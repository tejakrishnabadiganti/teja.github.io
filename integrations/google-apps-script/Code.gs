/**
 * Contact form receiver for the portfolio site.
 *
 * Saves every message as a row in the Google Sheet this script is attached to
 * (so it lives in your Google Drive) and emails you the details.
 * Setup steps are in the README under "Contact form".
 */

const CONFIG = {
  // Leave empty to send the email to the Google account that owns this script.
  notifyEmail: "",
  sheetName: "Contact requests",
  maxPerEmailPerHour: 3,
  maxTotalPerHour: 30,
};

const LIMITS = { firstName: 80, lastName: 80, email: 120, phone: 30, reason: 80, otherReason: 120, message: 1000 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{5,18}[0-9]$/;
const HEADERS = ["Received", "First name", "Last name", "Email", "Phone", "Reason", "Message", "Page"];

function doGet() {
  return reply({ ok: true, service: "portfolio contact form" });
}

function doPost(e) {
  try {
    const params = e.parameter || {};
    if (params.website) return reply({ ok: true }); // hidden field, only bots fill it

    const data = readFields(params);
    validate(data);
    enforceRateLimit(data.email);
    saveRow(data, clean(params.page, 300));
    notifyOwner(data);
    return reply({ ok: true });
  } catch (error) {
    return reply({ ok: false, error: error.message });
  }
}

function readFields(params) {
  const data = {};
  Object.keys(LIMITS).forEach((key) => {
    data[key] = clean(params[key], LIMITS[key]);
  });
  data.reasonText = data.otherReason || data.reason;
  return data;
}

function clean(value, maxLength) {
  return String(value == null ? "" : value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, maxLength);
}

function validate(data) {
  ["firstName", "lastName", "email", "phone", "reason"].forEach((key) => {
    if (!data[key]) throw new Error("Please fill in all required fields.");
  });
  if (!EMAIL_PATTERN.test(data.email)) throw new Error("Please enter a valid email address.");
  if (!PHONE_PATTERN.test(data.phone)) throw new Error("Please enter a valid phone number.");
  if (data.reason.toLowerCase() === "other" && !data.otherReason) throw new Error("Please tell me the reason.");
}

function enforceRateLimit(email) {
  const cache = CacheService.getScriptCache();
  const bump = (key, max) => {
    const count = Number(cache.get(key) || 0);
    if (count >= max) throw new Error("Too many messages right now. Please try again later.");
    cache.put(key, String(count + 1), 3600);
  };
  bump("rate:all", CONFIG.maxTotalPerHour);
  bump("rate:" + email.toLowerCase(), CONFIG.maxPerEmailPerHour);
}

// A leading = + - @ would make Google Sheets treat the text as a formula.
function safeCell(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.sheetName);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveRow(data, page) {
  const row = [new Date(), data.firstName, data.lastName, data.email, data.phone, data.reasonText, data.message, page];
  getSheet().appendRow(row.map((cell) => (typeof cell === "string" ? safeCell(cell) : cell)));
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function notifyOwner(data) {
  const to = CONFIG.notifyEmail || Session.getEffectiveUser().getEmail();
  const rows = [
    ["Name", data.firstName + " " + data.lastName],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Reason", data.reasonText],
    ["Message", data.message || "(none)"],
  ];
  MailApp.sendEmail({
    to: to,
    replyTo: data.email,
    subject: "New website enquiry: " + data.reasonText + " - " + data.firstName + " " + data.lastName,
    body: rows.map((row) => row[0] + ": " + row[1]).join("\n"),
    htmlBody:
      "<h3>New enquiry from your portfolio website</h3><table cellpadding='6'>" +
      rows.map((row) => "<tr><td><b>" + row[0] + "</b></td><td>" + escapeHtml(row[1]).replace(/\n/g, "<br>") + "</td></tr>").join("") +
      "</table><p>Reply to this email to answer " + escapeHtml(data.firstName) + " directly.</p>",
  });
}

function reply(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

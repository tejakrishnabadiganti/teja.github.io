const API = "https://api.github.com";

const FRIENDLY = {
  401: "GitHub rejected the token. It may be wrong or expired.",
  403: "The token does not have permission to write to this repository.",
  404: "Repository not found, or the token has no access to it.",
  409: "The file changed on GitHub while publishing. Reload the page and try again.",
  422: "GitHub could not accept that change. Check the repository and branch names.",
};

async function request(token, path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 404 && options.allowMissing) return null;
  if (!response.ok) {
    throw new Error(FRIENDLY[response.status] ?? `GitHub returned an error (${response.status}).`);
  }
  return response.json();
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const encodePath = (path) => path.split("/").map(encodeURIComponent).join("/");

async function commitFile({ token, repo, branch, path, base64, message }) {
  const url = `/repos/${repo}/contents/${encodePath(path)}`;
  const existing = await request(token, `${url}?ref=${encodeURIComponent(branch)}`, {
    allowMissing: true,
  });
  return request(token, url, {
    method: "PUT",
    body: { message, content: base64, branch, ...(existing ? { sha: existing.sha } : {}) },
  });
}

// Uploads new files first, then content.json, so the live site never points at a missing file.
export async function publish({ token, repo, branch, message, content, files, onProgress }) {
  onProgress("Checking access to the repository…");
  const info = await request(token, `/repos/${repo}`);
  if (!info.permissions?.push) {
    throw new Error("The token can read this repository but cannot write to it.");
  }

  for (const file of files) {
    onProgress(`Uploading ${file.path}…`);
    await commitFile({ token, repo, branch, path: file.path, base64: file.base64, message });
  }

  onProgress("Saving content…");
  const result = await commitFile({
    token,
    repo,
    branch,
    path: "data/content.json",
    base64: utf8ToBase64(`${JSON.stringify(content, null, 2)}\n`),
    message,
  });
  return result.commit.html_url;
}

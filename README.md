# Tejakrishna Badiganti | Portfolio

Personal portfolio of **Tejakrishna Badiganti**, Full Stack Software Engineer (Java, Spring Boot, microservices, React.js, AWS, Azure and AI agent engineering).

**Live site:** https://tejakrishnabadiganti.github.io/teja.github.io/

## Sections

| Section | Content |
| --- | --- |
| Hero | Headline, summary, resume download, social links, profile photo |
| Highlights | Years of experience, companies, test coverage, certifications |
| About | Professional summary |
| Experience | Accenture (Vertex Inc.) and Wipro (USAA) roles with achievements |
| Selected Work | Key projects and initiatives |
| Skills | Grouped technical skills |
| Awards | Hackathon wins and performance recognition |
| Certifications | Certificate images with matching digital badges, grouped by area |
| Education | Academic background |
| Contact | Email, phone, LinkedIn and GitHub |

## Features

- Responsive layout from mobile to desktop
- Light and dark themes (follows the system setting, remembered between visits)
- Accessible: skip link, keyboard focus styles, semantic landmarks, reduced-motion support
- Active navigation highlighting and subtle scroll-reveal animations
- No build step and no JavaScript libraries

## Tech stack

- HTML5
- CSS3 (custom properties, grid, flexbox)
- Vanilla JavaScript
- Google Fonts (Fraunces, Inter)
- Hosted on GitHub Pages

## Project structure

```
.
├── index.html                  # Single-page site (all sections)
├── README.md
├── packages/                   # Everything the live site uses
│   ├── css/
│   │   └── styles.css          # Design tokens, layout and light/dark themes
│   ├── js/
│   │   └── main.js             # Theme toggle, mobile menu, active link, scroll reveal
│   ├── documents/
│   │   └── Tejakrishna_Badiganti_Resume.pdf
│   └── images/
│       ├── profile/            # Hero profile photo
│       ├── certificates/       # Certificate images
│       └── badges/             # Digital badge images
└── archive/                    # Old files kept for reference, not used by the site
    ├── old-images/
    ├── old-resumes/
    ├── swiper/                 # Library used by the previous design
    └── Gallery.html            # Earlier placeholder page
```

Anything inside `packages/` is used by the site. Anything inside `archive/` is not, and can be deleted safely.

## Run locally

No installation is required. From the project folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Updating content

- **Text content:** edit `index.html`. Each section is marked by its `id` (`about`, `experience`, `work`, `skills`, `awards`, `certifications`, `education`, `contact`).
- **Resume:** replace `packages/documents/Tejakrishna_Badiganti_Resume.pdf`, keeping the same file name.
- **Profile photo:** replace `packages/images/profile/tejakrishna-badiganti-profile.jpg`.
- **Certifications:** add the files, then add a card in the `certifications` section.

### Certificate and badge naming

A certificate and its badge use the **same file name** in different folders, so they are always easy to match:

```
packages/images/certificates/<issuer>-<code>-<certification-name>.<ext>
packages/images/badges/<issuer>-<code>-<certification-name>.<ext>
```

Example:

```
packages/images/certificates/microsoft-az-900-azure-fundamentals.png
packages/images/badges/microsoft-az-900-azure-fundamentals.png
```

Use lowercase letters, digits and hyphens only (no spaces).

## Deployment

The site is served by GitHub Pages from the `main` branch (root folder). Every push to `main` rebuilds the site.

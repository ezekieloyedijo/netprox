# Netprox website

A fast, mobile-first static site built from the Netprox Website Brief (4 October 2026). It has ten pages plus privacy, terms and 404. Most visitors arrive on phones, so there is no framework and no heavy images. Every illustration is a small SVG file.

## Everyday editing (staff)

All copy that changes lives in three files in `content/`:

| File | What is in it |
|---|---|
| `content/site.json` | Phone, WhatsApp, email, address, hours, social links, cohort dates, testimonials, centre text and photos, partner logo files, form endpoints, Google Analytics ID, sign-offs |
| `content/courses.json` | Every course: name, what you learn, duration, certification, job roles, and the "best after" order |
| `content/faq.json` | FAQ questions and answers |

**The `[confirm]` rule.** If a value starts with `[confirm]`, it has not been confirmed yet. The draft build shows it with a yellow **To confirm** marker, so the staging link shows what is missing. The production build will not run until every one has been replaced. To confirm a value, delete the `[confirm]` tag and write the final text.

Examples:

```json
"duration": "[confirm]"            → not confirmed
"duration": "8 weeks"              → confirmed, goes live
"address": "[confirm] Amazing ..." → draft wording, shown with a marker
```

**Cohort dates.** Add up to three items to `cohorts.items`. The home page section appears automatically, and stays hidden while the list is empty.

**Testimonials.** Add only real Netprox students who have given written permission, with first name and course.

**Photos.** Put real centre photos in `src/assets/img/centre/`. Compress them to under 200 KB each, and never use "PIIT" or "Aptech" in file names. Then list them in `centre.photos` as `{ "file": "lab.webp", "alt": "Networking lab at the Lakowe study centre" }`.

**Partner logos.** Put the official Cisco Networking Academy partner logo from the NetAcad portal, and the Bellarks logo version that Bellarks supplies, in `src/assets/img/partners/`. Then set `partners.ciscoAcademyLogo` and `partners.bellarksLogo`. Until then, the site shows the partner names as text.

## Building

Requires Node.js 18 or newer. There are no packages to install.

```bash
npm run preview            # draft build + local server at http://localhost:8080
npm run build              # draft build into dist/ (for the staging link)
npm run build:production   # launch build: stops and lists anything still unconfirmed
```

You can also open `dist/index.html` straight from disk. Draft builds link pages to their `index.html` files so this works. Production builds use clean URLs (`/courses/`) for the live site.

Upload the `dist/` folder to any static host, such as Netlify, Cloudflare Pages, Vercel or cPanel. Draft builds tell search engines not to index the site. Production builds publish `robots.txt` and `sitemap.xml`.

## Built-in launch checks

Every build fails if any page contains:

- PIIT, Aptech or the 22,000 figure, including in asset file names
- the word "campus"
- a fee in naira
- an "Apply Now" button or a link to `#`
- a broken internal link or anchor

## How the brief's requirements are met

- **WhatsApp:** every Enquire button opens WhatsApp with a prefilled message naming the course, for example "Hello, I would like the fees and next start date for Data Analysis." A floating WhatsApp button appears on every page.
- **Tracking:** set `analytics.ga4`. Every WhatsApp click sends the GA4 event `whatsapp_click` with `course`, `page_path` and `link_location`. Mark `whatsapp_click` as a key event in GA4.
- **Course links:** every course has an anchor, such as `/courses/#dataanalysis` or `/networking/#ccna`, and a **Copy link** button so counsellors can share a direct link.
- **Forms:** forms have spam protection (a honeypot field and a minimum fill time). Set `forms.contactEndpoint`, `forms.corporateEndpoint` and `forms.diplomaInterestEndpoint` to a form service such as Formspree or Web3Forms. Configure each one to email the Netprox inbox with a copy to admissions. Until an endpoint is set, that form opens WhatsApp with the details filled in, so no enquiry is lost.
- **OND and HND:** the page shows "Register your interest" only, with no fees, start dates or Apply buttons. Lakowe is always called a study centre.
- **SEO:** each page has its own title and description, plus Open Graph tags and an EducationalOrganization schema.

## Still needed outside the code

- A Google Business Profile for the Lakowe centre.
- A WhatsApp confirmation after diploma interest registrations. This needs the WhatsApp Business API or an automation tool, such as Zapier or Make, connected to the form service.
- If staff would rather not edit JSON files, an editing screen can be added. Decap CMS or a similar Git-based CMS gives a browser editing screen over these same `content/*.json` files.

## Files

```
content/            editable content (JSON)
src/assets/         CSS, JS, logo, illustrations, favicons
build.mjs           page templates + content rule checks
tools/              illustration generator, local preview server
dist/               generated site (do not edit by hand)
```

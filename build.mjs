// Netprox site builder.
//   node build.mjs               draft build: unconfirmed values show a "To confirm" marker
//   node build.mjs --production  launch build: stops if anything is still unconfirmed
// Output goes to dist/. Content lives in content/*.json.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const PROD = process.argv.includes('--production');
const load = f => JSON.parse(readFileSync(join(ROOT, 'content', f), 'utf8'));
const site = load('site.json');
const courses = load('courses.json');
const faq = load('faq.json');

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TBC = /^\s*\[confirm\]\s*/i;
const isTbc = v => typeof v === 'string' && TBC.test(v);
const clean = v => (isTbc(v) ? v.replace(TBC, '') : v ?? '');
const has = v => typeof v === 'string' && v.trim() !== '' && !isTbc(v);
const pending = new Set();
const notes = new Set(); // reminders that do not block launch
// Render a content value; unconfirmed values are recorded and shown with a marker.
function val(v, where) {
  if (!isTbc(v)) return esc(v);
  pending.add(`${where}${clean(v) ? ` (draft: "${clean(v)}")` : ''}`);
  return `<span class="tbc">${esc(clean(v))}</span>`;
}
const md = s => s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

const c = site.contact;
const waNumber = has(c.whatsapp) ? c.whatsapp.replace(/\D/g, '') : '';
if (!waNumber) pending.add('WhatsApp number (contact.whatsapp)');
const siteUrl = clean(site.siteUrl).replace(/\/$/, '');
if (isTbc(site.siteUrl)) pending.add(`Domain name (siteUrl)${siteUrl ? ` (draft: "${siteUrl}")` : ''}`);
const year = 2026;

const allCareer = courses.pathways.flatMap(p => p.courses.map(x => ({ ...x, pathway: p })));
const byId = Object.fromEntries(allCareer.map(x => [x.id, x]));

/* ---------- icons ---------- */
const I = {
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.4-1.5-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>',
  menu: '<svg class="i-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg class="i-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>',
  cert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M9 14.5 8 22l4-2 4 2-1-7.5"/><path d="m9.5 9 2 2 3-3.5"/></svg>',
  lab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  net: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v4M12 11.5 6.5 17M12 11.5l5.5 5.5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  chevron: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6"/></svg>',
  exam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3M9 11l1.5 1.5L13 10M9 16h6"/></svg>',
  laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="11" rx="2"/><path d="M2 19h20"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v7h4v-7h3l1-4h-4V8z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9h4v12H4zM6 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 9h4v1.7c.6-1 1.9-2 3.8-2 4 0 4.2 2.6 4.2 6V21h-4v-5.5c0-1.4 0-3.2-2-3.2s-2.2 1.5-2.2 3.1V21h-4z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.7 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L2 3h6.4l4.4 5.9zm-1.1 16.2h1.7L7.5 4.7H5.7z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 3c.3 2.3 1.7 3.9 4 4v3.2c-1.5 0-2.8-.4-4-1.2V16a6 6 0 1 1-6-6v3.3a2.7 2.7 0 1 0 2.7 2.7V3z"/></svg>'
};

/* ---------- WhatsApp ---------- */
const waHref = text => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
const feesMsg = name => `Hello, I would like the fees and next start date for ${name}.`;
function waBtn({ label, text, track, cls = 'btn btn-wa', pos = 'inline' }) {
  return `<a class="${cls}" href="${esc(waHref(text))}" target="_blank" rel="noopener" data-wa="${esc(track)}" data-wa-pos="${pos}">${I.wa}<span>${esc(label)}</span></a>`;
}
const adviserMsg = 'Hello, I would like to speak with an adviser about Netprox courses.';
const enquire = name => waBtn({ label: 'Enquire for fees', text: feesMsg(name), track: name, cls: 'btn btn-wa btn-block' });

/* ---------- shared blocks ---------- */
const NAV = [
  ['/', 'Home'], ['/networking/', 'Cisco Networking'], ['/cybersecurity/', 'Cybersecurity'], ['/courses/', 'Career Courses'],
  ['/diplomas/', 'OND and HND'], ['/tutorials/', 'Exam Tutorials'], ['/corporate/', 'For Companies'], ['/about/', 'About']
];
const FOOT = [...NAV, ['/faq/', 'FAQ'], ['/contact/', 'Contact']];
// The five course pages sit under one "Courses" item in the header (all eight brief labels stay in the menu)
const COURSE_MENU = [
  ['/networking/', 'Cisco Networking', 'IT Essentials, CCST, CCNA, CCNA Automation', 'net'],
  ['/cybersecurity/', 'Cybersecurity', 'Cisco training for security careers', 'shield'],
  ['/courses/', 'Career Courses', 'Software, data, AI, design, marketing', 'laptop'],
  ['/diplomas/', 'OND and HND', 'National diplomas with Bellarks Polytechnic', 'cap'],
  ['/tutorials/', 'Exam Tutorials', 'WAEC, NECO, JAMB and GCSE with CBT', 'exam']
];
const TOP_MENU = [['/', 'Home'], ['/corporate/', 'For Companies'], ['/about/', 'About']];

const logo = (light = false) => `<img src="/assets/img/${light ? 'netprox-logo-light-520' : 'netprox-logo-520'}.png" width="520" height="150" alt="Netprox">`;

function academyBadge() {
  const logoImg = site.partners.ciscoAcademyLogo
    ? `<img src="/assets/img/partners/${esc(site.partners.ciscoAcademyLogo)}" alt="Cisco Networking Academy" width="46" height="46">`
    : `<span class="dot">${I.net}</span>`;
  if (!site.partners.ciscoAcademyLogo) pending.add('Cisco Networking Academy partner logo file (partners.ciscoAcademyLogo), from the NetAcad portal');
  else if (!site.partners.ciscoLogoFromNetAcad) pending.add('Cisco Networking Academy logo: replace with the official Academy partner logo from the NetAcad portal, then set partners.ciscoLogoFromNetAcad to true');
  return `<div class="academy-badge">${logoImg}<span>Cisco Networking Academy<small>Official Academy partner</small></span></div>`;
}

function partnerStrip() {
  const cisco = site.partners.ciscoAcademyLogo
    ? `<img src="/assets/img/partners/${esc(site.partners.ciscoAcademyLogo)}" alt="Cisco Networking Academy">`
    : `<span class="partner-name">Cisco Networking Academy<small>Official Academy partner</small></span>`;
  const bell = site.partners.bellarksLogo
    ? `<img src="/assets/img/partners/${esc(site.partners.bellarksLogo)}" alt="Bellarks Polytechnic">`
    : `<span class="partner-name">Bellarks Polytechnic<small>Kwale, Delta State · awards our OND and HND</small></span>`;
  if (!site.partners.bellarksLogo) pending.add('Bellarks Polytechnic logo file and written approval of its use (partners.bellarksLogo)');
  return `<div class="partner-strip">${cisco}${bell}</div>`;
}

const voucherNote = `<div class="callout reveal">${I.info}<div><p><strong>Exam voucher:</strong> The Cisco certification exam voucher is paid separately and is not included in the course fee. Ask an adviser for the current price.</p></div></div>`;
const ciscoOpening = 'Netprox is a Cisco Networking Academy. Our Cisco courses use the official Cisco curriculum and prepare you for Cisco certification exams.';

function pageHero({ crumb, eyebrow, title, intro, art, extra = '' }) {
  return `<section class="page-hero"><div class="wrap">
  <div>
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <span aria-current="page">${esc(crumb)}</span></nav>
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
    <h1>${esc(title)}</h1>
    ${intro}
    ${extra}
  </div>
  ${art ? `<div class="art"><img src="/assets/img/illustrations/${art}.svg" width="400" height="240" alt="" fetchpriority="high"></div>` : ''}
</div></section>`;
}

function visitBlock() {
  return `<div class="two-col wide-left">
    <div class="stack">
      <ul class="contact-list">
        <li><span class="icon">${I.pin}</span><div><strong>Address</strong>${val(c.address, 'Lakowe address wording (contact.address)')}</div></li>
        <li><span class="icon">${I.clock}</span><div><strong>Opening hours</strong>${val(c.hours, 'Opening hours (contact.hours)')}</div></li>
        <li><span class="icon">${I.wa}</span><div><strong>WhatsApp</strong><a href="${esc(waHref(adviserMsg))}" target="_blank" rel="noopener" data-wa="Adviser" data-wa-pos="contact-list">${esc(c.whatsappDisplay || 'Chat with an adviser')}</a></div></li>
        <li><span class="icon">${I.phone}</span><div><strong>Phone</strong>${has(c.phone) ? `<a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a>` : val(c.phone, 'Phone number (contact.phone)')}</div></li>
        <li><span class="icon">${I.mail}</span><div><strong>Email</strong>${has(c.email) ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : val(c.email, 'Netprox email address (contact.email)')}</div></li>
      </ul>
      <div class="btn-row">${waBtn({ label: 'Chat on WhatsApp', text: adviserMsg, track: 'Visit us', pos: 'visit' })}</div>
    </div>
    <div class="map"><iframe title="Map showing the Netprox study centre in Lakowe" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(site.contact.mapQuery)}&amp;output=embed"></iframe></div>
  </div>`;
}

function layout({ path, title, description, body, schema }) {
  const url = siteUrl ? siteUrl + path : '';
  const cur = h => (h === path ? ' aria-current="page"' : '');
  const inCourses = COURSE_MENU.some(([h]) => h === path);
  const topLink = ([h, l]) => `<li><a class="nav-link" href="${h}"${cur(h)}>${l}</a></li>`;
  const courseLink = ([h, l, sub, icon]) => `<a class="course-link" href="${h}"${cur(h)}><span class="ico">${I[icon]}</span><span><strong>${l}</strong><small>${sub}</small></span></a>`;
  const deskNav = `<nav class="desk-nav" aria-label="Main">
      <ul>
        ${topLink(TOP_MENU[0])}
        <li class="has-drop">
          <button class="nav-link nav-drop-btn${inCourses ? ' is-active' : ''}" type="button" aria-expanded="false" aria-controls="drop-courses">Courses${I.chevron}</button>
          <div class="drop" id="drop-courses">
            <div class="drop-grid">${COURSE_MENU.map(courseLink).join('')}</div>
            <div class="drop-foot"><span>Not sure where to start?</span>${waBtn({ label: 'Ask an adviser', text: adviserMsg, track: 'Adviser', cls: 'link-arrow', pos: 'menu-drop' })}</div>
          </div>
        </li>
        ${TOP_MENU.slice(1).map(topLink).join('')}
      </ul>
    </nav>`;
  const mobileNav = `<div class="mobile-nav" id="mobile-nav" role="dialog" aria-modal="true" aria-label="Menu">
  <div class="mobile-nav-top">
    <a class="brand" href="/" aria-label="Netprox home">${logo()}</a>
    <button class="nav-close" type="button" aria-label="Close menu">${I.close.replace(' class="i-close"', '')}</button>
  </div>
  <nav class="mobile-nav-body" aria-label="Main">
    <a class="m-link" href="/"${cur('/')}>Home</a>
    <p class="m-group">Courses</p>
    <div class="m-courses">${COURSE_MENU.map(courseLink).join('')}</div>
    <a class="m-link" href="/corporate/"${cur('/corporate/')}>For Companies</a>
    <a class="m-link" href="/about/"${cur('/about/')}>About</a>
    <div class="m-secondary"><a href="/faq/"${cur('/faq/')}>FAQ</a><a href="/contact/"${cur('/contact/')}>Contact</a></div>
  </nav>
  <div class="mobile-nav-foot">${waBtn({ label: 'Chat with an adviser', text: adviserMsg, track: 'Adviser', cls: 'btn btn-wa btn-block', pos: 'menu' })}</div>
</div>`;
  const socials = site.social.filter(s => has(s.url) && I[s.network]);
  site.social.filter(s => isTbc(s.url)).forEach(s => pending.add(`Social link: ${s.network} (live accounts only, otherwise delete the entry)`));
  const ga = site.analytics.ga4
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(site.analytics.ga4)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(site.analytics.ga4)}');</script>`
    : '';
  return `<!doctype html>
<html lang="en-NG" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${url ? `<link rel="canonical" href="${esc(url)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Netprox">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${url ? `<meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(siteUrl)}/assets/img/og-image.png">` : ''}
<meta name="theme-color" content="#0A3F4F">
<link rel="icon" type="image/png" href="/assets/img/favicon-64.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
<script>window.NETPROX=${JSON.stringify({ wa: waNumber })};</script>
${ga}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${PROD ? '' : '<div class="draft-bar">Draft preview. Items marked <span class="tbc"></span> are waiting for management and will block the production build.</div>'}
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="Netprox home">${logo()}</a>
    ${deskNav}
    <div class="header-actions">
      <div class="header-cta">${waBtn({ label: 'Chat with an adviser', text: adviserMsg, track: 'Adviser', cls: 'btn btn-wa btn-sm', pos: 'header' })}</div>
      <button class="nav-toggle" type="button" aria-controls="mobile-nav" aria-expanded="false" aria-label="Open menu">${I.menu.replace(' class="i-menu"', '')}</button>
    </div>
  </div>
</header>
${mobileNav}
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="/" aria-label="Netprox home">${logo(true)}</a>
        <p>Cisco certification, career tech training and national diplomas with Bellarks Polytechnic, at our Lakowe study centre.</p>
        ${socials.length ? `<div class="socials">${socials.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="Netprox on ${esc({ tiktok: 'TikTok', linkedin: 'LinkedIn', x: 'X' }[s.network] || s.network.charAt(0).toUpperCase() + s.network.slice(1))}">${I[s.network]}</a>`).join('')}</div>` : ''}
      </div>
      <div><h3>Explore</h3><ul class="footer-links">${FOOT.slice(1, 6).map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>
      <div><h3>Netprox</h3><ul class="footer-links">${[FOOT[0], ...FOOT.slice(6)].map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>
      <div><h3>Visit or call</h3><ul class="footer-contact">
        <li>${val(c.address, 'Lakowe address wording (contact.address)')}</li>
        <li>Phone: ${has(c.phone) ? `<a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a>` : val(c.phone, 'Phone number (contact.phone)')}</li>
        <li>WhatsApp: <a href="${esc(waHref(adviserMsg))}" target="_blank" rel="noopener" data-wa="Adviser" data-wa-pos="footer">${esc(c.whatsappDisplay || 'Chat with an adviser')}</a></li>
        <li>Email: ${has(c.email) ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : val(c.email, 'Netprox email address (contact.email)')}</li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <p>© ${year} Netprox Limited</p>
      <ul><li><a href="/privacy/">Privacy policy</a></li><li><a href="/terms/">Terms of use</a></li></ul>
    </div>
  </div>
</footer>
${waBtn({ label: 'Chat with us', text: adviserMsg, track: 'Floating button', cls: 'wa-float', pos: 'float' }).replace('<a ', '<a aria-label="Chat with Netprox on WhatsApp" ')}
<script src="/assets/js/main.js" defer></script>
</body>
</html>
`;
}

/* ---------- forms ---------- */
const field = (label, name, type = 'text', attrs = '') => `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${label}" type="${type}" ${attrs}></div>`;
const select = (label, name, options, attrs = '') => `<div class="field"><label for="f-${name}">${label}</label><select id="f-${name}" name="${label}" ${attrs}><option value="">Choose one</option>${options}</select></div>`;
const opts = list => list.map(o => `<option>${esc(o)}</option>`).join('');
function form({ id, endpoint, title, success, submit, fields, inbox }) {
  return `<form class="form" data-form="${id}" data-title="${esc(title)}" data-success="${esc(success)}" ${endpoint ? `action="${esc(endpoint)}" method="post"` : ''} novalidate>
  ${fields}
  <div class="hp" aria-hidden="true"><label for="f-${id}-website">Website</label><input id="f-${id}-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
  <input type="hidden" name="_subject" value="${esc(title)}">
  ${inbox ? `<input type="hidden" name="_inbox" value="${esc(inbox)}">` : ''}
  <button class="btn btn-primary btn-block" type="submit">${esc(submit)}</button>
  <p class="form-status" role="status" aria-live="polite"></p>
  <p class="form-note">We use your details only to reply to this enquiry. See our <a href="/privacy/">privacy policy</a>.</p>
</form>`;
}

/* ---------- course cards ---------- */
const copyBtn = id => `<button type="button" class="copy-link" data-anchor="${id}" aria-label="Copy a direct link to this course">${I.link}<span>Copy link</span></button>`;
const fact = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;

function ciscoCard(x, where) {
  return `<article class="card course reveal" id="${x.id}">
  <div class="card-body">
    <div class="course-top"><div>${x.level ? `<span class="level">${esc(x.level)}</span>` : ''}<h3>${esc(x.name)}</h3></div>${copyBtn(x.id)}</div>
    <dl class="facts">
      ${fact('What you learn', esc(x.learn))}
      ${fact('Duration', val(x.duration, `${where}: ${x.name} duration`))}
      ${fact('Prepares you for', val(x.preparesFor, `${where}: ${x.name} certification`))}
      ${fact('Job roles', esc(x.roles))}
    </dl>
    <div class="course-actions">${enquire(x.name)}</div>
  </div>
</article>`;
}

function careerCard(x) {
  const prev = x.bestAfter && byId[x.bestAfter];
  return `<article class="card course reveal" id="${x.id}">
  <div class="card-body">
    <div class="course-top"><h3>${esc(x.name)}</h3>${copyBtn(x.id)}</div>
    ${prev ? `<p class="best-after">Best after: <a href="#${prev.id}">${esc(prev.name)}</a></p>` : ''}
    <dl class="facts">
      ${fact('What you learn', esc(x.learn))}
      ${fact('Duration', val(x.duration, `Career Courses: ${x.name} duration`))}
      ${fact('Job roles', esc(x.roles))}
      ${fact('Certificate', val(courses.certificateLine, 'Certificate wording for career courses (courses.certificateLine)'))}
    </dl>
    <div class="course-actions">${enquire(x.name)}</div>
  </div>
</article>`;
}

/* ---------- pages ---------- */
const pages = [];
const page = (path, title, description, body, schema) => pages.push({ path, title, description, body, schema });

const orgSchema = {
  '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: 'Netprox', legalName: 'Netprox Limited',
  ...(siteUrl && { url: siteUrl, logo: `${siteUrl}/assets/img/netprox-logo.png` }),
  address: { '@type': 'PostalAddress', streetAddress: clean(c.address), addressLocality: 'Lakowe', addressRegion: 'Lagos', addressCountry: 'NG' },
  ...(has(c.phone) && { telephone: c.phone.replace(/\s/g, '') }), ...(c.hoursSchema && { openingHours: c.hoursSchema }), ...(has(c.email) && { email: c.email })
};

/* Home */
{
  const offers = [
    ['networking', 'Cisco Networking', 'From IT support to network engineer, with Cisco certification at every level', 'See networking courses', '/networking/'],
    ['cybersecurity', 'Cybersecurity', 'Cisco training for security careers, from support technician to SOC analyst', 'See cybersecurity', '/cybersecurity/'],
    ['diplomas', 'National Diplomas', 'OND in Computer Science and HND in Software Engineering and Cybersecurity, awarded by Bellarks Polytechnic', 'Register your interest', '/diplomas/#register'],
    ['courses', 'Career Courses', 'Software, data, AI, design, marketing and project management', 'See all courses', '/courses/'],
    ['tutorials', 'Exam Tutorials', 'WAEC, NECO, JAMB and GCSE preparation with CBT practice', 'See tutorials', '/tutorials/']
  ];
  const why = [
    [I.cert, 'Cisco certified training', 'Our Cisco courses prepare you for real Cisco certification exams.'],
    [I.lab, 'Hands on labs', 'You build, configure and troubleshoot on real equipment and simulators.'],
    [I.users, 'Small classes', 'Instructors who know your name and your progress.'],
    [I.calendar, 'Flexible schedules', val(site.schedules, 'Class schedules offered (schedules)')]
  ];
  if (!site.signoff.whyNetproxPoints) pending.add('Why Netprox points: lab equipment, class sizes and schedules confirmed by management (signoff.whyNetproxPoints)');
  const cohorts = site.cohorts.items;
  const body = `
<section class="hero on-dark"><div class="wrap">
  <div>
    <h1>Get certified. <span class="accent nowrap">Get hired.</span></h1>
    <p class="lead">Cisco certification, career tech training and national diplomas with Bellarks Polytechnic, in Lakowe, on the Lekki Epe Expressway. Practical classes, real labs, small groups.</p>
    <div class="btn-row">
      ${waBtn({ label: 'Chat with an adviser', text: adviserMsg, track: 'Adviser', pos: 'hero' })}
      <a class="btn btn-ghost" href="/courses/">Explore courses</a>
    </div>
    ${academyBadge()}
  </div>
  <div class="hero-art"><img src="/assets/img/illustrations/hero.svg" width="560" height="480" alt="" fetchpriority="high"></div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head center"><p class="eyebrow">Choose your path</p><h2>Five ways to start</h2></div>
  <div class="grid cols-5">
    ${offers.map(([img, t, line, btn, href]) => `<article class="card offer-card reveal">
      <div class="card-media"><img src="/assets/img/illustrations/${img}.svg" width="400" height="240" alt="" loading="lazy"></div>
      <div class="card-body"><h3>${t}</h3><p>${line}</p><a class="link-arrow" href="${href}">${btn}</a></div>
    </article>`).join('')}
  </div>
</div></section>

<section class="section alt"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Why Netprox</p><h2>Training built around getting you hired</h2></div>
  <div class="features">
    ${why.map(([icon, t, d]) => `<div class="feature reveal"><span class="icon">${icon}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}
  </div>
</div></section>

<section class="section dark on-dark"><div class="wrap">
  <div class="section-head"><p class="eyebrow">How it works</p><h2>From first chat to certificate</h2></div>
  <ol class="steps">
    <li>Chat with an adviser on WhatsApp about your goal.</li>
    <li>Choose your course and start date.</li>
    <li>Learn in class at Lakowe with practical projects.</li>
    <li>Sit your certification exam or get your course certificate.</li>
  </ol>
  <div class="btn-row" style="margin-top:28px">${waBtn({ label: 'Chat with an adviser', text: adviserMsg, track: 'Adviser', pos: 'how-it-works' })}</div>
</div></section>

<section class="section"><div class="wrap">
  <div class="strip reveal">
    <div><h2>Training a team?</h2><p>We run private cohorts in cybersecurity, networking, data and digital skills for companies.</p></div>
    <a class="btn btn-primary" href="/corporate/">Talk to us about team training</a>
  </div>
</div></section>

${cohorts.length ? `<section class="section alt"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Next cohorts</p><h2>Upcoming start dates</h2></div>
  <div class="table-wrap reveal"><table><thead><tr><th scope="col">Course</th><th scope="col">Starts</th><th scope="col">Schedule</th><th scope="col"><span class="sr-only">Enquire</span></th></tr></thead><tbody>
    ${cohorts.slice(0, 3).map(r => `<tr><td><strong>${esc(r.course)}</strong></td><td>${esc(r.start)}</td><td>${esc(r.schedule || '')}</td><td>${waBtn({ label: 'Enquire', text: feesMsg(r.course), track: r.course, cls: 'btn btn-wa btn-sm', pos: 'cohorts' })}</td></tr>`).join('')}
  </tbody></table></div>
</div></section>` : site.cohorts.comingSoon ? `<section class="section alt" id="cohorts"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Next cohorts</p><h2>Upcoming start dates</h2></div>
  <div class="coming-soon reveal">
    <span class="icon">${I.calendar}</span>
    <div><h3>New start dates coming soon</h3><p>We are finalising the next intake. Message an adviser and we will let you know as soon as dates are announced.</p></div>
    ${waBtn({ label: 'Tell me when dates are out', text: 'Hello, please let me know when the next start dates are announced.', track: 'Next cohorts', pos: 'cohorts' })}
  </div>
</div></section>` : ''}

<section class="section${cohorts.length || site.cohorts.comingSoon ? '' : ' alt'}" id="visit"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Visit us</p><h2>Our Lakowe study centre</h2><p class="lead">On the Lekki Epe Expressway. Come and see the labs, or chat with an adviser first.</p></div>
  ${visitBlock()}
</div></section>`;
  if (!cohorts.length) notes.add(`Next three cohort start dates (cohorts.items). ${site.cohorts.comingSoon ? 'Showing "coming soon" until dates are added' : 'The section stays hidden while empty'}`);
  page('/', 'Netprox | Cisco Training, Tech Courses and Diplomas in Lakowe, Lagos',
    'Cisco Networking Academy in Lakowe, Lagos. Cisco certification, career tech courses, exam tutorials and OND and HND with Bellarks Polytechnic. Chat with an adviser on WhatsApp.', body, orgSchema);
}

/* Cisco Networking */
page('/networking/', 'Cisco CCNA and Networking Training in Lakowe, Lagos | Netprox',
  'IT Essentials, CCST Networking, CCNA and CCNA Automation at the Netprox Cisco Networking Academy in Lakowe, Lagos. Hands on labs, small classes.',
  `${pageHero({ crumb: 'Cisco Networking', eyebrow: 'Cisco Networking Academy', title: 'Cisco Networking', art: 'networking',
    intro: `<p class="lead"><strong>${ciscoOpening}</strong></p><p>Start from the basics and build to network engineer. Each level prepares you for a recognised industry certification.</p>`,
    extra: academyBadge().replace('academy-badge', 'academy-badge light') })}
<section class="section"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Your ladder</p><h2>Four levels, one career path</h2></div>
  <nav class="pathway-nav" aria-label="Jump to a course">${courses.networking.map(x => `<a href="#${x.id}">${esc(x.level)}: ${esc(x.name)}</a>`).join('')}</nav>
  <div class="grid cols-2">${courses.networking.map(x => ciscoCard(x, 'Cisco Networking')).join('')}</div>
  <div style="margin-top:28px">${voucherNote}</div>
</div></section>`);

/* Cisco Cybersecurity */
page('/cybersecurity/', 'Cisco Cybersecurity Training in Lakowe, Lagos | Netprox',
  'Train for a cybersecurity career on the official Cisco curriculum at Netprox, a Cisco Networking Academy in Lakowe, Lagos. Junior technician to SOC analyst.',
  `${pageHero({ crumb: 'Cybersecurity', eyebrow: 'Cisco Networking Academy', title: 'Cisco Cybersecurity', art: 'cybersecurity',
    intro: `<p class="lead"><strong>${ciscoOpening}</strong></p><p>Train for a career protecting networks and data, on the official Cisco cybersecurity curriculum.</p>`,
    extra: academyBadge().replace('academy-badge', 'academy-badge light') })}
<section class="section"><div class="wrap">
  <div class="two-col wide-left">
    <div>${courses.cybersecurity.map(x => ciscoCard(x, 'Cybersecurity')).join('')}</div>
    <div class="stack">
      <div class="callout reveal">${I.info}<div><p><strong>Entry requirement:</strong> ${esc(courses.cybersecurityEntry)}</p>${isTbc(courses.cybersecurityEntryNote) ? `<p>${val(courses.cybersecurityEntryNote, 'Cybersecurity: are networking fundamentals included (courses.cybersecurityEntryNote)')}</p>` : has(courses.cybersecurityEntryNote) ? `<p>${esc(courses.cybersecurityEntryNote)}</p>` : ''}</div></div>
      <div class="feature reveal"><span class="icon">${I.net}</span><div><h3>New to networking?</h3><p>You can start here. Networking fundamentals are built into the course, so you learn the basics before moving on to security.</p></div></div>
      ${waBtn({ label: 'Ask an adviser where to start', text: 'Hello, I would like advice on where to start with Cybersecurity.', track: 'Cybersecurity starting point' })}
    </div>
  </div>
  <div style="margin-top:28px">${voucherNote}</div>
</div></section>`);

/* Career Courses */
page('/courses/', 'Career Tech Courses in Lakowe, Lagos: Web, Data, AI, Design | Netprox',
  'Practical short courses in web development, data analysis, AI, UI/UX, graphic design, digital marketing and project management at Netprox, Lakowe, Lagos.',
  `${pageHero({ crumb: 'Career Courses', eyebrow: 'Five pathways', title: 'Career Courses', art: 'courses',
    intro: '<p class="lead">Practical courses that take you from beginner to job ready. Pick a pathway, start at the first step, and move up when you are ready.</p>' })}
<section class="section"><div class="wrap">
  <nav class="pathway-nav" aria-label="Jump to a pathway">${courses.pathways.map(p => `<a href="#${p.id}">${p.number}. ${esc(p.name)}</a>`).join('')}</nav>
  ${courses.pathways.map(p => `<section class="pathway" id="${p.id}" aria-labelledby="${p.id}-h">
    <div class="pathway-head"><span class="pathway-num">${p.number}</span><h2 id="${p.id}-h">${esc(p.name)}</h2></div>
    <div class="grid cols-3">${p.courses.map(careerCard).join('')}</div>
    ${p.note ? `<div class="callout reveal" style="margin-top:20px">${I.info}<p>${esc(p.note)}</p></div>` : ''}
  </section>`).join('')}
</div></section>`);

/* National Diplomas */
{
  const programmes = courses.diplomas.map(d => d.name);
  const body = `${pageHero({ crumb: 'OND and HND', eyebrow: 'With Bellarks Polytechnic', title: 'National Diplomas with Bellarks Polytechnic', art: 'diplomas',
    intro: '<p class="lead">Earn an OND in Computer Science, then an HND in Software Engineering or Cybersecurity, awarded by Bellarks Polytechnic and taught at the Netprox study centre in Lakowe. Our cybersecurity programmes also include Cisco training as part of the course.</p>',
    extra: `<div class="callout warn" style="margin-top:20px">${I.alert}<div><p><strong>Admissions are not yet open.</strong> These programmes are subject to final NBTE approval. Register your interest and we will contact you as soon as admissions open.</p></div></div>` })}
<section class="section"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Programmes</p><h2>OND and HND programmes</h2></div>
  <div class="grid cols-2">
    ${courses.diplomas.map(d => `<article class="card course reveal" id="${d.id}"><div class="card-body">
      <div class="course-top"><h3>${esc(d.name)}</h3>${copyBtn(d.id)}</div>
      <dl class="facts">
        ${fact('Awarded by', esc(d.awardedBy))}
        ${fact('Typical duration', val(d.duration, `Diplomas: ${d.name} duration (Bellarks)`))}
        ${fact('Entry requirement', Array.isArray(d.entry) ? `<ul class="fact-list">${d.entry.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : val(d.entry, `Diplomas: ${d.name} entry requirement (Bellarks)`))}
        ${fact('Leads to', esc(d.leadsTo))}
      </dl>
      <div class="course-actions"><a class="btn btn-primary btn-block" href="#register" data-programme="${esc(d.name)}">Register your interest</a></div>
    </div></article>`).join('')}
  </div>
</div></section>
<section class="section alt"><div class="wrap two-col">
  <div>
    <div class="section-head"><p class="eyebrow">Why study with us</p><h2>A national diploma, taught close to home</h2></div>
    <ul class="ticks">
      <li>A national diploma recognised for employment and further study, awarded by Bellarks Polytechnic.</li>
      <li>${val(courses.diplomaCiscoPoint, 'Diplomas: Cisco certification training built into the cybersecurity OND and HND (confirm with Bellarks)')}</li>
      <li>Taught locally at our Lakowe study centre, so you do not need to relocate.</li>
    </ul>
    <div style="margin-top:28px">${partnerStrip()}</div>
  </div>
  <div id="register">
    <h2 style="font-size:1.5rem">Register your interest</h2>
    <p class="lead" style="font-size:1rem">We will contact you as soon as admissions open.</p>
    ${form({ id: 'diploma-interest', endpoint: site.forms.diplomaInterestEndpoint, title: 'OND and HND interest registration', submit: 'Register my interest',
      success: 'Thank you. You are on the list and we will contact you as soon as admissions open.', inbox: clean(c.admissionsEmail),
      fields: `${field('Name', 'di-name', 'text', 'required autocomplete="name"')}
      <div class="row">${field('Phone', 'di-phone', 'tel', 'required autocomplete="tel" inputmode="tel"')}${field('Email', 'di-email', 'email', 'autocomplete="email"')}</div>
      ${select('Programme', 'di-programme', opts(programmes), 'required')}
      <div class="row">${field('Highest qualification so far', 'di-qual', 'text', 'required')}${field('Year of O level results', 'di-year', 'text', 'inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="e.g. 2025"')}</div>` })}
  </div>
</div></section>`;
  if (!site.nbteApproved) notes.add('NBTE approval pending: National Diplomas page shows Register your interest only (nbteApproved)');
  if (!site.signoff.bellarksPageWording) pending.add('Bellarks Polytechnic written approval of the National Diplomas page wording (signoff.bellarksPageWording)');
  notes.add('WhatsApp confirmation after a diploma interest registration needs a WhatsApp Business API or automation service (not possible from a static site alone)');
  if (!has(c.admissionsEmail)) pending.add('Admissions inbox email (contact.admissionsEmail)');
  page('/diplomas/', 'OND Computer Science and HND Software Engineering, Cybersecurity | Netprox',
    'OND in Computer Science and HND in Software Engineering and Cybersecurity, awarded by Bellarks Polytechnic and taught at the Netprox study centre in Lakowe, Lagos. Register your interest.', body);
}

/* Exam Tutorials */
page('/tutorials/', 'JAMB, WAEC, NECO and GCSE Tutorials with CBT Practice in Lakowe | Netprox',
  'Exam preparation for JAMB/UTME, WAEC, NECO and GCSE at the Netprox centre in Lakowe, Lagos, with computer based test (CBT) practice.',
  `${pageHero({ crumb: 'Exam Tutorials', eyebrow: 'For secondary school candidates', title: 'Exam Tutorials', art: 'tutorials',
    intro: '<p class="lead">Exam preparation for secondary school candidates at our Lakowe centre, with computer based test (CBT) practice so candidates are ready for exam day.</p>',
    extra: `<div class="btn-row" style="margin-top:20px">${waBtn({ label: 'Book a place for your child', text: 'Hello, I would like to book a place for my child in your exam tutorials.', track: 'Exam Tutorials' })}</div>` })}
<section class="section"><div class="wrap">
  <div class="grid cols-2">
    ${courses.tutorials.map(t => `<article class="card course reveal" id="${t.id}"><div class="card-body">
      <div class="course-top"><h3>${esc(t.name)}</h3>${copyBtn(t.id)}</div>
      <dl class="facts">${fact('For', esc(t.for))}${fact('Includes', esc(t.includes))}${fact('Duration', val(t.duration, `Exam Tutorials: ${t.name} duration`))}${t.schedule ? fact('Schedule', esc(t.schedule)) : ''}</dl>
      <div class="course-actions">${waBtn({ label: 'Book a place for your child', text: `Hello, I would like to book a place for my child for ${t.name} tutorials, and to know the fees and next start date.`, track: `${t.name} tutorial`, cls: 'btn btn-wa btn-block' })}</div>
    </div></article>`).join('')}
  </div>
</div></section>`);

/* Corporate */
{
  const icons = [I.shield, I.net, I.chart, I.laptop];
  const body = `${pageHero({ crumb: 'For Companies', eyebrow: 'Corporate training', title: 'We train teams', art: 'corporate',
    intro: '<p class="lead">Private cohorts at our Lakowe centre or at your office, built around your goals.</p>',
    extra: `<div class="btn-row" style="margin-top:20px">${waBtn({ label: 'Talk to us about team training', text: 'Hello, I would like to talk about team training for my company.', track: 'Corporate training' })}<a class="btn btn-ghost" href="#enquiry">Send an enquiry</a></div>` })}
<section class="section"><div class="wrap">
  <div class="section-head"><p class="eyebrow">Training areas</p><h2>What we train</h2></div>
  <div class="features">${courses.corporate.map((a, i) => `<div class="feature reveal" id="${a.id}"><span class="icon">${icons[i % icons.length]}</span><div><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></div></div>`).join('')}</div>
</div></section>
<section class="section dark on-dark"><div class="wrap">
  <div class="section-head"><p class="eyebrow">How it works</p><h2>Three steps to a trained team</h2></div>
  <ol class="steps"><li>Tell us your goals.</li><li>We propose a programme and schedule.</li><li>We train and report on progress.</li></ol>
</div></section>
<section class="section" id="enquiry"><div class="wrap two-col">
  <div><p class="eyebrow">Enquiry</p><h2>Tell us about your team</h2><p class="lead">Share a few details and we will propose a programme and schedule.</p>
    <p>Corporate enquiries: ${has(c.corporateEmail) ? `<a href="mailto:${esc(c.corporateEmail)}">${esc(c.corporateEmail)}</a>` : val(c.corporateEmail, 'Corporate enquiries email (contact.corporateEmail)')}</p></div>
  ${form({ id: 'corporate', endpoint: site.forms.corporateEndpoint, title: 'Corporate training enquiry', submit: 'Send enquiry',
    success: 'Thank you. Our corporate team will be in touch shortly.', inbox: clean(c.corporateEmail),
    fields: `<div class="row">${field('Name', 'co-name', 'text', 'required autocomplete="name"')}${field('Company', 'co-company', 'text', 'required autocomplete="organization"')}</div>
    <div class="row">${field('Role', 'co-role', 'text', 'autocomplete="organization-title"')}${field('Email', 'co-email', 'email', 'required autocomplete="email"')}</div>
    <div class="row">${field('Phone', 'co-phone', 'tel', 'required autocomplete="tel" inputmode="tel"')}${field('Number of staff', 'co-staff', 'number', 'min="1" inputmode="numeric"')}</div>
    ${select('Training area', 'co-area', opts([...courses.corporate.map(a => a.title), 'Something else']), 'required')}
    <div class="field"><label for="f-co-message">Message</label><textarea id="f-co-message" name="Message" placeholder="Your goals, preferred dates and location"></textarea></div>` })}
</div></section>`;
  page('/corporate/', 'Corporate Cybersecurity, Networking and Data Training in Lagos | Netprox',
    'Private team training in cybersecurity, networking, data and analytics, fraud analytics and digital skills, at the Netprox Lakowe centre or at your office.', body);
}

/* About */
{
  const ct = site.centre;
  const testimonials = site.testimonials.items;
  const body = `${pageHero({ crumb: 'About', eyebrow: 'Who we are', title: 'About Netprox', art: 'centre',
    intro: '<p class="lead">Netprox is a technology training company in Lakowe, Lagos. We train people for real tech jobs, from IT support and networking to cybersecurity, software, data and design.</p><p>As a Cisco Networking Academy, we teach the official Cisco curriculum and prepare students for Cisco certification exams. Our career courses are practical, project based and taught in small groups.</p>' })}
<section class="section"><div class="wrap two-col">
  <div class="stack">
    <div><p class="eyebrow">Our centre</p><h2>The Lakowe study centre</h2>
      <p>${val(ct.text || '[confirm] Two or three lines on the Lakowe facility, labs and classrooms', 'About: two or three lines on the Lakowe centre (centre.text)')}</p></div>
    ${ct.photos.length ? `<div class="grid cols-2">${ct.photos.map(p => `<img src="/assets/img/centre/${esc(p.file)}" alt="${esc(p.alt)}" loading="lazy" style="border-radius:16px;width:100%;aspect-ratio:4/3;object-fit:cover">`).join('')}</div>` : ''}
  </div>
  <div class="stack">
    <div><p class="eyebrow">Our partnership</p><h2>With Bellarks Polytechnic</h2>
      <p>Our OND and HND programmes are delivered in partnership with Bellarks Polytechnic, Kwale, Delta State, which awards the qualifications. Netprox teaches them at our Lakowe study centre.</p>
      <a class="link-arrow" href="/diplomas/">About the OND and HND</a></div>
    ${partnerStrip()}
  </div>
</div></section>
${testimonials.length ? `<section class="section alt"><div class="wrap"><div class="section-head"><p class="eyebrow">Students</p><h2>In their words</h2></div>
  <div class="grid cols-3">${testimonials.map(t => `<figure class="quote reveal"><blockquote>“${esc(t.quote)}”</blockquote><figcaption><strong>${esc(t.name)}</strong> · ${esc(t.course)}</figcaption></figure>`).join('')}</div></div></section>` : ''}
<section class="section${testimonials.length ? '' : ' alt'}"><div class="wrap"><div class="strip reveal"><div><h2>Come and see the labs</h2><p>Visit the Lakowe study centre or chat with an adviser about your goal.</p></div>${waBtn({ label: 'Chat with an adviser', text: adviserMsg, track: 'Adviser', pos: 'about' })}</div></div></section>`;
  if (!ct.photos.length) pending.add('Real photos of the Lakowe centre, labs and classes (centre.photos)');
  page('/about/', 'About Netprox | Cisco Networking Academy in Lakowe, Lagos',
    'Netprox is a technology training company and Cisco Networking Academy in Lakowe, Lagos, delivering OND and HND programmes with Bellarks Polytechnic.', body);
}

/* FAQ */
page('/faq/', 'Frequently Asked Questions | Netprox, Lakowe, Lagos',
  'Answers about Netprox courses, Cisco exam vouchers, OND and HND with Bellarks Polytechnic, class formats, certificates and team training.',
  `${pageHero({ crumb: 'FAQ', eyebrow: 'Help', title: 'Common questions', art: 'faq', intro: '<p class="lead">Quick answers before you chat with an adviser.</p>' })}
<section class="section"><div class="wrap">
  <div class="faq">
    ${faq.items.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><div><p>${isTbc(f.a) ? val(f.a, `FAQ: ${f.q}`) : md(esc(f.a).replace('{address}', val(c.address, 'Lakowe address wording (contact.address)')))}</p></div></details>`).join('')}
  </div>
  <div class="strip reveal" style="margin-top:40px"><div><h2>Still have a question?</h2><p>An adviser will answer on WhatsApp.</p></div>${waBtn({ label: 'Chat with an adviser', text: adviserMsg, track: 'Adviser', pos: 'faq' })}</div>
</div></section>`);

/* Contact */
{
  const group = (label, list) => `<optgroup label="${esc(label)}">${opts(list)}</optgroup>`;
  const courseOptions = [
    group('Cisco Networking', courses.networking.map(x => x.name)),
    group('Cybersecurity', courses.cybersecurity.map(x => x.name)),
    ...courses.pathways.map(p => group(p.name, p.courses.map(x => x.name))),
    group('National Diplomas', courses.diplomas.map(x => x.name)),
    group('Exam Tutorials', courses.tutorials.map(x => x.name)),
    group('Other', ['Corporate training', 'Not sure yet'])
  ].join('');
  const body = `${pageHero({ crumb: 'Contact', eyebrow: 'Get in touch', title: 'Contact Netprox', art: 'contact',
    intro: '<p class="lead">The fastest way to reach us is WhatsApp. You can also call, email, send the form below or visit the Lakowe study centre.</p>',
    extra: `<div class="btn-row" style="margin-top:20px">${waBtn({ label: 'Chat on WhatsApp', text: adviserMsg, track: 'Adviser', pos: 'contact-hero' })}</div>` })}
<section class="section"><div class="wrap">${visitBlock()}</div></section>
<section class="section alt" id="enquiry"><div class="wrap two-col">
  <div><p class="eyebrow">Enquiry form</p><h2>Send us a message</h2><p class="lead">Tell us the course you are interested in and an adviser will reply.</p></div>
  ${form({ id: 'contact', endpoint: site.forms.contactEndpoint, title: 'Website enquiry', submit: 'Send message',
    success: 'Thank you. An adviser will reply shortly.', inbox: clean(c.admissionsEmail),
    fields: `${field('Name', 'ct-name', 'text', 'required autocomplete="name"')}
    <div class="row">${field('Phone', 'ct-phone', 'tel', 'required autocomplete="tel" inputmode="tel"')}${field('Email', 'ct-email', 'email', 'autocomplete="email"')}</div>
    ${select('Course of interest', 'ct-course', courseOptions, 'required')}
    <div class="field"><label for="f-ct-message">Message</label><textarea id="f-ct-message" name="Message"></textarea></div>` })}
</div></section>`;
  page('/contact/', 'Contact Netprox | Lakowe, Lekki Epe Expressway, Lagos',
    'Visit or contact Netprox at our Lakowe study centre on the Lekki Epe Expressway, Lagos. Phone, WhatsApp, email, map and enquiry form.', body, orgSchema);
}

/* Legal */
const legal = (path, crumb, title, intro, sections) => page(path, `${title} | Netprox`, `${title} for the Netprox website.`,
  `${pageHero({ crumb, title, intro: `<p class="lead">${intro}</p>` })}
<section class="section"><div class="wrap prose">${sections.map(([h, p]) => `<h2>${h}</h2>${p}`).join('')}
<p><em>Last updated ${year}.</em></p></div></section>`);
if (!site.signoff.legalPagesReviewed) pending.add('Privacy policy and terms of use reviewed by management or a legal adviser (signoff.legalPagesReviewed)');
const contactLine = () => `${has(c.email) ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : val(c.email, 'Netprox email address (contact.email)')} or WhatsApp`;
legal('/privacy/', 'Privacy policy', 'Privacy policy', 'How Netprox Limited collects and uses your personal data when you use this website or contact us.', [
  ['Who we are', `<p>This website is run by Netprox Limited, ${val(c.address, 'Lakowe address wording (contact.address)')}. We follow the Nigeria Data Protection Act 2023.</p>`],
  ['What we collect', '<p>When you send a form or message us, we collect the details you give us, such as your name, phone number, email address, the course you are interested in and your message. If you register interest in a national diploma we also collect your highest qualification and the year of your O level results.</p><p>We use Google Analytics to understand how visitors use the site, including which WhatsApp buttons are clicked. This uses cookies and does not identify you by name.</p>'],
  ['How we use it', '<p>We use your details only to answer your enquiry, tell you about the course or programme you asked about, and improve the website. We do not sell your data.</p>'],
  ['Who we share it with', '<p>Your enquiry is handled by Netprox staff. Form and analytics service providers process data for us. Diploma interest registrations may be shared with Bellarks Polytechnic when admissions open, only for your application.</p>'],
  ['How long we keep it', '<p>We keep enquiry details for up to two years unless you become a student, in which case student records rules apply.</p>'],
  ['Your rights', `<p>You can ask to see, correct or delete your data, or stop receiving messages, by contacting us at ${contactLine()}.</p>`]
]);
legal('/terms/', 'Terms of use', 'Terms of use', 'The terms that apply when you use the Netprox website.', [
  ['Using this site', '<p>This website gives information about Netprox courses and programmes. By using it you agree to these terms.</p>'],
  ['Course information', '<p>We keep course details, durations and schedules accurate, but they may change. Fees and start dates are confirmed by an adviser before you enrol. Cisco certification exam vouchers are paid separately from course fees.</p>'],
  ['National diplomas', '<p>OND and HND programmes are awarded by Bellarks Polytechnic and are subject to final NBTE approval of the Lakowe study centre arrangement. Registering interest is not an offer of admission.</p>'],
  ['Trademarks', '<p>Cisco and Cisco Networking Academy are trademarks of Cisco Systems, Inc. Exam names belong to their awarding bodies. Netprox and the Netprox logo belong to Netprox Limited.</p>'],
  ['Links', '<p>We link to WhatsApp, Google Maps and other services. Their own terms apply when you use them.</p>'],
  ['Contact', `<p>Questions about these terms: ${contactLine()}.</p>`]
]);

/* 404 */
page('/404', 'Page not found | Netprox', 'This page could not be found.',
  `<section class="section"><div class="wrap section-head center"><p class="eyebrow">Error 404</p><h1>We could not find that page</h1><p class="lead">The link may be old. Try the courses below or chat with an adviser.</p>
  <div class="btn-row" style="justify-content:center">${waBtn({ label: 'Chat with an adviser', text: adviserMsg, track: 'Adviser', pos: '404' })}<a class="btn btn-ghost" href="/courses/">See all courses</a></div></div></section>`);

/* ---------- write + checks ---------- */
const files = pages.map(p => ({ file: p.path === '/404' ? '404.html' : join(p.path, 'index.html'), html: layout(p), path: p.path }));

const errors = [];
const forbidden = [[/PIIT/i, 'PIIT'], [/Aptech/i, 'Aptech'], [/22[,.]?000/, 'the 22,000 figure'], [/campus/i, 'the word campus (use study centre)'], [/₦|NGN\s?\d|naira/i, 'a fee'], [/href="#"/, 'a link to #'], [/apply now/i, 'an Apply Now button']];
for (const { file, html } of files) {
  for (const [re, what] of forbidden) if (re.test(html)) errors.push(`${file}: contains ${what}`);
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const target = m[1];
    if (target.startsWith('/assets/')) continue;
    if (!pages.some(p => p.path === target || p.path === target + '/')) errors.push(`${file}: broken link ${target}`);
  }
  for (const m of html.matchAll(/href="([^"]*)#([a-z0-9-]+)"/g)) {
    const owner = m[1] ? files.find(f => f.file === join(m[1], 'index.html')) : { html };
    if (owner && !owner.html.includes(`id="${m[2]}"`)) errors.push(`${file}: anchor #${m[2]} not found on ${m[1] || 'same page'}`);
  }
}
const walk = d => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
for (const f of walk(join(ROOT, 'src', 'assets'))) if (/piit|aptech/i.test(relative(ROOT, f))) errors.push(`asset file name contains a forbidden word: ${relative(ROOT, f)}`);

const list = [...pending].sort();
if (errors.length) {
  console.error('\nBuild stopped. Content rule failures:\n' + errors.map(e => '  ✗ ' + e).join('\n'));
  process.exit(1);
}
if (PROD && list.length) {
  console.error(`\nProduction build stopped: ${list.length} items still need confirmation:\n` + list.map(e => '  ☐ ' + e).join('\n'));
  process.exit(1);
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, 'src', 'assets'), join(DIST, 'assets'), { recursive: true, filter: s => !/-source\.(jpe?g|png)$/.test(s) });
// Rewrite root links ("/assets/…", "/courses/#x") as relative paths so the site works
// from any folder on a host and when the files are opened straight from disk.
// Draft builds point page links at index.html so double-clicking a file works;
// production keeps clean URLs (/courses/). The 404 page stays root-relative on a host.
function relativise(html, path) {
  if (PROD && path === '/404') return html;
  const depth = path === '/' || path === '/404' ? 0 : path.split('/').filter(Boolean).length;
  const up = depth ? '../'.repeat(depth) : './';
  return html.replace(/(href|src)="\/([^"]*)"/g, (_, attr, target) => {
    if (target.startsWith('assets/')) return `${attr}="${up}${target}"`;
    const [page, hash] = target.split('#');
    const file = PROD ? page : page + 'index.html';
    return `${attr}="${up}${file}${hash !== undefined ? '#' + hash : ''}"`;
  });
}
for (const { file, html, path } of files) {
  mkdirSync(dirname(join(DIST, file)), { recursive: true });
  writeFileSync(join(DIST, file), relativise(html, path));
}
if (siteUrl) {
  writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter(p => p.path !== '/404').map(p => `  <url><loc>${siteUrl}${p.path}</loc></url>`).join('\n')}\n</urlset>\n`);
}
writeFileSync(join(DIST, 'robots.txt'), PROD ? `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}` : 'User-agent: *\nDisallow: /\n');

console.log(`${PROD ? 'Production' : 'Draft'} build: ${files.length} pages written to dist/`);
console.log('Content rule checks passed: no PIIT, Aptech, 22,000, campus, fees, # links or Apply Now; all internal links and anchors resolve.');
if (notes.size) console.log('\nNotes (not blocking):\n' + [...notes].map(e => '  • ' + e).join('\n'));
if (list.length) console.log(`\n${list.length} items still to confirm (shown as "To confirm" in this draft):\n` + list.map(e => '  ☐ ' + e).join('\n'));

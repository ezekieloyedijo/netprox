// Generates the scene illustrations used on cards and page headers.
// Run: node tools/make-illustrations.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'img', 'illustrations');
mkdirSync(out, { recursive: true });

const N = '#0A3F4F', D = '#072C38', T = '#01C3C3', TL = '#7FE3E3', TB = '#3FE0E0';

const frame = (id, label, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF9F9"/><stop offset="1" stop-color="#D3F1F1"/></linearGradient>
    <linearGradient id="${id}-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11566B"/><stop offset="1" stop-color="${N}"/></linearGradient>
    <linearGradient id="${id}-t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${TB}"/><stop offset="1" stop-color="#00A6AA"/></linearGradient>
  </defs>
  <rect width="400" height="240" fill="url(#${id}-bg)"/>
  <g fill="none" stroke="${N}" stroke-opacity=".1" stroke-width="2">
    <path d="M0 52h60l22 22h70"/><path d="M400 190h-70l-20-20h-60"/><path d="M40 240v-40l20-20"/><path d="M360 0v34l-18 18"/>
  </g>
  <g fill="#FFFFFF" stroke="${N}" stroke-opacity=".18" stroke-width="2">
    <circle cx="152" cy="74" r="5"/><circle cx="250" cy="170" r="5"/><circle cx="60" cy="180" r="5"/><circle cx="342" cy="52" r="5"/>
  </g>
  ${body(id)}
</svg>
`;

const scenes = {
  networking: ['Network switch connected to routers and devices', id => `
  <g fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round">
    <path d="M200 132V96M200 132l-92 34M200 132l92 34M200 132v54"/>
  </g>
  <g transform="translate(140 52)">
    <rect width="120" height="48" rx="10" fill="url(#${id}-n)"/>
    <g fill="${T}"><rect x="12" y="14" width="10" height="10" rx="2"/><rect x="28" y="14" width="10" height="10" rx="2"/><rect x="44" y="14" width="10" height="10" rx="2" fill="${TL}"/><rect x="60" y="14" width="10" height="10" rx="2"/><rect x="76" y="14" width="10" height="10" rx="2" fill="${TL}"/></g>
    <circle cx="102" cy="19" r="4" fill="${TB}"/><path d="M12 34h60" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>
  </g>
  <g transform="translate(176 112)"><circle cx="24" cy="22" r="22" fill="url(#${id}-t)"/><path d="M14 22h20M24 12v20M16 14l16 16M32 14 16 30" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/></g>
  <g transform="translate(70 152)"><rect width="76" height="50" rx="8" fill="#FFFFFF" stroke="${N}" stroke-width="2.5"/><rect x="8" y="8" width="60" height="30" rx="4" fill="${N}"/><path d="M16 18h26M16 28h40" stroke="${T}" stroke-width="3" stroke-linecap="round"/></g>
  <g transform="translate(254 152)"><rect width="76" height="50" rx="8" fill="#FFFFFF" stroke="${N}" stroke-width="2.5"/><rect x="8" y="8" width="60" height="30" rx="4" fill="${N}"/><path d="M16 18h40M16 28h22" stroke="${TL}" stroke-width="3" stroke-linecap="round"/></g>
  <g transform="translate(182 178)"><rect width="36" height="44" rx="6" fill="url(#${id}-n)"/><circle cx="18" cy="14" r="4" fill="${T}"/><path d="M10 28h16M10 34h16" stroke="#FFFFFF" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/></g>`],

  cybersecurity: ['Security shield with padlock protecting connected systems', id => `
  <circle cx="200" cy="120" r="86" fill="${T}" fill-opacity=".14"/>
  <circle cx="200" cy="120" r="62" fill="none" stroke="${T}" stroke-opacity=".5" stroke-width="2" stroke-dasharray="4 8"/>
  <path d="M200 46l62 22v46c0 40-27 66-62 80-35-14-62-40-62-80V68z" fill="url(#${id}-n)"/>
  <path d="M200 62l46 16v36c0 30-20 50-46 60z" fill="#FFFFFF" fill-opacity=".08"/>
  <rect x="176" y="112" width="48" height="38" rx="7" fill="url(#${id}-t)"/>
  <path d="M185 112v-12a15 15 0 0 1 30 0v12" fill="none" stroke="${TB}" stroke-width="6"/>
  <circle cx="200" cy="128" r="5" fill="${D}"/><path d="M200 132v8" stroke="${D}" stroke-width="4" stroke-linecap="round"/>
  <g fill="#FFFFFF" stroke="${N}" stroke-width="2.5">
    <rect x="62" y="96" width="54" height="40" rx="7"/><rect x="284" y="96" width="54" height="40" rx="7"/>
  </g>
  <path d="M74 110h30M74 122h18M296 110h30M296 122h20" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
  <path d="M116 116h22M262 116h22" stroke="${T}" stroke-width="3" stroke-dasharray="3 5"/>
  <g fill="${D}"><circle cx="318" cy="60" r="4"/><circle cx="82" cy="170" r="4"/></g>
  <path d="M300 186l8 8 16-18" fill="none" stroke="${T}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`],

  diplomas: ['Graduation cap resting on a rolled diploma', id => `
  <ellipse cx="200" cy="196" rx="120" ry="12" fill="${N}" fill-opacity=".1"/>
  <g transform="translate(96 140)">
    <rect width="208" height="48" rx="24" fill="#FFFFFF" stroke="${N}" stroke-width="3"/>
    <circle cx="24" cy="24" r="16" fill="#F3FBFB" stroke="${N}" stroke-width="3"/>
    <path d="M60 18h110M60 30h80" stroke="${T}" stroke-width="4" stroke-linecap="round"/>
    <path d="M150 48l8 26 10-10 12 6-8-22" fill="${T}"/>
  </g>
  <path d="M200 40l110 44-110 44-110-44z" fill="url(#${id}-n)"/>
  <path d="M138 104v34c0 14 28 24 62 24s62-10 62-24v-34l-62 24z" fill="#0F5266"/>
  <path d="M200 84l-74 4v52" fill="none" stroke="url(#${id}-t)" stroke-width="4" stroke-linecap="round"/>
  <circle cx="126" cy="146" r="9" fill="${TB}"/>
  <circle cx="200" cy="84" r="7" fill="${TB}"/>`],

  courses: ['Code editor, design canvas and data chart for career courses', id => `
  <g transform="translate(64 44)">
    <rect width="180" height="128" rx="12" fill="url(#${id}-n)"/>
    <g fill="#FFFFFF" fill-opacity=".35"><circle cx="16" cy="14" r="4"/><circle cx="30" cy="14" r="4"/><circle cx="44" cy="14" r="4"/></g>
    <g stroke-width="5" stroke-linecap="round">
      <path d="M18 40h30" stroke="${T}"/><path d="M56 40h50" stroke="#FFFFFF" stroke-opacity=".5"/>
      <path d="M34 58h64" stroke="${TL}"/><path d="M34 76h36" stroke="#FFFFFF" stroke-opacity=".45"/><path d="M78 76h44" stroke="${T}"/>
      <path d="M34 94h52" stroke="${TL}" stroke-opacity=".7"/><path d="M18 112h24" stroke="${T}"/>
    </g>
    <path d="M140 52l-14 14 14 14M156 52l14 14-14 14" fill="none" stroke="${TB}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g transform="translate(220 92)">
    <rect width="120" height="104" rx="12" fill="#FFFFFF" stroke="${N}" stroke-width="2.5"/>
    <g fill="${T}"><rect x="16" y="62" width="14" height="26" rx="3" fill-opacity=".5"/><rect x="38" y="48" width="14" height="40" rx="3" fill-opacity=".75"/><rect x="60" y="36" width="14" height="52" rx="3"/><rect x="82" y="24" width="14" height="64" rx="3" fill="${N}"/></g>
    <path d="M16 18h40" stroke="${N}" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>
  </g>
  <g transform="translate(36 150)"><circle cx="22" cy="22" r="22" fill="url(#${id}-t)"/><path d="M12 30l8-18 4 10 6-4 4 12" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`],

  tutorials: ['Computer based test screen with answered multiple choice questions', id => `
  <g transform="translate(92 34)">
    <rect width="216" height="146" rx="14" fill="url(#${id}-n)"/>
    <rect x="12" y="12" width="192" height="122" rx="8" fill="#FFFFFF"/>
    <rect x="12" y="12" width="192" height="24" rx="8" fill="#E5F7F7"/>
    <path d="M24 24h60" stroke="${N}" stroke-width="4" stroke-linecap="round"/><rect x="160" y="18" width="34" height="12" rx="6" fill="${T}"/>
    <g stroke="${N}" stroke-width="2.5" fill="#FFFFFF">
      <circle cx="34" cy="56" r="7"/><circle cx="34" cy="80" r="7" fill="${T}" stroke="${T}"/><circle cx="34" cy="104" r="7"/>
    </g>
    <path d="M30 80l3 3 6-6" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
    <g stroke-width="4" stroke-linecap="round"><path d="M50 56h90" stroke="${N}" stroke-opacity=".3"/><path d="M50 80h112" stroke="${N}" stroke-opacity=".7"/><path d="M50 104h70" stroke="${N}" stroke-opacity=".3"/></g>
    <rect x="148" y="112" width="44" height="14" rx="7" fill="${N}"/>
  </g>
  <path d="M184 180h32l8 20h-48z" fill="#0F5266"/><rect x="156" y="198" width="88" height="8" rx="4" fill="${N}"/>
  <g transform="translate(300 128)"><circle cx="28" cy="28" r="28" fill="url(#${id}-t)"/><circle cx="28" cy="28" r="18" fill="none" stroke="#FFFFFF" stroke-width="3"/><path d="M28 18v10l7 5" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/></g>`],

  corporate: ['Team training dashboard with progress report and goals', id => `
  <g transform="translate(60 40)">
    <rect width="190" height="140" rx="14" fill="#FFFFFF" stroke="${N}" stroke-width="2.5"/>
    <path d="M18 24h70" stroke="${N}" stroke-width="5" stroke-linecap="round"/>
    <g stroke-width="10" stroke-linecap="round">
      <path d="M18 56h154" stroke="#E5F2F2"/><path d="M18 56h120" stroke="${T}"/>
      <path d="M18 82h154" stroke="#E5F2F2"/><path d="M18 82h90" stroke="${N}"/>
      <path d="M18 108h154" stroke="#E5F2F2"/><path d="M18 108h140" stroke="${TB}"/>
    </g>
  </g>
  <g transform="translate(226 74)">
    <rect width="120" height="120" rx="16" fill="url(#${id}-n)"/>
    <circle cx="60" cy="60" r="34" fill="none" stroke="#FFFFFF" stroke-opacity=".15" stroke-width="12"/>
    <path d="M60 26a34 34 0 1 1-32 46" fill="none" stroke="${T}" stroke-width="12" stroke-linecap="round"/>
    <path d="M48 60l9 9 16-18" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g transform="translate(96 184)" fill="${N}"><rect width="16" height="16" rx="8"/><rect x="24" width="16" height="16" rx="8" fill="${T}"/><rect x="48" width="16" height="16" rx="8" fill="${TL}"/><rect x="72" width="16" height="16" rx="8" fill-opacity=".4"/></g>`],

  centre: ['Modern study centre building with lab windows', id => `
  <ellipse cx="200" cy="206" rx="150" ry="10" fill="${N}" fill-opacity=".1"/>
  <rect x="86" y="70" width="228" height="134" rx="8" fill="url(#${id}-n)"/>
  <rect x="86" y="58" width="228" height="20" rx="6" fill="#0F5266"/>
  <g fill="${TL}" fill-opacity=".85">
    <rect x="104" y="92" width="38" height="28" rx="3"/><rect x="152" y="92" width="38" height="28" rx="3" fill="${T}"/><rect x="210" y="92" width="38" height="28" rx="3"/><rect x="258" y="92" width="38" height="28" rx="3" fill="${T}"/>
    <rect x="104" y="132" width="38" height="28" rx="3" fill="${T}"/><rect x="152" y="132" width="38" height="28" rx="3"/><rect x="258" y="132" width="38" height="28" rx="3"/>
  </g>
  <rect x="206" y="140" width="46" height="64" rx="4" fill="#FFFFFF"/><path d="M229 140v64" stroke="${N}" stroke-width="2"/>
  <rect x="140" y="172" width="54" height="16" rx="4" fill="#FFFFFF" fill-opacity=".9"/><path d="M148 180h38" stroke="${N}" stroke-width="3" stroke-linecap="round"/>
  <g transform="translate(300 28)"><path d="M22 0a22 22 0 0 1 22 22c0 16-22 40-22 40S0 38 0 22A22 22 0 0 1 22 0z" fill="url(#${id}-t)"/><circle cx="22" cy="22" r="8" fill="#FFFFFF"/></g>`],

  contact: ['Chat bubbles and a map pin for getting in touch', id => `
  <g transform="translate(70 50)">
    <path d="M14 0h150a14 14 0 0 1 14 14v70a14 14 0 0 1-14 14H50l-26 22v-22H14A14 14 0 0 1 0 84V14A14 14 0 0 1 14 0z" fill="url(#${id}-n)"/>
    <path d="M24 32h120M24 54h84" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="6" stroke-linecap="round"/>
    <path d="M24 76h50" stroke="${T}" stroke-width="6" stroke-linecap="round"/>
  </g>
  <g transform="translate(196 104)">
    <path d="M12 0h112a12 12 0 0 1 12 12v52a12 12 0 0 1-12 12h-10v20l-22-20H12A12 12 0 0 1 0 64V12A12 12 0 0 1 12 0z" fill="#FFFFFF" stroke="${N}" stroke-width="2.5"/>
    <path d="M18 26h90M18 46h60" stroke="${T}" stroke-width="6" stroke-linecap="round"/>
  </g>
  <g transform="translate(300 36)"><path d="M22 0a22 22 0 0 1 22 22c0 16-22 40-22 40S0 38 0 22A22 22 0 0 1 22 0z" fill="url(#${id}-t)"/><circle cx="22" cy="22" r="8" fill="#FFFFFF"/></g>`],

  faq: ['Question and answer cards', id => `
  <g transform="translate(84 46)">
    <rect width="232" height="58" rx="12" fill="url(#${id}-n)"/>
    <circle cx="30" cy="29" r="16" fill="url(#${id}-t)"/>
    <path d="M25 24a5 5 0 1 1 7 4.5c-1.5.8-2 1.7-2 3.5M30 37v.5" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
    <path d="M58 24h120M58 38h80" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>
  </g>
  <g transform="translate(84 118)">
    <rect width="232" height="76" rx="12" fill="#FFFFFF" stroke="${N}" stroke-width="2.5"/>
    <path d="M22 24h150M22 40h180M22 56h110" stroke="${N}" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>
    <path d="M22 24h60" stroke="${T}" stroke-width="5" stroke-linecap="round"/>
  </g>`]
};

for (const [name, [label, body]] of Object.entries(scenes)) {
  writeFileSync(join(out, `${name}.svg`), frame(name.slice(0, 3), label, body));
}
console.log('Wrote', Object.keys(scenes).length, 'illustrations to', out);

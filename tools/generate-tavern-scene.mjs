import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.resolve('public/scenes');

const colors = {
  ink: '#2e3b34',
  cream: '#f4ecdc',
  creamDark: '#e4d8c0',
  wood: '#8b5f3f',
  woodDark: '#68442d',
  sage: '#7d9a7e',
  forest: '#45614f',
  stone: '#b8b1a2',
  warmLight: '#f0c887',
  parchment: '#e8ddc4'
};

function agent(id, x, y, scale = 1) {
  const s = scale;
  const common = `
    <g transform="translate(${x},${y}) scale(${s})" stroke="${colors.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="0" cy="30" rx="42" ry="10" fill="#000" opacity="0.13"/>
      <path d="M-30 16 Q0 -28 30 16 L24 46 Q0 56 -24 46 Z" fill="#f6f0e3"/>
      <circle cx="0" cy="-36" r="16" fill="#f6f0e3"/>
      <path d="M-16 -40 Q0 -56 16 -40" fill="${colors.wood}"/>
      <circle cx="-6" cy="-36" r="1.5" fill="${colors.ink}"/>
      <circle cx="6" cy="-36" r="1.5" fill="${colors.ink}"/>
      <path d="M-5 -29 Q0 -25 5 -29" fill="none"/>
    `;

  const end = '</g>';

  if (id === 'architect') {
    return common + `
      <path d="M-28 -6 H-2 V12 H-28 Z" fill="${colors.parchment}"/>
      <path d="M-24 -1 H-6 M-24 5 H-10"/>
      <circle cx="27" cy="2" r="9" fill="none"/>
      <path d="M27 -8 V12 M17 2 H37"/>
    ` + end;
  }

  if (id === 'ui') {
    return common + `
      <rect x="-30" y="-8" width="28" height="20" rx="3" fill="${colors.parchment}"/>
      <rect x="0" y="-8" width="28" height="20" rx="3" fill="#d7e3d2"/>
      <path d="M26 -10 L36 12"/>
      <circle cx="42" cy="14" r="4" fill="#5d8a71"/>
      <circle cx="50" cy="10" r="4" fill="#b88463"/>
    ` + end;
  }

  if (id === 'debug') {
    return common + `
      <circle cx="8" cy="-36" r="6" fill="none"/>
      <path d="M14 -32 L23 -27"/>
      <circle cx="-30" cy="6" r="8" fill="#f3d6a1"/>
      <rect x="-33" y="14" width="6" height="14" rx="2" fill="${colors.wood}"/>
      <path d="M25 -3 L44 12 L36 18 L18 4 Z" fill="${colors.stone}"/>
    ` + end;
  }

  if (id === 'qa') {
    return common + `
      <path d="M-30 -6 L-6 -6 L0 12 L-18 24 L-36 12 Z" fill="#d7dfd5"/>
      <path d="M-25 8 L-19 14 L-9 3" fill="none"/>
      <rect x="26" y="-6" width="8" height="20" rx="2" fill="${colors.wood}"/>
      <rect x="22" y="-12" width="16" height="8" rx="2" fill="#d8b57d"/>
    ` + end;
  }

  return common + `
    <rect x="-30" y="-8" width="26" height="22" rx="3" fill="${colors.parchment}"/>
    <path d="M-26 -2 H-8 M-26 4 H-10 M-26 10 H-14"/>
    <path d="M24 -4 Q34 -20 42 -5 Q35 2 26 5" fill="#f2dfbe"/>
    <path d="M22 7 L34 18"/>
  ` + end;
}

function sceneSvg(w, h) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#efe6d5"/>
        <stop offset="100%" stop-color="#dbc8a8"/>
      </linearGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#7d5538"/>
        <stop offset="100%" stop-color="#6a452f"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.25" r="0.45">
        <stop offset="0%" stop-color="rgba(241,200,132,0.52)"/>
        <stop offset="100%" stop-color="rgba(241,200,132,0)"/>
      </radialGradient>
      <filter id="paper">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="9"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="table" tableValues="0 0.06"/></feComponentTransfer>
      </filter>
    </defs>

    <rect width="${w}" height="${h}" fill="url(#wall)"/>
    <rect y="${Math.floor(h * 0.64)}" width="${w}" height="${Math.ceil(h * 0.36)}" fill="url(#floor)"/>

    <g stroke="${colors.ink}" stroke-width="6" opacity="0.72">
      <line x1="130" y1="0" x2="130" y2="${h}"/>
      <line x1="${Math.floor(w * 0.39)}" y1="0" x2="${Math.floor(w * 0.39)}" y2="${h}"/>
      <line x1="${Math.floor(w * 0.71)}" y1="0" x2="${Math.floor(w * 0.71)}" y2="${h}"/>
      <line x1="0" y1="140" x2="${w}" y2="140"/>
    </g>

    <rect x="${Math.floor(w * 0.78)}" y="${Math.floor(h * 0.23)}" width="${Math.floor(w * 0.17)}" height="${Math.floor(h * 0.25)}" rx="12" fill="${colors.parchment}" stroke="${colors.ink}" stroke-width="4"/>
    <path d="M${Math.floor(w * 0.8)} ${Math.floor(h * 0.28)} h${Math.floor(w * 0.13)} M${Math.floor(w * 0.8)} ${Math.floor(h * 0.32)} h${Math.floor(w * 0.12)} M${Math.floor(w * 0.8)} ${Math.floor(h * 0.36)} h${Math.floor(w * 0.1)}" stroke="${colors.ink}" stroke-width="3"/>

    <rect x="${Math.floor(w * 0.61)}" y="${Math.floor(h * 0.13)}" width="${Math.floor(w * 0.13)}" height="${Math.floor(h * 0.12)}" rx="10" fill="${colors.parchment}" stroke="${colors.ink}" stroke-width="4"/>
    <circle cx="${Math.floor(w * 0.65)}" cy="${Math.floor(h * 0.16)}" r="5" fill="${colors.sage}"/>
    <circle cx="${Math.floor(w * 0.68)}" cy="${Math.floor(h * 0.18)}" r="5" fill="${colors.stone}"/>

    <g>
      <line x1="${Math.floor(w * 0.53)}" y1="118" x2="${Math.floor(w * 0.53)}" y2="${Math.floor(h * 0.38)}" stroke="${colors.ink}" stroke-width="5"/>
      <path d="M${Math.floor(w * 0.51)} 118 h${Math.floor(w * 0.04)} l-10 18 h-20 l-10 -18 z" fill="${colors.warmLight}" stroke="${colors.ink}" stroke-width="4"/>
      <ellipse cx="${Math.floor(w * 0.53)}" cy="${Math.floor(h * 0.33)}" rx="${Math.floor(w * 0.28)}" ry="${Math.floor(h * 0.24)}" fill="url(#glow)"/>
    </g>

    <ellipse cx="${Math.floor(w * 0.54)}" cy="${Math.floor(h * 0.72)}" rx="${Math.floor(w * 0.22)}" ry="${Math.floor(h * 0.07)}" fill="#000" opacity="0.2"/>
    <ellipse cx="${Math.floor(w * 0.54)}" cy="${Math.floor(h * 0.67)}" rx="${Math.floor(w * 0.24)}" ry="${Math.floor(h * 0.08)}" fill="#9b6a46" stroke="${colors.ink}" stroke-width="6"/>
    <rect x="${Math.floor(w * 0.43)}" y="${Math.floor(h * 0.67)}" width="${Math.floor(w * 0.22)}" height="${Math.floor(h * 0.16)}" rx="16" fill="#7e5337" stroke="${colors.ink}" stroke-width="5"/>

    <g stroke="${colors.ink}" stroke-width="3">
      <rect x="${Math.floor(w * 0.46)}" y="${Math.floor(h * 0.62)}" width="44" height="20" rx="4" fill="${colors.parchment}"/>
      <rect x="${Math.floor(w * 0.52)}" y="${Math.floor(h * 0.61)}" width="40" height="18" rx="4" fill="#d5e2d0"/>
      <circle cx="${Math.floor(w * 0.58)}" cy="${Math.floor(h * 0.64)}" r="8" fill="#c1905d"/>
      <circle cx="${Math.floor(w * 0.61)}" cy="${Math.floor(h * 0.645)}" r="8" fill="#d8b988"/>
    </g>

    ${agent('architect', Math.floor(w * 0.43), Math.floor(h * 0.67), w / 1280)}
    ${agent('ui', Math.floor(w * 0.51), Math.floor(h * 0.64), w / 1280)}
    ${agent('debug', Math.floor(w * 0.60), Math.floor(h * 0.67), w / 1280)}
    ${agent('qa', Math.floor(w * 0.48), Math.floor(h * 0.77), w / 1280)}
    ${agent('writer', Math.floor(w * 0.56), Math.floor(h * 0.77), w / 1280)}

    <rect width="${w}" height="${h}" fill="none" filter="url(#paper)"/>
  </svg>`;
}

async function render(fileName, w, h) {
  const svg = sceneSvg(w, h);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(outDir, fileName));
}

await fs.mkdir(outDir, { recursive: true });
await render('tavern-interior-hero.png', 1280, 720);
await render('tavern-interior-hero@2x.png', 1920, 1080);

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.resolve('public/sprites/agents');

const palette = {
  line: '#2f3d35',
  cream: '#f5efe2',
  sage: '#8ba989',
  forest: '#466251',
  wood: '#9a6a45',
  stone: '#b9b3a6',
  accentGold: '#d7b272',
  inkSoft: '#4b5b52'
};

const agents = [
  { id: 'architect', name: 'Architect Agent', roleClass: 'Mage/Planner', dominantColor: '#6a8d79' },
  { id: 'ui', name: 'UI Agent', roleClass: 'Artificer', dominantColor: '#7fa58c' },
  { id: 'debug', name: 'Debug Agent', roleClass: 'Rogue/Hunter', dominantColor: '#5e7e69' },
  { id: 'qa', name: 'QA Agent', roleClass: 'Paladin/Inspector', dominantColor: '#7b9270' },
  { id: 'writer', name: 'Writer Agent', roleClass: 'Bard/Scribe', dominantColor: '#917359' }
];

function watercolorTexture(opacity = 0.08) {
  return `
    <defs>
      <filter id="paper">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 ${opacity}"/>
        </feComponentTransfer>
      </filter>
      <linearGradient id="cloakGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.sage}"/>
        <stop offset="100%" stop-color="${palette.forest}"/>
      </linearGradient>
      <linearGradient id="woodGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#b07b52"/>
        <stop offset="100%" stop-color="${palette.wood}"/>
      </linearGradient>
    </defs>
  `;
}

function baseIdle(agent, variant = 0) {
  const bob = variant === 0 ? 0 : 2;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    ${watercolorTexture(0.085)}
    <rect width="512" height="512" fill="none"/>
    <ellipse cx="256" cy="430" rx="112" ry="24" fill="#000" opacity="0.08"/>

    <g transform="translate(0, ${bob})" stroke="${palette.line}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M182 390 Q256 300 330 390 L316 426 Q256 444 196 426 Z" fill="url(#cloakGrad)"/>
      <path d="M206 278 Q256 250 306 278 L296 336 Q256 350 216 336 Z" fill="${palette.cream}"/>
      <circle cx="256" cy="224" r="42" fill="${palette.cream}"/>
      <path d="M214 215 Q256 170 298 215" fill="${palette.wood}"/>
      <circle cx="241" cy="224" r="3" fill="${palette.inkSoft}"/>
      <circle cx="271" cy="224" r="3" fill="${palette.inkSoft}"/>
      <path d="M244 241 Q256 248 268 241" fill="none"/>
      <path d="M220 262 L292 262" opacity="0.35"/>

      <path d="M210 336 Q198 360 185 384" fill="none"/>
      <path d="M302 336 Q314 360 327 384" fill="none"/>

      <rect x="220" y="430" width="24" height="16" rx="5" fill="${palette.stone}"/>
      <rect x="268" y="430" width="24" height="16" rx="5" fill="${palette.stone}"/>

      ${rolePropIdle(agent.id)}
    </g>

    <rect x="8" y="8" width="496" height="496" rx="40" fill="none" filter="url(#paper)"/>
  </svg>`;
}

function rolePropIdle(id) {
  switch (id) {
    case 'architect':
      return `
        <rect x="152" y="325" width="78" height="44" rx="7" fill="${palette.cream}"/>
        <path d="M160 340 H222 M160 350 H210"/>
        <circle cx="336" cy="338" r="20" fill="none"/>
        <path d="M336 316 L336 360 M314 338 L358 338"/>
        <path d="M336 338 L362 312"/>
        <path d="M348 306 q14 8 8 22" fill="none"/>
      `;
    case 'ui':
      return `
        <rect x="146" y="326" width="82" height="48" rx="8" fill="${palette.cream}"/>
        <rect x="154" y="334" width="30" height="12" rx="3" fill="#d5e3d2"/>
        <rect x="188" y="334" width="32" height="12" rx="3" fill="#e4d2b8"/>
        <rect x="154" y="351" width="66" height="14" rx="3" fill="#c5d4cc"/>
        <path d="M328 314 l20 52"/>
        <circle cx="354" cy="372" r="7" fill="#5f8a72"/>
        <circle cx="372" cy="368" r="7" fill="#b88564"/>
      `;
    case 'debug':
      return `
        <circle cx="274" cy="220" r="13" fill="none"/>
        <path d="M286 226 L304 236"/>
        <circle cx="170" cy="350" r="16" fill="#f3d6a4"/>
        <rect x="164" y="364" width="12" height="26" rx="3" fill="${palette.wood}"/>
        <path d="M332 316 l26 30 l-12 10 l-26 -30 z" fill="${palette.stone}"/>
        <path d="M346 334 l18 -14"/>
      `;
    case 'qa':
      return `
        <path d="M152 324 L214 324 L224 356 L183 388 L142 356 Z" fill="#d9e1d7"/>
        <path d="M163 346 l12 12 l24 -24" fill="none"/>
        <rect x="330" y="326" width="18" height="42" rx="6" fill="${palette.wood}"/>
        <rect x="322" y="316" width="34" height="14" rx="5" fill="#d9b47e"/>
      `;
    case 'writer':
      return `
        <rect x="146" y="320" width="72" height="56" rx="8" fill="${palette.cream}"/>
        <path d="M156 335 H208 M156 345 H206 M156 355 H198"/>
        <path d="M320 328 q18 -34 34 -2 q-14 10 -30 14" fill="#f2dfbe"/>
        <path d="M315 347 l24 22"/>
        <rect x="212" y="322" width="8" height="20" rx="2" fill="#a96d5f"/>
      `;
    default:
      return '';
  }
}

function portrait(agent, variant = 0) {
  const blink = variant === 0 ? 3 : 1;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    ${watercolorTexture(0.075)}
    <rect width="512" height="512" fill="none"/>
    <circle cx="256" cy="260" r="190" fill="#f7f2e7" stroke="${palette.line}" stroke-width="4"/>

    <g stroke="${palette.line}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M150 370 Q256 238 362 370 L334 420 Q256 446 178 420 Z" fill="url(#cloakGrad)"/>
      <circle cx="256" cy="232" r="64" fill="${palette.cream}"/>
      <path d="M192 220 Q256 150 320 220" fill="${palette.wood}"/>
      <ellipse cx="232" cy="232" rx="5" ry="${blink}" fill="${palette.inkSoft}"/>
      <ellipse cx="280" cy="232" rx="5" ry="${blink}" fill="${palette.inkSoft}"/>
      <path d="M238 262 Q256 272 274 262" fill="none"/>
      ${rolePropPortrait(agent.id)}
    </g>
  </svg>`;
}

function rolePropPortrait(id) {
  switch (id) {
    case 'architect':
      return `<path d="M154 306 h82"/><circle cx="346" cy="306" r="24" fill="none"/><path d="M346 282 v48 M322 306 h48"/>`;
    case 'ui':
      return `<rect x="144" y="290" width="92" height="52" rx="8" fill="${palette.cream}"/><circle cx="352" cy="304" r="8" fill="#5f8a72"/><circle cx="372" cy="316" r="8" fill="#c28a62"/>`;
    case 'debug':
      return `<circle cx="286" cy="233" r="16" fill="none"/><path d="M300 241 l24 10"/><circle cx="164" cy="312" r="16" fill="#f3d6a4"/>`;
    case 'qa':
      return `<path d="M144 286 L224 286 L236 336 L184 378 L132 336 Z" fill="#d9e1d7"/><path d="M162 326 l14 14 l28 -28" fill="none"/>`;
    case 'writer':
      return `<rect x="138" y="286" width="88" height="66" rx="8" fill="${palette.cream}"/><path d="M154 304 h58 M154 320 h58 M154 336 h46"/><path d="M330 300 q20 -32 36 -4 q-16 12 -32 16" fill="#f2dfbe"/>`;
    default:
      return '';
  }
}

async function renderPng(svg, outPath, size) {
  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const manifest = [];

  for (const agent of agents) {
    const idle512 = `${agent.id}-idle.png`;
    const portrait512 = `${agent.id}-portrait.png`;
    const idle256 = `${agent.id}-idle-256.png`;
    const portrait256 = `${agent.id}-portrait-256.png`;
    const idleAlt = `${agent.id}-idle-alt.png`;

    const idleSvg = baseIdle(agent, 0);
    const idleAltSvg = baseIdle(agent, 1);
    const portraitSvg = portrait(agent, 0);

    await renderPng(idleSvg, path.join(outDir, idle512), 512);
    await renderPng(portraitSvg, path.join(outDir, portrait512), 512);
    await renderPng(idleAltSvg, path.join(outDir, idleAlt), 512);

    await renderPng(idleSvg, path.join(outDir, idle256), 256);
    await renderPng(portraitSvg, path.join(outDir, portrait256), 256);

    manifest.push({
      id: agent.id,
      name: agent.name,
      spriteIdle: `/sprites/agents/${idle512}`,
      portrait: `/sprites/agents/${portrait512}`,
      dominantColor: agent.dominantColor,
      roleClass: agent.roleClass,
      variants: {
        idleAlt: `/sprites/agents/${idleAlt}`,
        idleWeb: `/sprites/agents/${idle256}`,
        portraitWeb: `/sprites/agents/${portrait256}`
      }
    });
  }

  await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

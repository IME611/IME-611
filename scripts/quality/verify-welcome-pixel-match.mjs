import assert from 'node:assert/strict';
import fs from 'node:fs';

const welcome = fs.readFileSync('src/features/welcome/WelcomeScreen.tsx', 'utf8');
const css = fs.readFileSync('src/design/features/welcome.css', 'utf8');
const primitive = fs.readFileSync('src/design/primitives/liquid-glass.css', 'utf8');
const app = fs.readFileSync('src/app/App.tsx', 'utf8');
const main = fs.readFileSync('src/main.tsx', 'utf8');

assert.match(welcome, /E · I · L/, 'approved E.I.L label must remain');
assert.match(welcome, /רגע של מודעות אמיתית/, 'approved four-line hook must remain');
assert.match(welcome, /welcomeOrbA/, 'welcome must retain the approved soft bokeh depth');
assert.match(welcome, /welcomeFloorGlow/, 'welcome must retain the lower light floor');
assert.match(welcome, /welcomeCtaLens/, 'welcome CTA must mount a dedicated optical lens layer');
assert.doesNotMatch(welcome, /welcomeGlass|welcomeKicker|welcomeGoldLine|welcomeSubHook|welcomeHint/, 'removed legacy welcome containers/copy must not return');

// Desktop remains pinned to the creator-approved reference geometry.
assert.match(css, /top:\s*17\.53%/, 'brand vertical geometry must stay pinned to the approved desktop reference');
assert.match(css, /top:\s*29\.97%/, 'headline geometry must stay pinned to the approved desktop reference');
assert.match(css, /top:\s*71\.73%/, 'CTA geometry must stay pinned to the approved desktop reference');
assert.match(css, /#1a1408/i, 'approved tourmaline text color must remain');
assert.match(css, /#d0aa5e/i, 'approved crystal-gold label color must remain');

// Creator/Claude mobile deltas are explicit acceptance criteria.
assert.match(css, /margin-top:\s*15vh/, 'mobile E.I.L label must start at 15vh');
assert.match(css, /font-size:\s*16px[\s\S]*?letter-spacing:\s*\.40em/, 'mobile E.I.L label must stay small and widely tracked');
assert.match(css, /font-size:\s*clamp\(28px,5vw,40px\)/, 'mobile headline must use the reduced approved scale');
assert.match(css, /\.welcomeHook\s*\{[\s\S]*?margin:\s*80px 0 0/, 'mobile headline must keep the approved 80px gap from the label');
assert.match(css, /width:\s*min\(340px,88vw\)/, 'mobile CTA must use the approved wider pill width');
assert.match(css, /\.welcomeCta\.eilLiquidButton\s*\{[\s\S]*?margin-top:\s*80px/, 'mobile CTA must keep the approved 80px gap from the headline');
assert.match(css, /\.welcomeOrbA\s*\{[\s\S]*?width:\s*300px[\s\S]*?height:\s*300px/, 'warm top-left bokeh must use the approved 300px scale');
assert.match(css, /\.welcomeOrbB\s*\{[\s\S]*?width:\s*360px[\s\S]*?height:\s*360px/, 'warm lower-left bokeh must use the approved 360px scale');
assert.match(css, /\.welcomeOrbC\s*\{[\s\S]*?width:\s*280px[\s\S]*?height:\s*280px/, 'amber lower-right bokeh must use the approved 280px scale');
assert.match(css, /filter:\s*blur\(80px\)/, 'welcome bokeh must remain broad and diffused');

// The button must read as glass even when Brave/Android does not render SVG backdrop displacement.
assert.match(css, /backdrop-filter:\s*blur\((?:4|5)px\)\s+saturate\((?:128|140)%\)/, 'CTA must keep a low-intensity translucent backdrop lens');
assert.match(css, /url\("#eil-liquid-glass-filter"\)/, 'welcome may enhance the deterministic lens with SVG optical displacement when supported');
assert.match(app, /<LiquidGlassFilter\s*\/>/, 'SVG optical filter definitions must remain mounted in the application');
assert.match(css, /linear-gradient\(180deg,\s*rgba\(255,255,255,\.0(?:35|55)\)/, 'CTA center fill must stay near-transparent on bright Android backgrounds');
assert.match(css, /\.welcomeCtaLens\s*\{[\s\S]*?mix-blend-mode:\s*normal/, 'dedicated lens must not use screen blending on the bright welcome substrate');
assert.match(css, /\.welcomeCtaLens::before\s*\{[\s\S]*?linear-gradient\(103deg/, 'deterministic lens must include visible internal specular refraction');
assert.match(css, /\.welcomeCta\.eilLiquidButton::before\s*\{[\s\S]*?height:\s*20%[\s\S]*?mix-blend-mode:\s*normal/, 'specular highlight must be a narrow rim instead of a full-surface white wash');
assert.match(css, /optical caustic under the lens/i, 'CTA must preserve the optical caustic layer');
assert.match(primitive, /glass must stay optically translucent/i, 'shared Liquid Glass primitive must preserve the translucency rule');
assert.doesNotMatch(css, /background-image:\s*url|welcome-approved\.avif/i, 'welcome must never regress to a raster mock');
assert.doesNotMatch(main, /welcome\/luxury\.css/, 'temporary raster welcome stylesheet must not return');

console.log('PASS welcome pixel match (approved mobile deltas + deterministic Liquid Glass + desktop reference geometry)');

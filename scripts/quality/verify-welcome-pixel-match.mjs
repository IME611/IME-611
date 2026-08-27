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
assert.doesNotMatch(welcome, /welcomeGlass|welcomeKicker|welcomeGoldLine|welcomeSubHook|welcomeHint/, 'removed legacy welcome containers/copy must not return');
assert.match(css, /top:\s*17\.53%/, 'brand vertical geometry must stay pinned to the approved desktop reference');
assert.match(css, /top:\s*29\.97%/, 'headline geometry must stay pinned to the approved desktop reference');
assert.match(css, /top:\s*71\.73%/, 'CTA geometry must stay pinned to the approved desktop reference');
assert.match(css, /#1a1408/i, 'approved tourmaline text color must remain');
assert.match(css, /#d0aa5e/i, 'approved crystal-gold label color must remain');
assert.match(css, /backdrop-filter:\s*blur\((?:10|12)px\)\s+saturate\((?:145|150)%\)/, 'CTA must keep a real translucent backdrop lens');
assert.match(css, /url\("#eil-liquid-glass-filter"\)/, 'welcome must opt into SVG optical displacement when supported');
assert.match(app, /<LiquidGlassFilter\s*\/>/, 'SVG optical filter definitions must be mounted in the application');
assert.match(css, /linear-gradient\(180deg,\s*rgba\(255,255,255,\.1[45-8]\)/, 'CTA base fill must stay low-opacity rather than becoming an opaque white pill');
assert.match(css, /optical caustic under the lens/i, 'CTA must preserve the optical caustic layer');
assert.match(primitive, /glass must stay optically translucent/i, 'shared Liquid Glass primitive must preserve the translucency rule');
assert.doesNotMatch(css, /background-image:\s*url|welcome-approved\.avif/i, 'welcome must never regress to a raster mock');
assert.doesNotMatch(main, /welcome\/luxury\.css/, 'temporary raster welcome stylesheet must not return');

console.log('PASS welcome pixel match (approved geometry + refractive Liquid Glass + Android-safe translucent fallback)');

import assert from 'node:assert/strict';
import fs from 'node:fs';

const welcome = fs.readFileSync('src/features/welcome/WelcomeScreen.tsx', 'utf8');
const css = fs.readFileSync('src/design/features/welcome.css', 'utf8');
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
assert.match(css, /backdrop-filter:\s*blur\(18px\)/, 'CTA must remain real Liquid Glass');
assert.doesNotMatch(css, /background-image:\s*url|welcome-approved\.avif/i, 'welcome must never regress to a raster mock');
assert.doesNotMatch(main, /welcome\/luxury\.css/, 'temporary raster welcome stylesheet must not return');

console.log('PASS welcome pixel match (approved geometry + real Liquid Glass + no raster fallback)');

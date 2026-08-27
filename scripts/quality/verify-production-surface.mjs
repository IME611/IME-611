import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const app=read('src/app/App.tsx');
const navigation=read('src/features/navigation/navigation.config.ts');
const storage=read('src/core/storage.ts');
const main=read('src/main.tsx');
const designIndex=read('src/design/index.css');
const welcome=read('src/features/welcome/WelcomeScreen.tsx');
const welcomeCss=read('src/design/features/welcome.css');
const liquidGlass=read('src/design/primitives/liquid-glass.css');

assert.match(navigation,/isKnownNavigation/,'navigation config must be the route allowlist');
assert.doesNotMatch(navigation,/add-learning/,'local-only learning capture must not be a production route');
assert.match(app,/isKnownNavigation\(page\)/,'App must normalize hashes through the declared navigation allowlist');
assert.match(app,/page!==activePage\)replaceNav\(activePage\)/,'unknown or unauthorized hashes must be replaced with the safe active page');
assert.doesNotMatch(app,/EvolutionWorkspace|TransformationWorkspace|MediaWorkspace|evolutionPages/,'dormant prototypes must not be loaded by the production shell');
assert.doesNotMatch(app,/activePage==='crystals'|activePage==='add-learning'/,'drawer/local-only legacy pages must not remain hidden routes');
assert.doesNotMatch(app,/דף זה בפיתוח/,'unknown hashes must never render a fake development page');
assert.doesNotMatch(app,/\blocalStorage\b/,'App feature code must use the storage adapter instead of direct localStorage access');
assert.match(app,/readJson<Partial<SettingsForm>>\(storageKeys\.settings/,'settings must read through the storage adapter');
assert.match(app,/writeJson\(storageKeys\.settings,form\)/,'settings must write through the storage adapter');
assert.equal(fs.existsSync('src/app/navigation.ts'),false,'obsolete parallel navigation map must be removed');
assert.match(storage,/settings:'eil-settings'/,'settings storage key must be centralized');

assert.match(designIndex,/primitives\/liquid-glass\.css/,'shared Liquid Glass primitives must be part of the design system');
assert.match(welcome,/eilLiquidBackdrop/,'welcome must compose the shared Liquid Glass backdrop');
assert.match(welcome,/eilLiquidButton/,'welcome CTA must compose the shared Liquid Glass button');
assert.match(welcome,/eilCrystalInk/,'welcome headline must use the reusable crystal-ink treatment');
assert.doesNotMatch(welcomeCss,/url\([^)]*\.(?:avif|png|jpe?g|webp|gif|svg)(?:[?#][^)]*)?\)/i,'welcome presentation must not depend on a raster/vector background asset');
assert.match(welcomeCss,/url\("#eil-liquid-glass-filter"\)/,'welcome may use the internal SVG optical filter fragment');
assert.doesNotMatch(main,/welcome\/luxury\.css/,'welcome must not bypass the design-system stylesheet graph');
assert.equal(fs.existsSync('src/design/features/welcome/luxury.css'),false,'temporary standalone welcome stylesheet must be removed');
assert.equal(fs.existsSync('public/assets/welcome-approved.avif'),false,'welcome must not depend on the approved raster reference at runtime');
assert.match(liquidGlass,/\.eilLiquidSurface/,'design system must expose a reusable Liquid Glass surface primitive');
assert.match(liquidGlass,/\.eilLiquidButton/,'design system must expose a reusable Liquid Glass button primitive');

const apiFunctions=fs.readdirSync('api',{withFileTypes:true}).filter(entry=>entry.isFile()&&entry.name.endsWith('.js')).map(entry=>entry.name).sort();
assert.equal(apiFunctions.length,12,`Hobby production surface must remain at 12 functions, found ${apiFunctions.length}: ${apiFunctions.join(', ')}`);

console.log('PASS production surface (declared routes + reusable Liquid Glass UI + centralized storage + 12 functions)');

import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const app=read('src/app/App.tsx');
const navigation=read('src/features/navigation/navigation.config.ts');
const navigationShell=read('src/features/navigation/NavigationShell.tsx');
const storage=read('src/core/storage.ts');
const main=read('src/main.tsx');
const designIndex=read('src/design/index.css');
const welcome=read('src/features/welcome/WelcomeScreen.tsx');

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

assert.equal(designIndex.trim(),"/* E.I.L UI baseline — structure and accessibility only.\n   Visual design intentionally starts from zero. */\n@import './foundation.css';\n@import './layout.css';\n@import './responsive.css';\n@import './accessibility.css';",'design index must expose only the neutral UI baseline');
assert.doesNotMatch(app,/LiquidGlass|bindLiquidGlass|design\/glass/,'application shell must not mount legacy visual effects');
assert.doesNotMatch(navigationShell,/design\/primitives|GlassNavigation/,'navigation must use semantic elements rather than visual wrappers');
assert.doesNotMatch(welcome,/eilLiquid|welcomeOrb|welcomeFloorGlow|welcomeCtaLens|style=|#[0-9a-f]{3,8}/i,'welcome must remain neutral and free of the removed visual system');
assert.match(app,/className="skipLink" href="#main-content"/,'application must expose keyboard skip navigation');
assert.match(app,/<main id="main-content" tabIndex=\{-1\}>/,'main application content must expose a focusable skip target');
assert.match(welcome,/id="main-content"/,'welcome must expose the same main-content landmark');

const removedDesignPaths=[
 'src/design/primitives/LiquidGlassFilter.tsx','src/design/primitives/liquid-glass.css','src/design/primitives/tokens.css',
 'src/design/glass/runtime.ts','src/design/glass/system.css','src/design/features/welcome.css','src/design/features/learner-polish.css'
];
for(const path of removedDesignPaths)assert.equal(fs.existsSync(path),false,`${path} must stay deleted during the accessibility-first reset`);

const apiFunctions=fs.readdirSync('api',{withFileTypes:true}).filter(entry=>entry.isFile()&&entry.name.endsWith('.js')).map(entry=>entry.name).sort();
assert.equal(apiFunctions.length,12,`Hobby production surface must remain at 12 functions, found ${apiFunctions.length}: ${apiFunctions.join(', ')}`);

console.log('PASS production surface (declared routes + neutral accessible UI baseline + centralized storage + 12 functions)');

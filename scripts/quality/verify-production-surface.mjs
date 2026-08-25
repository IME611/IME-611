import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const app=read('src/app/App.tsx');
const navigation=read('src/features/navigation/navigation.config.ts');
const storage=read('src/core/storage.ts');

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

const apiFunctions=fs.readdirSync('api',{withFileTypes:true}).filter(entry=>entry.isFile()&&entry.name.endsWith('.js')).map(entry=>entry.name).sort();
assert.equal(apiFunctions.length,12,`Hobby production surface must remain at 12 functions, found ${apiFunctions.length}: ${apiFunctions.join(', ')}`);

console.log('PASS production surface (declared routes only + no local-only content dead end + centralized settings storage + 12 functions)');

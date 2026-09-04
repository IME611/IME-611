import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const index=read('src/design/index.css');
const foundation=read('src/design/foundation.css');
const layout=read('src/design/layout.css');
const responsive=read('src/design/responsive.css');
const accessibility=read('src/design/accessibility.css');
const app=read('src/app/App.tsx');
const welcome=read('src/features/welcome/WelcomeScreen.tsx');
const nav=read('src/features/navigation/NavigationShell.tsx');
const html=read('index.html');

assert.match(index,/foundation\.css/);
assert.match(index,/layout\.css/);
assert.match(index,/responsive\.css/);
assert.match(index,/accessibility\.css/);
assert.doesNotMatch(index,/glass|tokens|polish|features\//i,'old visual layers must not be imported');

for(const[path,content]of[['foundation.css',foundation],['layout.css',layout],['responsive.css',responsive],['accessibility.css',accessibility]]){
 assert.doesNotMatch(content,/linear-gradient|radial-gradient|backdrop-filter|box-shadow|filter:\s*blur|mix-blend-mode/i,`${path} must not contain decorative visual effects during reset`);
 assert.doesNotMatch(content,/#[0-9a-f]{3,8}|rgba?\(/i,`${path} must use system colors rather than a brand palette during reset`);
}

assert.match(foundation,/background:Canvas/,'neutral baseline must follow the operating-system canvas');
assert.match(foundation,/color:CanvasText/,'neutral baseline must follow the operating-system text color');
assert.match(accessibility,/:focus-visible/,'visible keyboard focus is required');
assert.match(accessibility,/outline:3px solid Highlight/,'focus must use a high-visibility system color');
assert.match(accessibility,/\.skipLink/,'skip-link styling is required');
assert.match(accessibility,/prefers-reduced-motion:reduce/,'reduced-motion support is required');
assert.match(accessibility,/forced-colors:active/,'forced-colors support is required');
assert.match(accessibility,/pointer:coarse/,'touch-target rules are required');
assert.match(accessibility,/min-height:44px/,'coarse-pointer targets must be at least 44px high');

assert.match(app,/דלג לתוכן/,'app must render a skip link');
assert.match(app,/id="main-content"/,'app must expose a main-content target');
assert.doesNotMatch(app,/LiquidGlass|bindLiquidGlass/,'legacy glass runtime must not return');
assert.match(welcome,/<main id="main-content"/,'welcome must use the main landmark');
assert.doesNotMatch(welcome,/eilLiquid|Orb|Glass|style=/,'welcome must stay presentation-neutral');
assert.match(nav,/aria-current=\{page===id\?'page':undefined\}/,'active navigation must expose aria-current');
assert.match(nav,/aria-modal="true"/,'mobile navigation dialog must remain modal to assistive technology');
assert.match(nav,/aria-expanded=\{open\}/,'mobile navigation trigger must expose expanded state');
assert.doesNotMatch(nav,/GlassNavigation|design\/primitives/,'navigation semantics must not depend on a visual primitive');
assert.doesNotMatch(html,/theme-color|#[0-9a-f]{3,8}/i,'document metadata must not carry the removed visual theme');

console.log('PASS UI foundation (neutral presentation + semantic landmarks + keyboard/touch/forced-colors/reduced-motion accessibility)');

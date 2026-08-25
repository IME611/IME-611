import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const layers=read('src/features/journey/model/journey-layers.ts');
const dashboard=read('src/features/knowledge-dashboard/KnowledgeDashboard.tsx');
const journey=read('src/features/journey/SpiralLibrary.tsx');
const app=read('src/app/App.tsx');
const polish=read('src/design/features/learner-polish.css');

const ids=[...layers.matchAll(/id:'([A-E])'/g)].map(match=>match[1]);
const colors=[...layers.matchAll(/color:'(#[0-9A-Fa-f]{6})'/g)].map(match=>match[1].toUpperCase());
const textColors=[...layers.matchAll(/textColor:'(#[0-9A-Fa-f]{6})'/g)].map(match=>match[1].toUpperCase());
assert.deepEqual(ids,['A','B','C','D','E'],'journey must expose exactly five ordered foundation layers');
assert.equal(new Set(colors).size,5,'foundation layers must keep five distinct visual accents');
assert.equal(textColors.length,5,'every layer needs an explicit accessible text color');

function channel(value){const n=value/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}
function luminance(hex){const value=hex.slice(1);const r=channel(parseInt(value.slice(0,2),16)),g=channel(parseInt(value.slice(2,4),16)),b=channel(parseInt(value.slice(4,6),16));return .2126*r+.7152*g+.0722*b}
function contrast(a,b){const x=luminance(a),y=luminance(b),hi=Math.max(x,y),lo=Math.min(x,y);return(hi+.05)/(lo+.05)}
for(const color of textColors){
 assert.ok(contrast(color,'#FFFFFF')>=4.5,`${color} must meet WCAG AA on white`);
 assert.ok(contrast(color,'#F8F3EA')>=4.5,`${color} must meet WCAG AA on the learner cream surface`);
}

assert.match(dashboard,/JOURNEY_LAYERS/,'dashboard and journey must share layer metadata');
assert.match(dashboard,/onClick=\{\(\)=>onOpenJourney\(layer\.id\)\}/,'dashboard layer click must preserve the chosen layer id');
assert.match(dashboard,/'--lt':layer\.textColor/,'dashboard must expose the accessible layer text color to CSS');
assert.doesNotMatch(dashboard,/SPIRAL_OVERVIEW/,'dashboard must not duplicate journey layer metadata');

assert.match(app,/requestedLayer/,'app must carry a requested journey layer through navigation');
assert.match(app,/initialLayer=\{requestedLayer\}/,'app must pass the selected layer into SpiralLibrary');
assert.match(app,/onInitialLayerOpened=\{\(\)=>setRequestedLayer\(null\)\}/,'app must clear one-shot layer navigation after consumption');
assert.match(app,/KnowledgeDashboard onOpenJourney=\{openJourney\}/,'dashboard must use the layer-aware journey navigation function');

assert.match(journey,/JOURNEY_LAYERS/,'SpiralLibrary must use shared journey layer metadata');
assert.match(journey,/setOpenLayer\(initialLayer\)/,'requested layer must open the matching accordion section');
assert.match(journey,/role="progressbar"/,'journey progress must expose progressbar semantics');
assert.match(journey,/aria-expanded=\{isOpen\}/,'layer accordions must expose expanded state');
assert.match(journey,/aria-controls=\{bodyId\}/,'layer accordions must identify their controlled region');
assert.match(journey,/hidden=\{!isOpen\}/,'controlled layer regions must remain addressable while collapsed');
assert.match(journey,/color=\{layer\.textColor\}/,'learning-card surfaces must use contrast-safe layer colors');
assert.doesNotMatch(journey,/const LAYERS = \[/,'SpiralLibrary must not keep a second layer palette');

assert.match(polish,/var\(--lt/,'learner CSS must use accessible layer text color variables');
assert.match(polish,/color-mix\(in srgb,var\(--lc/,'learner CSS must retain layer-specific visual accent treatment');

console.log('PASS learner journey coherence (shared layers + exact layer navigation + WCAG text colors + accordion/progress semantics)');

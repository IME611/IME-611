import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const layers=read('src/features/journey/model/journey-layers.ts');
const dashboard=read('src/features/knowledge-dashboard/KnowledgeDashboard.tsx');
const journey=read('src/features/journey/SpiralLibrary.tsx');
const reader=read('src/features/journey/LearningCardReader.tsx');
const app=read('src/app/App.tsx');

const ids=[...layers.matchAll(/id:'([A-E])'/g)].map(match=>match[1]);
assert.deepEqual(ids,['A','B','C','D','E'],'journey must expose exactly five ordered foundation layers');
assert.doesNotMatch(layers,/color\s*:|textColor\s*:|#[0-9A-Fa-f]{3,8}/,'journey metadata must not contain presentation colors during the UI reset');

assert.match(dashboard,/JOURNEY_LAYERS/,'dashboard and journey must share layer metadata');
assert.match(dashboard,/onClick=\{\(\)=>onOpenJourney\(layer\.id\)\}/,'dashboard layer click must preserve the chosen layer id');
assert.doesNotMatch(dashboard,/--lc|--lt|layer\.color|layer\.textColor|#[0-9A-Fa-f]{3,8}/,'dashboard must remain presentation-neutral during the UI reset');
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
assert.doesNotMatch(journey,/layer\.color|layer\.textColor|l\.color|l\.textColor|--lc|--lt|#[0-9A-Fa-f]{3,8}/,'journey rendering must not carry the removed visual palette');
assert.doesNotMatch(journey,/const LAYERS = \[/,'SpiralLibrary must not keep a second layer palette');
assert.doesNotMatch(reader,/--card-accent|color:string|#[0-9A-Fa-f]{3,8}/,'learning-card reader must remain presentation-neutral during the UI reset');

console.log('PASS learner journey coherence (shared layers + exact layer navigation + semantic progress/accordion + neutral presentation)');

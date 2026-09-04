import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const layers=read('src/features/journey/model/journey-layers.ts');
const dashboard=read('src/features/knowledge-dashboard/KnowledgeDashboard.tsx');
const journey=read('src/features/journey/SpiralLibrary.tsx');
const reader=read('src/features/journey/LearningCardReader.tsx');
const app=read('src/app/App.tsx');
const navigation=read('src/features/navigation/navigation.config.ts');

const ids=[...layers.matchAll(/id:'([A-E])'/g)].map(match=>match[1]);
assert.deepEqual(ids,['A','B','C','D','E'],'journey must expose exactly five ordered foundation layers');
assert.doesNotMatch(layers,/color\s*:|textColor\s*:|#[0-9A-Fa-f]{3,8}/,'journey metadata must not contain presentation colors');

assert.match(dashboard,/emptyHome/,'home must stay intentionally empty while journey access moves into the menu');
assert.doesNotMatch(dashboard,/JOURNEY_LAYERS|onOpenJourney|useLearningProgress/,'home must not duplicate journey navigation or progress');
assert.match(navigation,/id:'library'.*label:'ההתקדמות שלי במסע'/,'menu must expose the journey progress entry');
assert.match(app,/activePage==='library'&&<SpiralLibrary/,'menu journey route must render SpiralLibrary');
assert.match(app,/initialLayer=\{null\}/,'menu journey entry must open the journey without a hidden layer-specific shortcut');

assert.match(journey,/JOURNEY_LAYERS/,'SpiralLibrary must use shared journey layer metadata');
assert.match(journey,/setOpenLayer\(initialLayer\)/,'SpiralLibrary may still honor explicit internal layer requests when supplied');
assert.match(journey,/role="progressbar"/,'journey progress must expose progressbar semantics');
assert.match(journey,/aria-expanded=\{isOpen\}/,'layer accordions must expose expanded state');
assert.match(journey,/aria-controls=\{bodyId\}/,'layer accordions must identify their controlled region');
assert.match(journey,/hidden=\{!isOpen\}/,'controlled layer regions must remain addressable while collapsed');
assert.doesNotMatch(journey,/layer\.color|layer\.textColor|l\.color|l\.textColor|--lc|--lt|#[0-9A-Fa-f]{3,8}/,'journey rendering must not carry a hard-coded palette');
assert.doesNotMatch(journey,/const LAYERS = \[/,'SpiralLibrary must not keep a second layer metadata source');
assert.doesNotMatch(reader,/--card-accent|color:string|#[0-9A-Fa-f]{3,8}/,'learning-card reader must remain independent from shell styling');

console.log('PASS learner journey coherence (menu-first journey access + shared layers + semantic progress/accordion)');

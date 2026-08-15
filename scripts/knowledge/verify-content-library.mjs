import assert from'node:assert/strict';
import{buildLibraryHierarchyFromMap,buildExtractiveCard}from'../../server/knowledge/application/library/content-library.service.js';

const dmt={id:'section-dmt',kind:'SECTION_TOPIC',label:'כיצד לשחרר DMT באופן טבעי',sourceCount:1,candidateCount:9,contextAtomCount:9,sourceFiles:['פרק7_בלוטת_האצטרובל.docx']};
const meditation={id:'concept-meditation',kind:'CONCEPT',label:'מדיטציה',sourceCount:2,candidateCount:2,contextAtomCount:2,sourceFiles:['פרק4_מערכת_ההפעלה.docx','פרק7_בלוטת_האצטרובל.docx']};
const senses={id:'section-senses',kind:'SECTION_TOPIC',label:'חישה',sourceCount:1,candidateCount:10,contextAtomCount:10,sourceFiles:['פרק3_הפלא_ההנדסי.docx']};
const map={nodes:[dmt,meditation,senses],edges:[{id:'edge-dmt-meditation',from:dmt.id,to:meditation.id,weight:2.8,signals:{SECTION_MEMBERSHIP:1}}]};
const hierarchy=buildLibraryHierarchyFromMap(map);
const brain=hierarchy.domains.find(domain=>domain.id==='brain-consciousness');
assert(brain,'brain/consciousness domain must exist');
assert(brain.topics.some(topic=>topic.id===dmt.id),'DMT source section should be a topic inside the brain/consciousness domain');
assert(!brain.topics.some(topic=>topic.id===meditation.id),'a related concept must never become a hierarchy child just because a graph edge exists');
const body=hierarchy.domains.find(domain=>domain.id==='human-body');
assert(body?.topics.some(topic=>topic.id===senses.id),'source-observed body section should remain reachable under the body domain');
const card=buildExtractiveCard('חישה',[{text:'המערכת קולטת מידע דרך מספר ערוצי חישה.'},{text:'המידע עובר עיבוד ומשפיע על התגובה.'}], [{title:'מקור.docx'}],'section-senses');
assert.equal(card.id,'knowledge-card:section-senses:v1');
assert(card.summary.includes('המערכת קולטת מידע'),'knowledge card must be built from supplied source-backed points');
console.log('PASS content library hierarchy regression (RELATED ≠ CHILD; source-backed card stable)');

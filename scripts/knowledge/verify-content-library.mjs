import assert from'node:assert/strict';
import{buildLibraryHierarchyFromMap,buildExtractiveCard}from'../../server/knowledge/application/library/content-library.service.js';

const dmtHow={id:'section-dmt-how',kind:'SECTION_TOPIC',label:'כיצד לשחרר DMT באופן טבעי',sourceCount:1,candidateCount:9,contextAtomCount:9,sourceFiles:['פרק7_בלוטת_האצטרובל.docx'],sections:['source-7::כיצד לשחרר DMT באופן טבעי']};
const dmtWhat={id:'section-dmt-what',kind:'SECTION_TOPIC',label:'DMT — מולקולת הנשמה',sourceCount:1,candidateCount:2,contextAtomCount:2,sourceFiles:['פרק7_בלוטת_האצטרובל.docx'],sections:['source-7::DMT — מולקולת הנשמה']};
const meditationSection={id:'section-meditation',kind:'SECTION_TOPIC',label:'בסוגי מדיטציה עמוקה',sourceCount:1,candidateCount:1,contextAtomCount:1,sourceFiles:['פרק7_בלוטת_האצטרובל.docx'],sections:['source-7::בסוגי מדיטציה עמוקה']};
const meditationConcept={id:'concept-meditation',kind:'CONCEPT',label:'מדיטציה',sourceCount:2,candidateCount:2,contextAtomCount:2,sourceFiles:['פרק4_מערכת_ההפעלה.docx','פרק7_בלוטת_האצטרובל.docx']};
const noisyStep={id:'section-step',kind:'SECTION_TOPIC',label:'שלב 4 — חזרה עם רגש, בחלונות הנכונים',sourceCount:1,candidateCount:8,contextAtomCount:8,sourceFiles:['פרק4_מערכת_ההפעלה.docx'],sections:['source-4::שלב 4 — חזרה עם רגש, בחלונות הנכונים']};
const senses={id:'section-senses',kind:'SECTION_TOPIC',label:'חישה',sourceCount:1,candidateCount:10,contextAtomCount:10,sourceFiles:['פרק3_הפלא_ההנדסי.docx'],sections:['source-3::חישה']};
const map={nodes:[dmtHow,dmtWhat,meditationSection,meditationConcept,noisyStep,senses],edges:[{id:'edge-dmt-meditation',from:dmtHow.id,to:meditationConcept.id,weight:2.8,signals:{SECTION_MEMBERSHIP:1}}]};
const hierarchy=buildLibraryHierarchyFromMap(map);

const brain=hierarchy.domains.find(domain=>domain.id==='brain-consciousness');
assert(brain,'brain/consciousness domain must exist');
const pineal=brain.topics.find(topic=>topic.id==='topic:pineal-gland');
assert(pineal,'pineal gland must be a canonical topic');
assert.equal(pineal.subtopics.filter(item=>item.label==='DMT').length,1,'multiple DMT source headings must collapse into one DMT subtopic');
const dmt=pineal.subtopics.find(item=>item.label==='DMT');
assert.deepEqual(new Set(dmt?.nodeIds),new Set([dmtHow.id,dmtWhat.id]),'DMT subtopic must aggregate its source-backed sections');
const meditation=pineal.subtopics.find(item=>item.label==='מדיטציה');
assert(meditation,'meditation may exist as its own subtopic when a source section exists');
assert.notEqual(dmt?.id,meditation.id,'DMT and meditation must remain siblings, never parent/child');
assert(!pineal.subtopics.some(item=>item.nodeIds.includes(meditationConcept.id)),'graph concepts must never enter hierarchy as children');

const operating=brain.topics.find(topic=>topic.id==='topic:operating-system');
assert(operating,'operating system canonical topic should exist from its source');
assert(!operating.subtopics.some(item=>item.nodeIds.includes(noisyStep.id)),'instructional step headings should be suppressed from learner taxonomy');

const body=hierarchy.domains.find(domain=>domain.id==='human-body');
const engineering=body?.topics.find(topic=>topic.id==='topic:engineering-body');
assert(engineering?.subtopics.some(item=>item.label==='חישה'),'source-observed body section should remain reachable as a subtopic');

const card=buildExtractiveCard('DMT',[{text:'יחידת ידע ראשונה המבוססת על המקור ונשמרת ללא המצאת טענה חדשה.'},{text:'יחידת ידע שנייה ממשיכה את הסיכום מתוך החומר הקיים.'}], [{title:'פרק7_בלוטת_האצטרובל.docx'}],'subtopic:pineal-gland:dmt');
assert.equal(card.id,'knowledge-card:subtopic:pineal-gland:dmt:v1');
assert(card.summary.includes('יחידת ידע ראשונה'),'knowledge card must be built from supplied source-backed points');
console.log('PASS content library v2 hierarchy (DOMAIN → TOPIC → SUBTOPIC; DMT ≠ meditation; source-backed card stable)');

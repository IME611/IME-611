import assert from'node:assert/strict';
import{buildLibraryHierarchyFromMap,buildExtractiveCard,frameSubtopicForLearner,frameTopicRowsForLearner,learningUnitScopeForTopic,selectKeyPoints,selectSourceSpanRows,selectTopicScopedRows,topicLearningUnit}from'../../server/knowledge/application/library/content-library.service.js';
import{LIBRARY_TOPICS,topicForSourceFile}from'../../server/knowledge/application/library/content-taxonomy.js';
import{PEDAGOGIC_FLOW,PEDAGOGIC_FLOW_VERSION,pedagogicFlowForTopic}from'../../server/knowledge/application/library/pedagogic-flow.js';

assert(LIBRARY_TOPICS.length<18,'18 seed files must not become 18 learner-facing topics');
assert.equal(PEDAGOGIC_FLOW.length,LIBRARY_TOPICS.length,'every current central learner topic must have explicit pedagogic framing');
for(const topic of LIBRARY_TOPICS){const flow=pedagogicFlowForTopic(topic.id);assert(flow,`missing pedagogic flow for ${topic.id}`);assert(flow.question&&flow.objective&&flow.bridge&&flow.handoff,`pedagogic flow must explain question, objective, bridge and handoff for ${topic.id}`)}
assert.equal(topicForSourceFile('פרק4_מערכת_ההפעלה.docx')?.id,topicForSourceFile('פרק5_המוח_המפורט.docx')?.id,'multiple seed files may feed one semantic topic');
assert.equal(topicForSourceFile('פרק16_סבל_קושי_ומשמעות.docx')?.id,topicForSourceFile('פרק18_מי_אני_תשובה.docx')?.id,'late seed files may feed one integration topic');

const dmtHow={id:'section-dmt-how',kind:'SECTION_TOPIC',label:'כיצד לשחרר DMT באופן טבעי',sourceCount:1,candidateCount:9,contextAtomCount:9,sourceFiles:['פרק7_בלוטת_האצטרובל.docx'],sections:['source-7::כיצד לשחרר DMT באופן טבעי']};
const dmtWhat={id:'section-dmt-what',kind:'SECTION_TOPIC',label:'DMT — מולקולת הנשמה',sourceCount:1,candidateCount:2,contextAtomCount:2,sourceFiles:['פרק7_בלוטת_האצטרובל.docx'],sections:['source-7::DMT — מולקולת הנשמה']};
const meditationSection={id:'section-meditation',kind:'SECTION_TOPIC',label:'בסוגי מדיטציה עמוקה',sourceCount:1,candidateCount:1,contextAtomCount:1,sourceFiles:['פרק7_בלוטת_האצטרובל.docx'],sections:['source-7::בסוגי מדיטציה עמוקה']};
const meditationConcept={id:'concept-meditation',kind:'CONCEPT',label:'מדיטציה',sourceCount:2,candidateCount:2,contextAtomCount:2,sourceFiles:['פרק4_מערכת_ההפעלה.docx','פרק7_בלוטת_האצטרובל.docx']};
const operatingSection={id:'section-operating',kind:'SECTION_TOPIC',label:'מערכת ההפעלה',sourceCount:1,candidateCount:4,contextAtomCount:4,sourceFiles:['פרק4_מערכת_ההפעלה.docx'],sections:['source-4::מערכת ההפעלה']};
const noisyStep={id:'section-step',kind:'SECTION_TOPIC',label:'שלב 4 — חזרה עם רגש, בחלונות הנכונים',sourceCount:1,candidateCount:8,contextAtomCount:8,sourceFiles:['פרק4_מערכת_ההפעלה.docx'],sections:['source-4::שלב 4 — חזרה עם רגש, בחלונות הנכונים']};
const senses={id:'section-senses',kind:'SECTION_TOPIC',label:'חישה',sourceCount:1,candidateCount:10,contextAtomCount:10,sourceFiles:['פרק3_הפלא_ההנדסי.docx'],sections:['source-3::חישה']};
const journeyOpening={id:'section-journey-opening',kind:'SECTION_TOPIC',label:'למה יצאתי למסע?',sourceCount:1,candidateCount:3,contextAtomCount:3,sourceFiles:['מי_אני_פרק1_v6.docx'],sections:['source-1::למה יצאתי למסע?']};
const laterWhoAmI={id:'section-later-who-am-i',kind:'SECTION_TOPIC',label:'מי אני?',sourceCount:1,candidateCount:6,contextAtomCount:6,sourceFiles:['פרק18_מי_אני_תשובה.docx'],sections:['source-18::מי אני?']};
const bodyFromOpening={id:'section-body-opening',kind:'SECTION_TOPIC',label:'אני פנימה — הגוף כמערכת',sourceCount:1,candidateCount:4,contextAtomCount:4,sourceFiles:['מי_אני_פרק1_v6.docx'],sections:['source-1::אני פנימה — הגוף כמערכת']};
const environmentFromOpening={id:'section-env-opening',kind:'SECTION_TOPIC',label:'אני החוצה — הסביבה כמערכת תומכת',sourceCount:1,candidateCount:3,contextAtomCount:3,sourceFiles:['מי_אני_פרק1_v6.docx'],sections:['source-1::אני החוצה — הסביבה כמערכת תומכת']};
const map={nodes:[dmtHow,dmtWhat,meditationSection,meditationConcept,operatingSection,noisyStep,senses,journeyOpening,laterWhoAmI,bodyFromOpening,environmentFromOpening],edges:[{id:'edge-dmt-meditation',from:dmtHow.id,to:meditationConcept.id,weight:2.8,signals:{SECTION_MEMBERSHIP:1}}]};
const hierarchy=buildLibraryHierarchyFromMap(map);

const brain=hierarchy.domains.find(domain=>domain.id==='brain-consciousness');
assert(brain,'brain/consciousness domain must exist');
const pineal=brain.topics.find(topic=>topic.id==='topic:pineal-gland');
assert(pineal,'pineal gland must be a canonical topic');
assert.equal(pineal.subtopics.filter(item=>item.label==='DMT').length,1,'DMT concept must remain a single focused subtopic');
const dmt=pineal.subtopics.find(item=>item.label==='DMT');
assert.deepEqual(new Set(dmt?.nodeIds),new Set([dmtWhat.id]),'DMT concept unit must not absorb how-to/practice sections');
const dmtPractice=pineal.subtopics.find(item=>item.label==='טענות ותרגולים סביב DMT');
assert(dmtPractice,'DMT how-to material must remain reachable as a separate source-framed subtopic');
assert.deepEqual(new Set(dmtPractice?.nodeIds),new Set([dmtHow.id]),'DMT practice/source claims must not be presented as the DMT concept itself');
assert(!pineal.subtopics.some(item=>item.label==='מדיטציה'),'meditation must not be grouped under DMT/pineal just because it appears in the same source');
assert(!pineal.subtopics.some(item=>item.nodeIds.includes(meditationConcept.id)),'graph concepts must never enter hierarchy as children');
const states=brain.topics.find(topic=>topic.id==='topic:brain-states-learning');
assert(states?.subtopics.some(item=>item.label==='מדיטציה'),'meditation should route by meaning to states/consciousness practice');
const operating=brain.topics.find(topic=>topic.id==='topic:brain-operating-system');
assert(operating?.subtopics.some(item=>item.nodeIds.includes(operatingSection.id)),'brain and operating-system content should route to one semantic topic');
assert(!hierarchy.domains.flatMap(domain=>domain.topics).flatMap(topic=>topic.subtopics).some(item=>item.nodeIds.includes(noisyStep.id)),'instructional step headings should be suppressed from learner taxonomy');

const pinealUnit=topicLearningUnit(pineal,hierarchy);
assert.equal(pinealUnit.sequenceBasis,PEDAGOGIC_FLOW_VERSION,'central topics must use explicit pedagogic flow rather than generic ordering copy');
assert.equal(pinealUnit.stageLabel,'מקרי מבחן והבחנה בין סוגי ידע');
assert.match(pinealUnit.goal,/עובדה.*פרשנות.*טענה|פרשנות.*טענה/,'pineal learning goal must teach epistemic distinction, not just placement');
assert.match(pinealUnit.whyNow,/מקרה מבחן/,'topic bridge must explain why the unit appears in the journey');

const topicAggregationRows=[
 {id:'practice-high-confidence',section:'כיצד לשחרר DMT באופן טבעי',atomType:'DEFINITION',claimType:'DEFINITIONAL',text:'המנעו ממי ברז ובחרו במים מסוננים כפי שמומלץ במקור הזה.',sourceTitle:'פרק7_בלוטת_האצטרובל.docx',sourceStart:10,confidence:.99,excludeFromKnowledge:false},
 {id:'concept-core',section:'DMT — מולקולת הנשמה',atomType:'DEFINITION',claimType:'DEFINITIONAL',text:'במקור DMT מתואר כחומר מסוג טריפטמין הקשור לדיון בבלוטת האצטרובל.',sourceTitle:'פרק7_בלוטת_האצטרובל.docx',sourceStart:20,confidence:.72,excludeFromKnowledge:false},
];
const learnerTopicRows=frameTopicRowsForLearner(pineal,topicAggregationRows);
const framedPracticeRow=learnerTopicRows.find(row=>row.id==='practice-high-confidence');
assert.equal(framedPracticeRow.atomType,'REFERENCE','source-practice rows must stay framed when aggregated into their parent topic');
assert.equal(framedPracticeRow.claimType,'SOURCE_CLAIM');
assert.equal(framedPracticeRow.sourceAtomType,'DEFINITION','parent-topic framing must preserve original extractor type for provenance');
assert.equal(topicAggregationRows[0].atomType,'DEFINITION','parent-topic framing must not mutate canonical/extracted rows');
const aggregatedPoints=selectKeyPoints(learnerTopicRows,2);
assert.equal(aggregatedPoints[0].id,'concept-core','core topic knowledge must outrank higher-confidence source practice claims in the parent summary');
assert.equal(aggregatedPoints[1].type,'REFERENCE','source practice claims may remain visible but must stay secondary and framed');

const rawPracticePoint={id:'practice-claim',type:'DEFINITION',claimType:'DEFINITIONAL',text:'המלצה שמופיעה במקור.',sourceLabel:'פרק7_בלוטת_האצטרובל.docx',confidence:.92};
const practiceCard=buildExtractiveCard(dmtPractice.label,[rawPracticePoint],[{title:'פרק7_בלוטת_האצטרובל.docx'}],dmtPractice.id);
const framedPractice=frameSubtopicForLearner(dmtPractice,[rawPracticePoint],practiceCard);
assert.equal(framedPractice.epistemicFrame,'SOURCE_PRACTICE_CLAIMS','practice/source-claim units must receive a learner-facing epistemic frame');
assert.equal(framedPractice.keyPoints[0].type,'REFERENCE','source practice claims must not render as definitions/facts');
assert.equal(framedPractice.keyPoints[0].claimType,'SOURCE_CLAIM');
assert.equal(framedPractice.keyPoints[0].sourceType,'DEFINITION','original extractor classification remains available for provenance');
assert.equal(rawPracticePoint.type,'DEFINITION','learner framing must not mutate the canonical/extracted atom');
assert.match(framedPractice.epistemicNotice,/אינם מסומנים.*עובדה/,'learner must be told that source claims are not automatically verified facts');
assert.match(framedPractice.card.provenanceLabel,/לא סימון כעובדה מאומתת/,'saved card must preserve the source-claim epistemic frame');
const unframedDmt=frameSubtopicForLearner(dmt,[{...rawPracticePoint,type:'DEFINITION'}],buildExtractiveCard('DMT',[rawPracticePoint],[{title:'פרק7_בלוטת_האצטרובל.docx'}],dmt.id));
assert.equal(unframedDmt.epistemicFrame,null,'concept-focused DMT unit must not inherit the practice/source-claim frame');
assert.equal(unframedDmt.keyPoints[0].type,'DEFINITION');

const journey=hierarchy.domains.find(domain=>domain.id==='journey-question');
const journeyTopic=journey?.topics.find(topic=>topic.id==='topic:journey-origin');
assert(journeyTopic,'the journey/introduction topic must remain visible even when its source also contains later themes');
assert(!journeyTopic.sections.includes('מי אני?'),'a later integration section with similar wording must not be pulled into the opening learning unit');
assert(!journeyTopic.sourceFiles.includes('פרק18_מי_אני_תשובה.docx'),'opening topic must not claim a later source merely because its heading contains “מי אני”');
const journeyUnit=topicLearningUnit(journeyTopic,hierarchy);
assert.equal(journeyUnit.sequenceBasis,PEDAGOGIC_FLOW_VERSION);
assert.match(journeyUnit.goal,/מה אנחנו מנסים להבין/,'journey opening must begin with a genuine learner question');
assert.match(journeyUnit.whyNow,/הגוף כמערכת/,'opening handoff must prepare the next system-level learning move');
const journeyScope=learningUnitScopeForTopic(journeyTopic);
assert.equal(journeyScope.type,'SOURCE_SPAN','opening learning unit must use a positional source span');
assert.equal(journeyScope.sourceFile,'מי_אני_פרק1_v6.docx');
assert.equal(journeyScope.beforeSection,'אני פנימה — הגוף כמערכת');

const openingRows=[
 {id:'opening-question',sourceTitle:'מי_אני_פרק1_v6.docx',sourceStart:0,section:null,text:'מי אני? איפה אני? למה אני פה?',atomType:'QUESTION',excludeFromKnowledge:false},
 {id:'opening-observer',sourceTitle:'מי_אני_פרק1_v6.docx',sourceStart:82,section:'השאלה',text:'כשאנחנו שואלים מי אני אפשר להתחיל להסתכל כצופה מהצד ולבחון את הנתונים.',atomType:'CLAIM',excludeFromKnowledge:false},
 {id:'opening-split',sourceTitle:'מי_אני_פרק1_v6.docx',sourceStart:159,section:'השאלה',text:'נפריד בין שני פנים: האני הפנימי והאני החיצוני.',atomType:'CLAIM',excludeFromKnowledge:false},
 {id:'body-start',sourceTitle:'מי_אני_פרק1_v6.docx',sourceStart:270,section:'אני פנימה — הגוף כמערכת',text:'לפני מחשבות, רגשות או זהות — יש מכונה.',atomType:'CLAIM',excludeFromKnowledge:false},
 {id:'bones',sourceTitle:'מי_אני_פרק1_v6.docx',sourceStart:2818,section:'מבנה ותנועה',text:'206 עצמות מרכיבות את מסגרת השלד וכ־600 שרירים מניעים אותה.',atomType:'DEFINITION',excludeFromKnowledge:false},
 {id:'late-identity',sourceTitle:'פרק18_מי_אני_תשובה.docx',sourceStart:100,section:'מי אני?',text:'סוף המסע ותשובה מסונתזת.',atomType:'CLAIM',excludeFromKnowledge:false},
];
const openingSpan=selectSourceSpanRows(openingRows,journeyScope);
assert.deepEqual(openingSpan.map(row=>row.id),['opening-question','opening-observer','opening-split'],'source-span scope must capture the real opening and stop before the body unit');
assert(!openingSpan.some(row=>/206|600|סוף המסע/.test(row.text)),'opening source span must exclude body facts and later identity material');

const sharedSourceRows=[
 {id:'journey-row',section:'למה יצאתי למסע?',text:'יצאתי למסע כדי להבין מי אני ומהי המערכת שבתוכה אני חי.',atomType:'CLAIM',excludeFromKnowledge:false},
 {id:'body-row',section:'אני פנימה — הגוף כמערכת',text:'206 עצמות מרכיבות את מסגרת השלד וכ־600 שרירים מניעים אותה.',atomType:'CLAIM',excludeFromKnowledge:false},
 {id:'keyword-row',section:'זהות והרגלים',text:'מי אני רוצה להיות ומה הזהות שאני בונה?',atomType:'PRACTICE',excludeFromKnowledge:false},
];
const sectionScoped=selectTopicScopedRows(sharedSourceRows,{sections:['למה יצאתי למסע?']});
assert.deepEqual(sectionScoped.map(row=>row.id),['journey-row'],'observed-section scope must not use raw text keyword fallback');

const body=hierarchy.domains.find(domain=>domain.id==='human-body');
const bodySystem=body?.topics.find(topic=>topic.id==='topic:body-system');
assert(bodySystem?.subtopics.some(item=>item.label==='חישה'),'body sections should remain reachable under the semantic body topic');
assert(bodySystem?.subtopics.some(item=>item.nodeIds.includes(bodyFromOpening.id)),'opening-file body material should route by meaning, not by file number');
const world=hierarchy.domains.find(domain=>domain.id==='human-world');
const environment=world?.topics.find(topic=>topic.id==='topic:external-environment');
assert(environment?.subtopics.some(item=>item.nodeIds.includes(environmentFromOpening.id)),'opening-file environment material should route to the external system topic');

const card=buildExtractiveCard('DMT',[{text:'יחידת ידע ראשונה המבוססת על המקור ונשמרת ללא המצאת טענה חדשה.'},{text:'יחידת ידע שנייה ממשיכה את הסיכום מתוך החומר הקיים.'}], [{title:'פרק7_בלוטת_האצטרובל.docx'}],'subtopic:pineal-gland:dmt');
assert.equal(card.id,'knowledge-card:subtopic:pineal-gland:dmt:v2');
assert(card.summary.includes('יחידת ידע ראשונה'),'knowledge card must be built from supplied source-backed points');
console.log('PASS content library v3.6 (explicit flow; parent-topic summaries respect epistemic frames; topic scope coherent; card matches unit)');

import assert from'node:assert/strict';
import{buildLibraryHierarchyFromMap,buildExtractiveCard,learningUnitScopeForTopic,selectSourceSpanRows,selectTopicScopedRows}from'../../server/knowledge/application/library/content-library.service.js';
import{LIBRARY_TOPICS,topicForSourceFile}from'../../server/knowledge/application/library/content-taxonomy.js';

assert(LIBRARY_TOPICS.length<18,'18 seed files must not become 18 learner-facing topics');
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
assert.equal(pineal.subtopics.filter(item=>item.label==='DMT').length,1,'multiple DMT headings must collapse into one DMT subtopic');
const dmt=pineal.subtopics.find(item=>item.label==='DMT');
assert.deepEqual(new Set(dmt?.nodeIds),new Set([dmtHow.id,dmtWhat.id]),'DMT subtopic must aggregate source-backed sections');
assert(!pineal.subtopics.some(item=>item.label==='מדיטציה'),'meditation must not be grouped under DMT/pineal just because it appears in the same source');
assert(!pineal.subtopics.some(item=>item.nodeIds.includes(meditationConcept.id)),'graph concepts must never enter hierarchy as children');
const states=brain.topics.find(topic=>topic.id==='topic:brain-states-learning');
assert(states?.subtopics.some(item=>item.label==='מדיטציה'),'meditation should route by meaning to states/consciousness practice');
const operating=brain.topics.find(topic=>topic.id==='topic:brain-operating-system');
assert(operating?.subtopics.some(item=>item.nodeIds.includes(operatingSection.id)),'brain and operating-system content should route to one semantic topic');
assert(!hierarchy.domains.flatMap(domain=>domain.topics).flatMap(topic=>topic.subtopics).some(item=>item.nodeIds.includes(noisyStep.id)),'instructional step headings should be suppressed from learner taxonomy');

const journey=hierarchy.domains.find(domain=>domain.id==='journey-question');
const journeyTopic=journey?.topics.find(topic=>topic.id==='topic:journey-origin');
assert(journeyTopic,'the journey/introduction topic must remain visible even when its source also contains later themes');
assert(!journeyTopic.sections.includes('מי אני?'),'a later integration section with similar wording must not be pulled into the opening learning unit');
assert(!journeyTopic.sourceFiles.includes('פרק18_מי_אני_תשובה.docx'),'opening topic must not claim a later source merely because its heading contains “מי אני”');
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
console.log('PASS content library v3.2 (section + source-span learning scopes; opening journey bounded before body; DMT separate from meditation; card matches unit)');

import assert from'node:assert/strict';
import{buildLibraryHierarchyFromMap,buildExtractiveCard,learningUnitScopeForTopic,selectParentTopicOverviewRows,selectSourceSpanRows,selectTopicScopedRows}from'../../server/knowledge/application/library/content-library.service.js';
import{LIBRARY_TOPICS,topicForSourceFile}from'../../server/knowledge/application/library/content-taxonomy.js';

assert(LIBRARY_TOPICS.length<18,'18 seed files must not become 18 learner-facing topics');
assert.equal(topicForSourceFile('פרק4_מערכת_ההפעלה.docx')?.id,topicForSourceFile('פרק5_המוח_המפורט.docx')?.id,'multiple seed files may feed one semantic topic');
assert.equal(topicForSourceFile('פרק16_סבל_קושי_ומשמעות.docx')?.id,topicForSourceFile('פרק18_מי_אני_תשובה.docx')?.id,'late seed files may feed one integration topic');

const dmtHow={id:'section-dmt-how',kind:'SECTION_TOPIC',label:'כיצד לשחרר DMT באופן טבעי',sourceCount:1,candidateCount:9,contextAtomCount:9,sourceFiles:['פרק7_בלוטת_האצטרובל.docx'],sections:['source-7::כיצד לשחרר DMT באופן טבעי']};
const dmtWhat={id:'section-dmt-what',kind:'SECTION_TOPIC',label:'DMT — מולקולת הנשמה',sourceCount:1,candidateCount:2,contextAtomCount:2,sourceFiles:['פרק7_בלוטת_האצטרובל.docx'],sections:['source-7::DMT — מולקולת הנשמה']};
const pinealOverview={id:'section-pineal-overview',kind:'SECTION_TOPIC',label:'בלוטת האצטרובל',sourceCount:1,candidateCount:3,contextAtomCount:3,sourceFiles:['פרק7_בלוטת_האצטרובל.docx'],sections:['source-7::בלוטת האצטרובל']};
const meditationSection={id:'section-meditation',kind:'SECTION_TOPIC',label:'בסוגי מדיטציה עמוקה',sourceCount:1,candidateCount:1,contextAtomCount:1,sourceFiles:['פרק7_בלוטת_האצטרובל.docx'],sections:['source-7::בסוגי מדיטציה עמוקה']};
const meditationConcept={id:'concept-meditation',kind:'CONCEPT',label:'מדיטציה',sourceCount:2,candidateCount:2,contextAtomCount:2,sourceFiles:['פרק4_מערכת_ההפעלה.docx','פרק7_בלוטת_האצטרובל.docx']};
const operatingSection={id:'section-operating',kind:'SECTION_TOPIC',label:'מערכת ההפעלה',sourceCount:1,candidateCount:4,contextAtomCount:4,sourceFiles:['פרק4_מערכת_ההפעלה.docx'],sections:['source-4::מערכת ההפעלה']};
const consciousLayers={id:'section-layers',kind:'SECTION_TOPIC',label:'תת-מודע',sourceCount:1,candidateCount:6,contextAtomCount:6,sourceFiles:['פרק4_מערכת_ההפעלה.docx'],sections:['source-4::תת-מודע']};
const noisyStep={id:'section-step',kind:'SECTION_TOPIC',label:'שלב 4 — חזרה עם רגש, בחלונות הנכונים',sourceCount:1,candidateCount:8,contextAtomCount:8,sourceFiles:['פרק4_מערכת_ההפעלה.docx'],sections:['source-4::שלב 4 — חזרה עם רגש, בחלונות הנכונים']};
const senses={id:'section-senses',kind:'SECTION_TOPIC',label:'חישה',sourceCount:1,candidateCount:10,contextAtomCount:10,sourceFiles:['פרק3_הפלא_ההנדסי.docx'],sections:['source-3::חישה']};
const bodyOverview={id:'section-body-overview',kind:'SECTION_TOPIC',label:'אני פנימה — הגוף כמערכת',sourceCount:1,candidateCount:3,contextAtomCount:3,sourceFiles:['מי_אני_פרק1_v6.docx'],sections:['source-1::אני פנימה — הגוף כמערכת']};
const structureMovement={id:'section-structure',kind:'SECTION_TOPIC',label:'מבנה ותנועה',sourceCount:1,candidateCount:12,contextAtomCount:12,sourceFiles:['מי_אני_פרק1_v6.docx'],sections:['source-1::מבנה ותנועה']};
const journeyOpening={id:'section-journey-opening',kind:'SECTION_TOPIC',label:'למה יצאתי למסע?',sourceCount:1,candidateCount:3,contextAtomCount:3,sourceFiles:['מי_אני_פרק1_v6.docx'],sections:['source-1::למה יצאתי למסע?']};
const laterWhoAmI={id:'section-later-who-am-i',kind:'SECTION_TOPIC',label:'מי אני?',sourceCount:1,candidateCount:6,contextAtomCount:6,sourceFiles:['פרק18_מי_אני_תשובה.docx'],sections:['source-18::מי אני?']};
const environmentOverview={id:'section-env-opening',kind:'SECTION_TOPIC',label:'אני החוצה — הסביבה כמערכת תומכת',sourceCount:1,candidateCount:3,contextAtomCount:3,sourceFiles:['מי_אני_פרק1_v6.docx'],sections:['source-1::אני החוצה — הסביבה כמערכת תומכת']};
const water={id:'section-water',kind:'SECTION_TOPIC',label:'מים',sourceCount:1,candidateCount:14,contextAtomCount:14,sourceFiles:['פרק2_הכלי_החיצוני.docx'],sections:['source-2::מים']};
const brainWaves={id:'section-brain-waves',kind:'SECTION_TOPIC',label:'גלי המוח',sourceCount:1,candidateCount:10,contextAtomCount:10,sourceFiles:['פרק6_גלי_המוח.docx'],sections:['source-6::גלי המוח']};
const neuroplasticity={id:'section-neuro',kind:'SECTION_TOPIC',label:'נוירופלסטיות',sourceCount:1,candidateCount:8,contextAtomCount:8,sourceFiles:['פרק10_נוירופלסטיות.docx'],sections:['source-10::נוירופלסטיות']};
const map={nodes:[dmtHow,dmtWhat,pinealOverview,meditationSection,meditationConcept,operatingSection,consciousLayers,noisyStep,senses,bodyOverview,structureMovement,journeyOpening,laterWhoAmI,environmentOverview,water,brainWaves,neuroplasticity],edges:[{id:'edge-dmt-meditation',from:dmtHow.id,to:meditationConcept.id,weight:2.8,signals:{SECTION_MEMBERSHIP:1}}]};
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

const body=hierarchy.domains.find(domain=>domain.id==='human-body');
const bodySystem=body?.topics.find(topic=>topic.id==='topic:body-system');
assert(bodySystem?.subtopics.some(item=>item.label==='חישה'),'body sections should remain reachable under the semantic body topic');
const bodyRows=[
 {id:'body-overview-row',section:'אני פנימה — הגוף כמערכת',text:'הגוף הוא מערכת של מערכות שפועלות יחד ומשפיעות על מחשבה, רגש והחלטה.',atomType:'CLAIM',confidence:.7,sourceStart:300,sourceTitle:'מי_אני_פרק1_v6.docx',excludeFromKnowledge:false},
 {id:'bones-row',section:'מבנה ותנועה',text:'206 עצמות מרכיבות את המסגרת הקשיחה של הגוף.',atomType:'DEFINITION',confidence:.92,sourceStart:2800,sourceTitle:'מי_אני_פרק1_v6.docx',excludeFromKnowledge:false},
 {id:'senses-row',section:'חישה',text:'מערכות החישה קולטות מידע מהסביבה ומעבירות אותו לעיבוד.',atomType:'DEFINITION',confidence:.92,sourceStart:400,sourceTitle:'פרק3_הפלא_ההנדסי.docx',excludeFromKnowledge:false},
];
const bodyOverviewSelection=selectParentTopicOverviewRows(bodySystem,bodyRows);
assert.equal(bodyOverviewSelection.basis,'ANCHOR_SUBTOPIC','body parent must use its overview subtopic as the card anchor');
assert.deepEqual(bodyOverviewSelection.primaryRows.map(row=>row.id),['body-overview-row'],'body parent primary evidence must be the system overview, not the high-confidence bones detail');
assert(bodyOverviewSelection.supportingRows.some(row=>row.id==='bones-row')&&bodyOverviewSelection.supportingRows.some(row=>row.id==='senses-row'),'body parent may still show representative detail after the overview');

const world=hierarchy.domains.find(domain=>domain.id==='human-world');
const environment=world?.topics.find(topic=>topic.id==='topic:external-environment');
const environmentRows=[
 {id:'env-overview-row',section:'אני החוצה — הסביבה כמערכת תומכת',text:'האדם תלוי במערכות חיצוניות כמו אוויר, מים, אדמה ואקלים כדי להתקיים.',atomType:'CLAIM',confidence:.7,sourceStart:100,sourceTitle:'מי_אני_פרק1_v6.docx',excludeFromKnowledge:false},
 {id:'water-row',section:'מים',text:'מחזור המים כולל אידוי, התעבות, גשם וזרימה חזרה לאוקיינוס.',atomType:'DEFINITION',confidence:.92,sourceStart:900,sourceTitle:'פרק2_הכלי_החיצוני.docx',excludeFromKnowledge:false},
];
const environmentOverviewSelection=selectParentTopicOverviewRows(environment,environmentRows);
assert.equal(environmentOverviewSelection.basis,'ANCHOR_SUBTOPIC');
assert.deepEqual(environmentOverviewSelection.primaryRows.map(row=>row.id),['env-overview-row'],'environment parent must not collapse into the water subtopic');

const operatingRows=[
 {id:'os-overview-row',section:'מערכת ההפעלה',text:'החומרה היא הגוף; מערכת ההפעלה מתארת את המחשבות, הרגשות, האמונות והזהויות שמפעילות אותו.',atomType:'CLAIM',confidence:.7,sourceStart:100,sourceTitle:'פרק4_מערכת_ההפעלה.docx',excludeFromKnowledge:false},
 {id:'subconscious-row',section:'תת-מודע',text:'מצב Theta לפני שינה מאפשר גישה גבוהה יותר לתהליכים תת-מודעים.',atomType:'DEFINITION',confidence:.92,sourceStart:800,sourceTitle:'פרק4_מערכת_ההפעלה.docx',excludeFromKnowledge:false},
];
const operatingOverviewSelection=selectParentTopicOverviewRows(operating,operatingRows);
assert.equal(operatingOverviewSelection.basis,'ANCHOR_SUBTOPIC');
assert.deepEqual(operatingOverviewSelection.primaryRows.map(row=>row.id),['os-overview-row'],'brain operating-system parent must start with the operating-system overview, not Theta/meditation details');

const statesRows=[
 {id:'waves-row',section:'גלי המוח',text:'גלי מוח מתארים דפוסי פעילות חשמלית המשתנים בין מצבי תודעה.',atomType:'DEFINITION',confidence:.9,sourceStart:100,sourceTitle:'פרק6_גלי_המוח.docx',excludeFromKnowledge:false},
 {id:'neuro-row',section:'נוירופלסטיות',text:'נוירופלסטיות מתארת את יכולת המוח להשתנות בעקבות למידה וניסיון.',atomType:'DEFINITION',confidence:.9,sourceStart:100,sourceTitle:'פרק10_נוירופלסטיות.docx',excludeFromKnowledge:false},
];
const statesOverviewSelection=selectParentTopicOverviewRows(states,statesRows);
assert.equal(statesOverviewSelection.basis,'DIVERSIFIED_SUBTOPICS','broad topics without a true overview anchor must diversify across subtopics');
assert.deepEqual(new Set(statesOverviewSelection.primaryRows.map(row=>row.id)),new Set(['waves-row','neuro-row']),'diversified parent overview must represent more than one subtopic');

const sectionScoped=selectTopicScopedRows([
 {id:'journey-row',section:'למה יצאתי למסע?',text:'יצאתי למסע כדי להבין מי אני ומהי המערכת שבתוכה אני חי.',atomType:'CLAIM',excludeFromKnowledge:false},
 {id:'keyword-row',section:'זהות והרגלים',text:'מי אני רוצה להיות ומה הזהות שאני בונה?',atomType:'PRACTICE',excludeFromKnowledge:false},
],{sections:['למה יצאתי למסע?']});
assert.deepEqual(sectionScoped.map(row=>row.id),['journey-row'],'observed-section scope must not use raw text keyword fallback');

const card=buildExtractiveCard('DMT',[{text:'יחידת ידע ראשונה המבוססת על המקור ונשמרת ללא המצאת טענה חדשה.'},{text:'יחידת ידע שנייה ממשיכה את הסיכום מתוך החומר הקיים.'}], [{title:'פרק7_בלוטת_האצטרובל.docx'}],'subtopic:pineal-gland:dmt');
assert.equal(card.id,'knowledge-card:subtopic:pineal-gland:dmt:v3');
assert(card.summary.includes('יחידת ידע ראשונה'),'knowledge card must be built from supplied source-backed points');
console.log('PASS content library v3.3 (parent overview ≠ subtopic depth; anchor + diversified overview selection; source-span opening; DMT separate from meditation)');

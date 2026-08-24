import assert from 'node:assert/strict';
import { normalizeKnowledgeText,rankKnowledgeOverlap } from '../../server/knowledge/application/matching/knowledge-overlap.service.js';

const records=[
 {id:'nervous',authority:'CANDIDATE',type:'CONCEPT',text:'מערכת העצבים'},
 {id:'regulation',authority:'CANDIDATE',type:'CLAIM',text:'מערכת העצבים משפיעה על הגוף והרגש.'},
 {id:'plasticity',authority:'CANDIDATE',type:'DEFINITION',text:'נוירופלסטיות פירושה היכולת של המוח להשתנות לאורך החיים.'},
 {id:'belief',authority:'CANDIDATE',type:'CLAIM',text:'האמונות שלנו משפיעות על ההתנהגות שלנו.'},
 {id:'sleep',authority:'CANDIDATE',type:'CLAIM',text:'שינה עמוקה תומכת בתהליכי התאוששות.'},
 {id:'ocean',authority:'CANDIDATE',type:'CONCEPT',text:'האוקיינוס'},
];

assert.equal(normalizeKnowledgeText('  מַעֲרֶכֶת  העצבים! '),'מערכת העצבים');

const exact=rankKnowledgeOverlap('מערכת העצבים',records);
assert.equal(exact.verdict,'EXISTS');
assert.equal(exact.matches[0].id,'nervous');

const token=rankKnowledgeOverlap('נוירופלסטיות',records);
assert.equal(token.verdict,'EXISTS');
assert.equal(token.matches[0].id,'plasticity');

const extended=rankKnowledgeOverlap('מערכת העצבים משפיעה על הגוף והרגש דרך מנגנוני ויסות מורכבים.',records);
assert.equal(extended.verdict,'EXTENDS','golden extension must be classified as EXTENDS');
assert.equal(extended.matches[0].id,'regulation');

const conflict=rankKnowledgeOverlap('האמונות שלנו לא משפיעות על ההתנהגות שלנו.',records);
assert.equal(conflict.verdict,'CONFLICTS');
assert.equal(conflict.matches[0].metrics.conflictSignal,true);

const novel=rankKnowledgeOverlap('קוואזר מגנטי פולט סילוני פלזמה בין־גלקטיים',records);
assert.equal(novel.verdict,'NEW','golden novel control must remain NEW');

const containedTerm=rankKnowledgeOverlap('מערכת העצבים משפיעה על הגוף, הרגש וההתנהגות דרך מנגנוני ויסות מורכבים',[
 {id:'only-concept',authority:'CANDIDATE',type:'CONCEPT',text:'מערכת העצבים'},
]);
assert.notEqual(containedTerm.verdict,'EXISTS','a longer statement that only contains one known concept must not collapse into a duplicate');
assert.notEqual(containedTerm.verdict,'EXTENDS','one isolated known concept must not be enough to claim extension');

const conceptRecords=[
 {id:'plasticity-definition',authority:'CANDIDATE',type:'DEFINITION',text:'נוירופלסטיות פירושה היכולת של המוח להשתנות לאורך החיים.'},
 {id:'circadian-definition',authority:'CANDIDATE',type:'DEFINITION',text:'השעון הצירקדי מסנכרן תהליכים בגוף עם מחזור האור והחושך.'},
 {id:'habit-definition',authority:'CANDIDATE',type:'DEFINITION',text:'הרגלים נוצרים כאשר התנהגות חוזרת נעשית אוטומטית.'},
];

for(const query of['המוח מסוגל לבנות קשרים עצביים חדשים גם בבגרות','The brain can rewire itself throughout life']){
 const result=rankKnowledgeOverlap(query,conceptRecords);
 assert.equal(result.verdict,'RELATED','a neuroplasticity paraphrase must be surfaced for review instead of marked NEW');
 assert.equal(result.matches[0].id,'plasticity-definition');
 assert.equal(result.matches[0].metrics.basis,'CONCEPT_CONTEXT');
 assert.deepEqual(result.matches[0].metrics.matchedConcepts.map(item=>item.id),['neuroplasticity']);
}

const circadian=rankKnowledgeOverlap('השעון הביולוגי מתאים את הגוף למחזור היום והלילה',conceptRecords);
assert.equal(circadian.verdict,'RELATED');
assert.equal(circadian.matches[0].id,'circadian-definition');
assert.deepEqual(circadian.matches[0].metrics.matchedConcepts.map(item=>item.id),['circadian-rhythm']);

const habit=rankKnowledgeOverlap('דפוס פעולה שחוזר שוב ושוב הופך לתגובה אוטומטית',conceptRecords);
assert.equal(habit.verdict,'RELATED');
assert.equal(habit.matches[0].id,'habit-definition');
assert.deepEqual(habit.matches[0].metrics.matchedConcepts.map(item=>item.id),['habit-formation']);

const equivalentLabel=rankKnowledgeOverlap('פלסטיות מוחית',[{id:'plasticity-label',authority:'CANDIDATE',type:'CONCEPT',text:'נוירופלסטיות'}]);
assert.equal(equivalentLabel.verdict,'EXISTS','two short, direct aliases may safely be classified as the same concept label');
assert.equal(equivalentLabel.matches[0].metrics.basis,'CONCEPT_EQUIVALENCE');

const shortClaims=rankKnowledgeOverlap('נוירופלסטיות אינה מדע אמיתי',[{id:'positive-claim',authority:'CANDIDATE',type:'CLAIM',text:'פלסטיות מוחית היא מדע אמיתי'}]);
assert.notEqual(shortClaims.verdict,'EXISTS','sharing one direct concept inside short claims must not collapse the claims into equivalent labels');

for(const query of['שעון קיר ביולוגי חדש תלוי במטבח','הרגל כואבת אחרי ריצה','מנוע רקטי חדש מנצל פלזמה להנעה בין כוכבית']){
 const result=rankKnowledgeOverlap(query,conceptRecords);
 assert.equal(result.verdict,'NEW',`false-positive control must remain NEW: ${query}`);
}

console.log('PASS overlap engine golden regression (lexical verdicts + concept paraphrases + multilingual aliases + false-positive guards)');

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

console.log('PASS overlap engine golden regression (EXISTS / EXTENDS / CONFLICTS / NEW + false-positive guard)');

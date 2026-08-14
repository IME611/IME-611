import assert from 'node:assert/strict';
import { normalizeKnowledgeText,rankKnowledgeOverlap } from '../../server/knowledge/application/matching/knowledge-overlap.service.js';

const records=[
 {id:'nervous',authority:'CANDIDATE',type:'CONCEPT',text:'מערכת העצבים'},
 {id:'plasticity',authority:'CANDIDATE',type:'DEFINITION',text:'נוירופלסטיות פירושה היכולת של המוח להשתנות לאורך החיים.'},
 {id:'belief',authority:'CANDIDATE',type:'CLAIM',text:'האמונות שלנו משפיעות על ההתנהגות שלנו.'},
 {id:'belief-neg',authority:'CANDIDATE',type:'CLAIM',text:'האמונות שלנו לא משפיעות על ההתנהגות שלנו.'},
 {id:'sleep',authority:'CANDIDATE',type:'CLAIM',text:'שינה עמוקה תומכת בתהליכי התאוששות.'},
];

assert.equal(normalizeKnowledgeText('  מַעֲרֶכֶת  העצבים! '),'מערכת העצבים');

const exact=rankKnowledgeOverlap('מערכת העצבים',records);
assert.equal(exact.verdict,'EXISTS');
assert.equal(exact.matches[0].id,'nervous');

const token=rankKnowledgeOverlap('נוירופלסטיות',records);
assert.equal(token.verdict,'EXISTS');
assert.equal(token.matches[0].id,'plasticity');

const extended=rankKnowledgeOverlap('מערכת העצבים משפיעה על הגוף, הרגש וההתנהגות דרך מנגנוני ויסות מורכבים',records);
assert.notEqual(extended.verdict,'EXISTS','a longer statement that only contains a known concept must not be collapsed into an existing duplicate');
assert.ok(['EXTENDS','RELATED','UNCERTAIN','NEW'].includes(extended.verdict));

const conflict=rankKnowledgeOverlap('האמונות שלנו לא משפיעות על ההתנהגות שלנו.',[records[2]]);
assert.equal(conflict.verdict,'CONFLICTS');
assert.equal(conflict.matches[0].metrics.conflictSignal,true);

const novel=rankKnowledgeOverlap('פוטוסינתזה בצמחי מנגרוב',records);
assert.equal(novel.verdict,'NEW');

console.log('PASS overlap engine golden regression');

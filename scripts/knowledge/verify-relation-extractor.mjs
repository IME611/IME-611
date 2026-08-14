import assert from'node:assert/strict';
import{extractExplicitRelations}from'../../server/knowledge/application/relations/explicit-relation.service.js';

const nodes=[
 {id:'nervous',kind:'CONCEPT',label:'מערכת העצבים',sourceFiles:['fixture.docx']},
 {id:'emotion',kind:'CONCEPT',label:'רגשות',sourceFiles:['fixture.docx']},
 {id:'amygdala',kind:'CONCEPT',label:'האמיגדלה',sourceFiles:['fixture.docx']},
 {id:'brain',kind:'CONCEPT',label:'המוח',sourceFiles:['fixture.docx']},
 {id:'body',kind:'CONCEPT',label:'הגוף',sourceFiles:['fixture.docx']},
 {id:'temperature',kind:'CONCEPT',label:'הטמפרטורה',sourceFiles:['fixture.docx']},
 {id:'liver',kind:'CONCEPT',label:'הכבד',sourceFiles:['fixture.docx']},
 {id:'cells',kind:'CONCEPT',label:'תאים',sourceFiles:['fixture.docx']},
];
const atom=(id,text,type='CLAIM')=>({id,atom_type:type,candidate_text:text,source_id:'s1',source_file:'fixture.docx',section:'fixture'});
const atoms=[
 atom('a1','מערכת העצבים משפיעה על רגשות.'),
 atom('a2','האמיגדלה היא חלק מהמוח.'),
 atom('a3','הגוף מווסת את הטמפרטורה.'),
 atom('a4','הכבד כולל תאים.'),
 atom('a5','מערכת העצבים ורגשות מופיעים יחד כאן.'),
 atom('a6','האם מערכת העצבים משפיעה על רגשות?','QUESTION'),
];

const result=extractExplicitRelations({nodes,atoms});
const relation=(type,from,to)=>result.relations.find(item=>item.relationType===type&&item.from.label===from&&item.to.label===to);

assert.ok(relation('INFLUENCES','מערכת העצבים','רגשות'),'explicit influence relation must be extracted');
assert.ok(relation('PART_OF','האמיגדלה','המוח'),'part-of direction must be preserved');
assert.ok(relation('REGULATES','הגוף','הטמפרטורה'),'regulates relation must be extracted');
assert.ok(relation('PART_OF','תאים','הכבד'),'includes must reverse into child PART_OF parent');
assert.equal(result.relations.some(item=>item.sourceAtomId==='a5'),false,'co-occurrence without an explicit cue must not create a typed relation');
assert.equal(result.relations.some(item=>item.sourceAtomId==='a6'),false,'question atoms must not be promoted into asserted relations');
assert.ok(result.relations.every(item=>item.reviewStatus==='PENDING'));
assert.ok(result.relations.every(item=>item.evidenceMode==='EXPLICIT_LINGUISTIC'));
assert.ok(result.relations.every(item=>item.confidence>=.7));

console.log(`PASS explicit relation regression (${result.relations.length} relations)`);

import assert from'node:assert/strict';
import{buildEmergentCorpusMap}from'../../server/knowledge/application/map/emergent-corpus-map.service.js';

const conceptRows=[
 {id:'c1',candidate_text:'מערכת העצבים',source_id:'s1',source_file:'inside.docx',section:'האדם פנימה'},
 {id:'c2',candidate_text:'רגשות',source_id:'s1',source_file:'inside.docx',section:'האדם פנימה'},
 {id:'c3',candidate_text:'הסביבה החיצונית',source_id:'s2',source_file:'outside.docx',section:'האדם מול העולם'},
 {id:'c4',candidate_text:'מערכת העצבים',source_id:'s3',source_file:'repeat.docx',section:'ויסות'},
];
const atomRows=[
 ...conceptRows.map(row=>({id:row.id,atom_type:'CONCEPT',candidate_text:row.candidate_text,source_id:row.source_id,section:row.section})),
 {id:'a1',atom_type:'CLAIM',candidate_text:'מערכת העצבים משפיעה על רגשות במצבים שונים.',source_id:'s1',section:'האדם פנימה'},
 {id:'a2',atom_type:'CLAIM',candidate_text:'הסביבה החיצונית מספקת לאדם קלט מתמשך.',source_id:'s2',section:'האדם מול העולם'},
 {id:'a3',atom_type:'QUESTION',candidate_text:'מה קורה כאשר אני עוצר לרגע?',source_id:'s1',section:'רגע של עצירה'},
];

const map=buildEmergentCorpusMap({conceptRows,atomRows});
assert.equal(map.ok,true);
assert.equal(map.summary.conceptCandidates,4);
assert.equal(map.summary.conceptNodes,3,'duplicate concept labels must collapse to one preview node');
assert.equal(map.summary.exactDuplicateNodes,1);
assert.equal(map.summary.knowledgeAtoms,3);
assert.equal(map.summary.mappedAtoms,2);
assert.equal(map.summary.unmappedAtoms,1);
assert.ok(map.summary.strongEdges>=1,'co-mentioned concepts must produce a strong map edge');

const nervous=map.nodes.find(node=>node.label==='מערכת העצבים');
assert.ok(nervous);
assert.equal(nervous.candidateCount,2);
assert.equal(nervous.sourceCount,2);
assert.ok(nervous.mappedAtomCount>=1);

const community=map.communities.find(item=>item.memberIds.includes(nervous.id));
assert.ok(community);
assert.ok(community.size>=2,'nervous system and emotions should cluster from shared section/co-mention context');
assert.equal(map.policy.canonicalWrites,false);

console.log(`PASS emergent corpus map regression (${map.summary.conceptNodes} nodes, ${map.summary.strongEdges} strong edges)`);

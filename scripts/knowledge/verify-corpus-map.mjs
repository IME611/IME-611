import assert from'node:assert/strict';
import{buildEmergentCorpusMap}from'../../server/knowledge/application/map/emergent-corpus-map.service.js';

const conceptRows=[
 {id:'c1',candidate_text:'מערכת העצבים',source_id:'s1',source_file:'inside.docx',section:'האדם פנימה',source_start:10},
 {id:'c2',candidate_text:'רגשות',source_id:'s1',source_file:'inside.docx',section:'האדם פנימה',source_start:20},
 {id:'c3',candidate_text:'הסביבה החיצונית',source_id:'s2',source_file:'outside.docx',section:'האדם מול העולם',source_start:10},
 {id:'c4',candidate_text:'מערכת העצבים — רשת שמעבירה אותות ומווסתת תגובות בגוף.',source_id:'s3',source_file:'repeat.docx',section:'ויסות',source_start:10},
];
const atomRows=[
 ...conceptRows.map(row=>({id:row.id,atom_type:'CONCEPT',candidate_text:row.candidate_text,source_id:row.source_id,section:row.section,source_start:row.source_start})),
 {id:'a1',atom_type:'CLAIM',candidate_text:'מערכת העצבים משפיעה על רגשות במצבים שונים.',source_id:'s1',section:'האדם פנימה',source_start:30},
 {id:'a3',atom_type:'QUESTION',candidate_text:'מה קורה כאשר אני עוצר לרגע?',source_id:'s1',section:'רגע של עצירה',source_start:40},
 {id:'a2',atom_type:'CLAIM',candidate_text:'הסביבה החיצונית מספקת לאדם קלט מתמשך.',source_id:'s2',section:'האדם מול העולם',source_start:20},
 {id:'a4',atom_type:'CLAIM',candidate_text:'תגובה יכולה להשתנות לאורך זמן.',source_id:'s3',section:'ויסות',source_start:20},
 {id:'a5',atom_type:'CLAIM',candidate_text:'טקסט ללא עוגן מבני.',source_id:'s4',section:null,source_start:1},
];

const map=buildEmergentCorpusMap({conceptRows,atomRows});
assert.equal(map.ok,true);
assert.equal(map.summary.conceptCandidates,4);
assert.equal(map.summary.conceptNodes,3,'descriptive and short forms of the same map label must collapse for graph readability');
assert.equal(map.summary.mapCollapsedConceptCandidates,1);
assert.equal(map.summary.knowledgeAtoms,5);
assert.equal(map.summary.explicitMappedAtoms,2);
assert.ok(map.summary.contextualAtoms>=4,'meaningful sections and inherited reflection blocks must receive structural context');
assert.equal(map.summary.inheritedGenericContextAtoms,1,'generic reflection block must inherit the preceding meaningful source topic');
assert.ok(map.summary.connectedAtoms>=4);
assert.equal(map.summary.trulyUnmappedAtoms,1,'only the source atom with no structural or explicit anchor should remain unmapped');
assert.ok(map.summary.strongEdges>=1,'co-mentioned concepts must produce a strong map edge');

const nervous=map.nodes.find(node=>node.label==='מערכת העצבים');
assert.ok(nervous);
assert.equal(nervous.candidateCount,2);
assert.equal(nervous.sourceCount,2);
assert.ok(nervous.explicitMappedAtomCount>=1);
assert.ok(nervous.contextAtomCount>=1);
assert.ok(nervous.rawCandidateVariants.some(item=>item.label.includes('רשת שמעבירה')),'full raw candidate wording must remain retained');

const community=map.communities.find(item=>item.memberIds.includes(nervous.id));
assert.ok(community);
assert.ok(community.size>=2,'nervous system and emotions should cluster from shared section/co-mention context');
assert.equal(map.policy.canonicalWrites,false);

console.log(`PASS emergent corpus map regression (${map.summary.conceptNodes} concepts, ${map.summary.sectionTopicNodes} section topics, ${map.summary.strongEdges} strong edges)`);

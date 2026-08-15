import assert from'node:assert/strict';
import{rankRelationEndpointSuggestions,summarizeEndpointSuggestionDiagnostics,summarizeEndpointSuggestionHealth}from'../../server/knowledge/application/relations/relation-endpoint-suggestions.service.js';

const nodes=[
 {id:'a'.repeat(64),kind:'CONCEPT',label:'ויסות רגשי',sourceFiles:['a.docx']},
 {id:'b'.repeat(64),kind:'CONCEPT',label:'מערכת העצבים',sourceFiles:['b.docx']},
 {id:'c'.repeat(64),kind:'SECTION_TOPIC',label:'מערכת העצבים',sourceFiles:['c.docx']},
 {id:'d'.repeat(64),kind:'SECTION_TOPIC',label:'מערכת העצבים והרגש',sourceFiles:['b.docx']},
];

const strong=rankRelationEndpointSuggestions('ויסות רגשי',nodes,{sourceFile:'a.docx'});
assert.equal(strong.assessment.band,'STRONG');
assert.equal(strong.assessment.recommendedNodeId,'a'.repeat(64));
assert.equal(strong.suggestions[0].recommended,true);
assert.equal(strong.suggestions[0].matchMode,'EXACT');
assert.equal(strong.suggestions[0].sameSource,true);

const ambiguous=rankRelationEndpointSuggestions('מערכת העצבים',nodes,{sourceFile:'b.docx'});
assert.equal(ambiguous.assessment.band,'AMBIGUOUS','identical observed labels must not be presented as a safe recommendation');
assert.equal(ambiguous.assessment.recommendedNodeId,null);
assert.equal(ambiguous.suggestions.filter(item=>item.score===1).length,2);

const weak=rankRelationEndpointSuggestions('תופעה שלא קיימת במפה',nodes);
assert.ok(['WEAK','NONE'].includes(weak.assessment.band));
assert.equal(weak.assessment.recommendedNodeId,null);

const short=rankRelationEndpointSuggestions('א',nodes);
assert.equal(short.assessment.band,'NONE','one-character endpoints must be reviewable data, not matcher errors');
assert.equal(short.assessment.recommendedNodeId,null);
assert.deepEqual(short.suggestions,[]);

const relations=[
 {from_resolution:'UNRESOLVED',from_label:'ויסות רגשי',to_resolution:'MAPPED',to_label:'מערכת העצבים',source_file:'a.docx'},
 {from_resolution:'UNRESOLVED',from_label:'מערכת העצבים',to_resolution:'UNRESOLVED',to_label:'תופעה שלא קיימת במפה',source_file:'b.docx'},
 {from_resolution:'UNRESOLVED',from_label:'א',to_resolution:'MAPPED',to_label:'ויסות רגשי',source_file:'c.docx'},
];
const health=summarizeEndpointSuggestionHealth(relations,nodes);
assert.equal(health.unresolvedEndpoints,4);
assert.equal(health.bands.STRONG,1);
assert.equal(health.bands.AMBIGUOUS,1);
assert.equal(health.bands.WEAK+health.bands.NONE,2);

const diagnostics=summarizeEndpointSuggestionDiagnostics(relations,nodes);
assert.equal(diagnostics.unresolvedEndpoints,4);
assert.equal(diagnostics.noneReasons.SHORT,1);
assert.equal(Object.values(diagnostics.characterLengths).reduce((sum,value)=>sum+value,0),4);
assert.equal(Object.values(diagnostics.topScoreBuckets).reduce((sum,value)=>sum+value,0),4);
assert.ok((diagnostics.topScoreBuckets['0_92_1_00']||0)>=2,'strong and ambiguous exact labels should remain visible in score diagnostics');
assert.equal(diagnostics.policy.rawEndpointTextLogged,false);
assert.equal(diagnostics.policy.aggregateOnly,true);

console.log(`PASS relation endpoint suggestion regression (${health.unresolvedEndpoints} unresolved fixture endpoints; short labels safe; aggregate diagnostics safe)`);

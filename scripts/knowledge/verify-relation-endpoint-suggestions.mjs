import assert from'node:assert/strict';
import{rankRelationEndpointSuggestions,summarizeEndpointContextCoverage,summarizeEndpointSuggestionDiagnostics,summarizeEndpointSuggestionHealth}from'../../server/knowledge/application/relations/relation-endpoint-suggestions.service.js';

const sourceA='11111111-1111-4111-8111-111111111111',sourceB='22222222-2222-4222-8222-222222222222',sourceC='33333333-3333-4333-8333-333333333333';
const nodes=[
 {id:'a'.repeat(64),kind:'CONCEPT',label:'ויסות רגשי',sourceFiles:['a.docx'],sections:[`${sourceA}::רגשות`]},
 {id:'b'.repeat(64),kind:'CONCEPT',label:'מערכת העצבים',sourceFiles:['b.docx'],sections:[`${sourceB}::מערכת העצבים`]},
 {id:'c'.repeat(64),kind:'SECTION_TOPIC',label:'מערכת העצבים',sourceFiles:['c.docx'],sections:[`${sourceC}::מבוא קצר`]},
 {id:'d'.repeat(64),kind:'SECTION_TOPIC',label:'מערכת העצבים והרגש',sourceFiles:['b.docx'],sections:[`${sourceB}::מערכת העצבים`]},
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
 {source_id:sourceA,source_file:'a.docx',source_section:'רגשות',from_resolution:'UNRESOLVED',from_label:'ויסות רגשי',to_resolution:'MAPPED',to_label:'מערכת העצבים'},
 {source_id:sourceB,source_file:'b.docx',source_section:'מערכת העצבים',from_resolution:'UNRESOLVED',from_label:'מערכת העצבים',to_resolution:'UNRESOLVED',to_label:'תופעה שלא קיימת במפה'},
 {source_id:sourceC,source_file:'c.docx',source_section:'מבוא קצר',from_resolution:'UNRESOLVED',from_label:'א',to_resolution:'MAPPED',to_label:'ויסות רגשי'},
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

const context=summarizeEndpointContextCoverage(relations,nodes);
assert.equal(context.unresolvedEndpoints,4);
assert.equal(context.sourceSectionAvailable,4);
assert.equal(context.withExactSectionContext,4,'all fixture endpoints should have observed nodes in their exact source section');
assert.equal(context.withSectionConceptCandidates,3,'three fixture endpoints come from sections with observed concepts');
assert.equal(context.withSectionTopicCandidates,3,'three fixture endpoints come from sections with observed section topics');
assert.equal(context.coverage.exactSection,1);
assert.equal(context.policy.contextIsNotSemanticProof,true);
assert.equal(context.policy.autoResolution,false);
assert.equal(context.policy.rawEndpointTextLogged,false);
assert.equal(context.policy.rawSectionTextLogged,false);

console.log(`PASS relation endpoint suggestion regression (${health.unresolvedEndpoints} unresolved fixture endpoints; lexical + context diagnostics safe)`);

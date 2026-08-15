import{buildLearningDependencyGraph}from'../server/knowledge/application/learning/learning-dependency.service.js';
import{withHardening}from'./_lib/hardening.js';

async function health(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const conceptA={id:'concept-a',kind:'CONCEPT',label:'מערכת העצבים',sourceFiles:['a'],contextAtomCount:2,explicitMappedAtomCount:1};
 const conceptB={id:'concept-b',kind:'CONCEPT',label:'ויסות רגשי',sourceFiles:['b'],contextAtomCount:1,explicitMappedAtomCount:1};
 const sectionIntro={id:'section-intro',kind:'SECTION_TOPIC',label:'יסודות מערכת העצבים',sourceFiles:['a'],contextAtomCount:2,explicitMappedAtomCount:1};
 const sectionDeep={id:'section-deep',kind:'SECTION_TOPIC',label:'מערכת העצבים ורגש',sourceFiles:['b'],contextAtomCount:8,explicitMappedAtomCount:2};
 const map={nodes:[conceptA,conceptB,sectionIntro,sectionDeep],edges:[
  {from:sectionIntro.id,to:conceptA.id,signals:{SECTION_MEMBERSHIP:1}},
  {from:sectionDeep.id,to:conceptA.id,signals:{SECTION_MEMBERSHIP:1}},
  {from:sectionDeep.id,to:conceptB.id,signals:{SECTION_MEMBERSHIP:1}},
 ]};
 const relations=[
  {id:'r1',relation_type:'DEPENDS_ON',from_node_key:conceptB.id,to_node_key:conceptA.id,endpoint_resolution:'MAPPED',confidence:.95,review_status:'APPROVED'},
  {id:'r2',relation_type:'DEPENDS_ON',from_node_key:'source-span',to_node_key:conceptA.id,endpoint_resolution:'PARTIAL',confidence:.7,review_status:'APPROVED'},
  {id:'r3',relation_type:'DEPENDS_ON',from_node_key:conceptA.id,to_node_key:conceptB.id,endpoint_resolution:'MAPPED',confidence:.99,review_status:'PENDING'},
 ];
 const graph=buildLearningDependencyGraph({map,relationRows:relations});
 const dep=graph.dependencies.find(item=>item.basis==='DEPENDS_ON');
 const spiral=graph.spiralAppearances.find(item=>item.conceptNodeId===conceptA.id);
 const intro=graph.learningUnits.find(item=>item.anchorNodeId===sectionIntro.id),deep=graph.learningUnits.find(item=>item.anchorNodeId===sectionDeep.id);
 const checks={
  noFixedChapterCount:graph.method.fixedChapterCount===false,
  sourceOrderUnused:graph.method.sourceOrderUsed===false,
  approvedRelationRequired:graph.method.requiresApprovedRelations===true&&graph.summary.ignoredRelationCandidates.pendingReview===1,
  pendingMappedRelationIgnored:graph.dependencies.every(item=>item.sourceRelationId!=='r3'),
  dependencyDirection:dep?.sourceRelationId==='r1'&&dep?.prerequisiteNodeId===conceptA.id&&dep?.dependentNodeId===conceptB.id,
  partialEndpointIgnored:graph.summary.ignoredRelationCandidates.unresolved>=1,
  spiralDetected:spiral?.appearanceCount===2,
  introUsesLowerComplexity:spiral?.introduction?.unitId===intro?.id&&Number(intro?.complexity)<Number(deep?.complexity),
  noCycle:graph.summary.strictCycles===0,
 };
 const ok=Object.values(checks).every(Boolean);
 return res.status(ok?200:503).json({ok,checks,summary:graph.summary,policy:graph.policy});
}
export default withHardening(health,{rateLimit:{limit:30,windowMs:60_000,keyPrefix:'learning-health'}});

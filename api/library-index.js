import{getDb}from'../server/shared/postgres.js';
import{buildEmergentCorpusMapPreview}from'../server/knowledge/application/map/emergent-corpus-map.service.js';
import{withHardening}from'./_lib/hardening.js';

function nodeView(node){
 return{
  id:node.id,
  kind:node.kind,
  label:node.label,
  sourceCount:Number(node.sourceCount||0),
  candidateCount:Number(node.candidateCount||0),
  contextAtomCount:Number(node.contextAtomCount||0),
  explicitMappedAtomCount:Number(node.explicitMappedAtomCount||0),
  sourceFiles:Array.isArray(node.sourceFiles)?node.sourceFiles.slice(0,8):[],
 };
}
function edgeView(edge){return{id:edge.id,from:edge.from,to:edge.to,weight:Number(edge.weight||0),signals:edge.signals||{}}}

async function libraryIndex(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const map=await buildEmergentCorpusMapPreview(getDb(),{communityLimit:120,nodeLimit:700,edgeLimit:1200});
 if(!map?.ok)return res.status(409).json(map);
 const nodes=(map.nodes||[]).map(nodeView),edges=(map.edges||[]).map(edgeView);
 return res.status(200).json({
  ok:true,
  version:'library-index-v0.1',
  generatedFrom:map.version||map.method?.version||'corpus-map',
  summary:{
   topics:nodes.filter(node=>node.kind==='SECTION_TOPIC').length,
   concepts:nodes.filter(node=>node.kind==='CONCEPT').length,
   knowledgeAtoms:Number(map.summary?.nonConceptAtoms||0),
   connectedAtoms:Number(map.summary?.mappedAtoms||map.summary?.connectedAtoms||0),
   unmappedAtoms:Number(map.summary?.unmappedAtoms||0),
   graphCoverage:Number(map.summary?.graphCoverage||0),
  },
  nodes,
  edges,
  policy:{
   taxonomyFrozen:false,
   sourceOrderUsed:false,
   fixedChapterCount:false,
   labelsDerivedFromCorpus:true,
   note:'This is a learner-facing index projection of the live Corpus Map. It does not create or freeze taxonomy.'
  }
 });
}

export default withHardening(libraryIndex,{rateLimit:{limit:60,windowMs:60_000,keyPrefix:'library-index'}});

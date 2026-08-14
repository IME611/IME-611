import crypto from 'node:crypto';
import{normalizeKnowledgeText}from'../matching/knowledge-overlap.service.js';

const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const pairKey=(a,b)=>a<b?`${a}|${b}`:`${b}|${a}`;
const asArray=value=>[...value];

function tokens(value){return new Set(normalizeKnowledgeText(value).match(/[\p{L}\p{N}]+/gu)||[])}
function preferredLabel(labels){return [...labels.entries()].sort((a,b)=>b[1]-a[1]||a[0].length-b[0].length||a[0].localeCompare(b[0],'he'))[0]?.[0]||''}
function percentage(part,total){return total?Number((part/total*100).toFixed(1)):0}

function buildConceptNodes(conceptRows){
 const byNormalized=new Map();
 for(const row of conceptRows){
  const normalized=normalizeKnowledgeText(row.candidate_text);if(!normalized)continue;
  const node=byNormalized.get(normalized)||{
   id:sha256(`concept:${normalized}`),normalized,labels:new Map(),candidateIds:[],sourceIds:new Set(),sourceFiles:new Set(),sections:new Set(),mappedAtomIds:new Set(),
  };
  node.labels.set(row.candidate_text,(node.labels.get(row.candidate_text)||0)+1);
  node.candidateIds.push(row.id);node.sourceIds.add(row.source_id);
  if(row.source_file)node.sourceFiles.add(row.source_file);
  if(row.section)node.sections.add(`${row.source_id}::${row.section}`);
  byNormalized.set(normalized,node);
 }
 const nodes=[...byNormalized.values()].map(node=>({
  ...node,label:preferredLabel(node.labels),labelVariants:[...node.labels.entries()].map(([label,count])=>({label,count})),
  tokens:tokens(node.normalized),candidateCount:node.candidateIds.length,sourceCount:node.sourceIds.size,
 }));
 return{nodes,byNormalized:new Map(nodes.map(node=>[node.normalized,node]))};
}

function addEdge(edges,a,b,{weight,signal,sourceId=null,section=null,atomId=null}){
 if(!a||!b||a.id===b.id)return;
 const key=pairKey(a.id,b.id),edge=edges.get(key)||{id:sha256(`edge:${key}`),from:a.id<b.id?a.id:b.id,to:a.id<b.id?b.id:a.id,weight:0,signals:{SOURCE_CONTEXT:0,SECTION_CONTEXT:0,CO_MENTION:0},sourceIds:new Set(),sections:new Set(),atomIds:new Set()};
 edge.weight+=weight;edge.signals[signal]=(edge.signals[signal]||0)+1;
 if(sourceId)edge.sourceIds.add(sourceId);if(section)edge.sections.add(section);if(atomId)edge.atomIds.add(atomId);edges.set(key,edge);
}

function pairs(items,callback){for(let i=0;i<items.length;i+=1)for(let j=i+1;j<items.length;j+=1)callback(items[i],items[j])}

function mentionedNodes(atom,nodes){
 const normalized=normalizeKnowledgeText(atom.candidate_text),atomTokens=tokens(normalized),matches=[];
 for(const node of nodes){
  if(node.normalized.length<3)continue;
  let match=false;
  if(node.tokens.size===1){const token=[...node.tokens][0];match=token.length>=5&&atomTokens.has(token)}
  else if(normalized.includes(node.normalized))match=true;
  else if(node.tokens.size<=4)match=[...node.tokens].every(token=>atomTokens.has(token));
  if(match)matches.push(node);
 }
 return matches.sort((a,b)=>b.normalized.length-a.normalized.length).slice(0,10);
}

function buildEdges(nodes,atomRows){
 const edges=new Map(),nodesBySource=new Map(),nodesBySection=new Map();
 for(const node of nodes){
  for(const sourceId of node.sourceIds){const list=nodesBySource.get(sourceId)||new Map();list.set(node.id,node);nodesBySource.set(sourceId,list)}
  for(const sectionKey of node.sections){const list=nodesBySection.get(sectionKey)||new Map();list.set(node.id,node);nodesBySection.set(sectionKey,list)}
 }
 for(const[sourceId,map]of nodesBySource)pairs([...map.values()],(a,b)=>addEdge(edges,a,b,{weight:.15,signal:'SOURCE_CONTEXT',sourceId}));
 for(const[sectionKey,map]of nodesBySection){const[sourceId,...rest]=sectionKey.split('::'),section=rest.join('::');pairs([...map.values()],(a,b)=>addEdge(edges,a,b,{weight:1.2,signal:'SECTION_CONTEXT',sourceId,section}))}

 let mappedAtoms=0;const unmappedSectionCounts=new Map();
 for(const atom of atomRows){
  if(atom.atom_type==='CONCEPT')continue;
  const matched=mentionedNodes(atom,nodes);
  if(matched.length){mappedAtoms+=1;for(const node of matched)node.mappedAtomIds.add(atom.id);pairs(matched,(a,b)=>addEdge(edges,a,b,{weight:2.2,signal:'CO_MENTION',sourceId:atom.source_id,section:atom.section||null,atomId:atom.id}))}
  else{const key=`${atom.source_id}::${atom.section||'(no section)'}`;unmappedSectionCounts.set(key,(unmappedSectionCounts.get(key)||0)+1)}
 }
 return{edges:[...edges.values()],mappedAtoms,unmappedSectionCounts};
}

function edgeView(edge){return{...edge,weight:Number(edge.weight.toFixed(3)),sourceIds:asArray(edge.sourceIds),sections:asArray(edge.sections),supportAtomIds:asArray(edge.atomIds)}}

function buildCommunities(nodes,edges,{strongThreshold=1.2}={}){
 const adjacency=new Map(nodes.map(node=>[node.id,[]]));
 for(const edge of edges){if(edge.weight<strongThreshold)continue;adjacency.get(edge.from)?.push({nodeId:edge.to,weight:edge.weight});adjacency.get(edge.to)?.push({nodeId:edge.from,weight:edge.weight})}
 const degree=new Map(nodes.map(node=>[node.id,(adjacency.get(node.id)||[]).reduce((sum,item)=>sum+item.weight,0)]));
 const byId=new Map(nodes.map(node=>[node.id,node])),ordered=[...nodes].sort((a,b)=>(degree.get(b.id)||0)-(degree.get(a.id)||0)||a.label.localeCompare(b.label,'he'));
 const assigned=new Set(),communities=[];
 for(const seed of ordered){
  if(assigned.has(seed.id))continue;
  const members=[seed];assigned.add(seed.id);
  const direct=(adjacency.get(seed.id)||[]).filter(item=>!assigned.has(item.nodeId)).sort((a,b)=>b.weight-a.weight||String(a.nodeId).localeCompare(String(b.nodeId)));
  for(const item of direct){const node=byId.get(item.nodeId);if(node){members.push(node);assigned.add(node.id)}}
  let changed=true;
  while(changed&&members.length<30){
   changed=false;
   const memberIds=new Set(members.map(member=>member.id));
   const candidates=new Map();
   for(const member of members)for(const relation of adjacency.get(member.id)||[]){
    if(assigned.has(relation.nodeId)||memberIds.has(relation.nodeId))continue;
    const stat=candidates.get(relation.nodeId)||{weight:0,links:0};stat.weight+=relation.weight;stat.links+=1;candidates.set(relation.nodeId,stat);
   }
   const additions=[...candidates.entries()].filter(([,stat])=>stat.links>=2&&stat.weight>=strongThreshold*2).sort((a,b)=>b[1].weight-a[1].weight||String(a[0]).localeCompare(String(b[0]))).slice(0,Math.max(0,30-members.length));
   for(const[nodeId]of additions){const node=byId.get(nodeId);if(node&&!assigned.has(nodeId)){members.push(node);assigned.add(nodeId);changed=true}}
  }
  const ranked=[...members].sort((a,b)=>(degree.get(b.id)||0)-(degree.get(a.id)||0)||a.label.localeCompare(b.label,'he'));
  const sourceIds=new Set(),sourceFiles=new Set(),sections=new Set();
  for(const member of members){for(const value of member.sourceIds)sourceIds.add(value);for(const value of member.sourceFiles)sourceFiles.add(value);for(const value of member.sections)sections.add(value)}
  const centralConcepts=ranked.slice(0,5).map(node=>({id:node.id,label:node.label,weightedDegree:Number((degree.get(node.id)||0).toFixed(3)),sourceCount:node.sourceCount}));
  communities.push({
   id:sha256(`community:${ranked.map(node=>node.id).sort().join('|')}`),
   derivedLabel:centralConcepts.slice(0,3).map(item=>item.label).join(' · '),size:members.length,centralConcepts,
   sourceCount:sourceIds.size,sourceFiles:asArray(sourceFiles),sectionCount:sections.size,
   memberIds:ranked.map(node=>node.id),
  });
 }
 return communities.sort((a,b)=>b.size-a.size||b.sourceCount-a.sourceCount||a.derivedLabel.localeCompare(b.derivedLabel,'he'));
}

export function buildEmergentCorpusMap({conceptRows,atomRows}){
 const{nodes}=buildConceptNodes(conceptRows),{edges,mappedAtoms,unmappedSectionCounts}=buildEdges(nodes,atomRows),edgeViews=edges.map(edgeView).sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id)),communities=buildCommunities(nodes,edges);
 const knowledgeAtoms=atomRows.filter(row=>row.atom_type!=='CONCEPT').length,duplicateNodes=nodes.filter(node=>node.candidateCount>1).length,strongEdges=edgeViews.filter(edge=>edge.weight>=1.2).length;
 const unmappedSections=[...unmappedSectionCounts.entries()].map(([key,count])=>{const[sourceId,...rest]=key.split('::');return{sourceId,section:rest.join('::'),count}}).sort((a,b)=>b.count-a.count).slice(0,30);
 const nodeViews=nodes.map(node=>({id:node.id,label:node.label,normalized:node.normalized,candidateCount:node.candidateCount,sourceCount:node.sourceCount,sourceFiles:asArray(node.sourceFiles),sections:asArray(node.sections),mappedAtomCount:node.mappedAtomIds.size})).sort((a,b)=>b.mappedAtomCount-a.mappedAtomCount||b.sourceCount-a.sourceCount||a.label.localeCompare(b.label,'he'));
 return{
  ok:true,method:{version:'corpus-map-v0.1',basis:['exact-normalized-concepts','same-source-context','same-section-context','explicit-concept-co-mention'],semanticModel:false,partition:'hub-neighborhood-preview'},
  summary:{conceptCandidates:conceptRows.length,conceptNodes:nodes.length,exactDuplicateNodes:duplicateNodes,knowledgeAtoms,mappedAtoms,unmappedAtoms:knowledgeAtoms-mappedAtoms,atomCoveragePercent:percentage(mappedAtoms,knowledgeAtoms),edges:edgeViews.length,strongEdges,communities:communities.length,singletonCommunities:communities.filter(community=>community.size===1).length},
  nodes:nodeViews,edges:edgeViews,communities,unmappedSections,
  policy:{canonicalWrites:false,derivedLabels:true,note:'Communities and labels are emergent preview structures derived from corpus context. They are not approved taxonomy categories.'},
 };
}

export async function buildEmergentCorpusMapPreview(db,{communityLimit=30,nodeLimit=150,edgeLimit=250}={}){
 const conceptRows=(await db.query(`
  SELECT c.id,c.candidate_text,c.source_id,c.metadata->>'section' AS section,s.metadata->>'sourceFile' AS source_file
  FROM extraction_candidates c JOIN sources s ON s.id=c.source_id
  WHERE c.atom_type='CONCEPT' AND c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge
  ORDER BY c.created_at,c.source_start
 `)).rows;
 const atomRows=(await db.query(`
  SELECT id,atom_type::text,candidate_text,source_id,metadata->>'section' AS section
  FROM extraction_candidates
  WHERE review_status<>'REJECTED' AND NOT exclude_from_knowledge
  ORDER BY created_at,source_id,source_start
 `)).rows;
 const map=buildEmergentCorpusMap({conceptRows,atomRows});
 return{...map,nodes:map.nodes.slice(0,Math.max(1,Math.min(500,Number(nodeLimit)||150))),edges:map.edges.slice(0,Math.max(1,Math.min(1000,Number(edgeLimit)||250))),communities:map.communities.slice(0,Math.max(1,Math.min(200,Number(communityLimit)||30)))};
}

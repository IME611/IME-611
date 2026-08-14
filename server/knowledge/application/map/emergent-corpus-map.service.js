import crypto from 'node:crypto';
import{normalizeKnowledgeText}from'../matching/knowledge-overlap.service.js';

const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const pairKey=(a,b)=>a<b?`${a}|${b}`:`${b}|${a}`;
const asArray=value=>[...value];
const GENERIC_SECTION=/^(?:מבוא|הקדמה|סיכום|לסיכום|השאלה|רגע של עצירה|הנקודה המרכזית|הנקודה האמיתית|שיטות עיקריות)$/;

function tokens(value){return new Set(normalizeKnowledgeText(value).match(/[\p{L}\p{N}]+/gu)||[])}
function preferredLabel(labels){return [...labels.entries()].sort((a,b)=>b[1]-a[1]||a[0].length-b[0].length||a[0].localeCompare(b[0],'he'))[0]?.[0]||''}
function percentage(part,total){return total?Number((part/total*100).toFixed(1)):0}
function sourceSectionKey(sourceId,section){return`${sourceId}::${section}`}
function mapLabelFromCandidate(value){
 const text=String(value||'').trim(),dash=text.match(/^(.{2,80}?)\s+(?:—|–)\s+(.{10,})$/u);if(dash)return dash[1].trim();
 const colon=text.match(/^(.{2,70}?):\s+(.{15,})$/u);if(colon)return colon[1].trim();return text;
}
function mapLabelFromSection(value){return String(value||'').trim().replace(/^פרק\s+\d+\s*[:—–-]\s*/u,'').replace(/:\s*$/u,'').trim()}
function isGenericSection(label){return GENERIC_SECTION.test(normalizeKnowledgeText(label))}

function buildConceptNodes(conceptRows){
 const byNormalized=new Map();
 for(const row of conceptRows){
  const mapLabel=mapLabelFromCandidate(row.candidate_text),normalized=normalizeKnowledgeText(mapLabel);if(!normalized)continue;
  const node=byNormalized.get(normalized)||{id:sha256(`concept:${normalized}`),kind:'CONCEPT',normalized,labels:new Map(),rawLabels:new Map(),candidateIds:[],sourceIds:new Set(),sourceFiles:new Set(),sections:new Set(),mappedAtomIds:new Set(),contextAtomIds:new Set()};
  node.labels.set(mapLabel,(node.labels.get(mapLabel)||0)+1);node.rawLabels.set(row.candidate_text,(node.rawLabels.get(row.candidate_text)||0)+1);node.candidateIds.push(row.id);node.sourceIds.add(row.source_id);if(row.source_file)node.sourceFiles.add(row.source_file);if(row.section)node.sections.add(sourceSectionKey(row.source_id,row.section));byNormalized.set(normalized,node);
 }
 return[...byNormalized.values()].map(node=>({...node,label:preferredLabel(node.labels),labelVariants:[...node.labels.entries()].map(([label,count])=>({label,count})),rawCandidateVariants:[...node.rawLabels.entries()].map(([label,count])=>({label,count})),tokens:tokens(node.normalized),candidateCount:node.candidateIds.length,sourceCount:node.sourceIds.size}));
}

function buildSectionTopicNodes(atomRows){
 const byNormalized=new Map(),genericCounts=new Map(),rawSectionAtomIds=new Set(),meaningfulSectionAtomIds=new Set(),inheritedGenericAtomIds=new Set(),contextSectionKeyByAtomId=new Map(),lastMeaningfulBySource=new Map();
 const ordered=[...atomRows].sort((a,b)=>String(a.source_id).localeCompare(String(b.source_id))||Number(a.source_start||0)-Number(b.source_start||0));
 for(const row of ordered){
  if(!row.section)continue;
  const label=mapLabelFromSection(row.section);if(!label)continue;
  if(row.atom_type!=='CONCEPT')rawSectionAtomIds.add(row.id);
  if(isGenericSection(label)){
   const normalizedGeneric=normalizeKnowledgeText(label),existing=genericCounts.get(normalizedGeneric)||{label,count:0,inherited:0};if(row.atom_type!=='CONCEPT')existing.count+=1;
   const previous=lastMeaningfulBySource.get(row.source_id);
   if(row.atom_type!=='CONCEPT'&&previous){contextSectionKeyByAtomId.set(row.id,previous);meaningfulSectionAtomIds.add(row.id);inheritedGenericAtomIds.add(row.id);existing.inherited+=1}
   genericCounts.set(normalizedGeneric,existing);continue;
  }
  const normalized=normalizeKnowledgeText(label);if(!normalized)continue;
  const exactSectionKey=sourceSectionKey(row.source_id,row.section),node=byNormalized.get(normalized)||{id:sha256(`section-topic:${normalized}`),kind:'SECTION_TOPIC',normalized,labels:new Map(),candidateIds:[],sourceIds:new Set(),sourceFiles:new Set(),sections:new Set(),mappedAtomIds:new Set(),contextAtomIds:new Set()};
  node.labels.set(label,(node.labels.get(label)||0)+1);node.sourceIds.add(row.source_id);if(row.source_file)node.sourceFiles.add(row.source_file);node.sections.add(exactSectionKey);
  if(row.atom_type!=='CONCEPT'){node.contextAtomIds.add(row.id);meaningfulSectionAtomIds.add(row.id);contextSectionKeyByAtomId.set(row.id,exactSectionKey)}
  byNormalized.set(normalized,node);lastMeaningfulBySource.set(row.source_id,exactSectionKey);
 }
 const nodes=[...byNormalized.values()].map(node=>({...node,label:preferredLabel(node.labels),labelVariants:[...node.labels.entries()].map(([label,count])=>({label,count})),rawCandidateVariants:[],tokens:tokens(node.normalized),candidateCount:0,sourceCount:node.sourceIds.size}));
 return{nodes,rawSectionAtomIds,meaningfulSectionAtomIds,inheritedGenericAtomIds,contextSectionKeyByAtomId,genericSections:[...genericCounts.values()].filter(item=>item.count>0).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'he'))};
}

function addEdge(edges,a,b,{weight,signal,sourceId=null,section=null,atomId=null}){
 if(!a||!b||a.id===b.id)return;
 const key=pairKey(a.id,b.id),edge=edges.get(key)||{id:sha256(`edge:${key}`),from:a.id<b.id?a.id:b.id,to:a.id<b.id?b.id:a.id,weight:0,signals:{SOURCE_CONTEXT:0,SECTION_CONTEXT:0,SECTION_MEMBERSHIP:0,SECTION_LABEL_MENTION:0,CO_MENTION:0},sourceIds:new Set(),sections:new Set(),atomIds:new Set()};
 edge.weight+=weight;edge.signals[signal]=(edge.signals[signal]||0)+1;if(sourceId)edge.sourceIds.add(sourceId);if(section)edge.sections.add(section);if(atomId)edge.atomIds.add(atomId);edges.set(key,edge);
}
function pairs(items,callback){for(let i=0;i<items.length;i+=1)for(let j=i+1;j<items.length;j+=1)callback(items[i],items[j])}

function mentionedConceptNodes(atom,conceptNodes){
 const normalized=normalizeKnowledgeText(atom.candidate_text),atomTokens=tokens(normalized),matches=[];
 for(const node of conceptNodes){
  if(node.normalized.length<3)continue;let match=false;
  if(node.tokens.size===1){const token=[...node.tokens][0];match=token.length>=5&&atomTokens.has(token)}
  else if(normalized.includes(node.normalized))match=true;
  else if(node.tokens.size<=4)match=[...node.tokens].every(token=>atomTokens.has(token));
  if(match)matches.push(node);
 }
 return matches.sort((a,b)=>b.normalized.length-a.normalized.length).slice(0,10);
}

function buildEdges(conceptNodes,sectionNodes,atomRows,contextSectionKeyByAtomId){
 const edges=new Map(),conceptsBySource=new Map(),conceptsBySection=new Map(),sectionNodeBySection=new Map();
 for(const node of conceptNodes){for(const sourceId of node.sourceIds){const list=conceptsBySource.get(sourceId)||new Map();list.set(node.id,node);conceptsBySource.set(sourceId,list)}for(const sectionKey of node.sections){const list=conceptsBySection.get(sectionKey)||new Map();list.set(node.id,node);conceptsBySection.set(sectionKey,list)}}
 for(const node of sectionNodes)for(const sectionKey of node.sections)sectionNodeBySection.set(sectionKey,node);
 for(const[sourceId,map]of conceptsBySource)pairs([...map.values()],(a,b)=>addEdge(edges,a,b,{weight:.15,signal:'SOURCE_CONTEXT',sourceId}));
 for(const[sectionKey,map]of conceptsBySection){const[sourceId,...rest]=sectionKey.split('::'),section=rest.join('::'),concepts=[...map.values()];pairs(concepts,(a,b)=>addEdge(edges,a,b,{weight:1.2,signal:'SECTION_CONTEXT',sourceId,section}));const sectionNode=sectionNodeBySection.get(sectionKey);if(sectionNode)for(const concept of concepts)addEdge(edges,sectionNode,concept,{weight:2.8,signal:'SECTION_MEMBERSHIP',sourceId,section})}
 for(const sectionNode of sectionNodes){for(const concept of mentionedConceptNodes({candidate_text:sectionNode.label},conceptNodes))addEdge(edges,sectionNode,concept,{weight:2,signal:'SECTION_LABEL_MENTION'})}

 let explicitMappedAtoms=0,contextualAtoms=0,connectedAtoms=0;const unmappedSectionCounts=new Map(),noExplicitSectionCounts=new Map();
 for(const atom of atomRows){
  if(atom.atom_type==='CONCEPT')continue;
  const inheritedOrDirect=contextSectionKeyByAtomId.get(atom.id),directKey=atom.section?sourceSectionKey(atom.source_id,atom.section):null,contextKey=inheritedOrDirect||directKey,sectionNode=contextKey?sectionNodeBySection.get(contextKey):null,contextConcepts=contextKey?conceptsBySection.get(contextKey):null,hasContext=Boolean(sectionNode||contextConcepts?.size);
  if(hasContext){contextualAtoms+=1;if(sectionNode)sectionNode.contextAtomIds.add(atom.id);if(contextConcepts)for(const node of contextConcepts.values())node.contextAtomIds.add(atom.id)}
  const matched=mentionedConceptNodes(atom,conceptNodes),hasExplicit=matched.length>0;
  if(hasExplicit){explicitMappedAtoms+=1;for(const node of matched)node.mappedAtomIds.add(atom.id);pairs(matched,(a,b)=>addEdge(edges,a,b,{weight:2.2,signal:'CO_MENTION',sourceId:atom.source_id,section:atom.section||null,atomId:atom.id}))}
  if(hasExplicit||hasContext)connectedAtoms+=1;
  if(!hasExplicit){const key=sourceSectionKey(atom.source_id,atom.section||'(no section)');noExplicitSectionCounts.set(key,(noExplicitSectionCounts.get(key)||0)+1)}
  if(!hasExplicit&&!hasContext){const key=sourceSectionKey(atom.source_id,atom.section||'(no section)');unmappedSectionCounts.set(key,(unmappedSectionCounts.get(key)||0)+1)}
 }
 return{edges:[...edges.values()],explicitMappedAtoms,contextualAtoms,connectedAtoms,unmappedSectionCounts,noExplicitSectionCounts};
}

function edgeView(edge){return{...edge,weight:Number(edge.weight.toFixed(3)),sourceIds:asArray(edge.sourceIds),sections:asArray(edge.sections),supportAtomIds:asArray(edge.atomIds)}}
function buildCommunities(nodes,edges,{strongThreshold=1.2}={}){
 const adjacency=new Map(nodes.map(node=>[node.id,[]]));for(const edge of edges){if(edge.weight<strongThreshold)continue;adjacency.get(edge.from)?.push({nodeId:edge.to,weight:edge.weight});adjacency.get(edge.to)?.push({nodeId:edge.from,weight:edge.weight})}
 const degree=new Map(nodes.map(node=>[node.id,(adjacency.get(node.id)||[]).reduce((sum,item)=>sum+item.weight,0)])),byId=new Map(nodes.map(node=>[node.id,node])),ordered=[...nodes].sort((a,b)=>(degree.get(b.id)||0)-(degree.get(a.id)||0)||a.label.localeCompare(b.label,'he')),assigned=new Set(),communities=[];
 for(const seed of ordered){
  if(assigned.has(seed.id))continue;const members=[seed];assigned.add(seed.id);const direct=(adjacency.get(seed.id)||[]).filter(item=>!assigned.has(item.nodeId)).sort((a,b)=>b.weight-a.weight||String(a.nodeId).localeCompare(String(b.nodeId)));for(const item of direct){const node=byId.get(item.nodeId);if(node){members.push(node);assigned.add(node.id)}}
  let changed=true;while(changed&&members.length<30){changed=false;const memberIds=new Set(members.map(member=>member.id)),candidates=new Map();for(const member of members)for(const relation of adjacency.get(member.id)||[]){if(assigned.has(relation.nodeId)||memberIds.has(relation.nodeId))continue;const stat=candidates.get(relation.nodeId)||{weight:0,links:0};stat.weight+=relation.weight;stat.links+=1;candidates.set(relation.nodeId,stat)}const additions=[...candidates.entries()].filter(([,stat])=>stat.links>=2&&stat.weight>=strongThreshold*2).sort((a,b)=>b[1].weight-a[1].weight||String(a[0]).localeCompare(String(b[0]))).slice(0,Math.max(0,30-members.length));for(const[nodeId]of additions){const node=byId.get(nodeId);if(node&&!assigned.has(nodeId)){members.push(node);assigned.add(nodeId);changed=true}}}
  const ranked=[...members].sort((a,b)=>(degree.get(b.id)||0)-(degree.get(a.id)||0)||a.label.localeCompare(b.label,'he')),sourceIds=new Set(),sourceFiles=new Set(),sections=new Set();for(const member of members){for(const value of member.sourceIds)sourceIds.add(value);for(const value of member.sourceFiles)sourceFiles.add(value);for(const value of member.sections)sections.add(value)}
  const centralConcepts=ranked.slice(0,5).map(node=>({id:node.id,kind:node.kind,label:node.label,weightedDegree:Number((degree.get(node.id)||0).toFixed(3)),sourceCount:node.sourceCount})),sectionCenter=centralConcepts.find(item=>item.kind==='SECTION_TOPIC'),derivedParts=sectionCenter?[sectionCenter,...centralConcepts.filter(item=>item.id!==sectionCenter.id)].slice(0,3):centralConcepts.slice(0,3);
  communities.push({id:sha256(`community:${ranked.map(node=>node.id).sort().join('|')}`),derivedLabel:derivedParts.map(item=>item.label).join(' · '),size:members.length,centralConcepts,sourceCount:sourceIds.size,sourceFiles:asArray(sourceFiles),sectionCount:sections.size,memberIds:ranked.map(node=>node.id)});
 }
 return communities.sort((a,b)=>b.size-a.size||b.sourceCount-a.sourceCount||a.derivedLabel.localeCompare(b.derivedLabel,'he'));
}
function sectionCountView(counts){return[...counts.entries()].map(([key,count])=>{const[sourceId,...rest]=key.split('::');return{sourceId,section:rest.join('::'),count}}).sort((a,b)=>b.count-a.count).slice(0,30)}

export function buildEmergentCorpusMap({conceptRows,atomRows}){
 const conceptNodes=buildConceptNodes(conceptRows),sectionData=buildSectionTopicNodes(atomRows),sectionNodes=sectionData.nodes,nodes=[...conceptNodes,...sectionNodes],{edges,explicitMappedAtoms,contextualAtoms,connectedAtoms,unmappedSectionCounts,noExplicitSectionCounts}=buildEdges(conceptNodes,sectionNodes,atomRows,sectionData.contextSectionKeyByAtomId),edgeViews=edges.map(edgeView).sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id)),communities=buildCommunities(nodes,edges);
 const knowledgeAtoms=atomRows.filter(row=>row.atom_type!=='CONCEPT').length,strongEdges=edgeViews.filter(edge=>edge.weight>=1.2).length,nodeViews=nodes.map(node=>({id:node.id,kind:node.kind,label:node.label,normalized:node.normalized,candidateCount:node.candidateCount,sourceCount:node.sourceCount,sourceFiles:asArray(node.sourceFiles),sections:asArray(node.sections),explicitMappedAtomCount:node.mappedAtomIds.size,contextAtomCount:node.contextAtomIds.size,rawCandidateVariants:node.rawCandidateVariants})).sort((a,b)=>b.contextAtomCount-a.contextAtomCount||b.explicitMappedAtomCount-a.explicitMappedAtomCount||b.sourceCount-a.sourceCount||a.label.localeCompare(b.label,'he'));
 return{ok:true,method:{version:'corpus-map-v0.4',basis:['map-labels-derived-from-exact-concept-candidates','source-observed-section-topics','ordered-inheritance-for-generic-reflection-blocks','same-source-context','same-section-context','section-concept-membership','section-label-concept-mention','explicit-concept-co-mention'],semanticModel:false,partition:'hub-neighborhood-preview'},summary:{conceptCandidates:conceptRows.length,conceptNodes:conceptNodes.length,mapCollapsedConceptCandidates:conceptRows.length-conceptNodes.length,sectionTopicNodes:sectionNodes.length,totalMapNodes:nodes.length,knowledgeAtoms,rawSectionContextAtoms:sectionData.rawSectionAtomIds.size,rawSectionCoveragePercent:percentage(sectionData.rawSectionAtomIds.size,knowledgeAtoms),meaningfulSectionAtoms:sectionData.meaningfulSectionAtomIds.size,meaningfulSectionCoveragePercent:percentage(sectionData.meaningfulSectionAtomIds.size,knowledgeAtoms),inheritedGenericContextAtoms:sectionData.inheritedGenericAtomIds.size,explicitMappedAtoms,explicitCoveragePercent:percentage(explicitMappedAtoms,knowledgeAtoms),contextualAtoms,contextCoveragePercent:percentage(contextualAtoms,knowledgeAtoms),connectedAtoms,connectedCoveragePercent:percentage(connectedAtoms,knowledgeAtoms),trulyUnmappedAtoms:knowledgeAtoms-connectedAtoms,edges:edgeViews.length,strongEdges,communities:communities.length,singletonCommunities:communities.filter(community=>community.size===1).length},nodes:nodeViews,edges:edgeViews,communities,genericSections:sectionData.genericSections,unmappedSections:sectionCountView(unmappedSectionCounts),noExplicitMentionSections:sectionCountView(noExplicitSectionCounts),policy:{canonicalWrites:false,derivedLabels:true,note:'SECTION_TOPIC nodes come only from headings observed in source structure. Generic reflection/summary headings inherit the immediately preceding meaningful source topic by source order, but remain non-taxonomy nodes. Map labels may shorten descriptive concept candidate lines while raw candidate wording remains retained. Communities are preview structures, not approved taxonomy.'}};
}

export async function buildEmergentCorpusMapPreview(db,{communityLimit=30,nodeLimit=150,edgeLimit=250}={}){
 const conceptRows=(await db.query(`SELECT c.id,c.candidate_text,c.source_id,c.source_start,c.metadata->>'section' AS section,s.metadata->>'sourceFile' AS source_file FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE c.atom_type='CONCEPT' AND c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge ORDER BY c.source_id,c.source_start`)).rows;
 const atomRows=(await db.query(`SELECT c.id,c.atom_type::text,c.candidate_text,c.source_id,c.source_start,c.metadata->>'section' AS section,s.metadata->>'sourceFile' AS source_file FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge ORDER BY c.source_id,c.source_start`)).rows;
 const map=buildEmergentCorpusMap({conceptRows,atomRows});return{...map,nodes:map.nodes.slice(0,Math.max(1,Math.min(500,Number(nodeLimit)||150))),edges:map.edges.slice(0,Math.max(1,Math.min(1000,Number(edgeLimit)||250))),communities:map.communities.slice(0,Math.max(1,Math.min(200,Number(communityLimit)||30)))};
}

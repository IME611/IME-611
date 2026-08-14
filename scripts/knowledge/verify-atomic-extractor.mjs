import assert from 'node:assert/strict';
import { extractAtomicCandidates } from '../../server/knowledge/application/extraction/atomic-extraction-preview.service.js';

const text = [
  'פרק 10: נוירופלסטיות',
  'המוח שלך אינו קבוע',
  'נוירופלסטיות פירושה היכולת של המוח להשתנות לאורך החיים.',
  '1. מערכת העצבים',
  'רשת עצבים שמעבירה אותות בגוף.',
  'למה זה חשוב?',
  'הערה לעריכה: להוסיף איור.',
].join('\n\n');

const source={id:'golden-source',title:'Golden extraction fixture',raw_content:text};
const fragments=[{id:'golden-fragment',ordinal:0,raw_text:text,start_offset:0,end_offset:text.length}];
const candidates=extractAtomicCandidates(source,fragments);
const find=(type,predicate=()=>true)=>candidates.find(candidate=>candidate.type===type&&predicate(candidate));

assert.equal(candidates.some(candidate=>candidate.text.startsWith('פרק 10:')),false,'chapter title must remain structural context');
assert.equal(candidates.some(candidate=>candidate.text==='המוח שלך אינו קבוע'),false,'short section heading must not become canonical knowledge automatically');

const explicitDefinition=find('DEFINITION',candidate=>candidate.text.includes('נוירופלסטיות פירושה'));
assert.ok(explicitDefinition,'explicit definition must be extracted');
assert.equal(explicitDefinition.claimType,'DEFINITIONAL');

const concept=find('CONCEPT',candidate=>candidate.text==='מערכת העצבים');
assert.ok(concept,'numbered concept must be extracted');

const conceptDefinition=find('DEFINITION',candidate=>candidate.defines==='מערכת העצבים');
assert.ok(conceptDefinition,'first sentence after numbered concept must be linked as its definition');
assert.equal(conceptDefinition.text,'רשת עצבים שמעבירה אותות בגוף.');

assert.ok(find('QUESTION',candidate=>candidate.text==='למה זה חשוב?'),'question must be extracted');
const editorial=find('EDITORIAL_NOTE');
assert.ok(editorial,'editorial note must be detected');
assert.equal(editorial.excludeFromKnowledge,true,'editorial note must be excluded from knowledge');

for(const candidate of candidates){
  assert.ok(candidate.evidence.length>0,`candidate ${candidate.candidateKey} must retain evidence`);
  assert.ok(candidate.evidence.every(edge=>edge.exactQuoteVerified),`candidate ${candidate.candidateKey} evidence must verify exactly`);
}

console.log(`PASS atomic extractor golden regression (${candidates.length} candidates)`);

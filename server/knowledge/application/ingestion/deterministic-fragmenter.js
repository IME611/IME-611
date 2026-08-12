import crypto from 'crypto';

export const FRAGMENTER_VERSION = 'text-v2:900:0:verbatim-boundary';

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function preferredEnd(text,start,limit){
  const floor=start+Math.floor((limit-start)*0.55);
  const candidates=['\n\n','\n','. ','! ','? ','׃ ','。'];
  let best=-1,bestLength=0;
  for(const marker of candidates){
    const pos=text.lastIndexOf(marker,limit);
    if(pos>=floor&&pos>best){best=pos;bestLength=marker.length}
  }
  return best>=floor?best+bestLength:limit;
}

export function fragmentText(text, { size = 900, sourceContentHash } = {}) {
  if (typeof text !== 'string' || !text.length) return [];
  if (!/^[0-9a-f]{64}$/.test(String(sourceContentHash || ''))) {
    throw new Error('fragmentText requires a canonical sourceContentHash');
  }

  const fragments = [];
  let start = 0;
  let ordinal = 0;

  while (start < text.length) {
    const limit=Math.min(text.length,start+size);
    const end=limit===text.length?limit:preferredEnd(text,start,limit);
    const rawText = text.slice(start, end);
    const contentHash = sha256(rawText);
    const fragmentKey = sha256([
      'eil.fragment.v2',sourceContentHash,FRAGMENTER_VERSION,ordinal,start,end,rawText,
    ].join('\u001f'));

    fragments.push({ordinal,rawText,startOffset:start,endOffset:end,contentHash,fragmentKey,fragmenterVersion:FRAGMENTER_VERSION});
    ordinal += 1;
    if (end === text.length) break;
    start=end;
  }

  return fragments;
}

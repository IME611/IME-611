import{useEffect,useState}from'react';

type PublicSource={
 id:string;
 type:string;
 title:string;
 author?:string|null;
 original_uri?:string|null;
 mime_type?:string|null;
 metadata?:Record<string,unknown>|null;
 created_at?:string|null;
};
type SourceFragment={id:string;ordinal:number;raw_text:string;page?:number|null;section?:string|null};
type Payload={ok:boolean;source?:PublicSource;fragments?:SourceFragment[];error?:string};
type Props={sourceId:string;onBack:()=>void};

const paragraphs=(raw:string)=>String(raw||'').split(/\n{2,}/u).map(value=>value.trim()).filter(Boolean);

export function PublicSourceDocument({sourceId,onBack}:Props){
 const[loading,setLoading]=useState(true),[error,setError]=useState(''),[payload,setPayload]=useState<Payload|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError('');setPayload(null);
  fetch(`/api/sources?id=${encodeURIComponent(sourceId)}`,{signal:controller.signal,headers:{Accept:'application/json'}})
   .then(async response=>{const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);return data as Payload})
   .then(data=>{setPayload(data);setLoading(false)})
   .catch(reason=>{if(reason?.name==='AbortError')return;setError(String(reason?.message||'לא ניתן לטעון את המקור'));setLoading(false)});
  return()=>controller.abort();
 },[sourceId]);
 const source=payload?.source,fragments=Array.isArray(payload?.fragments)?payload!.fragments!:[];
 const metadata=source?.metadata||{},sourceFile=typeof metadata.sourceFile==='string'?metadata.sourceFile:source?.original_uri||'';
 return <div className="publicSourceDocument" dir="rtl">
  <div className="publicSourceTop"><button type="button" className="spiralBack" onClick={onBack}>→ חזרה למקורות</button><span>מקור קנוני שפורסם</span></div>
  {loading&&<div className="routeLoading" role="status" aria-live="polite"><span>טוען את המקור המלא…</span></div>}
  {error&&<div className="publicSourceError" role="alert"><b>לא ניתן לטעון את המקור</b><span>{error}</span><button type="button" onClick={onBack}>חזרה למקורות</button></div>}
  {!loading&&!error&&source&&<>
   <header className="publicSourceHeader">
    <span className="publicSourceKicker">SOURCE · PUBLISHED</span>
    <h1>{source.title||'מקור ללא כותרת'}</h1>
    <div className="publicSourceMeta">
     {sourceFile&&<span>{sourceFile}</span>}
     {source.author&&<span>{source.author}</span>}
     {source.type&&<span>{source.type}</span>}
     <span>{fragments.length} קטעי מקור</span>
    </div>
   </header>
   <div className="canonicalSourceNotice"><b>המקור נשמר בשלמותו</b><span>זהו חומר המקור הקנוני שפורסם ללומדים. עיבודים וכרטיסיות אינם מחליפים את הניסוח המקורי.</span></div>
   <article className="publicSourceContent">
    {fragments.length?fragments.map(fragment=><section key={fragment.id||fragment.ordinal} className="publicSourceFragment">
     {(fragments.length>1||fragment.section||fragment.page)&&<div className="publicSourceFragmentMeta"><span>קטע {fragment.ordinal}</span>{fragment.section&&<span>{fragment.section}</span>}{fragment.page&&<span>עמוד {fragment.page}</span>}</div>}
     {paragraphs(fragment.raw_text).map((text,index)=><p key={`${fragment.id}-${index}`}>{text}</p>)}
    </section>):<div className="emptyState"><p>המקור פורסם אך אין בו טקסט זמין להצגה.</p><span>הפרסום נשמר במאגר, והכרטיסיות המקושרות אליו נשארות זמינות במסע.</span></div>}
   </article>
  </>}
 </div>;
}

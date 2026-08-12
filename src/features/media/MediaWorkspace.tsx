import{useState}from'react';
import{AudioFrequencyPlayer}from'./AudioFrequencyPlayer';
import{InteractiveDiagram}from'./InteractiveDiagram';
import{MediaCard}from'./MediaCard';
import{VideoModal}from'./VideoModal';
import{chapterMedia,systemsVisualSummary}from'./media.registry';

export function MediaWorkspace(){
 const[selected,setSelected]=useState(chapterMedia[0]),[videoOpen,setVideoOpen]=useState(false);
 return <div className="mediaWorkspace"><header className="mediaWorkspaceHero"><div><span>MEDIA / VISUAL ATLAS</span><h1>לא עוד מסמך לקרוא. מפה שאפשר לראות, לשמוע ולחקור.</h1><p>השכבה הוויזואלית מארגנת את 18 פרקי המחקר בלי להפוך המחשה לראיה. כל מסקנה עדיין חוזרת למקור.</p></div><div className="systemsCounter"><span><b>{systemsVisualSummary.physiologicalCount}</b>פנימיות</span><i>↔</i><span><b>{systemsVisualSummary.environmentalCount}</b>חיצוניות</span></div></header><section className="mediaAtlasLayout"><aside className="mediaChapterRail">{chapterMedia.map(item=><button key={item.id} type="button" className={item.id===selected.id?'active':''} onClick={()=>setSelected(item)}><span>{String(item.chapter).padStart(2,'0')}</span><b>{item.title}</b></button>)}</aside><main className="mediaFocus"><MediaCard eyebrow={`CHAPTER ${String(selected.chapter).padStart(2,'0')}`} title={selected.title} description={selected.subtitle}>{selected.kind==='frequency'?<AudioFrequencyPlayer initialHz={selected.frequencyHz}/>:<InteractiveDiagram labels={selected.labels} center="מודעות"/>}</MediaCard><section className="mediaContextStrip">{systemsVisualSummary.groups.map(group=><article key={group.id}><span>{group.label}</span><p>{group.description}</p></article>)}</section><button className="mediaExplainerButton" type="button" onClick={()=>setVideoOpen(true)}>▶ פתח הסבר ויזואלי</button></main></section><VideoModal open={videoOpen} title={selected.title} onClose={()=>setVideoOpen(false)}/></div>;
}

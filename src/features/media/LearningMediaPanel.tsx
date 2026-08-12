import{useState}from'react';
import{AudioFrequencyPlayer}from'./AudioFrequencyPlayer';
import{InteractiveDiagram}from'./InteractiveDiagram';
import{MediaCard}from'./MediaCard';
import{VideoModal}from'./VideoModal';
import{mediaForChapter,systemsVisualSummary}from'./media.registry';

interface LearningMediaPanelProps{chapter:number;sourceExcerpt?:string}

export function LearningMediaPanel({chapter,sourceExcerpt}:LearningMediaPanelProps){
 const spec=mediaForChapter(chapter),[videoOpen,setVideoOpen]=useState(false),[summaryOpen,setSummaryOpen]=useState(false);
 if(!spec)return null;
 return <section className="learningMediaLayer" aria-label="שכבת מדיה לימודית"><div className="mediaLayerHeading"><div><span>MEDIA LAYER</span><h2>להבין גם דרך מבנה, קצב ויחסים.</h2></div><button type="button" onClick={()=>setVideoOpen(true)}>▶ הסבר ויזואלי</button></div><div className="mediaLayerGrid"><MediaCard title={spec.title} description={spec.subtitle}>{spec.kind==='frequency'?<AudioFrequencyPlayer initialHz={spec.frequencyHz}/>:<InteractiveDiagram labels={spec.labels} center={chapter<=3?'מערכת':'מודעות'}/>}</MediaCard><MediaCard eyebrow="PROGRESSIVE DISCLOSURE" title="מה כדאי לקחת מהשכבה הזו?" description="קודם תמצית. אחר כך, רק אם צריך, חוזרים לפרטים ולמקור."><div className="mediaSummary"><div className="mediaSummaryStats"><span><b>{systemsVisualSummary.physiologicalCount}</b> מערכות פיזיולוגיות</span><span><b>{systemsVisualSummary.environmentalCount}</b> מערכות סביבתיות</span></div>{sourceExcerpt&&<blockquote>{sourceExcerpt.slice(0,240)}</blockquote>}<button type="button" onClick={()=>setSummaryOpen(value=>!value)} aria-expanded={summaryOpen}>{summaryOpen?'סגור פירוט':'פתח את שכבות ההקשר'}</button>{summaryOpen&&<div className="mediaDisclosure">{systemsVisualSummary.groups.map(group=><article key={group.id}><b>{group.label}</b><p>{group.description}</p></article>)}</div>}</div></MediaCard></div><VideoModal open={videoOpen} title={spec.title} onClose={()=>setVideoOpen(false)}/></section>;
}

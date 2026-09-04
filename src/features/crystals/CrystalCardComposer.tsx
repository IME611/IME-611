import{useEffect,useMemo,useState}from'react';
import{useCrystalCollection}from'./model/useCrystalCollection';
import type{CrystalRecord}from'./model/crystal.repository';

type Props={record:CrystalRecord};

export function CrystalCardComposer({record}:Props){
  const{records,save,toggle}=useCrystalCollection();
  const existing=useMemo(()=>records.find(item=>item.fragmentId===record.fragmentId),[records,record.fragmentId]);
  const[note,setNote]=useState(existing?.personalNote??'');
  const[status,setStatus]=useState<'idle'|'saved'|'removed'|'error'>('idle');

  useEffect(()=>{setNote(existing?.personalNote??'');setStatus('idle')},[record.fragmentId]);

  const handleSave=()=>{
    const ok=save({...record,personalNote:note,savedAt:existing?.savedAt??''});
    setStatus(ok?'saved':'error');
  };
  const handleRemove=()=>{
    const remainsSaved=toggle(existing??record);
    setStatus(remainsSaved?'error':'removed');
  };

  return <section className="cardCrystalComposer" aria-labelledby={`crystal-title-${record.fragmentId}`}>
    <div className="cardCrystalHead">
      <span aria-hidden="true">♡</span>
      <div><h3 id={`crystal-title-${record.fragmentId}`}>{existing?'הכרטיס נמצא בכרטיסיות שאהבתי':'אהבת את הכרטיס הזה?'}</h3><p>אפשר לשמור אותו ולהוסיף הערה אישית — לא חובה.</p></div>
    </div>
    <label className="cardCrystalLabel" htmlFor={`crystal-note-${record.fragmentId}`}>הערה אישית</label>
    <textarea id={`crystal-note-${record.fragmentId}`} value={note} onChange={event=>{setNote(event.target.value);setStatus('idle')}} rows={2} placeholder="מה נגע בך? מה תרצה לזכור?"/>
    <div className="cardCrystalActions">
      <button type="button" className="cardCrystalSave" onClick={handleSave}>{existing?'עדכן את הכרטיס':'שמור בכרטיסיות שאהבתי ♡'}</button>
      {existing&&<button type="button" className="cardCrystalRemove" onClick={handleRemove}>הסר מהכרטיסיות</button>}
    </div>
    {status==='saved'&&<p className="cardCrystalStatus" role="status">✓ הכרטיס וההערה נשמרו</p>}
    {status==='removed'&&<p className="cardCrystalStatus" role="status">הכרטיס הוסר מהכרטיסיות שאהבתי</p>}
    {status==='error'&&<p className="formError" role="alert">לא ניתן היה לעדכן את הכרטיס בדפדפן. נסה שוב.</p>}
  </section>;
}

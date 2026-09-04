import{useEffect,useMemo,useState}from'react';
import{useCrystalCollection}from'./model/useCrystalCollection';
import type{CrystalRecord}from'./model/crystal.repository';

type Props={record:CrystalRecord};

export function CrystalCardComposer({record}:Props){
  const{records,save,toggle}=useCrystalCollection();
  const existing=useMemo(()=>records.find(item=>item.fragmentId===record.fragmentId),[records,record.fragmentId]);
  const[note,setNote]=useState(existing?.personalNote??'');
  const[noteOpen,setNoteOpen]=useState(Boolean(existing?.personalNote));
  const[status,setStatus]=useState<'idle'|'saved'|'removed'|'error'>('idle');

  useEffect(()=>{setNote(existing?.personalNote??'');setNoteOpen(Boolean(existing?.personalNote));setStatus('idle')},[record.fragmentId]);

  const handleSave=()=>{
    const ok=save({...record,personalNote:note,savedAt:existing?.savedAt??''});
    setStatus(ok?'saved':'error');
  };
  const handleRemove=()=>{
    const remainsSaved=toggle(existing??record);
    setStatus(remainsSaved?'error':'removed');
    if(!remainsSaved){setNote('');setNoteOpen(false)}
  };

  return <section className="cardCrystalComposer" aria-labelledby={`saved-card-title-${record.fragmentId}`}>
    <div className="cardCrystalPrimary">
      <div>
        <h3 id={`saved-card-title-${record.fragmentId}`}>{existing?'שמורה בכרטיסיות שאהבתי':'רוצה לשמור את הכרטיס?'}</h3>
        <p>{existing?'אפשר להוסיף הערה אישית או להסיר מהאוסף.':'הוא יחכה לך בעמוד הכרטיסיות שאהבתי.'}</p>
      </div>
      <button type="button" className="cardCrystalSave" onClick={handleSave}>{existing?'♥ נשמר':'♡ שמור'}</button>
    </div>

    <div className="cardCrystalSecondaryActions">
      <button type="button" className="cardCrystalNoteToggle" aria-expanded={noteOpen} onClick={()=>setNoteOpen(value=>!value)}>{noteOpen?'סגור הערה':'הוסף הערה אישית'}</button>
      {existing&&<button type="button" className="cardCrystalRemove" onClick={handleRemove}>הסר</button>}
    </div>

    {noteOpen&&<div className="cardCrystalNote">
      <label className="cardCrystalLabel" htmlFor={`crystal-note-${record.fragmentId}`}>הערה אישית</label>
      <textarea id={`crystal-note-${record.fragmentId}`} value={note} onChange={event=>{setNote(event.target.value);setStatus('idle')}} rows={3} placeholder="מה תרצה לזכור מהכרטיס הזה?"/>
      <button type="button" className="cardCrystalNoteSave" onClick={handleSave}>{existing?'שמור הערה':'שמור כרטיס והערה'}</button>
    </div>}

    {status==='saved'&&<p className="cardCrystalStatus" role="status">✓ נשמר</p>}
    {status==='removed'&&<p className="cardCrystalStatus" role="status">הכרטיס הוסר</p>}
    {status==='error'&&<p className="formError" role="alert">לא ניתן היה לעדכן את הכרטיס בדפדפן. נסה שוב.</p>}
  </section>;
}
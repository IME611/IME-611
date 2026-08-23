import{useEffect,useState}from'react';
import{crystalCollectionRepository,type CrystalRecord}from'./crystal.repository';

export function useCrystalCollection(){
 const[records,setRecords]=useState<CrystalRecord[]>(()=>crystalCollectionRepository.load());
 useEffect(()=>{
  const sync=()=>setRecords(crystalCollectionRepository.load());
  window.addEventListener(crystalCollectionRepository.eventName,sync);
  window.addEventListener('storage',sync);
  return()=>{window.removeEventListener(crystalCollectionRepository.eventName,sync);window.removeEventListener('storage',sync)};
 },[]);
 return{records,save:(record:CrystalRecord)=>crystalCollectionRepository.save(record),toggle:(record:CrystalRecord)=>crystalCollectionRepository.toggle(record),clear:()=>crystalCollectionRepository.clear()};
}

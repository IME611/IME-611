import{useEffect,useState}from'react';
import{crystalCollectionRepository,type CrystalRecord}from'./crystal.repository';

export function useCrystalCollection(){
 const[records,setRecords]=useState<CrystalRecord[]>(()=>crystalCollectionRepository.load());
 useEffect(()=>{
  let active=true;
  const sync=()=>setRecords(crystalCollectionRepository.load());
  crystalCollectionRepository.hydrate().then(next=>{if(active)setRecords(next)});
  window.addEventListener(crystalCollectionRepository.eventName,sync);
  window.addEventListener('storage',sync);
  return()=>{active=false;window.removeEventListener(crystalCollectionRepository.eventName,sync);window.removeEventListener('storage',sync)};
 },[]);
 return{records,toggle:(record:CrystalRecord)=>crystalCollectionRepository.toggle(record),clear:()=>crystalCollectionRepository.clear()};
}

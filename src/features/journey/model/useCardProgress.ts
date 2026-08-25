import{useEffect,useState}from'react';
import{cardProgressRepository}from'./card-progress.repository';

export function useCardProgress(unitKey:string|number,cardCount:number){
  const[position,setPositionState]=useState(()=>cardProgressRepository.load(unitKey,cardCount));
  useEffect(()=>{
    const sync=()=>setPositionState(cardProgressRepository.load(unitKey,cardCount));
    sync();
    window.addEventListener(cardProgressRepository.eventName,sync);
    window.addEventListener('storage',sync);
    window.addEventListener('eil:progress-reset',sync);
    return()=>{
      window.removeEventListener(cardProgressRepository.eventName,sync);
      window.removeEventListener('storage',sync);
      window.removeEventListener('eil:progress-reset',sync);
    };
  },[unitKey,cardCount]);
  const setPosition=(next:number)=>{
    const normalized=Math.min(Math.max(0,next),Math.max(0,cardCount-1));
    setPositionState(normalized);
    cardProgressRepository.save(unitKey,normalized);
  };
  return{position,setPosition};
}

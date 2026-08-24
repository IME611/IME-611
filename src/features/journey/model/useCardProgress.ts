import{useEffect,useState}from'react';
import{cardProgressRepository}from'./card-progress.repository';

export function useCardProgress(chapterNumber:number,cardCount:number){
  const[position,setPositionState]=useState(()=>cardProgressRepository.load(chapterNumber,cardCount));
  useEffect(()=>{
    const sync=()=>setPositionState(cardProgressRepository.load(chapterNumber,cardCount));
    sync();
    window.addEventListener(cardProgressRepository.eventName,sync);
    window.addEventListener('storage',sync);
    window.addEventListener('eil:progress-reset',sync);
    return()=>{
      window.removeEventListener(cardProgressRepository.eventName,sync);
      window.removeEventListener('storage',sync);
      window.removeEventListener('eil:progress-reset',sync);
    };
  },[chapterNumber,cardCount]);
  const setPosition=(next:number)=>{
    const normalized=Math.min(Math.max(0,next),Math.max(0,cardCount-1));
    setPositionState(normalized);
    cardProgressRepository.save(chapterNumber,normalized);
  };
  return{position,setPosition};
}

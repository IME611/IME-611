import{useEffect,useRef,useState}from'react';

interface AudioFrequencyPlayerProps{initialHz?:number;minHz?:number;maxHz?:number;label?:string}

export function AudioFrequencyPlayer({initialHz=220,minHz=40,maxHz=880,label='תדר הדגמה'}:AudioFrequencyPlayerProps){
 const[hz,setHz]=useState(initialHz),[playing,setPlaying]=useState(false);
 const contextRef=useRef<AudioContext|null>(null),oscillatorRef=useRef<OscillatorNode|null>(null),gainRef=useRef<GainNode|null>(null);
 const stop=()=>{try{oscillatorRef.current?.stop()}catch{}oscillatorRef.current=null;gainRef.current?.disconnect();gainRef.current=null;setPlaying(false)};
 const play=()=>{stop();const Context=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!Context)return;const context=contextRef.current??new Context();contextRef.current=context;const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=hz;gain.gain.value=.035;oscillator.connect(gain);gain.connect(context.destination);oscillator.start();oscillatorRef.current=oscillator;gainRef.current=gain;setPlaying(true)};
 useEffect(()=>{if(oscillatorRef.current)oscillatorRef.current.frequency.setTargetAtTime(hz,contextRef.current?.currentTime??0,.02)},[hz]);
 useEffect(()=>()=>{stop();void contextRef.current?.close()},[]);
 return <div className="frequencyPlayer"><div className="frequencyReadout"><span>{label}</span><strong>{Math.round(hz)}<small> Hz</small></strong></div><input aria-label="בחר תדר" type="range" min={minHz} max={maxHz} value={hz} onChange={event=>setHz(Number(event.target.value))}/><div className="frequencyActions"><button type="button" onClick={playing?stop:play}>{playing?'עצור':'נגן גל סינוס'}</button><small>המחשה פיזיקלית/שמיעתית בלבד — לא כלי טיפולי.</small></div></div>;
}

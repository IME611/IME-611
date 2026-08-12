import React from'react';
import{CrystalButton}from'../crystals/CrystalButton';

type Props={fragmentId:string;conceptId:string;topic:string;subtopic?:string;text:string;sourceLabel:string;provenanceLabel:string};
export function MicroCard({fragmentId,conceptId,topic,subtopic,text,sourceLabel,provenanceLabel}:Props){
 const record={fragmentId,conceptId,topic,subtopic,text,sourceLabel,provenanceLabel,savedAt:''};
 return <article className="microCard"><header><div><span className="microTopic">{topic}</span>{subtopic&&<small>{subtopic}</small>}</div><CrystalButton record={record}/></header><p className="microOriginal">{text}</p><footer><span>{sourceLabel}</span><span className="microProvenance">↗ {provenanceLabel}</span></footer></article>;
}

import React from'react';
import{useCrystalCollection}from'./model/useCrystalCollection';
import type{CrystalRecord}from'./model/crystal.repository';

type Props={record:CrystalRecord};
export function CrystalButton({record}:Props){
 const{records,toggle}=useCrystalCollection();
 const active=records.some(item=>item.fragmentId===record.fragmentId);
 return <button className={'crystalButton '+(active?'isSaved':'')} type="button" aria-pressed={active} aria-label={active?'הסר מאוסף הקריסטלים':'שמור באוסף הקריסטלים'} title={active?'נשמר באוסף הקריסטלים':'שמור קריסטל'} onClick={()=>toggle(record)}><span aria-hidden="true">◆</span><small>{active?'נשמר':'שמור'}</small></button>;
}

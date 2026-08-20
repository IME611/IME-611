export type NavigationItem={id:string;label:string;question?:string;icon:string;ownerOnly?:boolean};
export type NavigationGroup={id:string;label:string;items:NavigationItem[]};

export const primaryNavigation:NavigationItem[]=[
 {id:'dashboard',label:'דף הבית',icon:'⌂'},
 {id:'library',label:'ההתקדמות שלי במסע',icon:'◎'},
];

export const mentalModelNavigation:NavigationGroup[]=[
 {id:'personal',label:'המרחב האישי',items:[
  {id:'crystals',label:'הקריסטלים שלי',icon:'◆'},
  {id:'add-learning',label:'הוסף משהו שלמדת',icon:'✎'},
 ]},
 {id:'content',label:'תוכן',items:[
  {id:'sources',label:'המקורות שלי',icon:'↗'},
  {id:'add-source',label:'הוסף מקור',icon:'＋'},
  {id:'research',label:'חקירה',icon:'⌕'},
 ]},
 {id:'system',label:'מערכת',items:[
  {id:'settings',label:'הגדרות',icon:'⚙'},
 ]},
];

export const allNavigationItems=[...primaryNavigation,...mentalModelNavigation.flatMap(g=>g.items)];
export const pageByNavigationId=(id:string)=>allNavigationItems.find(item=>item.id===id)??primaryNavigation[0];

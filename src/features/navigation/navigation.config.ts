export type NavigationItem={id:string;label:string;question?:string;icon:string;ownerOnly?:boolean};
export type NavigationGroup={id:string;label:string;items:NavigationItem[]};

export const primaryNavigation:NavigationItem[]=[
 {id:'dashboard',label:'היום',question:'איפה אני עכשיו?',icon:'⌂'},
 {id:'library',label:'המסע',question:'איפה אני במסע?',icon:'◌'},
];

export const mentalModelNavigation:NavigationGroup[]=[
 {id:'model',label:'המודל שלי',items:[
  {id:'sources',label:'מה משפיע עליי?',question:'מקורות · סביבה · קלט',icon:'↗'},
  {id:'insights',label:'מה אני מבין?',question:'טענות · ראיות · תובנות',icon:'✧'},
  {id:'transformation',label:'מה אני בודק בחיים?',question:'ניסוי · תצפית · שינוי',icon:'✓'},
 ]},
 {id:'deeper',label:'כלים עמוקים',items:[
  {id:'atlas',label:'מפת הקשרים',icon:'◉',ownerOnly:true},
  {id:'mentor',label:'המנטור',icon:'✦',ownerOnly:true},
  {id:'research',label:'חקירה',icon:'⌕',ownerOnly:true},
 ]},
 {id:'system',label:'מערכת',items:[
  {id:'activity',label:'פעילות',icon:'◷',ownerOnly:true},
  {id:'settings',label:'הגדרות',icon:'⚙',ownerOnly:true},
 ]},
];

export const allNavigationItems=[...primaryNavigation,...mentalModelNavigation.flatMap(group=>group.items)];
export const pageByNavigationId=(id:string)=>allNavigationItems.find(item=>item.id===id)??primaryNavigation[0];

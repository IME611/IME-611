export type NavigationItem={id:string;label:string;question?:string;icon:string;ownerOnly?:boolean};
export type NavigationGroup={id:string;label:string;items:NavigationItem[]};

export const primaryNavigation:NavigationItem[]=[
 {id:'dashboard',label:'ספריית התוכן',question:'מפת הידע החיה',icon:'⌂'},
];

export const mentalModelNavigation:NavigationGroup[]=[
 {id:'model',label:'כלי עבודה',items:[
  {id:'sources',label:'מקורות',question:'חומר הגלם והמקור המלא',icon:'↗',ownerOnly:true},
  {id:'insights',label:'תובנות',question:'טענות · ראיות · תובנות',icon:'✧',ownerOnly:true},
  {id:'transformation',label:'בדיקה בחיים',question:'ניסוי · תצפית · שינוי',icon:'✓',ownerOnly:true},
  {id:'media',label:'מפות והמחשות',question:'קשרים · תדרים · המחשות',icon:'◫',ownerOnly:true},
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

export type NavigationItem={id:string;label:string;question?:string;icon:string;ownerOnly?:boolean};
export type NavigationGroup={id:string;label:string;items:NavigationItem[]};

export const primaryNavigation:NavigationItem[]=[
 {id:'dashboard',label:'דף הבית',icon:'⌂'},
 {id:'library',label:'מסע הלמידה',icon:'◎'},
];

export const mentalModelNavigation:NavigationGroup[]=[
 {id:'content',label:'תוכן',items:[
  {id:'add-content',label:'הוסף תוכן',icon:'＋',ownerOnly:true},
  {id:'sources',label:'מקורות',icon:'↗',ownerOnly:true},
  {id:'research',label:'חקירה',icon:'⌕',ownerOnly:true},
 ]},
 {id:'tools',label:'כלים',items:[
  {id:'transformation',label:'בדיקה בחיים',icon:'✓',ownerOnly:true},
  {id:'media',label:'מפות והמחשות',icon:'◫',ownerOnly:true},
 ]},
 {id:'system',label:'מערכת',items:[
  {id:'settings',label:'הגדרות',icon:'⚙',ownerOnly:true},
 ]},
];

export const allNavigationItems=[...primaryNavigation,...mentalModelNavigation.flatMap(g=>g.items)];
export const pageByNavigationId=(id:string)=>allNavigationItems.find(item=>item.id===id)??primaryNavigation[0];

export type NavigationItem={id:string;label:string;question?:string;icon:string;ownerOnly?:boolean};
export type NavigationGroup={id:string;label:string;items:NavigationItem[]};

export const primaryNavigation:NavigationItem[]=[
 {id:'dashboard',label:'דף הבית',question:'סיכום המסע שלך',icon:'⌂'},
 {id:'library',label:'מסע הלמידה',question:'18 פרקים · 5 שכבות',icon:'◎'},
];

export const mentalModelNavigation:NavigationGroup[]=[
 {id:'tools',label:'כלי עבודה',items:[
  {id:'sources',label:'מקורות',question:'חומר גלם ומקורות',icon:'↗',ownerOnly:true},
  {id:'transformation',label:'בדיקה בחיים',question:'ניסוי · תצפית · שינוי',icon:'✓',ownerOnly:true},
  {id:'media',label:'מפות והמחשות',question:'קשרים · תדרים · המחשות',icon:'◫',ownerOnly:true},
  {id:'research',label:'חקירה',icon:'⌕',ownerOnly:true},
 ]},
 {id:'system',label:'מערכת',items:[
  {id:'settings',label:'הגדרות',icon:'⚙',ownerOnly:true},
 ]},
];

export const allNavigationItems=[...primaryNavigation,...mentalModelNavigation.flatMap(group=>group.items)];
export const pageByNavigationId=(id:string)=>allNavigationItems.find(item=>item.id===id)??primaryNavigation[0];

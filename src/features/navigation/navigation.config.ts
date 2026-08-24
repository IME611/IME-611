export type NavigationItem={id:string;label:string;question?:string;icon:string;ownerOnly?:boolean};
export type NavigationGroup={id:string;label:string;items:NavigationItem[]};

export const primaryNavigation:NavigationItem[]=[
 {id:'dashboard',label:'דף הבית',icon:'⌂'},
 {id:'library',label:'ההתקדמות שלי במסע',icon:'◎'},
];

export const mentalModelNavigation:NavigationGroup[]=[
 {id:'personal',label:'המרחב האישי',items:[
  {id:'add-learning',label:'הוסף משהו שלמדת',icon:'✎',ownerOnly:true},
 ]},
 {id:'content',label:'תוכן',items:[
  {id:'sources',label:'המקורות שלי',icon:'↗'},
  {id:'add-source',label:'הוסף מקור',icon:'＋',ownerOnly:true},
  {id:'review',label:'בקרת תוכן ופרסום',icon:'✓',ownerOnly:true},
 ]},
 {id:'system',label:'מערכת',items:[
  {id:'settings',label:'הגדרות',icon:'⚙'},
 ]},
];

export const allNavigationItems=[...primaryNavigation,...mentalModelNavigation.flatMap(g=>g.items)];
export const pageByNavigationId=(id:string)=>allNavigationItems.find(item=>item.id===id)??primaryNavigation[0];
export const isOwnerOnlyNavigation=(id:string)=>allNavigationItems.some(item=>item.id===id&&item.ownerOnly===true);
export const navigationForMode=(owner:boolean)=>({
 primary:primaryNavigation.filter(item=>owner||!item.ownerOnly),
 groups:mentalModelNavigation.map(group=>({...group,items:group.items.filter(item=>owner||!item.ownerOnly)})).filter(group=>group.items.length>0),
});

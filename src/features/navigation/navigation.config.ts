export type NavigationItem={id:string;label:string;question?:string;icon:string;ownerOnly?:boolean};
export type NavigationGroup={id:string;label:string;items:NavigationItem[]};

export const primaryNavigation:NavigationItem[]=[
 {id:'dashboard',label:'דף הבית',question:'חזרה לנקודת הפתיחה',icon:'⌂'},
];

export const mentalModelNavigation:NavigationGroup[]=[
 {id:'journey',label:'המסע שלי',items:[
  {id:'library',label:'ההתקדמות שלי במסע',question:'איפה אני נמצא ומה הלאה',icon:'◫'},
 ]},
 {id:'saved',label:'הספרייה שלי',items:[
  {id:'liked-cards',label:'הכרטיסיות שאהבתי',question:'כל מה שסימנתי ושמרתי',icon:'♡'},
 ]},
 {id:'tools',label:'הכלים שלי',items:[
  {id:'practical-tools',label:'כלים פרקטיים',question:'צ׳קליסטים, טבלאות וכלים ליישום',icon:'⌘'},
  {id:'exercises',label:'התרגולים שלי',question:'משימות ותרגילים לפי פרק',icon:'◎'},
 ]},
 {id:'connections',label:'הרחבה וקשרים',items:[
  {id:'connection-map',label:'מפת החיבורים',question:'איך הרעיונות מתחברים',icon:'⌁'},
  {id:'notes',label:'הערות ותובנות',question:'המחשבות שלי לאורך הדרך',icon:'✎'},
 ]},
 {id:'system',label:'פרטי ומערכת',items:[
  {id:'settings',label:'הגדרות',question:'התאמה אישית של המערכת',icon:'⚙'},
  {id:'add-source',label:'הוסף מקור',question:'קליטת חומר חדש',icon:'＋',ownerOnly:true},
  {id:'review',label:'בקרת תוכן ופרסום',question:'בדיקה לפני פרסום',icon:'✓',ownerOnly:true},
  {id:'sources',label:'המקורות שלי',question:'לשימוש אישי בלבד',icon:'↗',ownerOnly:true},
 ]},
];

export const allNavigationItems=[...primaryNavigation,...mentalModelNavigation.flatMap(g=>g.items)];
const navigationIds=new Set(allNavigationItems.map(item=>item.id));
export const isKnownNavigation=(id:string)=>navigationIds.has(id);
export const isOwnerOnlyNavigation=(id:string)=>allNavigationItems.some(item=>item.id===id&&item.ownerOnly===true);
export const navigationForMode=(owner:boolean)=>({
 primary:primaryNavigation.filter(item=>owner||!item.ownerOnly),
 groups:mentalModelNavigation.map(group=>({...group,items:group.items.filter(item=>owner||!item.ownerOnly)})).filter(group=>group.items.length>0),
});

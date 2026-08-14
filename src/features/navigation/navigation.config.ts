export type NavigationItem={id:string;label:string;question?:string;icon:string;ownerOnly?:boolean};
export type NavigationGroup={id:string;label:string;items:NavigationItem[]};

export const primaryNavigation:NavigationItem[]=[
 {id:'home',label:'ראשי',question:'מהו E.I.L?',icon:'⌂'},
 {id:'journey',label:'מסע הלמידה',question:'המסלול הספירלי · 18 שכבות',icon:'◌'},
 {id:'content-library',label:'ספריית התוכן',question:'חקירה חופשית לפי נושא',icon:'▦'},
 {id:'crystals',label:'הקריסטלים שלי',question:'מה בחרתי לקחת איתי?',icon:'◆'},
 {id:'my-space',label:'המרחב שלי',question:'איפה אני ומה הצעד הבא?',icon:'◎'},
];

export const mentalModelNavigation:NavigationGroup[]=[
 {id:'knowledge',label:'ידע ומקורות',items:[
  {id:'sources',label:'מקורות',question:'מאיפה הידע מגיע?',icon:'↗'},
  {id:'insights',label:'תובנות',question:'טענות · ראיות · קשרים',icon:'✧',ownerOnly:true},
 ]},
 {id:'deeper',label:'כלים עמוקים',items:[
  {id:'transformation',label:'ניסויים ושינוי',icon:'✓',ownerOnly:true},
  {id:'atlas',label:'מפת הקשרים',icon:'◉',ownerOnly:true},
  {id:'mentor',label:'המנטור',icon:'✦',ownerOnly:true},
  {id:'research',label:'חקירה',icon:'⌕',ownerOnly:true},
 ]},
 {id:'system',label:'מערכת',items:[
  {id:'about',label:'אודות E.I.L',icon:'i'},
  {id:'activity',label:'פעילות',icon:'◷',ownerOnly:true},
  {id:'settings',label:'הגדרות',icon:'⚙',ownerOnly:true},
 ]},
];

export const allNavigationItems=[...primaryNavigation,...mentalModelNavigation.flatMap(group=>group.items)];
export const pageByNavigationId=(id:string)=>allNavigationItems.find(item=>item.id===id)??primaryNavigation[0];

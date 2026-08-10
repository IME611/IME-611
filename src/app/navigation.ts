import type{Page}from'../core/types';

export const navigationGroups=[
  {title:'KNOWLEDGE',items:[['library','מסע הידע','▦'],['inbox','קליטה','↓'],['atlas','מפת הקשרים','◉'],['topics','נושאים','◇'],['sources','מקורות','↗']]},
  {title:'SYNTHESIS',items:[['mentor','המנטור','✦'],['research','חקירה','⌕'],['insights','תובנות','✧']]},
  {title:'EVOLUTION',items:[['journey','המסע שלי','↗'],['journal','התבוננות','✎'],['notes','הערות','≡'],['tasks','פעולות','✓']]},
  {title:'SYSTEM',items:[['activity','פעילות','◷'],['settings','הגדרות','⚙']]},
] as const;

export const pages:Page[]=[
  {id:'dashboard',label:'היום',icon:'⌂'},
  ...navigationGroups.flatMap(group=>group.items.map(([id,label,icon])=>({id,label,icon}))),
];

export const evolutionPages=['mentor','insights','journey','journal','tasks'] as const;

export const unlockPolicy={
  connections:4,
  insights:7,
  reflection:10,
  action:13,
  mentor:15,
} as const;

export function pageById(id:string){return pages.find(page=>page.id===id)||pages[0]}

import type{Page}from'../core/types';

export const navigationGroups=[
  {title:'THE JOURNEY',items:[['library','מסע הידע','◌']]},
  {title:'MY MODEL',items:[['sources','מה משפיע עליי?','↗'],['insights','מה אני מבין?','✧'],['transformation','מה אני בודק בחיים?','✓']]},
  {title:'DEEPER',items:[['atlas','מפת הקשרים','◉'],['mentor','המנטור','✦'],['research','חקירה','⌕']]},
  {title:'SYSTEM',items:[['activity','פעילות','◷'],['settings','הגדרות','⚙']]},
] as const;

export const pages:Page[]=[
  {id:'dashboard',label:'היום',icon:'⌂'},
  ...navigationGroups.flatMap(group=>group.items.map(([id,label,icon])=>({id,label,icon}))),
];

export const evolutionPages=['mentor','insights'] as const;

export const unlockPolicy={connections:4,insights:7,reflection:10,action:13,mentor:15}as const;

export function pageById(id:string){return pages.find(page=>page.id===id)||pages[0]}

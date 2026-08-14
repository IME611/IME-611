export type LibraryTopic={slug:string;title:string;summary:string};
export type LibraryWorld={slug:string;title:string;eyebrow:string;description:string;topics:LibraryTopic[]};

export const libraryWorlds:LibraryWorld[]=[
 {
  slug:'human-within',
  title:'האדם מבפנים',
  eyebrow:'THE HUMAN WITHIN',
  description:'תודעה, זהות, רגשות, אמונות והמנגנונים הפנימיים שמעצבים את הדרך שבה אנחנו חווים את עצמנו.',
  topics:[
   {slug:'consciousness',title:'תודעה ומודעות',summary:'איך תשומת לב, מודעות וחוויה פנימית מעצבות את מה שאנחנו רואים.'},
   {slug:'identity-self',title:'זהות ועצמי',summary:'הסיפורים, התפקידים והמבנים שמהם נוצרת תחושת העצמי.'},
   {slug:'emotions-beliefs',title:'רגשות ואמונות',summary:'הקשרים בין פרשנות, אמונה, רגש ותגובה.'},
   {slug:'inner-mechanisms',title:'מנגנונים פנימיים',summary:'דפוסים אוטומטיים, הגנות והרגלי חשיבה.'},
  ],
 },
 {
  slug:'body-as-system',
  title:'הגוף כמערכת',
  eyebrow:'THE BODY AS SYSTEM',
  description:'מערכות הגוף, המוח, מערכת העצבים, שינה, נשימה, תנועה ואנרגיה — כחלק ממערכת אחת מחוברת.',
  topics:[
   {slug:'nervous-system',title:'מערכת העצבים',summary:'מבנה, הפעלה, ויסות והקשר בין מערכת העצבים לחוויה ולהתנהגות.'},
   {slug:'brain-cognition',title:'מוח וקוגניציה',summary:'קשב, זיכרון, תפיסה, למידה וקבלת החלטות.'},
   {slug:'hormones-chemistry',title:'הורמונים וכימיה',summary:'אותות כימיים והקשרים בין גוף, מצב פנימי והתנהגות.'},
   {slug:'movement-recovery',title:'תנועה והתאוששות',summary:'תנועה, עומס, מנוחה, שינה והתאוששות כמערכת.'},
   {slug:'breathing-energy',title:'נשימה ואנרגיה',summary:'נשימה, עוררות והקשר בין קצב פיזיולוגי למצב פנימי.'},
  ],
 },
 {
  slug:'human-and-world',
  title:'האדם והעולם',
  eyebrow:'THE HUMAN AND THE WORLD',
  description:'יחסים, תקשורת, השפעה חברתית, תרבות, סביבה וטכנולוגיה — המרחב שבין האדם למה שסביבו.',
  topics:[
   {slug:'communication-presence',title:'תקשורת ונוכחות',summary:'איך אנחנו מביאים את עצמנו למפגש עם אחרים.'},
   {slug:'relationships-attachment',title:'יחסים והיקשרות',summary:'קשר, ביטחון, גבולות ודפוסים בין־אישיים.'},
   {slug:'social-influence',title:'השפעה חברתית',summary:'נורמות, לחץ חברתי, חיקוי והשפעות קבוצתיות.'},
   {slug:'culture-environment',title:'תרבות וסביבה',summary:'איך הקשר, מקום ותרבות מעצבים תפיסה והתנהגות.'},
  ],
 },
 {
  slug:'change-growth',
  title:'שינוי והתפתחות',
  eyebrow:'CHANGE & GROWTH',
  description:'הרגלים, למידה, חוסן, יצירתיות ושינוי התנהגותי — איך ידע הופך לתנועה ממשית בחיים.',
  topics:[
   {slug:'habits',title:'הרגלים ושינוי התנהגות',summary:'איך דפוסים נוצרים, נשמרים ומשתנים.'},
   {slug:'learning-mastery',title:'למידה ומיומנות',summary:'תרגול, חזרה, משוב ובניית יכולת לאורך זמן.'},
   {slug:'resilience',title:'חוסן והסתגלות',summary:'התמודדות, התאוששות וגמישות מול שינוי.'},
   {slug:'creativity',title:'יצירתיות ופתרון בעיות',summary:'חיבורים חדשים, ניסוי והרחבת מרחב האפשרויות.'},
  ],
 },
 {
  slug:'meaning-purpose',
  title:'משמעות ותכלית',
  eyebrow:'MEANING & PURPOSE',
  description:'ערכים, בחירה, שאלות קיומיות, פילוסופיה ורוח — החיפוש אחר כיוון ומשמעות בתוך החיים.',
  topics:[
   {slug:'values-priorities',title:'ערכים וסדרי עדיפויות',summary:'מה חשוב לנו ואיך זה מתורגם לבחירות.'},
   {slug:'existential-questions',title:'שאלות קיומיות',summary:'זהות, חופש, אחריות, משמעות וסופיות.'},
   {slug:'philosophy-frameworks',title:'פילוסופיה ומסגרות חשיבה',summary:'רעיונות שעוזרים לראות את החיים מזוויות שונות.'},
   {slug:'spirituality',title:'רוח והתעלות',summary:'חוויה, התבוננות ומסורות שעוסקות במה שמעבר לעצמי היומיומי.'},
  ],
 },
];

export const findWorld=(slug?:string)=>libraryWorlds.find(world=>world.slug===slug)??null;
export const findTopic=(world:LibraryWorld|null,slug?:string)=>world?.topics.find(topic=>topic.slug===slug)??null;

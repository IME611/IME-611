type ExhibitKind='CHAKRA_REFLECTION'|'AURA_FIELD';

type Exhibit={
  kind:ExhibitKind;
  title:string;
  caption:string;
  note:string;
};

const EXHIBITS:Record<string,Exhibit>={
  'C9-02':{
    kind:'CHAKRA_REFLECTION',
    title:'מפת הצ׳אקרות כמסגרת התבוננות',
    caption:'המחשה קצרה של שבע הצ׳אקרות באמצעות משפטי זהות ופעולה: I am · I feel · I do · I love · I speak · I see · I know.',
    note:'המיפוי מוצג כמסגרת מסורתית־פרשנית להתבוננות אישית — לא כמודל אנטומי או רפואי.',
  },
  'C9-03':{
    kind:'AURA_FIELD',
    title:'המחשה של מושג ההילה סביב הגוף',
    caption:'המחשה של השפה שבה מסגרות רוחניות מתארות שכבות הילה וצ׳אקרות סביב הגוף.',
    note:'האיור נועד לעזור להבין את המודל. הוא אינו מוצג כהוכחה רפואית, ככלי אבחון או כמדידה מדעית של מצב בריאותי.',
  },
};

const CHAKRAS=[
  {name:'כתר',phrase:'I know'},
  {name:'עין שלישית',phrase:'I see'},
  {name:'גרון',phrase:'I speak'},
  {name:'לב',phrase:'I love'},
  {name:'מקלעת השמש',phrase:'I do'},
  {name:'סקרל',phrase:'I feel'},
  {name:'שורש',phrase:'I am'},
] as const;

function ChakraReflection(){
  return <section className="sourceExhibitContent" aria-labelledby="chakra-exhibit-title">
    <h3 id="chakra-exhibit-title">שבע הצ׳אקרות</h3>
    <ul>{CHAKRAS.map(chakra=><li key={chakra.name}><strong>צ׳אקרת {chakra.name}</strong> — <span lang="en">{chakra.phrase}</span></li>)}</ul>
  </section>;
}

function AuraField(){
  return <section className="sourceExhibitContent" aria-labelledby="aura-exhibit-title">
    <h3 id="aura-exhibit-title">איך לקרוא את ההמחשה?</h3>
    <p>האיור מתאר דמות אדם, שבע נקודות צ׳אקרה ושכבות הילה סביבה.</p>
    <ul>
      <li>האיור מסייע להבין את המודל המתואר.</li>
      <li>הוא אינו מאמת קשר רפואי בין צבע, תדר ומצב בריאותי.</li>
      <li>כאשר קיימים מיפויים שונים, הם מוצגים כמסגרות חלופיות ולא כעובדה אחת.</li>
    </ul>
  </section>;
}

export function CardSourceExhibit({cardId}:{cardId:string}){
  const exhibit=EXHIBITS[cardId];
  if(!exhibit)return null;
  return <figure className="sourceExhibit" aria-labelledby={`source-exhibit-${cardId}`}>
    <header className="sourceExhibitHead"><strong id={`source-exhibit-${cardId}`}>{exhibit.title}</strong></header>
    {exhibit.kind==='CHAKRA_REFLECTION'?<ChakraReflection/>:<AuraField/>}
    <figcaption className="sourceExhibitCaption"><p>{exhibit.caption}</p><small>{exhibit.note}</small></figcaption>
  </figure>;
}
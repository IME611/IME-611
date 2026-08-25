import'../../design/features/source-exhibits.css';

type ExhibitKind='CHAKRA_REFLECTION'|'AURA_FIELD';

type Exhibit={
  kind:ExhibitKind;
  title:string;
  source:string;
  caption:string;
  note:string;
};

const EXHIBITS:Record<string,Exhibit>={
  'C9-02':{
    kind:'CHAKRA_REFLECTION',
    title:'מפת הצ׳אקרות כמסגרת התבוננות',
    source:'עיבוד חזותי מתוך תמונה שהעלה היוצר · אוגוסט 2026',
    caption:'המקור החזותי מוסיף דרך קצרה לזכור את שבע הצ׳אקרות באמצעות משפטי זהות ופעולה: I am · I feel · I do · I love · I speak · I see · I know.',
    note:'המיפוי מוצג כמסגרת מסורתית־פרשנית להתבוננות אישית — לא כמודל אנטומי או רפואי.',
  },
  'C9-03':{
    kind:'AURA_FIELD',
    title:'המחשה חזותית של הילה סביב הגוף',
    source:'AuraFlow · עיבוד חזותי מתוך תמונה שהעלה היוצר · אוגוסט 2026',
    caption:'האיור ממחיש את השפה שבה מקורות רוחניים מתארים שכבות הילה וצ׳אקרות סביב הגוף, ומסייע להבין את המסגרת שעליה מדבר הטקסט.',
    note:'זהו מוצג תומך להבנת הטענה והמסורת. הוא אינו מוצג כהוכחה רפואית, ככלי אבחון או כמדידה מדעית של מצב בריאותי. ערכי תדר מספריים שהופיעו במקור החזותי נשמרים כמודל מקור חלופי ואינם מחליפים את הידע הקיים.',
  },
};

const CHAKRAS=[
  {name:'כתר',phrase:'I know',color:'#7B3F98'},
  {name:'עין שלישית',phrase:'I see',color:'#4F57A7'},
  {name:'גרון',phrase:'I speak',color:'#3E88B8'},
  {name:'לב',phrase:'I love',color:'#5B9B62'},
  {name:'מקלעת השמש',phrase:'I do',color:'#D5B43A'},
  {name:'סקרל',phrase:'I feel',color:'#E8802D'},
  {name:'שורש',phrase:'I am',color:'#C52B30'},
] as const;

function ChakraReflection(){
  return <div className="sourceExhibitFrame chakraExhibit" role="img" aria-label="מפת שבע הצ׳אקרות: כתר I know, עין שלישית I see, גרון I speak, לב I love, מקלעת השמש I do, סקרל I feel, שורש I am">
    <div className="chakraBody" aria-hidden="true">
      <span className="chakraSpine"/>
      <span className="chakraFigure"/>
      <div className="chakraDots">{CHAKRAS.map(chakra=><i key={chakra.name} className="chakraDot" style={{background:chakra.color}}/>)}</div>
    </div>
    <div className="chakraRows">{CHAKRAS.map(chakra=><div className="chakraRow" key={chakra.name}>
      <i className="chakraRowDot" style={{background:chakra.color}} aria-hidden="true"/>
      <strong>צ׳אקרת {chakra.name}</strong>
      <em>{chakra.phrase}</em>
    </div>)}</div>
  </div>;
}

function AuraField(){
  return <div className="sourceExhibitFrame auraExhibit">
    <div className="auraField" role="img" aria-label="המחשה מסורתית של דמות אדם, שבע נקודות צ׳אקרה ושכבות צבעוניות של הילה">
      <span className="auraRing r6" aria-hidden="true"/><span className="auraRing r5" aria-hidden="true"/><span className="auraRing r4" aria-hidden="true"/><span className="auraRing r3" aria-hidden="true"/><span className="auraRing r2" aria-hidden="true"/><span className="auraRing r1" aria-hidden="true"/>
      <span className="auraPerson" aria-hidden="true"/>
      <div className="auraChakras" aria-hidden="true">{CHAKRAS.map(chakra=><i key={chakra.name} className="chakraDot" style={{background:chakra.color}}/>)}</div>
    </div>
    <div className="auraCopy">
      <strong>איך לקרוא את המוצג?</strong>
      <p>השכבות הצבעוניות הן המחשה של מושג ה״הילה״ במסגרות רוחניות. נקודות הצבע לאורך הגוף מייצגות את שבע הצ׳אקרות העיקריות.</p>
      <ul><li>האיור מסייע להבין את המודל שהמקור מתאר.</li><li>הוא אינו מאמת קשר רפואי בין צבע, תדר ומצב בריאותי.</li><li>כאשר מקורות מציעים ערכי תדר שונים — E.I.L שומר אותם כמודלים חלופיים במקום למזג אותם לעובדה אחת.</li></ul>
    </div>
  </div>;
}

export function CardSourceExhibit({cardId}:{cardId:string}){
  const exhibit=EXHIBITS[cardId];
  if(!exhibit)return null;
  return <figure className="sourceExhibit" aria-label={`מוצג מקור: ${exhibit.title}`}>
    <div className="sourceExhibitHead"><span className="sourceExhibitBadge">✦ מוצג תומך</span><span className="sourceExhibitSource">{exhibit.source}</span></div>
    {exhibit.kind==='CHAKRA_REFLECTION'?<ChakraReflection/>:<AuraField/>}
    <figcaption className="sourceExhibitCaption"><strong>{exhibit.title}</strong><span>{exhibit.caption}</span><small className="sourceExhibitNote">{exhibit.note}</small></figcaption>
  </figure>;
}

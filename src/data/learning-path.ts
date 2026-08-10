export type LearningStage='SEE'|'EXPERIENCE'|'UNDERSTAND'|'CONNECT'|'APPLY'|'REFLECT';
export type JourneyChapter={number:number;world:string;stage:LearningStage;unlockAfter:number|null;goal:string;accent:string};

// The owner can browse everything. Future learner accounts follow unlockAfter sequentially.
export const learningPath:JourneyChapter[]=[
{number:1,world:'SELF',stage:'SEE',unlockAfter:null,goal:'ליצור נקודת מוצא: מי אני ומה מרכיב את החוויה שלי?',accent:'זהות'},
{number:2,world:'BODY',stage:'EXPERIENCE',unlockAfter:1,goal:'להכיר את הגוף ככלי שדרכו אנחנו פוגשים את העולם.',accent:'גוף'},
{number:3,world:'BODY',stage:'UNDERSTAND',unlockAfter:2,goal:'להבין ויסות, איזון והמערכות שפועלות מתחת לפני השטח.',accent:'ויסות'},
{number:4,world:'MIND',stage:'SEE',unlockAfter:3,goal:'לבנות תמונה ראשונה של המוח כמערכת לומדת וחוזה.',accent:'מוח'},
{number:5,world:'MIND',stage:'UNDERSTAND',unlockAfter:4,goal:'להעמיק בזיכרון, למידה, קשב והרגלים.',accent:'למידה'},
{number:6,world:'MIND',stage:'CONNECT',unlockAfter:5,goal:'לחבר בין פעילות מוחית, תפיסה והחוויה המודעת.',accent:'תודעה'},
{number:7,world:'SYSTEMS',stage:'EXPERIENCE',unlockAfter:6,goal:'לבחון אנרגיה כשפה לתנועה, חיוניות ומצב.',accent:'אנרגיה'},
{number:8,world:'SYSTEMS',stage:'SEE',unlockAfter:7,goal:'לחוות כיצד צליל, קצב ותדר משפיעים על החוויה.',accent:'צליל'},
{number:9,world:'BODY',stage:'CONNECT',unlockAfter:8,goal:'לחזור אל הגוף ברמה גבוהה יותר ולראות מערכת של מערכות.',accent:'מערכת'},
{number:10,world:'MIND',stage:'CONNECT',unlockAfter:9,goal:'לחזור למוח ולתודעה ולחבר בין מנגנון לחוויה.',accent:'אינטגרציה'},
{number:11,world:'SELF',stage:'UNDERSTAND',unlockAfter:10,goal:'לראות כיצד אמונות וזהויות מארגנות מידע ומכוונות פעולה.',accent:'אמונות'},
{number:12,world:'SELF',stage:'EXPERIENCE',unlockAfter:11,goal:'להבין רגשות כאותות, פרשנות ומערכות פעולה.',accent:'רגש'},
{number:13,world:'SYSTEMS',stage:'CONNECT',unlockAfter:12,goal:'לחבר אדם, סביבה, תרבות והשפעות הדדיות.',accent:'קשרים'},
{number:14,world:'MEANING',stage:'REFLECT',unlockAfter:13,goal:'לבחון עקרונות ומודלים רחבים כעדשות לחשיבה.',accent:'עקרונות'},
{number:15,world:'MEANING',stage:'APPLY',unlockAfter:14,goal:'לתרגם הבנה לכיוון ולעתיד רצוי.',accent:'חזון'},
{number:16,world:'MEANING',stage:'APPLY',unlockAfter:15,goal:'להעביר ידע מהבנה להתנהגות, ניסוי ושיפור.',accent:'מימוש'},
{number:17,world:'MEANING',stage:'REFLECT',unlockAfter:16,goal:'לחבר ערכים, בחירה וכיוון למשמעות אישית.',accent:'משמעות'},
{number:18,world:'SELF',stage:'REFLECT',unlockAfter:17,goal:'לחזור לשאלה מי אני ולענות עליה מתוך כל שכבות המסע.',accent:'סינתזה'}
];

export const stageLabels:Record<LearningStage,string>={SEE:'לראות',EXPERIENCE:'לחוות',UNDERSTAND:'להבין',CONNECT:'לחבר',APPLY:'ליישם',REFLECT:'להתבונן'};
export const worldLabels:Record<string,string>={SELF:'אני',BODY:'הגוף',MIND:'המוח והתודעה',SYSTEMS:'מערכות והשפעות',MEANING:'משמעות ומימוש'};

import type { LearningPath } from '../../core/learning-path/learning-path.types';
import { assertValidLearningPath } from '../../core/learning-path/learning-path.validation';
import { chapters } from '../chapters';

const questions = [
  'מי אני, איפה אני ולמה אני כאן?',
  'באיזו סביבה פיזית ומערכתית הקיום שלי מתרחש?',
  'מה מלמדת המורכבות של הגוף והעולם על המערכת שאני חוקר?',
  'איך המוח מתווך בין גוף, תפיסה, זיכרון והתנהגות?',
  'איך קשב, אוטומציה וניסיון חוזר נעשים דפוס פעולה?',
  'כיצד מצבי מוח משתנים קשורים לחוויה ולתפקוד?',
  'מה ידוע, מה משוער ומה שנוי במחלוקת סביב האצטרובל וחוויות אנרגטיות?',
  'איך צליל ומוזיקה משפיעים על גוף, מוח וחוויה?',
  'איך להבחין בין חוויה סובייקטיבית, מודל מסביר וטענה אמפירית לגבי הגוף?',
  'באילו מנגנונים האדם מסוגל להשתנות לאורך זמן?',
  'כיצד זהות ואמונות מעצבות תפיסה, בחירה והתנהגות?',
  'מה רגשות מאותתים, ומה אפשר ללמוד מהם בלי להפוך אותם לעובדות?',
  'איפה עובר הגבול בין ממצאים מדעיים, פרשנות והשערות על יצירת מציאות?',
  'אילו עקרונות חוזרים בין מסורות שונות, ומה מעמדם כטענות?',
  'איך הופכים הבנה לכיוון, יעד והתנהגות שאפשר לבדוק?',
  'איך קושי וסבל משנים את שאלת המשמעות ואת הבחירות שלי?',
  'איזה מודל משולב נשאר כשמחברים גוף, נפש, תודעה ומשמעות?',
  'איזו תשובה זמנית ומבוססת אני יכול לתת עכשיו לשאלה מי אני?',
];

const conceptSets = [
  ['self','existence','observation'],['environment','systems','interdependence'],['complexity','body','emergence'],
  ['brain','neuron','synapse'],['attention','automatic-processes','patterns'],['brain-states','attention','sleep'],
  ['pineal','circadian-rhythm','subjective-experience'],['sound','music','nervous-system'],['embodiment','subjective-experience','evidence'],
  ['neuroplasticity','learning','habit'],['identity','belief','prediction'],['emotion','signal','regulation'],
  ['observation','causality','hypothesis'],['principles','tradition','evidence'],['goals','vision','experiment'],
  ['suffering','meaning','resilience'],['integration','body','mind','meaning'],['self-model','synthesis','uncertainty'],
];

const proposedStageTitles=[
  'התבוננות — שאלת המסע',
  'הסביבה — המערכת שמחוץ לנו',
  'הגוף כמערכת מורכבת',
  'המוח — מבנה, תקשורת ובקרה',
  'מערכת ההפעלה — מודע, אוטומטי ודפוסים',
  'מצבי מוח — קשב, שינה ולמידה',
] as const;

const proposedStageSourceFiles=[
  'מי_אני_פרק1_v6.docx',
  'פרק2_הכלי_החיצוני.docx',
  'פרק3_הפלא_ההנדסי.docx',
  'פרק5_המוח_המפורט.docx',
  'פרק4_מערכת_ההפעלה.docx',
  'פרק6_גלי_המוח.docx',
] as const;

const path: LearningPath = {
  id: 'life-research',
  version: 1,
  title: 'מחקר החיים — מסע ראשוני',
  purpose: 'להוביל מהשאלות הקיומיות הראשונות אל מודל עצמי זמני, מבוסס מקורות, שניתן לבדוק ולעדכן בחיים.',
  entryQuestion: 'מי אני? מה אני? למה אני כאן — ומה אפשר באמת לדעת?',
  stages: chapters.map((chapter, index) => ({
    id: `life-research-v1-stage-${String(index + 1).padStart(2,'0')}`,
    order: index + 1,
    title: proposedStageTitles[index]??chapter.title,
    subtitle: chapter.subtitle,
    guidingQuestion: questions[index],
    sourceRefs: [proposedStageSourceFiles[index]??chapter.sourceFile],
    requiredConceptRefs: index === 0 ? [] : conceptSets[Math.max(0,index - 1)].slice(0,2),
    introducedConceptRefs: conceptSets[index],
    objectives: [{
      id: `objective-${index + 1}-distinguish`,
      statement: 'להבחין בין מה שהמקור טוען, הראיות שהוא מציג, הפרשנות שלנו ומה שעדיין נשאר השערה.',
      evidenceOfUnderstanding: 'הלומד מסוגל לנסח לפחות Claim אחד ולפתוח את ה-Evidence המקורי שתומך בו או מערער עליו.',
    }],
    revisits: index >= 3 ? [`life-research-v1-stage-${String(Math.max(1,index - 2)).padStart(2,'0')}`] : [],
    unlock: {
      prerequisiteStageIds: index === 0 ? [] : [`life-research-v1-stage-${String(index).padStart(2,'0')}`],
      mode: 'ALL' as const,
    },
  })),
};

export const lifeResearchV1 = assertValidLearningPath(path);

# E.I.L — Content Library Architecture v2

**Status:** Implementation candidate

## Core rule

The learner hierarchy has exactly three navigational levels:

```text
DOMAIN
└── TOPIC
    └── SUBTOPIC
```

Graph relationships are not hierarchy. `RELATED`, co-occurrence, shared source context, and learning dependencies remain separate relationship types.

## Canonical topics

The seed corpus is represented by 18 canonical learner topics, grouped into the seven product domains. The chapter/source file is routing evidence for a topic bucket, not a learning-order requirement.

### המסע והשאלה
- מי אני?

### הגוף ומערכות האדם
- הכלי החיצוני
- הפלא ההנדסי
- הגוף כתדר

### המוח, מערכת העצבים והתודעה
- מערכת ההפעלה
- המוח
- גלי המוח
- בלוטת האצטרובל
- נוירופלסטיות

### תדרים, מוזיקה וצליל
- תדרים, מוזיקה וצליל

### זהות, אמונות ורגשות
- זהויות ואמונות
- רגשות כמידע

### האדם והעולם
- יצירת מציאות
- 12 חוקי היקום

### מטרות, משמעות ואינטגרציה
- יעדים וחזון
- סבל, קושי ומשמעות
- חיבור הכל
- מי אני? — תשובה

## Subtopics

Source-observed section headings are candidates for the SUBTOPIC layer, not automatic siblings of canonical topics. The learner taxonomy:

- collapses repeated headings that clearly name the same concept (for example multiple DMT headings become one `DMT` subtopic)
- keeps distinct concepts as siblings (for example `DMT` and `מדיטציה` can both live under `בלוטת האצטרובל` without one becoming the child of the other)
- suppresses procedural/noisy headings such as chapter transitions, generic conclusions, and numbered execution steps from the learner navigation
- keeps the raw source headings in provenance so no source information is lost

## Topic interaction

Every DOMAIN, TOPIC, and SUBTOPIC can be opened in the same content panel. The detail view contains:

1. source-backed knowledge units
2. source/provenance labels
3. reviewed relationships only when explicitly approved
4. a short extractive Knowledge Card
5. Save as Crystal

Knowledge Cards use stable IDs derived from the hierarchy node, for example:

```text
knowledge-card:subtopic:pineal-gland:dmt:v1
```

A Crystal is the user's saved relationship to that Knowledge Card. The Knowledge Card remains canonical content; the Crystal remains personal state.

## DMT regression contract

The following must remain true:

```text
המוח, מערכת העצבים והתודעה
└── בלוטת האצטרובל
    ├── DMT
    └── מדיטציה
```

`מדיטציה` must never become a child of `DMT` merely because both occur in the same source, section neighborhood, or graph context.

# E.I.L — Content Library Architecture v2

**Status:** Implemented candidate

## Core rule

The learner hierarchy has three navigational levels:

```text
DOMAIN
└── TOPIC
    └── SUBTOPIC
```

The 18 uploaded seed files are evidence and provenance. They are **not** 18 chapters and they are **not** 18 learner topics. Several files may feed one semantic topic, and one file may contain material that belongs in several topics.

Graph relationships are not hierarchy. `RELATED`, co-occurrence, shared source context, and learning dependencies remain separate relationship types.

## Current semantic topics

The current corpus is organized into seven broad domains and twelve revisable semantic topics:

### המסע והשאלה
- למה יצאתי למסע?

### האדם פנימה — הגוף כמערכת
- הגוף כמערכת

### המוח, מערכת העצבים והתודעה
- המוח ומערכת ההפעלה
- מצבי תודעה, גלי מוח ולמידה
- בלוטת האצטרובל

### תדרים, מוזיקה וצליל
- תדרים, מוזיקה והגוף

### זהות, אמונות ורגשות
- זהות, אמונות ודפוסים
- רגשות כמידע

### האדם והעולם
- הסביבה כמערכת תומכת
- האדם מול המציאות והעולם

### שינוי, משמעות ואינטגרציה
- מטרות, חזון וכלי שינוי
- משמעות, מסקנות ואינטגרציה

This number is not a product limit. Topics may split, merge, or grow as the corpus grows.

## Subtopics

Raw source headings do not automatically become navigation. A source heading is promoted to SUBTOPIC only when it names a meaningful concept worth exploring. Procedural steps, transitions, sentence fragments, and generic headings stay inside the parent topic as source-backed information rather than cluttering the hierarchy.

Repeated headings that clearly name the same concept are collapsed. Raw headings and source files remain attached as provenance, so no source information is lost.

## Topic interaction

Every DOMAIN, TOPIC, and promoted SUBTOPIC can be opened in the same content panel. The detail view contains:

1. source-backed knowledge units
2. source/provenance labels
3. reviewed relationships only when explicitly approved
4. a short extractive Knowledge Card
5. Save as Crystal

Knowledge Cards use stable hierarchy-derived IDs, for example:

```text
knowledge-card:subtopic:pineal-gland:dmt:v1
```

A Crystal is the user's saved relationship to that Knowledge Card. The Knowledge Card remains system content; the Crystal remains personal state.

## DMT regression contract

DMT and meditation are not grouped merely because they occur in the same source.

```text
המוח, מערכת העצבים והתודעה
├── מצבי תודעה, גלי מוח ולמידה
│   └── מדיטציה
└── בלוטת האצטרובל
    └── DMT
```

A shared source, graph edge, or local co-occurrence is never enough to make one a child of the other or to force them into the same learner branch.

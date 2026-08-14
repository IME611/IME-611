# E.I.L — Corpus Map v0.1

**Date:** 2026-08-14  
**Status:** Verified structural/emergent map baseline  
**Corpus:** 18 verified seed sources, 742 extraction candidates (741 non-editorial knowledge candidates)

## Purpose

Corpus Map v0.1 is not a curriculum and not a fixed taxonomy. It is the first evidence-backed structural map generated from what is actually present in the seed corpus.

It answers a narrower question first:

> Which observed concepts, source headings, and knowledge atoms already have reliable structural context, and which relationships are explicitly supported by source organization or co-mention?

Future semantic clustering, creator review, relation extraction, prerequisites, and spiral sequencing will refine this map. They must not overwrite source truth.

## Verified v0.4 audit

The final Phase 4 Preview audit was executed read-only against the connected corpus database during Vercel Preview build.

| Metric | Verified value |
|---|---:|
| Concept candidates | 131 |
| Clean graph Concept nodes | 100 |
| Concept candidates collapsed only for graph-label readability | 31 |
| Source-observed `SECTION_TOPIC` nodes | 220 |
| Total map nodes | 320 |
| Non-Concept knowledge atoms | 610 |
| Atoms with any raw source section | 592 / 610 (97.0%) |
| Atoms with meaningful/inherited source-topic context | 590 / 610 (96.7%) |
| Generic reflection/summary atoms inheriting prior meaningful topic | 50 |
| Atoms explicitly mentioning extracted Concepts | 26 / 610 (4.3%) |
| Atoms connected by explicit mention or structural source context | 590 / 610 (96.7%) |
| Truly unmapped atoms | 20 |
| Context/mention graph edges | 2,693 |
| Strong edges | 408 |
| Preview communities | 218 |
| Singleton communities | 201 |

### Integrity interpretation

The high **96.7% structural coverage** does not mean that 96.7% of the corpus has been semantically understood. It means that most atoms can be attached to an observed, source-derived context without inventing a taxonomy.

The **4.3% explicit Concept mention rate** remains intentionally separate. It is a stronger but much narrower signal.

## Node types

### `CONCEPT`
Derived from extracted Concept candidates.

A graph label may shorten a descriptive candidate line for readability. Example:

`ביו-מגוון — מגוון מינים, גנטיקה ומערכות אקולוגיות.`

may appear in the map as:

`ביו-מגוון`

The complete original candidate wording remains retained and source-traceable. This is a display/map normalization only.

### `SECTION_TOPIC`
Derived only from headings actually observed in source structure.

Examples observed in the seed corpus include:
- `אני פנימה — הגוף כמערכת`
- `חישה`
- `בקרה ותקשורת`
- `מבנה ותנועה`
- `חיים וביולוגיה`
- `אוויר ואטמוספירה`
- `קרקע וגיאולוגיה`
- `הכימיה של רגשות`
- `כניסה לתת-מודע — שבעת השערים`
- `החוקים — סקירה מלאה`
- `התשובה המאחדת`

These are evidence of how the source material is currently organized. They are **not automatically approved top-level categories**.

## Generic structural blocks

Headings such as:
- `רגע של עצירה`
- `הנקודה המרכזית`
- `הנקודה האמיתית`
- `סיכום`
- `לסיכום`

are not converted into taxonomy nodes.

When such a block follows a meaningful section in the same source, its atoms inherit the immediately preceding meaningful source-topic context by source order. In the verified corpus, **50 atoms** received this inherited context.

This prevents reflective questions and summaries from becoming artificial topic islands while preserving their exact original section labels.

## Relationship signals used in Phase 4

Corpus Map v0.1 uses only structural/contextual signals:

- `SOURCE_CONTEXT` — Concepts occur in the same source.
- `SECTION_CONTEXT` — Concepts occur in the same exact source section.
- `SECTION_MEMBERSHIP` — an observed Concept is structurally inside an observed source section.
- `SECTION_LABEL_MENTION` — a source heading itself explicitly names a known Concept.
- `CO_MENTION` — multiple Concepts are explicitly mentioned in the same atom.

These signals build navigation/context edges. They do **not** claim causal, hierarchical, or prerequisite semantics.

## Examples of emergent communities

The audit surfaced coherent local structures such as:

- `חישה · אינטרוספציה · וסטיבולרית (שיווי משקל)`
- `בקרה ותקשורת · המערכת האנדוקנבואידית · מערכת האנדוקרינית`
- `מבנה ותנועה · מערכת הפאשיה · מערכת השלד`
- `הגנה · מערכת החיסון · מערכת האינטגומנטרית`
- `חיים וביולוגיה · ביו-מגוון · האבקה`
- `מים · מחזור המים · פוטוסינתזה`
- `אוויר ואטמוספירה · שכבת האוזון · אפקט החממה הטבעי`
- `קרקע וגיאולוגיה · מחזור הפחמן · טקטוניקת לוחות`
- `החוקים — סקירה מלאה · חוק ההתכתבות · חוק הוויברציה`

One larger cross-source community currently connects material around `מדיטציה`, `כיצד לשחרר DMT באופן טבעי`, and `כניסה לתת-מודע — שבעת השערים`. This should be treated as a **relation candidate area**, not proof that all of those ideas belong in one canonical topic.

## Known limitations

### 1. Many local singleton communities
There are 218 preview communities, of which 201 are singletons.

This is not interpreted as “201 categories.” Most are local/source-level topic anchors awaiting explicit relation extraction and cross-source semantic review.

Phase 5 must connect nodes using source-evidenced semantic relation candidates rather than forcing community merging.

### 2. Explicit Concept coverage is intentionally low
Only 26/610 non-Concept atoms explicitly mention extracted Concept labels under the conservative matcher.

We do not inflate this metric with fuzzy matching. Semantic aliases/paraphrases remain a separate capability.

### 3. No semantic embedding model is active
The map does not currently claim synonym/paraphrase equivalence. A provider-neutral semantic matcher boundary exists, but no external embedding provider is configured.

### 4. Corpus source structure is evidence, not truth
A heading written in a seed source tells us how that material was organized at authoring time. Creator review may later split, rename, merge, or reposition it.

## Phase 4 acceptance

Phase 4 is accepted as the **structural Corpus Map baseline** because:

1. The map is derived from verified source material, not a predetermined category count.
2. Raw source/candidate wording remains preserved.
3. Structural context and explicit concept evidence are measured separately.
4. 590/610 non-Concept atoms have a source-derived map anchor.
5. Only 20 atoms remain truly unanchored.
6. Generic reflective blocks are contextualized without becoming fake taxonomy nodes.
7. No canonical taxonomy/concept writes occur.
8. Regression tests cover label cleaning, duplicate graph labels, source-topic context, generic-block inheritance, and unmapped behavior.

## Next phase

**Phase 5 — Relation Graph** must turn contextual proximity into reviewable, typed relationship candidates with evidence.

Minimum target relation vocabulary:
- `IS_A`
- `PART_OF`
- `DEPENDS_ON`
- `INFLUENCES`
- `REGULATES`
- `CAUSES_OR_CONTRIBUTES_TO`
- `CONTRADICTS`
- `SUPPORTS`
- `EXPLAINS`
- `EXAMPLE_OF`
- `APPLIES_TO`
- `REFRAMES`
- `PREREQUISITE_FOR`
- `REVISITED_BY`

Phase 5 must distinguish **explicit linguistic evidence** from weaker contextual/co-occurrence evidence and must not write directly into canonical `connections` without review.

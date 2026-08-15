# E.I.L — Content Library Architecture v1

## Product contract

The learner-facing library separates three different relationships that must never be conflated:

1. **DOMAIN → TOPIC** — hierarchical placement used for navigation.
2. **RELATED** — concepts that appear in the same context or graph neighborhood.
3. **LEARNING DEPENDENCY** — prerequisite/revisit relationships used by the learning path.

A graph edge is never sufficient evidence to create a parent/child relationship.

## Current hierarchy

The first learner-facing hierarchy uses broad, revisable domains grounded in the verified 18-source corpus and the creator's product direction. Source file numbers remain inventory metadata and never define learning order.

- המסע והשאלה
- הגוף ומערכות האדם
- המוח, מערכת העצבים והתודעה
- תדרים, מוזיקה וצליל
- זהות, אמונות ורגשות
- האדם והעולם
- מטרות, משמעות ואינטגרציה

Observed source section headings are placed below these domains. Uncertain sections remain explicitly unassigned instead of being forced into a wrong category.

## Topic view

Opening a domain/topic happens in the same library panel and exposes only source-backed material:

- key knowledge units from the canonical extraction layer
- provenance/source labels
- related concepts clearly marked as related, not children
- an extractive Knowledge Card built from source-backed units
- Save as Crystal using a stable `knowledge-card:<node>:v1` identifier

Knowledge Card summaries are extractive in v1. They do not invent new canonical claims.

# E.I.L — Card Script and Flow Draft, Learning Chapters 3–6

Status: `LIVE_PILOT_AUTHORIZED_BY_IDAN`
Deployment target: `main` / Production
Production status: Idan authorized a live pilot on 24 August 2026. Claude must perform an additional post-deployment review and return exact corrections by Card ID when needed.

## Decision

The numbered DOCX files remain canonical source documents. They are not the learner-facing sequence. Learning chapters 3–6 use this dependency order:

1. Learning chapter 3 — `הגוף כמערכת מורכבת` → source `פרק3_הפלא_ההנדסי.docx`
2. Learning chapter 4 — `המוח — מבנה, תקשורת ובקרה` → source `פרק5_המוח_המפורט.docx`
3. Learning chapter 5 — `מערכת ההפעלה — מודע, אוטומטי ודפוסים` → source `פרק4_מערכת_ההפעלה.docx`
4. Learning chapter 6 — `מצבי מוח — קשב, שינה ולמידה` → source `פרק6_גלי_המוח.docx`

The critical dependency is `body → brain mechanism → operating-system metaphor → EEG states`. The original source numbering and full source text remain unchanged.

## Card coverage

| Learning chapter | Cards | Source units | Learning result |
|---|---:|---|---|
| 3 | 6 | S03-U01–U06 | See the body as a coordinated open system and distinguish analogy from proof. |
| 4 | 7 | S05-U01–U06 | Understand neurons, synapses, regions, networks and bounded neuroplasticity. |
| 5 | 7 | S04-U01–U05 | Use the OS metaphor without presenting it as anatomy; turn one pattern into a testable experiment. |
| 6 | 7 | S06-U01–U04, S06-U06 | Understand what EEG measures, avoid deterministic band labels, and treat audio claims cautiously. |

All 27 new cards contain 40–90 words and at least one source-unit reference. Together with chapters 1–2, the draft contains 40 cards.

## Scientific evidence ledger

These references validate or constrain factual wording in the derived cards. They do not replace the E.I.L source documents.

| Evidence ID | Used for | Primary/authoritative reference |
|---|---|---|
| EVID-NINDS-KNOW-BRAIN | Brain structure and network framing | NINDS, “Brain Basics: Know Your Brain” — https://www.ninds.nih.gov/es/node/8168 |
| EVID-NINDS-NEURON | Neurons, electrical/chemical signaling and synapses | NINDS, “The Life and Death of a Neuron” — https://www.ninds.nih.gov/es/node/8172 |
| EVID-PLOS-LATERALIZATION | Rejecting personality-level “left-brain/right-brain” typing | Nielsen et al., PLOS ONE (2013), doi:10.1371/journal.pone.0071275 — https://pmc.ncbi.nlm.nih.gov/articles/PMC3743825/ |
| EVID-NEI-PLASTICITY | Bounded, mechanism-based neuroplasticity | National Eye Institute, Visual NeuroPlasticity Workshop (2024/2025 update) — https://www.nei.nih.gov/about/news-and-events/events/visual-neuroplasticity-workshop |
| EVID-AES-EEG | What scalp EEG records and how bands are conventionally named | American Epilepsy Society / NCBI Bookshelf, “An Orderly Approach to EEG Analysis” — https://www.ncbi.nlm.nih.gov/books/NBK390342/ |
| EVID-NCBI-NORMAL-EEG | Physiological variability and state/context dependence | American Epilepsy Society / NCBI Bookshelf, “The Normal EEG” — https://www.ncbi.nlm.nih.gov/books/NBK390343/ |
| EVID-PLOS-BINAURAL-REVIEW | Inconsistent EEG-entrainment evidence for binaural beats | Ingendoh et al., PLOS ONE (2023), doi:10.1371/journal.pone.0286023 — https://pubmed.ncbi.nlm.nih.gov/37205669/ |

## Claims deliberately not promoted into the core cards

- A fixed `5% conscious / 95% subconscious` split.
- Personality types based on a dominant left or right hemisphere.
- The superconscious as an anatomical brain layer.
- A deterministic emotional or spiritual meaning for each EEG band.
- Guaranteed healing, cognitive enhancement or hemispheric synchronization from tones.
- The engineering analogy as proof of intelligent design.
- Fibonacci or fine-tuning claims as settled proof of a philosophical conclusion.

Those claims remain accessible in the unchanged source documents. In the learning layer they are omitted or explicitly classified as metaphor, interpretation, worldview or uncertain evidence.

## Product behavior changed in this draft

- The journey index shows the proposed learner-facing titles for chapters 3–6.
- Learning chapter 4 resolves the full source by `sourceFile`, so it opens source document 5; chapter 5 opens source document 4.
- The Sources screen now has a separate source-document opening path. Reordering the learning journey can no longer cause a source button to open a different DOCX.
- Evidence IDs appear on cards only when a derived factual statement was checked against an external scientific reference.

## Human review gates

1. Idan authorized deployment to Production for live evaluation.
2. Claude reviews the live topic order, card wording, evidence boundaries, source mapping, mobile flow and crystal behavior.
3. Claude returns `PASS` or exact corrections by Card ID; Codex applies verified corrections and records the result.

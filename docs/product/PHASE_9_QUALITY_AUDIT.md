# E.I.L — Phase 9 Quality Audit

**Status:** pre-merge verification  
**Scope:** corpus integrity, overlap verdicts, review safety, and sampled extraction precision  
**Source of truth:** EPIC #35

## 1. What this audit is proving

Phase 9 is not a claim that every deterministic label is semantically perfect. It proves that:

1. source truth is retained and traceable;
2. exact quotes and evidence links are internally consistent;
3. known overlap cases produce deterministic expected verdicts;
4. ambiguous classifications remain reviewable rather than canonical;
5. worldview/creator material cannot silently masquerade as evidence-backed canonical truth;
6. review decisions are attributed and referentially valid;
7. intake approval is the only path from staged input to a canonical source;
8. database migrations and production health are checked before release.

## 2. Golden overlap regression

The deterministic overlap fixture now requires exact outcomes:

| Case | Expected |
|---|---|
| exact known concept | `EXISTS` |
| known statement + meaningful added mechanism | `EXTENDS` |
| explicit negation of a known statement | `CONFLICTS` |
| clearly unrelated novel statement | `NEW` |

A separate guard verifies that a long new sentence containing only one familiar concept cannot be promoted to `EXISTS` or `EXTENDS` merely because that concept appears inside it.

## 3. Production corpus integrity gates

The production-only quality gate verifies:

- seed source/fragment baseline has not shrunk;
- every active extraction candidate has evidence;
- every candidate evidence span is exact and verified;
- candidate quote matches canonical source text at stored offsets;
- evidence quote matches canonical fragment text at stored offsets;
- candidate/evidence source IDs agree;
- non-rejected canonical claims have evidence;
- an approved relation cannot retain unresolved endpoints;
- relation evidence must be explicit linguistic evidence;
- relation source atom and source IDs agree;
- review decisions have a reviewer;
- extraction/relation review decisions reference existing subjects;
- pending/rejected intake cannot point to an approved canonical source;
- approved intake cannot be missing its canonical source;
- migrations `001`–`008` are present in the migration ledger with SHA-256-shaped checksums.

## 4. Sampled extraction precision review

A human-readable audit was performed against real seed material rather than fixtures only.

### Sample A — source 1 / project introduction and human-system material

Observed strengths:
- questions are reliably separated;
- numbered systems/concepts are retained as Concepts;
- immediately following explanations preserve source evidence;
- explicit creator voice and editorial instructions are separated;
- evidence spans remain exact.

Observed heuristic risks:
- a standalone year such as `2026` can make a sentence look like a research Reference under extractor `atomic-he-v0.2`;
- generic contrast words such as `אבל` can make ordinary prose look like a `TENSION`;
- short rhetorical fragments can remain low-confidence interpretive Claims.

These are **classification candidates**, not canonical truth. They remain `PENDING` and can be changed/rejected in creator review.

### Sample B — source 10 / neuroplasticity

Observed strengths:
- explicit questions and definitions are strong;
- factual biological vocabulary receives evidence-preserving Claim candidates;
- explicit research language (`מחקרים ...`) is surfaced for review;
- practical/reflection material remains distinguishable from definitions.

Observed heuristic risks:
- modal words such as `חייבים` can cause a factual sentence (for example a description of London taxi drivers) to receive a `NORMATIVE` claim subtype even when the intended meaning is descriptive;
- scientific-sounding statements still require independent source/citation review; the extractor does not make them scientifically true.

### Sample C — source 14 / “12 laws of the universe” worldview material

This sample exposed a high-impact epistemic issue:

- numbered items such as `חוק המשיכה` are correctly retained as Concepts;
- the paragraph immediately following a numbered Concept is structurally classified as a high-confidence `DEFINITION`;
- however, a definition *of a worldview concept* must not be treated as having the same epistemic status as a biological/scientific definition.

**Phase 9 fix:** the creator `epistemic` review queue now also routes high-confidence material when its source filename, section, or candidate wording carries explicit worldview context (`חוקי היקום`, spirituality, creator/God/creation/soul/providence terms, etc.). This does **not** relabel or approve the content. It guarantees creator review before canonical use.

## 5. Known limitation deliberately not hidden

True semantic synonym/paraphrase matching is still not active. Current overlap ranking is deterministic lexical/contextual matching. Ambiguous synonym matches remain `UNCERTAIN` or require creator review. No semantic auto-merge is allowed.

Likewise, `atomic-he-v0.2` is a candidate generator, not an epistemic authority. The audit found useful deterministic structure and also real false-positive labels. Existing persisted candidates are not silently re-extracted or rewritten during Phase 9; their exact evidence and review history are preserved.

A future extractor revision may improve heuristics, but a version upgrade must be explicit and migration-safe rather than rewriting `v0.2` results under the same version label.

## 6. Release blockers

Phase 9 may close only when all of the following are true:

- Preview build is `READY`;
- golden extraction/overlap/map/intake regressions pass;
- the `relation-summary` SQL ambiguity found by this audit is fixed;
- production-only DB quality gates pass after merge;
- production `/api/health`, `/api/intake-health`, `/api/learning-health`, and `/api/relation-summary` return healthy states;
- no migration drift is reported;
- EPIC #35 is updated with the production-verified checkpoint.

## 7. Principle

> **Evidence can be verified automatically. Meaning remains reviewable.**

The system may suggest what a piece of knowledge is, where it belongs, and how it relates to existing material. It must not silently convert a heuristic label, worldview statement, creator insight, or unresolved relation into canonical truth.

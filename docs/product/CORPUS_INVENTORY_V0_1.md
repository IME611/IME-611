# E.I.L — Corpus Inventory v0.1

**Date:** 2026-08-14  
**Status:** Verified seed-corpus inventory  
**Scope:** The 18 currently uploaded seed documents as **sources**, not learning chapters.

## Executive result

The repository seed corpus and the connected Postgres canonical source store were compared by an automated read-only audit.

| Check | Result |
|---|---:|
| Expected seed sources | 18 |
| Canonical DB sources found | 18 |
| Missing sources | 0 |
| Duplicate seed numbers | 0 |
| Duplicate canonical text hashes | 0 |
| Exact canonical text verified | 18 / 18 |
| Fragment offset/text/hash coverage verified | 18 / 18 |
| Hard integrity failures | 0 |
| Original DOCX binaries verified in canonical/legacy DB | 0 / 18 |
| Total canonical paragraphs | 1,216 |
| Total canonical characters | 77,070 |
| Stored source fragments | 44 |

**Integrity verdict:** PASS for the canonical extracted-text corpus.

**Retention caveat:** the exact extracted UTF-8 text is preserved and hash-verified, but the original `.docx` binary files are not currently verifiable inside the connected canonical/legacy database. This is tracked separately and does not invalidate the canonical text corpus.

## Important semantic rule

The values `seedNumber`, legacy `chapterNumber`, and filenames such as `פרק5_...docx` are **source inventory metadata only**. They must not be interpreted as a permanent chapter count, learner sequence, taxonomy, or curriculum order.

The learning sequence will be derived later from concepts, relationships, prerequisites, and spiral revisits.

## Source inventory

| Seed | Stable Source ID | Original filename label | SHA-256 of canonical text | Paragraphs | Chars | Fragments | Text + fragment audit |
|---:|---|---|---|---:|---:|---:|---|
| 1 | `200f00df-0995-4ba8-a3bb-e04d7d0b006d` | `מי_אני_פרק1_v6.docx` | `eef33fab4af005135c436f819c36590ae62ddad852c48a2edf4e51b55699498f` | 227 | 13,095 | 7 | PASS |
| 2 | `e2f26578-0851-439d-939b-027fcc30535b` | `פרק2_הכלי_החיצוני.docx` | `fabbc05afedc0a60b2bf9c393461f42aedfa1343acb77f3c5a0d8e12f2cb8bd7` | 67 | 4,478 | 2 | PASS |
| 3 | `731c72fa-8418-4769-ad90-85c60f7f1207` | `פרק3_הפלא_ההנדסי.docx` | `915ad6b8d2ae35d4a8ccf6320284a00c1b0c166b59da28234606fb8351a27423` | 42 | 2,839 | 2 | PASS |
| 4 | `a3dfcf66-c6f8-4236-ae93-19c2e83efd4d` | `פרק4_מערכת_ההפעלה.docx` | `1598f5a476dc5a92b5763f169cff6ce3cf8a375484ca55ddcc94b9531c9c0e9d` | 81 | 5,879 | 3 | PASS |
| 5 | `80135c85-1d3e-47be-856b-88eac59a9fa6` | `פרק5_המוח_המפורט.docx` | `1683e29d7b7424463cc741739ecd80fa70d526d2b3d72abb8ffcf782e502ea6c` | 87 | 6,039 | 3 | PASS |
| 6 | `c6670a61-4e57-4105-972e-628bc9c91b0a` | `פרק6_גלי_המוח.docx` | `7399b92aa3880ec20b428c4463eb7239e128e7726597198ef5b2852fe0535a7e` | 79 | 5,896 | 3 | PASS |
| 7 | `ea0b4c39-7590-42fc-be07-02e243dfcac2` | `פרק7_בלוטת_האצטרובל.docx` | `b64c4e5506947c6c57f456ce7a80fa4d34185febc3933bb2bfecd65f58d62592` | 90 | 5,505 | 3 | PASS |
| 8 | `84224fc4-edbc-4e51-b5c5-d5db25376ada` | `פרק8_תדרים_מוזיקה_וצליל.docx` | `fde698fadb85af6376f0cd115b48bd6db4be7a11993d32dbcfee50d2487b99a3` | 54 | 4,084 | 2 | PASS |
| 9 | `cea35756-590f-4338-bcce-3280a9c241b9` | `פרק9_הגוף_כתדר.docx` | `5c76b543cdeeadd2222e9fd8455af6b5e2e070e0632d1f02679f46f1eddc4a93` | 32 | 2,581 | 2 | PASS |
| 10 | `a1862ce3-0e81-4328-b092-e1f77535f29c` | `פרק10_נוירופלסטיות.docx` | `1045266184f9727ae48edc9e44f3eb317e86c2c9fbaafb63c4985eb686c724d7` | 38 | 2,741 | 2 | PASS |
| 11 | `1b222651-4a8e-40c9-9797-634c1e703847` | `פרק11_זהויות_ואמונות.docx` | `613a728dec72bb9a5b47ba61d84d858e51e67857173a8e077f337c2cacd8be18` | 56 | 3,216 | 2 | PASS |
| 12 | `7e3f823b-5ae2-4e02-aaa3-4f9bb7f8c69c` | `פרק12_רגשות_כמידע.docx` | `076423baeafdf3f9a389defcba7c094911898ee76d16e98ee9a130c731bd75c8` | 74 | 3,880 | 2 | PASS |
| 13 | `578a0e00-a1d1-4b3e-8f8e-15ee9a138364` | `פרק13_יצירת_מציאות.docx` | `dcf66def1f7ca5bb7cd89603bc365c80902eccc978d955cdc2757511b004ef8d` | 64 | 3,864 | 2 | PASS |
| 14 | `771334c8-083d-487e-b4e2-283ab7e9ebe5` | `פרק14_12_חוקי_היקום.docx` | `ec3b12473eeed8a930be4692c9d2e4f6949ffc2017371e142f4b260613186672` | 43 | 2,847 | 2 | PASS |
| 15 | `2bd45668-046f-45f7-9027-0013dc1180a9` | `פרק15_יעדים_וחזון.docx` | `ebb64f42e172e1aac5ab18f5a387e8e73698bbd80ad742f594e20e669c07914f` | 59 | 2,831 | 2 | PASS |
| 16 | `9f0a3bea-5b80-4bc5-85dc-a355f27ee66d` | `פרק16_סבל_קושי_ומשמעות.docx` | `47a7f24898f358a51b99cc0c76ad599cb61d8478d0c21569ae309081710e471a` | 36 | 2,633 | 2 | PASS |
| 17 | `f004f2d3-e1b2-4306-9bf6-0742bf583706` | `פרק17_חיבור_הכל.docx` | `c58a8e9f0394fc6adafd0f7ac12fa608241b2e730789a1c19747e27acd635e21` | 51 | 2,603 | 2 | PASS |
| 18 | `2065459a-e5cf-470a-be9d-64d1f4c58d2d` | `פרק18_מי_אני_תשובה.docx` | `0bbc76271ea1cc67ff6ab66925bf06fa7c159afbc942536ddd3d21bd58afc052` | 36 | 2,059 | 1 | PASS |

## How the audit works

For every seed source the audit:

1. Loads the repository's compressed seed corpus.
2. Reconstructs the canonical extracted text.
3. Computes its SHA-256.
4. Resolves the canonical Postgres `sources` row by seed metadata and hash.
5. Verifies the stored `content_hash`.
6. Re-hashes `raw_content` and verifies exact text equality.
7. Validates every `source_fragment` against its canonical `start_offset:end_offset` text slice and fragment hash.
8. Confirms fragment coverage reaches the entire source. Overlap is allowed and measured because the currently stored seed fragments were generated by `text-v1:2400:250:newline`.
9. Checks for missing sources, duplicate seed numbers, and duplicate canonical hashes.
10. Audits whether original DOCX binary retention can be verified separately from text retention.

The API intentionally returns metadata and verification results, not full raw source text.

## Retention gap: original DOCX binaries

The canonical seed rows preserve exact extracted text, but `original_bytes_uri` is empty for all 18 seed sources. The connected database also does not currently expose a legacy `source_documents` table from which original file bytes could be verified.

Therefore the correct statement is:

- **Canonical extracted text:** verified and preserved exactly.
- **Original DOCX binary:** not verified in the runtime database.

Future ingestion must preserve both when a binary file is supplied:

- immutable original binary/object-storage reference + binary SHA-256
- extracted canonical text + independent text SHA-256
- parser/extractor version
- provenance from every derived unit back to the source and exact fragment

## Next phase

Phase 2 is atomic extraction across this verified source corpus. Extraction must create reviewable, source-traceable units rather than one summary per file. Minimum unit types:

- claim / proposition
- concept / entity
- definition
- question
- model / framework
- example / story
- practice / tool
- creator conclusion / personal insight
- belief / worldview claim
- research/evidence reference
- contradiction / uncertainty

No extraction result becomes canonical knowledge merely because a model produced it; provenance and review state are mandatory.

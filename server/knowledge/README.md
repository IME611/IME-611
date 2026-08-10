# Server / Knowledge

Owns canonical source handling and ingestion domain logic.

Future services belong here when extracted from thin `/api` route adapters:
- canonical corpus access
- source/document lookup
- import and preservation
- inbox processing
- source metadata

Invariant: original source material is immutable from the perspective of derived learning/synthesis. Summaries and interpretations must be stored as separate derived artifacts.

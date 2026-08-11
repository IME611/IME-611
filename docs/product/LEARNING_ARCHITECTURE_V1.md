# Learning Architecture v1

## Boundary
LearningPath is a presentation/sequencing layer above the canonical Knowledge Domain. It never owns Sources, Claims, Evidence, Connections, Insights, Experiments or Reflections.

## Canonical flow
Knowledge: Source -> SourceFragment -> Claim -> Evidence -> Connection/Insight -> Experiment -> Reflection.
Learning: LearningPath -> Stage -> guiding question -> source/concept references -> objective -> revisit -> completion.

## Runtime
- `src/core/learning-path/learning-path.types.ts` owns the path contract.
- `learning-path.validation.ts` owns structural invariants.
- `learning-progress.ts` owns versioned progress state and stage completion.
- `learning-progress.repository.ts` is the persistence port.
- `learning-progress.storage.ts` is the current localStorage adapter and migrates legacy numeric progress/reflections once.
- `spiral-planner.ts` decides unlocks, revisits and next stage.
- `src/data/learning-paths/life-research-v1.ts` is the first 18-stage path only; it is not ontology.
- `src/features/journey/model/*` adapts domain state to the current UI.
- `server/learning-paths/application/learning-core-loop.service.js` attaches learning context to the provenance-guarded synthesis loop.

## Invariants
1. Stage ids and orders are unique and contiguous.
2. Prerequisites and revisits point only backward to existing stages.
3. Every stage references at least one source and has a guiding question.
4. Completion state is keyed by learning-path id + version, so a future v2 does not corrupt v1 history.
5. UI does not decide unlock rules; the domain planner does.
6. Persistence is replaceable. A future server repository can replace localStorage without changing Journey components.
7. A stage can contextualize an Insight, but cannot make an unsupported Insight `SUPPORTED`. Provenance remains authoritative.

## Source reference transition
In v1, stage `sourceRefs` use the stable source filenames already present in the corpus. After live DB migration/backfill, a resolver can translate these references to canonical Source UUIDs. LearningPath remains unchanged conceptually.

## Definition of Done
- 18 chapters are represented as `LearningPath v1`, not Knowledge schema.
- owner mode can access all stages; journey mode follows domain unlock rules.
- old numeric journey progress migrates to versioned stage ids.
- reflections persist through the progress repository.
- future progress persistence can be swapped through a repository port.
- stage insights/experiments/reflections can carry learning context while still using canonical provenance guards.
- Vercel TypeScript/build verification passes before merge.

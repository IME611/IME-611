# E.I.L — Technical Architecture v1

**Version:** 1.0  
**Date:** August 2026  
**Status:** Engineering specification  
**Source product spec:** E.I.L Product Information Architecture v1

---

## 1. Architecture objective

E.I.L must implement one product rule consistently across frontend, backend, persistence, and navigation:

> **Knowledge is public. Journey is personal. State is contextual.**

The application is composed of five product spaces with separate ownership boundaries:

1. **Home** — orientation and choice.
2. **Content Library** — public canonical knowledge discovery.
3. **Learning Journey** — guided 18-layer progression.
4. **My Crystals** — user-owned saved knowledge and annotations.
5. **My Space** — a derived personal status surface. It does not own canonical knowledge.

`My Space` is an aggregator over Journey progress, Crystal activity, reflections, and later insights. It must never become the source of truth for those domains.

---

## 2. Current repository baseline

The current application already contains useful foundations that must be preserved rather than replaced.

### Frontend

- React + TypeScript + Vite.
- Current navigation is hash-based and implemented locally without a routing dependency.
- Current default route resolves to `dashboard`.
- Current primary navigation uses `dashboard` for “Today” and `library` for the existing 18-layer journey.
- Feature boundaries and design-system isolation are already documented in `AGENTS.md`, `ARCHITECTURE.md`, and `FRONTEND_CONSTITUTION.md`.

### Knowledge domain

The canonical knowledge foundation already includes:

- immutable `sources`
- `source_fragments`
- `claims`
- `concepts`
- `evidence`
- `connections`
- `insights`
- `experiments`
- `reflections`
- `provenance_edges`

These tables remain authoritative for source truth and provenance. Product-facing Knowledge Cards must reference this domain; they must not duplicate or replace it.

### User state

A first `user_crystals` table already exists, but it currently stores fragment snapshots directly and does not yet provide the full Product IA model: card linkage, notes, tags, resurfacing, version reference, or account ownership contracts.

### Authentication

There is no product-level authentication provider contract in the current frontend architecture. Technical v1 therefore defines a provider-neutral session boundary and does not couple the product to Clerk, Auth0, Supabase Auth, Firebase, or another vendor yet.

---

## 3. Target route model

### 3.1 Route contract

The product uses route identities that map directly to the Product IA.

| Route | Access | Product owner | Purpose |
|---|---|---|---|
| `/home` | Public | Home | Orientation and entry choices |
| `/journey` | Public overview | Journey | Explain journey + resume/start |
| `/journey/layer/:layer` | Progress-gated | Journey | Layer content |
| `/library` | Public | Library | 5-world content index |
| `/library/world/:worldSlug` | Public | Library | World overview |
| `/library/topic/:topicSlug` | Public | Library | Topic + Knowledge Cards |
| `/library/card/:cardId` | Public | Library | Stable deep link to a card |
| `/crystals` | Authenticated | Crystals | Personal knowledge vault |
| `/crystals/:crystalId` | Authenticated owner | Crystals | Crystal detail/edit |
| `/me` | Authenticated + engaged | My Space | Personal state aggregation |
| `/sources` | Public | Knowledge | Source transparency |
| `/about` | Public | Product | Creator vision + method |
| `/settings` | Authenticated | Account | Preferences/account |

### 3.2 Migration without a router rewrite

The current application already owns navigation with `useAppNavigation`. Do not introduce React Router merely to satisfy this specification.

Phase 1 may preserve hash URLs:

```text
#/home
#/journey
#/journey/layer/1
#/library
#/library/world/body-as-system
#/library/topic/nervous-system
#/crystals
#/me
```

The current `pageFromLocation()` parser must evolve from “one page id” into a parsed route object:

```ts
type AppRoute =
  | { name: 'home' }
  | { name: 'journey' }
  | { name: 'journey-layer'; layer: number }
  | { name: 'library' }
  | { name: 'library-world'; worldSlug: string }
  | { name: 'library-topic'; topicSlug: string }
  | { name: 'library-card'; cardId: string }
  | { name: 'crystals' }
  | { name: 'crystal'; crystalId: string }
  | { name: 'my-space' }
  | { name: 'sources' }
  | { name: 'about' }
  | { name: 'settings' };
```

Path routing can be considered later if deep-link SEO becomes important. It is not required to begin the migration.

---

## 4. Navigation visibility and access rules

Visibility and authorization are separate concerns.

### Public navigation

Always visible:

- Home
- Learning Journey
- Content Library

### Contextual navigation

- My Crystals: visible after authentication; may also appear as a disabled/empty destination before first save.
- My Space: visible only after engagement.
- Sources / About: under More/footer.
- Settings: authenticated only.

### Engagement rule

A user becomes `engaged` when any of these conditions is true:

```text
completed at least one Journey layer
OR
saved at least one Crystal
OR
has historical activity from a prior session/account migration
```

`engaged` is a derived state, not a manually editable user flag.

### Journey progression rule

- Journey overview is public.
- Layer 1 is available to start.
- A future layer is available only when all required prerequisite layers are complete.
- Completed layers remain revisitable.
- Frontend visibility is not security. The server validates completion prerequisites when progress is written.

---

## 5. Frontend feature boundaries

Target frontend structure:

```text
src/
  app/
    App.tsx
    routes.ts
    navigation.ts
    access-policy.ts

  features/
    home/
      HomePage.tsx
      components/

    library/
      LibraryHome.tsx
      WorldPage.tsx
      TopicPage.tsx
      CardDetail.tsx
      services/
      hooks/
      model/

    journey/
      JourneyHome.tsx
      JourneyLayer.tsx
      components/
      services/
      hooks/
      model/

    crystals/
      CrystalsPage.tsx
      CrystalDetail.tsx
      components/
      services/
      hooks/
      model/

    my-space/
      MySpacePage.tsx
      components/
      services/
      hooks/
      model/

    sources/
    about/
    settings/

  core/
    auth/
    learning-path/
    storage/
    types/

  design/
    ... existing canonical design system ...
```

Rules:

- Presentation components do not perform raw API calls.
- Services own HTTP requests and boundary parsing.
- Hooks own async orchestration and local UI state.
- Canonical truth remains in `server/` + database, never inferred by presentation code.
- Feature internals are not imported across sibling feature boundaries.

---

## 6. Canonical content model

The existing provenance domain answers: **Where did this knowledge come from and how strongly is it supported?**

The new Content Library layer answers: **How is validated knowledge organized and presented to learners?**

These are different responsibilities.

### 6.1 Content worlds

```text
content_worlds
- id UUID PK
- slug TEXT UNIQUE
- title_he TEXT
- title_en TEXT
- description_he TEXT
- description_en TEXT
- position INT
- status DRAFT | PUBLISHED | ARCHIVED
- version INT
- created_at
- updated_at
```

### 6.2 Topics

```text
content_topics
- id UUID PK
- world_id UUID FK -> content_worlds
- parent_topic_id UUID NULL FK -> content_topics
- slug TEXT UNIQUE
- title_he TEXT
- title_en TEXT
- description_he TEXT
- description_en TEXT
- difficulty OPTIONAL | INTERMEDIATE | ADVANCED
- estimated_read_minutes INT
- position INT
- status DRAFT | PUBLISHED | ARCHIVED
- version INT
- created_at
- updated_at
```

Topic hierarchy uses `parent_topic_id`; do not store the topic tree as one opaque JSON blob.

### 6.3 Knowledge Cards

```text
knowledge_cards
- id UUID PK
- topic_id UUID FK -> content_topics
- slug TEXT UNIQUE
- title_he TEXT
- title_en TEXT
- short_explanation_he TEXT
- short_explanation_en TEXT
- full_explanation_he TEXT
- full_explanation_en TEXT
- difficulty OPTIONAL | INTERMEDIATE | ADVANCED
- position INT
- status DRAFT | PUBLISHED | ARCHIVED
- version INT
- created_at
- updated_at
```

### 6.4 Card provenance links

A Knowledge Card is a curated presentation object. Its factual grounding must remain explicit.

```text
knowledge_card_evidence
- card_id UUID FK -> knowledge_cards
- evidence_id UUID FK -> evidence
- claim_id UUID FK -> claims
- relation PRIMARY | SUPPORTING | CONTEXT
- position INT
- PRIMARY KEY(card_id, evidence_id)
```

When exact `evidence_id` is not yet available during authoring, the card remains `DRAFT`; it must not be promoted to `PUBLISHED` by frontend code.

### 6.5 Related content

```text
knowledge_card_relations
- from_card_id UUID
- to_card_id UUID
- relation_type RELATED | PREREQUISITE | CONTRAST | EXTENSION
- position INT
```

```text
content_topic_relations
- from_topic_id UUID
- to_topic_id UUID
- relation_type RELATED | PREREQUISITE | CROSS_DOMAIN
- position INT
```

---

## 7. Journey model

The 18-layer Journey references canonical content instead of copying it.

### 7.1 Journey definition

```text
learning_journeys
- id UUID PK
- slug TEXT UNIQUE
- title_he TEXT
- title_en TEXT
- description_he TEXT
- description_en TEXT
- version INT
- status DRAFT | PUBLISHED | ARCHIVED
```

### 7.2 Layer definition

```text
journey_layers
- id UUID PK
- journey_id UUID FK
- layer_number INT
- slug TEXT
- title_he TEXT
- title_en TEXT
- introduction_he TEXT
- introduction_en TEXT
- reflection_prompt_he TEXT
- reflection_prompt_en TEXT
- estimated_minutes INT
- version INT
- status DRAFT | PUBLISHED | ARCHIVED
- UNIQUE(journey_id, layer_number)
```

### 7.3 Layer content

A layer is composed of ordered blocks:

```text
journey_layer_blocks
- id UUID PK
- layer_id UUID FK
- block_type TEXT
- position INT
- payload JSONB
```

Allowed v1 block types:

- `RICH_TEXT`
- `KNOWLEDGE_CARD_REF`
- `VIDEO`
- `AUDIO`
- `IMAGE`
- `REFLECTION_PROMPT`

`KNOWLEDGE_CARD_REF` stores a `cardId`, not a copy of card text.

---

## 8. User and authentication boundary

### 8.1 Provider-neutral identity

Backend code uses an internal actor contract:

```ts
interface AuthenticatedActor {
  userId: string;
  provider: string;
  providerSubject: string;
  email?: string;
}
```

The frontend never supplies an authoritative `ownerId` in mutations. The server derives the user from the authenticated session.

### 8.2 User profile

```text
users
- id UUID PK
- auth_provider TEXT
- auth_subject TEXT
- email TEXT
- created_at
- last_active_at
- UNIQUE(auth_provider, auth_subject)
```

```text
user_preferences
- user_id UUID PK FK -> users
- language HE | EN
- crystal_reminders_enabled BOOLEAN
- email_notifications_enabled BOOLEAN
- theme SYSTEM | LIGHT | DARK
- updated_at
```

Authentication vendor selection is explicitly deferred. The rest of the architecture must work regardless of provider.

---

## 9. User Journey progress

Do not use one `currentLayer` integer as source of truth.

```text
user_journey_layers
- user_id UUID FK -> users
- layer_id UUID FK -> journey_layers
- status LOCKED | UNLOCKED | IN_PROGRESS | COMPLETED
- first_opened_at TIMESTAMPTZ NULL
- last_viewed_at TIMESTAMPTZ NULL
- completed_at TIMESTAMPTZ NULL
- last_block_id UUID NULL
- updated_at TIMESTAMPTZ
- PRIMARY KEY(user_id, layer_id)
```

Derived values:

- current layer
- completion percentage
- resume layer
- completed layer count
- engagement status

The active layer is the earliest `IN_PROGRESS`, otherwise the first `UNLOCKED` layer.

---

## 10. Crystal model

A Crystal is a personal layer over a canonical Knowledge Card.

It must not become a second canonical copy of the card.

```text
user_crystals
- id UUID PK
- user_id UUID FK -> users
- card_id UUID FK -> knowledge_cards
- card_version INT
- saved_title_snapshot TEXT
- saved_summary_snapshot TEXT
- user_notes TEXT
- tags TEXT[]
- saved_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
- last_viewed_at TIMESTAMPTZ NULL
- view_count INT DEFAULT 0
- UNIQUE(user_id, card_id)
```

Why snapshots are retained:

- preserve what the user actually saved at that moment
- allow the canonical Card to evolve later
- keep the current Card as the canonical source while preserving personal history

### Simple v1 resurfacing

```text
crystal_reminders
- id UUID PK
- crystal_id UUID FK -> user_crystals
- remind_at TIMESTAMPTZ
- status SCHEDULED | DISMISSED | COMPLETED
- created_at
```

V1 supports manual presets such as 7 / 30 / 180 days. Adaptive spaced-repetition logic is explicitly future work.

---

## 11. Activity model and My Space

My Space is built from events and domain state.

```text
user_activity_events
- id UUID PK
- user_id UUID FK -> users
- event_type TEXT
- entity_type TEXT
- entity_id UUID NULL
- metadata JSONB
- occurred_at TIMESTAMPTZ
```

Initial event types:

- `JOURNEY_STARTED`
- `LAYER_OPENED`
- `LAYER_COMPLETED`
- `CRYSTAL_SAVED`
- `CRYSTAL_VIEWED`
- `CRYSTAL_NOTE_UPDATED`
- `TOPIC_VIEWED`

My Space does not persist copies of “recent activity” or “what is next.” Those views are computed from progress, crystals, and activity events.

---

## 12. API contracts

Public endpoints:

```text
GET /api/content/worlds
GET /api/content/worlds/:worldSlug
GET /api/content/topics/:topicSlug
GET /api/content/cards/:cardId
GET /api/journey
GET /api/journey/layers/:layerNumber
GET /api/sources
```

Authenticated endpoints:

```text
GET    /api/me
GET    /api/me/progress
POST   /api/me/journey/start
POST   /api/me/journey/layers/:layerNumber/open
POST   /api/me/journey/layers/:layerNumber/complete

GET    /api/me/crystals
POST   /api/me/crystals
GET    /api/me/crystals/:crystalId
PATCH  /api/me/crystals/:crystalId
DELETE /api/me/crystals/:crystalId

POST   /api/me/crystals/:crystalId/reminders
DELETE /api/me/crystals/:crystalId/reminders/:reminderId

GET    /api/me/space
PATCH  /api/me/preferences
```

API adapters under `api/` remain thin. Business logic belongs in `server/` modules.

Suggested server boundaries:

```text
server/
  auth/
  content/
  journey/
  crystals/
  my-space/
  knowledge/     # existing canonical provenance domain
```

---

## 13. Mutation event flows

### 13.1 Save as Crystal

```text
User clicks “Save as Crystal”
  -> frontend crystal service POST /api/me/crystals { cardId }
  -> if 401: preserve pending intent in session memory and open auth flow
  -> after successful auth: replay original save intent exactly once
  -> server resolves authenticated user
  -> server loads published card + version
  -> server creates crystal with canonical card reference + snapshots
  -> server emits CRYSTAL_SAVED
  -> response returns Crystal DTO
  -> UI updates saved state
```

The client must not create a fake Crystal before the server confirms ownership.

### 13.2 Complete a Journey layer

```text
User completes final required block
  -> POST /api/me/journey/layers/:n/complete
  -> server resolves user
  -> server loads layer + prerequisite policy
  -> server verifies layer is unlocked/in progress
  -> mark layer COMPLETED
  -> unlock next eligible layer
  -> emit LAYER_COMPLETED
  -> return updated progress snapshot
  -> UI renders next-layer action
```

The frontend must never unlock a layer by itself.

### 13.3 Home resume block

```text
Home renders public content immediately
  -> if authenticated, GET /api/me/progress
  -> if progress exists, show compact “resume” module
  -> Home layout remains Home; it is never replaced by My Space
```

### 13.4 My Space

```text
GET /api/me/space
  -> server aggregates:
       journey progress
       recent activity
       recent crystals
       next eligible layer
       optional supported insights later
  -> returns one presentation DTO
```

No canonical content is authored by this endpoint.

---

## 14. Authorization matrix

| Capability | Anonymous | Authenticated | Engaged | Owner/Admin |
|---|---:|---:|---:|---:|
| View Home | ✓ | ✓ | ✓ | ✓ |
| View Library | ✓ | ✓ | ✓ | ✓ |
| View published cards | ✓ | ✓ | ✓ | ✓ |
| View Journey overview | ✓ | ✓ | ✓ | ✓ |
| Start Journey | auth required at persistence boundary | ✓ | ✓ | ✓ |
| Save Crystal | triggers auth | ✓ | ✓ | ✓ |
| Edit own Crystal | — | ✓ | ✓ | ✓ |
| View My Space | — | empty/redirect until engaged | ✓ | ✓ |
| Manage canonical content | — | — | — | ✓ |
| Promote evidence/insight truth state | — | — | — | backend/domain only |

---

## 15. Content versioning and governance

Every published World, Topic, Card, Journey, and Layer has a version integer and lifecycle status.

Rules:

1. Editing draft content may update in place.
2. Material changes to published knowledge increment version.
3. A Crystal records the Card version at save time.
4. Canonical source/provenance records remain immutable according to existing domain rules.
5. Archived content remains addressable for existing Crystals/history but is removed from normal discovery.
6. Publication must be reviewable and attributable before a future CMS/admin UI is introduced.

---

## 16. Search architecture v1

Do not introduce vector search as a prerequisite for the Product IA.

V1 search can use PostgreSQL text search across:

- World titles/descriptions
- Topic titles/descriptions
- Knowledge Card titles/short/full explanation
- approved concept aliases

Search results return entity type + stable route.

Future semantic search can be added behind the same search service contract.

---

## 17. Migration from current application

### Phase 0 — Architecture lock

- Add this document.
- Treat Product IA v1 as product source of truth.
- Do not redesign legacy Dashboard while migration is in progress.

### Phase 1 — Route and navigation shell

- Introduce parsed `AppRoute`.
- Change initial post-Welcome destination to `home`.
- Add Home, Journey, Library route identities.
- Rename the current Journey route from legacy `library` to `journey` without deleting Journey data.
- Move Dashboard/Today out of primary first-time flow.

### Phase 2 — Content Library foundation

- Add content-world/topic/card tables.
- Build Content Library service contracts.
- Seed one vertical slice only:
  - World: The Body as System
  - Topic: Nervous System
  - 5–10 Knowledge Cards
- Prove deep links, related topics, evidence references, and mobile rendering before importing 100+ topics.

### Phase 3 — Crystal v1

- Introduce account/session boundary.
- Migrate current fragment-based Crystal persistence to card-based Crystal records where mapping exists.
- Add notes, tags, and stable Crystal detail route.
- Implement auth-resume save flow.

### Phase 4 — Journey adaptation

- Map existing 18-layer learning path to `learning_journeys` + `journey_layers`.
- Embed Card references rather than duplicated card content.
- Move progress from browser-local ownership to authenticated repository/server contracts.
- Keep backward compatibility during migration.

### Phase 5 — My Space

- Build only after Journey and Crystals generate real user state.
- Replace the current first-session/dashboard mental model with a derived personal status surface.

### Phase 6 — Cleanup

- Remove obsolete navigation ids and legacy first-session gates only after routes and data migration are verified.
- Keep old adapters until no imports remain.

---

## 18. First engineering vertical slice

The first implementation slice should prove architecture, not breadth.

Deliver this end-to-end:

```text
Welcome
  -> Home
  -> Content Library
  -> World: The Body as System
  -> Topic: Nervous System
  -> Knowledge Card
  -> Save as Crystal
  -> My Crystals
```

Success criteria:

- Home is not My Space.
- Library is public.
- Card has stable URL and provenance reference.
- Save requires/obtains identity without losing user intent.
- Crystal references Card + version and stores personal metadata separately.
- No existing source/provenance data is overwritten.
- Build passes on Vercel Preview.

Only after this slice works should engineering populate the complete taxonomy.

---

## 19. Explicit non-goals for v1

Not required to begin:

- community comments
- public profiles
- Crystal sharing
- AI-generated personal conclusions
- adaptive spaced repetition
- vector search
- native mobile app
- offline mode
- collaborative groups
- advanced analytics
- automatic publishing of AI-generated content

---

## 20. Engineering invariants

1. **Source truth is immutable.**
2. **Knowledge Cards are presentation objects grounded in provenance.**
3. **Journey references knowledge; it does not fork canonical knowledge.**
4. **Crystals are user-owned annotations over canonical knowledge.**
5. **My Space owns no canonical knowledge.**
6. **Progress unlocks are validated by server/domain policy.**
7. **Frontend cannot promote claims or insights to supported truth.**
8. **Navigation visibility is not authorization.**
9. **No raw database concerns leak into React components.**
10. **Migration is incremental; current working product is not replaced in one rewrite.**

---

## 21. Immediate next engineering tasks

1. Add `AppRoute` parser and route contract.
2. Create `home` feature shell with Home route.
3. Rename legacy Journey navigation identity from `library` to `journey` behind compatibility mapping.
4. Create empty `library` feature boundary for the new Content Library.
5. Draft migration `005_content_library_foundation.sql`.
6. Define server DTOs for World, Topic, Knowledge Card, Crystal, Progress, and My Space.
7. Implement one Nervous System vertical slice before broader content import.

---

**Decision status:** Ready to begin implementation after review of route names and data ownership boundaries.

# E.I.L — Product Information Architecture

**Version:** 1.0  
**Date:** August 2026  
**Status:** Specification Document  
**Audience:** Product, Design, Engineering

---

## Core Principle

> **Knowledge is public. Journey is personal. State is contextual.**

E.I.L is a learning environment where:

- Knowledge is discoverable and explorable through the **Content Library**.
- Learning follows a structured spiral pathway through the **Learning Journey**.
- Personal progress lives in **My Space**.
- Saved knowledge lives in **My Crystals**.
- **Home** orients every visitor and gives them a clear choice of where to begin.

---

## Product Spaces

| Space | Purpose | Audience | When |
|---|---|---|---|
| Home | Orientation, clarity, choice | Every user | First visit and returns |
| Content Library | Knowledge exploration | Curious learners | Any time |
| Learning Journey | Guided 18-layer progression | Learners seeking structure | During guided learning |
| My Crystals | Personal knowledge vault | Users who save knowledge | After saving |
| My Space | Personal progress and next steps | Engaged users | After activity begins |

---

## Primary Navigation

```text
E.I.L
├── Home
├── Learning Journey
├── Content Library
├── My Crystals
├── My Space
└── More
    ├── Sources
    ├── About E.I.L
    └── Settings
```

---

## Content Library Hierarchy

```text
Content Library
├── The Human Within
├── The Body as System
├── The Human and the World
├── Change & Growth
└── Meaning & Purpose
```

Each World contains Topics. Each Topic contains a hierarchy of subtopics and Knowledge Cards.

A Knowledge Card represents one discrete idea and contains:

- title
- 2–4 sentence explanation
- expandable full explanation
- related concepts
- source/provenance reference
- `Save as Crystal`

A Knowledge Card is system-provided canonical presentation content. A Crystal is a personal saved object created by the user.

---

# Page Definitions

## 1. Home

**Purpose:** Orientation + Choice  
**Audience:** Everyone

### Hero

- Abstract human figure, small relative to a much larger space.
- Headline: **“להבין יותר. לראות עמוק יותר. לחיות אחרת.”**
- Short explanation of E.I.L as a framework for understanding the human through connected knowledge and lived learning.
- CTAs:
  - **התחל את המסע** → Learning Journey
  - **ספריית התוכן** → Content Library
- Returning users may see a compact Resume module, but Home remains Home.

### What is E.I.L?

Overview of five Worlds:

1. The Human Within
2. The Body as System
3. The Human and the World
4. Change & Growth
5. Meaning & Purpose

Each World links directly into the Content Library.

### How We Learn Here

Headline: **“אנחנו לא לומדים בקו ישר”**

Explain Spiral Learning through:

- revisit in a new context
- bridge between domains
- apply and experience

The visual language should use a spiral rather than a linear progress bar.

### Why I Built This

First-person creator narrative:

- knowledge today is abundant but fragmented
- the value comes from connections, not accumulation alone
- E.I.L is intended to become a map for understanding the human

Core statement:

> The goal is not another content site. The goal is to build a map for understanding the human.

### Content Preview

Show 5–6 featured topics and link to the full Content Library.

---

## 2. Learning Journey

**Purpose:** Guided spiral progression through 18 structured layers.

The Journey is structured, but conceptually spiral rather than purely linear. Users revisit themes with deeper context.

### Journey behavior

- First visit begins at Layer 1.
- Completing a layer unlocks the next.
- Users cannot programmatically skip locked layers.
- Completed layers remain revisitable.
- Resume returns the user to the last active layer/block.

### Layer layout

- persistent/collapsible 18-layer navigator
- current layer highlighted
- current progress
- layer title + introduction
- 1–3 core learning blocks
- optional media
- embedded Knowledge Cards
- reflection prompt
- next/previous navigation
- related Library topics

Knowledge Cards used inside the Journey are the same canonical cards used in the Library, presented in a different learning context.

---

## 3. Content Library

**Purpose:** Open exploration without commitment.

### Five Worlds

#### The Human Within

Examples:
- Consciousness & Awareness
- Identity & Self
- Emotions & Beliefs
- Inner Mechanisms

#### The Body as System

Examples:
- Nervous System
- Brain & Cognition
- Hormones & Chemistry
- Movement & Fascia
- Sleep, Breathing & Recovery
- Nutrition & Energy

#### The Human and the World

Examples:
- Communication & Presence
- Relationships & Attachment
- Social Influence
- Culture & Environment
- Technology & Mind

#### Change & Growth

Examples:
- Habits & Behavior Change
- Learning & Mastery
- Resilience & Adaptation
- Creativity & Problem-Solving

#### Meaning & Purpose

Examples:
- Values & Priorities
- Existential Questions
- Philosophy & Frameworks
- Spirituality & Transcendence
- Legacy & Impact

### Library Home

- search
- optional filters
- five World cards

### World Page

- title
- description
- topic count
- topic grid

### Topic Page

- title + overview
- breadcrumb
- topic map / subtopic hierarchy
- Knowledge Cards
- related Topics
- back navigation

Example topic map:

```text
The Nervous System
├── Structure & Function
│   ├── CNS vs. PNS
│   └── Basic anatomy
├── Sympathetic Branch
│   ├── Activation patterns
│   └── Fight / Flight / Freeze
├── Parasympathetic Branch
│   ├── Vagus nerve
│   └── Rest & Digest
└── Regulation & Balance
    ├── Polyvagal Theory
    └── Somatic practices
```

Every Topic and Card must have a stable unique URL.

---

## 4. My Crystals

**Purpose:** Personal knowledge vault.

### Core distinction

> **Knowledge Card = system-provided knowledge object.**  
> **Crystal = user-saved personal layer over that knowledge object.**

When a user saves a Card as a Crystal:

1. Save the canonical Card reference.
2. Preserve relevant save-time context/version.
3. Allow personal notes.
4. Allow tags.
5. Link back to the original Topic/Card.

### Crystal Dashboard

- crystal count
- filter by World
- sort by date/name
- user tags
- grid/list of saved Crystals

### Crystal Detail

Sections:

- The Idea in Short
- Why This Matters
- How It Connects
- The Source
- My Thoughts
- Save for Later
- Delete Crystal

### Resurfacing v1

Manual reminder presets may include:

- 7 days
- 30 days
- 6 months

Adaptive spaced repetition is future work.

---

## 5. My Space

**Purpose:** Personal state, progress, and next actions.

My Space appears after meaningful engagement:

- first completed Journey layer, or
- first saved Crystal, or
- historical activity exists

### Sections

#### Status Summary

- current layer
- completion percentage
- recent engagement
- Continue Journey

#### Recent Activity

- recent Crystals
- completed layers
- later: optional streaks

#### What I’ve Understood

- major themes
- explored domains
- connections surfaced from user activity

#### What’s Next?

- next Journey layer, or
- suggested related Library topics

#### My Crystals Preview

- latest three Crystals
- View All

### Core rule

> **My Space does not own knowledge. It reflects the user’s relationship with knowledge.**

---

## 6. Sources

**Purpose:** Transparency and research grounding.

Sections:

- About This Library
- Source Categories
- Full Source List
- links from Sources back to Topics where used

Example categories:

- Neuroscience & Biology
- Psychology & Behavioral Science
- Philosophy & Existentialism
- Spirituality & Contemplative Traditions
- Somatic & Movement
- Systems & Complexity
- Relationships & Attachment
- Modern Frameworks & Applications

---

## 7. About E.I.L

**Purpose:** Narrative, creator vision, and method.

Sections:

- The Why
- The How
- The Who
- The Vision
- Get in Touch

Tone: personal, warm, non-corporate.

---

## 8. Settings

Authenticated user preferences:

- language
- notification preferences
- future theme options
- export data
- privacy controls
- delete account
- logout

---

# User Journey Maps

## Curious First-Time User

```text
Home
  -> Content Library
  -> World
  -> Topic
  -> Knowledge Cards
  -> Save first Crystal
  -> My Crystals
  -> optional Journey later
```

**Key value moment:** first saved Crystal.

## Committed First-Time User

```text
Home
  -> Learning Journey
  -> Layer 1
  -> complete layer
  -> save key Cards as Crystals
  -> Layer 2 unlocked
```

**Key commitment moment:** completing Layer 1.

## Returning Journey User

```text
Home
  -> Resume module
  -> active Layer
  -> complete layer
  -> Crystals / related Library exploration
```

## Returning Library Explorer

```text
Home or Library
  -> search
  -> Topic
  -> Cards
  -> save Crystals
  -> revisit My Crystals
```

---

# Navigation Model

## Global

- E.I.L logo → Home
- Home
- Learning Journey
- Content Library
- My Crystals
- My Space
- More

## Contextual

Journey:

- 18-layer navigator
- next / previous
- return to Journey

Library:

- Home > World > Topic breadcrumb
- related Topics
- back to World / Library

Crystals:

- source Topic link
- related concepts
- explore more in Library

---

# Data Model Intent

## User

User identity, preferences, progress, and Crystals are private by default.

## Knowledge Card

Canonical curated presentation object linked to evidence/provenance.

## Topic

Belongs to a World, may have subtopics, Cards, and related Topics.

## Chapter / Layer

One of 18 Journey layers. References shared Knowledge Cards rather than copying them.

## Crystal

User-owned metadata over a canonical Card, including notes/tags/reminder state and save-time version context.

---

# Content Delivery Rules

| Content Type | Library | Journey | My Space | Crystals |
|---|---|---|---|---|
| Knowledge Cards | Primary | Embedded reference | No | Saved reference/context |
| Full explanations | Yes | Yes | No | Context/reference |
| Topics | Primary | Related | Mentioned | Source link |
| Journey Layers | No | Primary | History/status | No |
| User Notes | No | Optional later | Optional summary | Primary |
| Progress | No | Visible | Primary aggregate | No |

Knowledge Cards are shared canonical content. Context changes; truth does not.

---

# Governance

Content should be:

- versioned
- author-attributable
- reviewable before publication
- archivable without breaking historical links

No legal claim such as “all content is CC-licensed” is considered final until the exact licensing policy is approved.

Privacy and data deletion/export requirements must be implemented according to the jurisdictions and product rollout actually chosen.

---

# v1 Non-Goals / Future

Not required for initial product architecture:

- community discussions
- peer Crystal reviews
- collaborative groups
- AI-generated personal conclusions
- advanced learning analytics
- adaptive spaced repetition
- native mobile application
- offline access
- full multilingual rollout

---

# Success Signals

Future tracking may include:

- Layer 1 completion
- average Crystals saved
- 7-day return rate
- Library vs Journey engagement
- frequently saved Topics
- reminder revisit rate

---

# Engineering Handoff Principle

The product should be implemented in this order:

```text
App shell + navigation
  -> Home
  -> Content Library taxonomy
  -> Topic + Knowledge Card
  -> Save as Crystal
  -> My Crystals
  -> Learning Journey adaptation
  -> My Space
```

My Space comes after the systems that generate meaningful personal state.

# Wireframes

Low-fidelity wireframes for the Milestone 1 pages. The implemented UI follows these structures with the "Botanical Clinic" design system (glass cards over an aurora background, Fraunces display type, light/dark themes). Layout collapses to a single column with bottom navigation under 860 px.

## 1. Login page

```
┌─────────────────────────────────┬──────────────────────────────┐
│  (aurora gradient hero)         │        ┌────────────────┐    │
│                                 │        │ Welcome back    │    │
│  Skin intelligence,             │        │ ─────────────── │    │
│  made personal.                 │        │ Email  [______] │    │
│                                 │        │ Passwd [______] │    │
│  Track your skin's story…       │        │ [   Sign in   ] │    │
│                                 │        │ New here? Link  │    │
│                                 │        │ demo accounts…  │    │
└─────────────────────────────────┴──────────────────────────────┘
```

## 2. Registration page

Same split layout; the form adds **Full name** and a **role selector** (Patient / Dermatologist / Skincare Consultant) with a note that provider accounts are reviewed by an administrator before going live.

## 3. User dashboard (patient — unique layout)

```
┌ sidebar ┬──────────────────────────────────────────────────────┐
│ Lumen  │ Hello, Priya            [bell•] [theme]              │
│ PATIENT │ ┌──────────────────────────────┬───────────────────┐ │
│ Dash    │ │  ◔ SCORE DIAL   76 / 100     │  ✦ AI daily tip   │ │
│ Skin    │ │  "Improving" +3 vs last week │  (gradient card)  │ │
│ Life    │ └──────────────────────────────┴───────────────────┘ │
│ Routine │ ┌────────┬────────┬────────┬────────┐                │
│ Derms   │ │Hydration│ Acne  │ Sleep  │ Water  │  stat cards    │
│ Appts   │ └────────┴────────┴────────┴────────┘                │
│ Consult │ ┌───────────────────────────┬───────────────────────┐│
│ Products│ │ Skin score · 12 weeks ∿∿∿ │ Pigmentation trend ∿∿ ││
│ Progress│ └───────────────────────────┴───────────────────────┘│
│ Notifs  │ ┌───────────────────────────┬───────────────────────┐│
│ ──────  │ │ Upcoming appointments     │ Consultant sessions   ││
│ Signout │ │ Dr. Bose · Mon 10:00 ✔    │ routine planning ⏳    ││
└─────────┴──────────────────────────────────────────────────────┘
```

## 4. Skin profile page

```
┌ Skin profile ────────────────────────────────────────┐
│ Age [__]  Gender [v]  Skin type [v]  Skin tone [v]   │
│ Concerns        [__________________________]         │
│ Allergies       [__________________________]         │
│ Sensitivities   [__________________________]         │
│ Medical history [__________________________]         │
│ Current products[__________________________]         │
│ Goals           [__________________________]         │
│                                   [ Save profile ]   │
└──────────────────────────────────────────────────────┘
```

## 5. Skin assessment page (lifestyle + progress check-in)

```
┌ Daily check-in ─────────────────────┐ ┌ History ──────────────┐
│ Sleep (h) [7.5]  Water (L) [2.5]    │ │ date  sleep water …   │
│ Exercise (min) [30] Stress 1–10 [4] │ │ …     …     …         │
│ Environment [low|moderate|high v]   │ │                       │
│ [ Log today ]                       │ │                       │
└─────────────────────────────────────┘ └───────────────────────┘
```

## 6. Product recommendation page

```
┌ Filters: [search] [category v] [tier v] [skin type v] [price v] ┐
├───────────────┬───────────────┬───────────────┐
│ Product card  │ Product card  │ Product card  │
│ name · brand  │  …            │  …            │
│ ₹price  tier  │               │               │
│ ingredient    │               │               │
│ chips + notes │               │               │
└───────────────┴───────────────┴───────────────┘
```

## 7. Progress tracking page

```
┌ Log a check-in ─────────┐ ┌ Charts ────────────────────────────┐
│ Skin score [76]         │ │ Skin score  ∿∿∿∿∿∿∿  (area chart)  │
│ Hydration  [70]         │ │ Hydration   ∿∿∿∿∿∿∿               │
│ Acne 0–10  [3]          │ │ Acne (inv)  ∿∿∿∿∿∿∿               │
│ Pigment 0–10 [2]        │ └────────────────────────────────────┘
│ [ Save entry ]          │
└─────────────────────────┘
```

## 8. Dermatologist directory + booking (patient)

```
┌ Find a dermatologist: [search] [location] [specialty v] [fee v] ┐
├──────────────┬──────────────┬──────────────┐
│ ◉ Dr. Bose   │ ◉ Dr. Mehta  │ ◉ Dr. Lin    │
│ MBBS MD      │ …            │ …            │
│ chips: Acne… │              │              │
│ ★4.8 · ₹800  │              │              │
│ [ Book ]     │              │              │
└──────────────┴──────────────┴──────────────┘
Booking modal: date picker → live slot chips (10:00 10:30 …)
→ consultation type → reason → [Confirm Mon at 10:00]
```

## 9. Dermatologist / consultant dashboards

Same layout family, different widgets and permissions: stat row (today's visits / pending / upcoming / completed for the doctor; new requests / routine requests / active clients / completed sessions for the consultant), then two management lists with accept–decline actions.

## 10. Administrator dashboard

Platform stat grid (users by role, appointments by status, approvals waiting, products, audit events) + latest-activity feed, with pages for Users (role assignment, suspend, approve providers), all Appointments, Products CRUD, Broadcast, and the full Audit Log table.

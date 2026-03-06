# DOKit Design System
## The Bible for All DOKit Products

**Owner:** Doc
**Last Updated:** 2026-03-06
**Applies To:** Marketing Site, Super Admin Dashboard, Client Dashboard

---

## 🎯 Design Philosophy

DOKit is a **premium AI-powered document intelligence platform** serving healthcare, legal, and enterprise clients. The design must communicate:

1. **Intelligence** — AI-powered, smart, automated
2. **Trust** — Secure, compliant, reliable (HIPAA, AWS BAA)
3. **Speed** — Fast processing, real-time results
4. **Premium** — Worth $2,500-10,000/month

**The "Holy Shit" Test:** Every screen should make users think "this is professional" at minimum, and "this is amazing" at best.

---

## 🎨 Color System

### Primary Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Indigo 600** | `#4F46E5` | Primary buttons, active states, key metrics |
| **Indigo 500** | `#6366F1` | Secondary accents, hover states |
| **Violet 500** | `#8B5CF6` | Gradient endpoint, special highlights |
| **Cyan 500** | `#06B6D4` | Real-time indicators, "live" badges |

### Signature Gradient

```css
/* Primary Brand Gradient - Use for key CTAs, active states, hero elements */
.gradient-primary {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
}

/* Subtle Gradient - Use for card accents, borders */
.gradient-subtle {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
}

/* Button Gradient */
.gradient-button {
  background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
}
```

### Status Colors

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| **Success** | Emerald | `#10B981` | Completed, approved, healthy |
| **Warning** | Amber | `#F59E0B` | Pending review, configuring |
| **Error** | Rose | `#F43F5E` | Failed, error, critical |
| **Info** | Blue | `#3B82F6` | Informational, processing |
| **Live** | Cyan | `#06B6D4` | Real-time, active processing |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Slate 900** | `#0F172A` | Sidebar background, text primary |
| **Slate 800** | `#1E293B` | Sidebar hover states |
| **Slate 700** | `#334155` | Borders on dark |
| **Slate 600** | `#475569` | Text secondary on dark |
| **Slate 200** | `#E2E8F0` | Borders on light |
| **Slate 100** | `#F1F5F9` | Card backgrounds, zebra stripes |
| **Slate 50** | `#F8FAFC` | Page background |
| **White** | `#FFFFFF` | Card backgrounds, content areas |

---

## 📝 Typography

### Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Type Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **Display** | 48px | 700 | 1.1 | Hero headlines, big numbers |
| **H1** | 32px | 700 | 1.2 | Page titles |
| **H2** | 24px | 600 | 1.3 | Section headers |
| **H3** | 18px | 600 | 1.4 | Card titles |
| **H4** | 16px | 600 | 1.4 | Subsection headers |
| **Body** | 14px | 400 | 1.6 | Default text |
| **Body Small** | 13px | 400 | 1.5 | Secondary text |
| **Caption** | 12px | 500 | 1.4 | Labels, badges |
| **Overline** | 11px | 600 | 1.4 | Section labels, uppercase |

### Big Numbers (Stats)

```css
.stat-number {
  font-size: 36px;
  font-weight: 700;
  font-feature-settings: 'tnum' 1; /* Tabular numbers */
  letter-spacing: -0.02em;
}

.stat-number-large {
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 📦 Components

### Stat Cards

**Standard Stat Card:**
```
┌────────────────────────────────────┐
│ ┌────┐                       +12% │
│ │ 📄 │  Total Documents           │
│ └────┘                             │
│ ═══════════════════════════        │ ← sparkline (optional)
│ 2,847                              │ ← animated counter
│ ▲ 342 from last week               │
└────────────────────────────────────┘
```

**CSS:**
```css
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
  border: 1px solid #F1F5F9;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px -10px rgba(99, 102, 241, 0.15);
  border-color: #E0E7FF;
}

.stat-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
  color: #4F46E5;
}

.stat-card-trend {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}

.stat-card-trend.positive {
  background: #D1FAE5;
  color: #059669;
}

.stat-card-trend.negative {
  background: #FEE2E2;
  color: #DC2626;
}
```

**Animation:**
```javascript
// Counter animation on load
function animateCounter(element, target, duration = 1000) {
  let start = 0;
  const increment = target / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    element.textContent = Math.floor(start).toLocaleString();
    if (start >= target) {
      element.textContent = target.toLocaleString();
      clearInterval(timer);
    }
  }, 16);
}
```

### Sidebar (Dark Theme)

**Structure:**
```
┌─────────────────────────┐
│ [Logo] DOKit            │
│ Admin Dashboard         │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Client Name     ▼   │ │ ← Client switcher
│ │ Pro Plan            │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ MAIN                    │
│   ◉ Dashboard           │ ← Active: gradient bg + white text
│   ○ Documents      247  │ ← Badge
│   ○ Upload              │
│                         │
│ PROCESSING              │
│   ○ Review Queue   12   │
│   ○ Decision Rules      │
│   ○ Integrations        │
│                         │
│ ANALYTICS               │
│   ○ Reports             │
│   ○ Audit Trail         │
├─────────────────────────┤
│ [Avatar] Jane Doe       │
│          Administrator  │
│ ○ Sign Out              │
└─────────────────────────┘
```

**CSS:**
```css
.sidebar {
  width: 260px;
  height: 100vh;
  background: #0F172A;
  color: #94A3B8;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  padding: 24px;
  border-bottom: 1px solid #1E293B;
}

.sidebar-logo img {
  height: 32px;
}

.sidebar-logo span {
  color: white;
  font-size: 20px;
  font-weight: 700;
}

.sidebar-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  padding: 16px 20px 8px;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  color: #94A3B8;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
}

.sidebar-nav-item:hover {
  background: rgba(255,255,255,0.05);
  color: white;
}

.sidebar-nav-item.active {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, transparent 100%);
  color: white;
  border-left-color: #6366F1;
}

.sidebar-badge {
  margin-left: auto;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.2);
  color: #A5B4FC;
  border-radius: 6px;
}
```

### Buttons

**Primary Button (Gradient):**
```css
.btn-primary {
  background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
}

.btn-primary:active {
  transform: translateY(0);
}
```

**Secondary Button:**
```css
.btn-secondary {
  background: white;
  color: #0F172A;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
}
```

**Ghost Button:**
```css
.btn-ghost {
  background: transparent;
  color: #6366F1;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: rgba(99, 102, 241, 0.1);
}
```

### Status Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
}

.badge-success {
  background: #D1FAE5;
  color: #059669;
}

.badge-warning {
  background: #FEF3C7;
  color: #D97706;
}

.badge-error {
  background: #FEE2E2;
  color: #DC2626;
}

.badge-info {
  background: #DBEAFE;
  color: #2563EB;
}

.badge-live {
  background: #CFFAFE;
  color: #0891B2;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Document Row

```css
.document-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.15s ease;
}

.document-row:hover {
  background: #F8FAFC;
}

.document-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-icon.cms-1500 {
  background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
  color: #7C3AED;
}

.document-icon.ub-04 {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #059669;
}

.document-icon.eob {
  background: linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%);
  color: #0891B2;
}

.document-icon.unknown {
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  color: #DC2626;
}

.document-name {
  font-weight: 500;
  color: #0F172A;
}

.document-meta {
  font-size: 13px;
  color: #64748B;
}

.document-confidence {
  font-size: 14px;
  font-weight: 600;
}
```

### Cards

**Standard Card:**
```css
.card {
  background: white;
  border-radius: 16px;
  border: 1px solid #F1F5F9;
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #0F172A;
}

.card-body {
  padding: 20px;
}
```

**Accent Card (for important info):**
```css
.card-accent {
  background: white;
  border-radius: 16px;
  border: 1px solid #E0E7FF;
  border-left: 4px solid #6366F1;
  padding: 20px;
}
```

---

## 🌊 Animations & Transitions

### Timing Functions

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}
```

### Standard Transitions

```css
/* Cards, buttons */
transition: all 0.2s var(--ease-out);

/* Navigation, menus */
transition: all 0.15s ease;

/* Page transitions */
transition: all 0.3s var(--ease-out);
```

### Micro-Interactions

**Hover Lift:**
```css
.lift-on-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.lift-on-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
}
```

**Live Pulse:**
```css
@keyframes live-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(6, 182, 212, 0);
  }
}

.live-indicator {
  animation: live-pulse 2s infinite;
}
```

**Counter Animation:**
```css
@keyframes count-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-number {
  animation: count-up 0.5s ease-out;
}
```

---

## 🖥️ Layout Grid

### Dashboard Layout

```
┌────────────────────────────────────────────────────────┐
│ [Sidebar 260px] │ [Main Content - fluid]               │
│                 │ ┌────────────────────────────────┐   │
│                 │ │ Header (sticky, 64px)          │   │
│                 │ ├────────────────────────────────┤   │
│                 │ │ Page Content (scrollable)      │   │
│                 │ │                                │   │
│                 │ │ Max-width: 1200px              │   │
│                 │ │ Padding: 32px                  │   │
│                 │ │                                │   │
│                 │ └────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### Stat Grid

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🌈 Gradient Orb (Background)

**The signature DOKit background element:**

```css
.gradient-orb {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: 
    radial-gradient(circle at 30% 40%, rgba(255, 150, 180, 0.6) 0%, transparent 40%),
    radial-gradient(circle at 70% 50%, rgba(120, 180, 255, 0.6) 0%, transparent 40%),
    radial-gradient(circle at 50% 60%, rgba(180, 160, 255, 0.7) 0%, transparent 45%),
    radial-gradient(circle at 60% 30%, rgba(140, 230, 240, 0.5) 0%, transparent 35%);
  filter: blur(40px);
  opacity: 0.7;
  pointer-events: none;
  animation: float 12s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.02); }
}
```

---

## 🎯 Marketing Site Specifics

### Hero Section

```
┌─────────────────────────────────────────────────────────┐
│ [Nav: Logo | Features | Modules | Security | CTA]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│           From Documents to Decisions                   │
│              in Seconds                                 │
│                                                         │
│    Stop reading. Start knowing. DOKit's AI extracts,   │
│    classifies, and acts on your documents instantly.   │
│                                                         │
│         [Get Started - gradient] [Watch Demo]          │
│                                                         │
│    "10,000+ documents processed daily"                 │
│    [Client logos: healthcare, legal, insurance]        │
│                                                         │
│              [Animated Dashboard Preview]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Headlines to Use

| Current | Upgraded |
|---------|----------|
| "AI-powered document intake" | "From Documents to Decisions in Seconds" |
| "Streamline your document workflow" | "Stop Reading. Start Knowing." |
| "Everything you need..." | "One Platform. Every Document. Zero Manual Work." |

### Social Proof Section

```
┌─────────────────────────────────────────────────────────┐
│                 Trusted by Healthcare Leaders           │
│                                                         │
│   [Logo] [Logo] [Logo] [Logo] [Logo]                   │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ "DOKit reduced our claims processing time by 80%.   ││
│ │  We went from 3 days to 3 hours."                   ││
│ │                                                     ││
│ │ [Photo] Sarah Johnson                               ││
│ │         COO, Memorial Health Network                ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ 10M+     │  │ 99.2%    │  │ <10sec   │            │
│   │ Documents│  │ Accuracy │  │ Avg Time │            │
│   └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Implement color system CSS variables
- [ ] Set up typography scale
- [ ] Create button component styles
- [ ] Create badge component styles
- [ ] Update sidebar to dark theme (Super Admin)

### Phase 2: Components (Week 2)
- [ ] Redesign stat cards with icons + trends
- [ ] Add counter animation to stats
- [ ] Redesign document rows with colored icons
- [ ] Add hover lift effects to cards
- [ ] Implement gradient orb consistently

### Phase 3: Polish (Week 3)
- [ ] Add micro-animations
- [ ] Implement live pulse indicators
- [ ] Add loading states
- [ ] Test responsive breakpoints
- [ ] Cross-browser testing

### Phase 4: Marketing Site (Week 4)
- [ ] Update hero headline
- [ ] Add animated dashboard preview
- [ ] Create social proof section
- [ ] Add bold stats section
- [ ] Implement interactive demo (stretch)

---

## 📁 File Structure

```
/styles
  globals.css        # Base styles, CSS variables
  components.css     # Component-specific styles
  animations.css     # All animations
  utilities.css      # Utility classes

/components
  StatCard.tsx       # Stat card component
  Badge.tsx          # Status badges
  Button.tsx         # Button variants
  Sidebar.tsx        # Dark sidebar
  DocumentRow.tsx    # Document list item
  Card.tsx           # Card variants
```

---

## 🚫 Don't Do

- ❌ Use multiple primary colors (pick Indigo OR Cyan, not both randomly)
- ❌ Flat cards with no hover state
- ❌ Generic icons from random icon packs
- ❌ Inconsistent border radius (stick to 12px or 16px)
- ❌ Pure black text (#000) — use Slate 900 (#0F172A)
- ❌ White sidebar on dashboards (use dark)
- ❌ Static numbers without animation
- ❌ Empty states without helpful guidance

---

## ✅ Do

- ✅ Use consistent gradient accents
- ✅ Add hover states to everything interactive
- ✅ Animate numbers on load
- ✅ Use status colors consistently
- ✅ Add subtle shadows for depth
- ✅ Include loading states
- ✅ Make empty states delightful
- ✅ Test on mobile

---

*This is the DOKit Design Bible. Every pixel should follow these guidelines.*
*— Doc, March 6, 2026*

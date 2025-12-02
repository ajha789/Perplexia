# Perplexia Design Guidelines

## Design Approach
**Reference-Based:** Drawing from Linear, VS Code, and Notion for a modern developer-focused experience that prioritizes clarity, efficiency, and professional aesthetics.

## Core Design Principles
1. **Developer-First Interface**: Clean, distraction-free environment optimized for code generation and review
2. **Information Hierarchy**: Clear visual separation between chat, code blocks, and UI controls
3. **Functional Minimalism**: Every element serves a purpose; no decorative flourishes

---

## Typography System

**Primary Font**: Inter (Google Fonts) - Clean, modern sans-serif
**Monospace Font**: JetBrains Mono (Google Fonts) - For all code blocks

**Hierarchy:**
- Page Title/Brand: text-2xl font-semibold
- Chat Messages (User): text-base font-medium
- Chat Messages (AI): text-base
- Code Blocks: text-sm font-mono
- Sidebar Items: text-sm
- Labels/Metadata: text-xs
- Buttons: text-sm font-medium

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 3, 4, 6, 8** (e.g., p-4, gap-6, m-8)

**Core Layout Structure:**
```
[Sidebar: 280px fixed] | [Main Content: flex-1]
```

**Sidebar (Left, Fixed Width 280px):**
- Logo/brand at top (h-16 with p-4)
- "New Chat" button (w-full, mb-4)
- Scrollable chat history list (flex-1 overflow-y-auto)
- API status indicator at bottom (p-4)
- Each chat item: p-3 rounded-lg with truncated text

**Main Content Area:**
- Header bar (h-16): Model selector dropdown + settings icon
- Messages container (flex-1 overflow-y-auto): max-w-4xl mx-auto with p-6
- Input area (fixed bottom): max-w-4xl mx-auto with p-4

**Responsive Behavior:**
- Desktop (lg+): Sidebar visible, full layout
- Mobile (<lg): Sidebar hidden, hamburger menu to toggle overlay sidebar

---

## Component Library

### Navigation & Controls
**Sidebar Chat Items:**
- Compact list items with hover states
- Truncate long titles with ellipsis
- Small timestamp underneath (text-xs)
- Delete icon on hover (right side)

**Model Selector Dropdown:**
- Positioned in header, right-aligned
- Shows current model name with chevron-down icon
- Dropdown menu showing all 5 Perplexity models:
  - Sonar Pro
  - Sonar
  - Sonar Reasoning  
  - Sonar Deep Search
  - (List each with radio button/checkmark for selected)

**New Chat Button:**
- Full-width in sidebar
- Icon (plus) + "New Chat" text
- Prominent, easy to find

### Chat Interface
**Message Bubbles:**
- User messages: Aligned right, max-w-3xl, rounded corners
- AI messages: Aligned left, full width, no background (just text)
- Avatar icons: Small circular icons (h-8 w-8) for user and AI
- Spacing: gap-6 between messages

**Code Blocks:**
- Full-width within message
- Language label in top-right corner (small badge)
- Copy button in top-right (hover to show)
- Syntax highlighting using Prism.js or Highlight.js
- Rounded corners, distinct treatment from text
- p-4 padding inside code block

**Download Button:**
- Appears after AI generates project files
- "Download ZIP" with download icon
- Positioned below the relevant message
- Secondary button style

### Form Elements
**Message Input:**
- Multi-line textarea (min 3 rows, max 8 rows auto-expand)
- Rounded border
- Send button (icon only: paper plane) positioned bottom-right of textarea
- Placeholder: "Ask Perplexia to build your Django project..."

### Status Indicators
**API Key Status (Bottom of Sidebar):**
- Shows current active key (Key 1/2/3)
- Visual indicator (dot) showing status
- Small text showing remaining credits/quota if available

**Loading States:**
- Pulsing dot animation for AI thinking
- Text: "Perplexia is thinking..."

---

## Icons
**Library:** Heroicons (via CDN)
- Use outline variant for most icons
- Solid variant for active/selected states

**Key Icons:**
- Plus (new chat)
- Chat bubble (chat items)
- Code (code generation mode)
- Cog/Settings (settings)
- Download (ZIP download)
- Copy (code copy)
- Chevron (dropdowns)
- X (close/delete)
- Menu (mobile hamburger)

---

## Images
**No hero image required.** This is a functional tool interface where immediate utility trumps visual storytelling. The interface should load directly into the chat workspace.

---

## Accessibility
- All interactive elements have clear focus states (ring-2 on focus)
- Sufficient contrast for all text
- Keyboard navigation support (Tab through controls, Enter to submit)
- ARIA labels for icon-only buttons
- Skip to main content link

---

## Animations
**Minimal Usage Only:**
- Smooth transitions on sidebar toggle (transition-transform duration-200)
- Message fade-in as they appear (fade-in-up, duration-300)
- NO hover animations on buttons (intrinsic states handle this)
- NO scroll-triggered effects
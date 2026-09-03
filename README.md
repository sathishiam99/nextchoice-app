# NextChoice

**Notice the moment. Pause. Choose your next move. Learn from it.**

NextChoice is a calm, minimal decision-awareness app built on the belief that
your life changes through the small choices you make every day — not just
the big ones.

It has two core flows:

- **PAUSE** — interrupt an urge in the moment. Pick a "Try Instead" action,
  do it, then log how it went (no shame-based language — just "the urge
  passed / got weaker / I acted on it / not sure").
- **REFLECT** — log a choice after the fact in about 10–15 seconds: what you
  chose, how you chose it (one tap), and what happened.

**Insights** turns those entries into simple, honest patterns over time
(outcome breakdowns, which "Try Instead" actions actually help, decision-mode
vs. outcome, activity trends) — never a cluttered dashboard.

## Stack

- React 18 + Vite
- Tailwind CSS
- [recharts](https://recharts.org/) for the Insights charts
- [lucide-react](https://lucide.dev/) for icons
- **No backend.** All data lives on-device in `localStorage`.

## Running locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To build a production bundle:

```bash
npm run build
npm run preview
```

## Data & privacy

Everything you log — urges, choices, actions, settings — is stored only in
your browser's `localStorage` on your own device. Nothing is sent to a
server. Use **Settings → Export backup** to save a `.json` copy, and
**Import backup** to restore it (e.g. after clearing browser data or moving
devices).

## Project status

This is a V1 built to prove the core loop — **Pause → Choose → Reflect →
Learn** — is useful before adding anything else. See the in-app Settings
screen for data export/import/erase, and the checklist icon in the top bar
to manage your personal "Try Instead" actions.

# Cricket Strategy Pro — Frontend Demo

A frontend-only React + Tailwind CSS demo of a cricket strategy workspace, built around the client's four strategies: **Right Entry**, **Live Trading / Match Tracking**, **Book Profit** and **Strict Loss Cut**. It also includes P&L, analytics, a demo wallet, demo KYC, demo claims and a full admin console.

> **Demonstration only.** No real money, betting, payments, identity verification or payouts are processed. All matches, balances, results, KYC statuses and claims are simulated. Data lives in memory and resets when the page is refreshed.

## Setup

Requires Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

### Demo accounts

| Role        | Username | Password    |
|-------------|----------|-------------|
| Admin       | `admin`  | `Admin123!` |
| Normal user | `demo`   | `Demo123!`  |

The login page has one-click buttons that fill these in. Other mock users (`ananya`, `vikram_d`, `kabir`, `sara_t`) use `Demo123!`. The `meera.n` account is deactivated so you can demo the login block.

## User menu (simple names)

The normal user's side uses everyday names. The Admin panel keeps its original names.

| User menu | Client strategy / module |
|---|---|
| Home | User dashboard |
| Matches | Upcoming matches + match details |
| Entry Check | Right Entry (simple: pick match → complete entry) |
| Match Notes | Live Trading / Match Tracking |
| Book Profit | Book Profit |
| Profit & Loss | P&L calculator |
| Loss Limit | Strict Loss Cut |
| Reports | Dashboard & Analytics |
| Wallet · Verify ID · Claim Money · My Claims | Demo wallet, demo KYC, claims |

The user's wallet balance is always shown in the top bar. Clicking it opens **Add Money**.

## Suggested presentation walkthrough

1. **Admin:** Match Management → *Add match*.
2. **Logout → demo user → Entry Check:** pick a match, see its entry amount, tap **Complete Entry** → "You're in!". The amount is taken from the demo wallet, and the match shows **Completed**. Each match can be entered once. If the wallet doesn't have enough, the user is asked to Add Money. The admin sets each match's entry amount (0 = free) in **Match Management** and can see how many entries each match has.
3. **Match Notes:** add a couple of score notes. Wrong values (e.g. 11 wickets, 9.7 overs) are rejected.
4. **Profit & Loss:** pick the entry check and enter `-1900` with costs `100`. Net = −₹2,000, which is over the ₹1,500 per-play limit. Warnings appear, and **Loss Limit** shows *Limit crossed*.
5. **Reports:** the charts now include the new records.
6. **Verify ID:** use a practice number like `DEMO-4821`. Real-looking Aadhaar/PAN/account numbers are refused.
7. **Admin → KYC Management:** approve.
8. **User → Claim Money** (now unlocked) → send the claim.
9. **Admin → Claim Management:** change the status, message and time.
10. **User Home:** the claim's new status and message show at the top straight away.
11. Click the **wallet balance in the top bar** → Add Money → the balance updates everywhere.

This whole journey was checked during development with an automated browser test that drives the real app; every check passed.

## Project structure

```
src/
  components/
    layout/      AppLayout (top bar, notifications), Sidebar, navConfig
    ui/          Button, Card, Field/Input/Select, Modal, ConfirmDialog, Toast,
                 DataTable (sort + paging), StatusBadge, StatCard, Tabs, …
    charts/      Recharts components (P&L trend, strategy performance, compliance,
                 activity, risk breaches, completion, score progression)
    cards/       MatchCard
    forms/       PnlForm (shared by P&L Calculator and Book Profit)
  context/
    AppDataContext.jsx   single in-memory store + actions + selectors
    AuthContext.jsx      simulated login / signup / logout
  data/          mockUsers, mockMatches, mockStrategies, mockStrategyRecords,
                 mockMatchUpdates, mockClaims, mockTransactions (+ KYC),
                 mockNotifications — dates are generated relative to "now"
  pages/
    auth/        Login, Signup
    user/        16 user pages
    admin/       14 admin pages
    shared/      AnalyticsView, LiveTrackingView, NotificationsView
  routes/        AppRoutes, guards (role checks, disabled-module gate)
  utils/
    calculations.js   Right Entry evaluation, P&L formulas, risk evaluation
    analytics.js      chart datasets built from shared records
    formatters.js, validation.js
```

All metrics and charts are calculated from shared state, not hard-coded. Admin changes (matches, strategy text and enable/disable, KYC, claims, announcements, settings) show up in the user's views immediately.

## Documented calculation rules

**Right Entry evaluation** (`utils/calculations.js → evaluateEntry`)
- Numeric rules compare an entered value (score, wickets, overs, run rate, manual price reference) using ≥, ≤, = or *between*. Run rate = runs ÷ (balls ÷ 6).
- Checklist rules are ticked by hand.
- If any **required** rule fails, the result is **Conditions Not Satisfied**. If a required rule is missing its input, the result is **Manual Review Required**. Otherwise it is **Conditions Satisfied**. Optional rules are shown but never change the outcome.
- The suggested compliance compares the decision with the evaluation: *Entry* is compliant only when conditions are satisfied, and *No Entry* is always compliant. The user can override it.
- The thresholds are editable sample rules, not the client's methodology.

**Profit & Loss** (`calculatePnl`)
- *Simple accounting record:* `Net = Recorded Gain/Loss − Recorded Costs`
- *Illustrative entry/exit (sample):* `Gross = (Exit − Entry) × Demo Position Size; Net = Gross − Costs`. This is clearly labelled as illustrative and must be replaced with a client-approved formula before any real use.
- Incomplete or non-numeric inputs produce no result; the record is saved as *Open*.
- Book Profit "target reached" uses a rule set by the admin: Net ≥ Target (default) or Gross ≥ Target.

**Strict Loss-Cut** (`evaluateRisk`)
- Losses are measured from the net results of completed records.
- Limits: per record, daily (optional), session (optional; a session starts at midnight or when the user clicks *New session*), and maximum records per session.
- *Approaching Limit* triggers at a configurable percentage of a limit (default 80%).
- Status precedence: **Limit Exceeded** (current day/session) → **Approaching Limit** → **Review Required** (a past breach has no review note) → **Within Limit**.
- Alerts are derived from records, so editing a record keeps the alert history consistent. New alerts create notifications.

## What is simulated vs. what production would need

| Simulated in this demo | Needed before any production deployment |
|---|---|
| Login and roles checked in the browser; passwords held in plain text in memory | Backend auth: hashed passwords, sessions/tokens, MFA, rate limiting, password reset; server-side role checks |
| Users, records and settings held in React state (reset on refresh) | Backend API and database, server-side validation, audit logs, backups |
| Fictional fixtures; manually entered scores | Licensed cricket-data provider integration |
| Wallet balances and "Simulate Add Funds" | Any real money handling needs a regulated payment provider and licensing — **out of scope** |
| KYC with fictional, masked references; admin sets the status by hand | Real KYC/AML provider, secure document handling, data-protection compliance (e.g. India's DPDP Act) |
| Claims and payout statuses | Real payouts would need payment rails, reconciliation and legal sign-off — **out of scope** |
| In-app notifications only | Email/SMS/push services |
| — | **Legal review** of betting/gaming regulations in every target jurisdiction; security engineering (pen-testing, secrets management, monitoring) |

The app does not connect to any betting exchange or payment API, and nothing in it can place, settle or close a bet.

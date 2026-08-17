# Cheap4U Technology — Frontend

A complete HTML5 / CSS3 / Vanilla JavaScript frontend for the existing
Cheap4U Flask backend. No frameworks, no build step — open `index.html`
or deploy the folder as-is to any static host.

## Quick start

Just open `index.html` in a browser, or serve the folder with any static
file server (e.g. `python3 -m http.server`). No build/install step.

## Changing the backend URL

Edit **one line**, in `js/config.js`:

```js
API_BASE_URL: 'https://cheap4u-backend.onrender.com',
```

Every API call in the app goes through `js/api.js`, which reads this
value — nothing else needs to change to point at a local/dev backend.

## Structure

```
index.html            → redirects to dashboard or login based on stored session
login.html / register.html / verify-otp.html / forgot-password.html / reset-password.html
dashboard.html         → wallet balance, referral/cashback stats, recent transactions
services.html          → hub linking every service
airtime.html / data.html / electricity.html / cable.html / exampin.html
wallet.html             → card funding (Paystack) + virtual account
transactions.html       → transaction history, filters
referral.html / cashback.html / challenge.html / spin.html / coupons.html
airtime-to-cash.html    → 4-step OTP → verify → quota → transfer wizard
support.html            → AI support chat
profile.html            → account details, transaction PIN, legal links, logout

css/style.css           → single design-system stylesheet (mobile-first)

js/config.js            → API_BASE_URL + shared constants (edit this to redeploy)
js/api.js               → centralized fetch client; every backend route used, matched
                           1:1 against the actual Flask source (auth.py, routes.py,
                           plans.py, payment.py, referral.py, cashback_routes.py,
                           challenge_routes.py, coupon_routes.py, spin_routes.py,
                           ai_chat.py). No invented endpoints.
js/utils.js              → toasts, formatting, validation, clipboard, button states
js/auth.js               → login/session guards
js/app.js                → shared sidebar/topbar/bottom-nav shell
js/purchase.js            → shared PIN-confirmation modal + result rendering
js/<page>.js              → one file per page, each doing only that page's logic

assets/                  → logos/icons reused from the original Kivy app + backend
```

## Design

White / blue / light-gray fintech look: rounded cards, generous spacing,
sidebar navigation on desktop, bottom tab bar on mobile. Every number
shown (wallet balance, plan prices, transaction history, leaderboard,
etc.) comes from a live API response — nothing is hardcoded.

## Known backend issue (not modified — documented only)

**Electricity provider IDs don't match between two backend files.**
`init_plans.py` seeds `ElectricityProvider` rows with names like
`"Eko Electric (EKEDC)"` and its own `provider_id` numbering (1 =
Abuja, 2 = Eko, 3 = Ibadan…), while `cheapdatahub.py`'s `DISCO_ID_MAP`
(used to validate a purchase) expects different name strings (`"Eko
Electric"`, no parenthetical) with a *different* number assigned to
each disco (1 = Ikeja, 2 = Eko, 5 = Abuja…). The frontend calls
`GET /api/plans/electricity-providers` and sends back exactly the
`name` field the backend gave it — so on the current backend data this
will trip `buy_electricity()`'s "Unknown electricity provider" error
for names that don't happen to collide with a DISCO_ID_MAP key. This
is a backend data-seeding mismatch between two independently
maintained lists; per your instructions, backend code was not touched
— see the comment block at the top of `js/electricity.js`.

## Things that could only be verified against a live deployment

Static code audit, endpoint-matching against the Flask source, HTML
validation, and JS syntax checks were all done and passed. The
following can only be confirmed once wired to a running backend/DB:

- Whether `PAYSTACK_SECRET_KEY`, `GEMINI_API_KEY`, `VTUNAIJA_API_KEY`,
  and `CHEAPDATAHUB_API_KEY` are actually configured in the deployed
  environment (their absence produces backend-side error responses
  that the frontend surfaces via the toast/error UI, but can't be
  triggered without a live call).
- Real Paystack checkout completion (the "fund wallet" flow opens the
  real Paystack authorization URL — full completion needs a live test
  card/account).
- CORS behavior against the actual deployed backend origin.
- The electricity provider mismatch above, which needs a live
  `/api/plans/electricity-providers` response to confirm which (if
  any) seeded names happen to match `DISCO_ID_MAP`.

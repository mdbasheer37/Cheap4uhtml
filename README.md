# Cheap4U Technology — Frontend (v2)

A complete HTML5 / CSS3 / Vanilla JavaScript frontend for the existing
Cheap4U Flask backend, rebuilt to match the real production app's visual
design and full feature set. No frameworks, no build step.

## Quick start

Just open `index.html` in a browser, or serve the folder with any static
file server. No build/install step.

## Deploying on Render (or any static host)

- **Publish directory:** `.` (repo root)
- **Build command:** leave empty (pure static site)

Folder names are `CSS/` and `JS/` (capitalized) — every HTML file
references them with matching capitalization. Linux hosts are
case-sensitive, so keep any renames consistent across both the folders
and every `href`/`src` reference.

## Changing the backend URL

Edit **one line**, in `JS/config.js`:
```js
API_BASE_URL: 'https://cheap4u-backend.onrender.com',
```

## What changed in v2

The first version was built from an incomplete audit (only the file
listing, not the actual app source) and used a sidebar-dashboard design
that didn't match the real app at all. This version was rebuilt after
reading the real ~25,000-line Kivy app source directly, and now matches
it in both design and feature completeness:

**Design** — Material Blue (#2196F3) theme, rounded "blob" header panels
on auth screens, icon-grid Quick Actions/Services on the dashboard, and
the real 4-tab bottom nav (Home / History / Support / Profile) instead of
a sidebar.

**Quick PIN unlock** — replicates the real app's device-local convenience
feature exactly: after a full email/password login, the app can save a
PIN (SHA-256 hashed client-side against the email, stored with the
session token in local storage — never sent to the backend). Return
visits show a "Welcome back, {name}!" unlock screen instead of the full
login form. Pure device convenience, no backend endpoint involved,
matching `Cheap4u.py`'s `attempt_pin_login()`.

**Five feature areas that were missing in v1, now fully wired to real
backend routes:**
- Dollar Card (`card.html` / `/api/cards/*`)
- Merchant program incl. bulk purchases (`merchant.html` / `/api/merchant/*`)
- Bill Reminders (`reminders.html` / `/api/reminders/*`)
- Price Comparison (`compare.html` / `/api/compare/*`)
- Rewards / Gamification — XP, levels, missions, badges (`rewards.html` /
  `/api/gamification/*`)

**Static info pages, matching the real app's own dialogs (none of these
call the backend — confirmed from source that the real app doesn't
either):** `pricing.html`, `upgrade.html`, `code4balance.html` (real USSD
balance-check codes).

**`beneficiary.html`** — replicates the real app's local-only beneficiary
list (`current_user['beneficiaries']` in the Kivy app has no backend
field) using `localStorage`, keyed per logged-in email.

**Confirmed "Coming Soon" in the real app itself** (not a gap in this
build — verified from `Cheap4u.py`'s own `show_coming_soon()` calls):
Transfer to Banks, Transfer to Cheap4U, Smile Voice, Bulk SMS, Betting,
Gift Cards. These show the same "service coming soon" toast the real app
shows, rather than a fake integration.

## Structure

```
index.html              → routes to pin-login / dashboard / login based on stored state
login.html / register.html / verify-otp.html / forgot-password.html / reset-password.html
pin-login.html           → device Quick-PIN unlock screen
dashboard.html            → Home tab: wallet, Monthly Challenge, Quick Actions, Services
transactions.html          → History tab
support.html                → Support tab (menu) — ai-chat.html is the actual chat
profile.html                  → Profile tab (list-menu)

airtime.html / data.html / electricity.html / cable.html / exampin.html
wallet.html · airtime-to-cash.html · referral.html · cashback.html
challenge.html · spin.html · coupons.html
card.html · card-history.html · merchant.html · reminders.html · compare.html · rewards.html
pricing.html · upgrade.html · code4balance.html · beneficiary.html

CSS/style.css             → single design-system stylesheet (Material Blue, mobile-first)

JS/config.js               → API_BASE_URL + shared constants
JS/api.js                    → centralized fetch client; every route matched 1:1 against
                              the actual Flask source, including the 5 newly-added blueprints
JS/nav-grids.js               → shared Quick Actions / Services tile definitions
JS/utils.js · JS/auth.js · JS/app.js · JS/purchase.js  → shared helpers
JS/<page>.js                    → one file per page

assets/                          → logos/icons reused from the original app + backend
```

## Known backend issue (documented only, not modified)

Electricity provider names seeded in `init_plans.py` don't match the
`DISCO_ID_MAP` keys used to validate purchases in `cheapdatahub.py` — see
the comment block at the top of `JS/electricity.js`.

## Things that could only be verified against a live deployment

- Whether all provider API keys (Paystack, VTUNaija, CheapDataHub, Gemini)
  are configured in the deployed environment
- Real Paystack checkout completion
- Live CORS behavior against the deployed backend origin
- The electricity provider name mismatch above

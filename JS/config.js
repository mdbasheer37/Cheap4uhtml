/**
 * config.js — Centralized configuration for the Cheap4U frontend.
 *
 * Change API_BASE_URL here (and nowhere else) to switch between a local
 * dev backend and the production Render deployment.
 */
const CONFIG = Object.freeze({
  // Production Flask backend (from render.yaml). Override for local dev by
  // editing this one line — every JS file reads from CONFIG.API_BASE_URL.
  API_BASE_URL: 'https://cheap4u-backend.onrender.com',

  APP_NAME: 'Cheap4U Technology',

  // localStorage keys
  STORAGE_KEYS: {
    TOKEN: 'c4u_token',
    USER: 'c4u_user',
  },

  // Networks / providers the backend accepts verbatim (must match backend
  // validation in routes.py exactly — do not rename).
  NETWORKS: ['MTN', 'Airtel', 'Glo', '9Mobile'],
  EXAM_TYPES: ['WAEC', 'NECO', 'NABTEB', 'JAMB'],

  MIN_AIRTIME: 50,
  MIN_ELECTRICITY: 50,
  MIN_FUNDING: 100,
  MAX_FUNDING: 1000000,
  MIN_REFERRAL_BONUS_USE: 200,

  SUPPORT_PHONE: '+2349037663816',
  SUPPORT_EMAIL: 'support@cheap4utechnology.com',
});

// Network logo assets reused by airtime.html, data.html, airtime-to-cash.html
const NETWORK_LOGOS = {
  MTN: 'assets/mtn.png',
  Airtel: 'assets/airtel.png',
  Glo: 'assets/glo.png',
  '9Mobile': 'assets/9mobile.png',
};

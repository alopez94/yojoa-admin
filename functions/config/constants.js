// config/constants.js
// Shared configuration and the vocabulary of the domain. If a string appears
// in more than one file (a status, a payment method), it belongs here.
//
// NOTE: you already have a constants.js — merge, don't overwrite.

const { defineSecret } = require('firebase-functions/params');

// ── Secrets ──────────────────────────────
// Set with: firebase functions:secrets:set RESEND_API_KEY
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const PAYPAL_CLIENT_ID = defineSecret('PAYPAL_CLIENT_ID');
const PAYPAL_SECRET = defineSecret('PAYPAL_SECRET');

const PAYPAL_BASE_URL =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const USD_EXCHANGE_RATE = 26.8;   //PARA EL FUTURO ALLAN: AGREGA UNA API CHECK PARA TENER UPDATED EXCHANGE RATES, PODRIA SERVIR PARA ALGO

const FUNCTION_CONFIG = {
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 60,
  maxInstances: 10,
  cors: true,
  secrets: [RESEND_API_KEY],
};

const PAYPAL_CONFIG = {
  ...FUNCTION_CONFIG,
  secrets: [RESEND_API_KEY, PAYPAL_CLIENT_ID, PAYPAL_SECRET],
};

// ── Runtime options spread into every function ──


const PRICING_CONFIG = {
  serviceFeePercentage: 0.035,   // comisión de YojoaTravel, en %
  taxPercent: 0.125,             // ISV, en %
  enabled: true,            // false = el turista paga solo el precio base
};

const FROM_EMAIL = 'Yojoa Travel <reservas@yojoatravel.com>';
const DASHBOARD_URL = 'https://business.yojoatravel.com';
const LANDING_URL = 'https://www.yojoatravel.com';

const PAYPAL_BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

// ── Domain vocabulary ────────────────────

const BOOKING_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
};

const PAYMENT_METHOD = {
  CARD: 'card',
  TRANSFER: 'transfer',
  CASH: 'cash',
};

// Statuses that occupy a seat. Anything counting capacity must use THIS list,
// never a bare ['confirmed'] — that is how you oversell.
const OCCUPYING_STATUSES = [
  BOOKING_STATUS.PENDING_PAYMENT,
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.IN_PROGRESS,
  BOOKING_STATUS.COMPLETED,
];

module.exports = {
  RESEND_API_KEY,
  PAYPAL_CLIENT_ID,
  PAYPAL_SECRET,
  FUNCTION_CONFIG,
  PAYPAL_CONFIG,
  FROM_EMAIL,
  PAYPAL_BASE_URL,
  USD_EXCHANGE_RATE,
  DASHBOARD_URL,
  PRICING_CONFIG,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  OCCUPYING_STATUSES,
};

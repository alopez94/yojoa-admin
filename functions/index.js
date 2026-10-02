// index.js
// Nothing but wiring. Every exported name here must match the name that is
// already deployed — rename one and `firebase deploy` DELETES the old function
// and creates a new one, which breaks every httpsCallable in the app.

const { onBookingCreated } = require('./triggers/onBookingCreated');
const { onBookingStatusChanged } = require('./triggers/onBookingStatusChanged');

const { createBooking } = require('./callables/createBooking');
const { createPayPalOrder } = require('./callables/createPayPalOrder');
const { capturePayPalPayment } = require('./callables/capturePayPalPayment');
const { sendPaymentInstructions } = require('./callables/sendPaymentInstructions');
const { createEmployeeAccount } = require('./callables/createEmployeeAccount');
const { onEstablishmentStatusChanged } = require('./triggers/onEstablishmentStatusChanged');
const {confirmPaymentReceived} = require('./callables/confirmPaymentReceived')
const { checkInBooking } = require('./callables/checkInBooking');

// ── Triggers ──
exports.onBookingCreated = onBookingCreated;
exports.onBookingStatusChanged = onBookingStatusChanged;

// ── Callables ──
exports.createBooking = createBooking;
exports.createPayPalOrder = createPayPalOrder;
exports.capturePayPalPayment = capturePayPalPayment;
exports.sendPaymentInstructions = sendPaymentInstructions;
exports.createEmployeeAccount = createEmployeeAccount;
exports.onEstablishmentStatusChanged = onEstablishmentStatusChanged;
exports.confirmPaymentReceived = confirmPaymentReceived;
exports.checkInBooking = checkInBooking;
// callables/createBooking.js
// Transfer and cash bookings. Creates a pending_payment reservation that holds
// the slot; onBookingCreated then emails the right instructions.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { db } = require('../config/firebase');
const {
  functionConfig,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} = require('../config/constants');
const {
  loadActivityAndEstablishment,
  computeTotalPrice,
  assertCapacityAvailable,
  buildBookingDoc,
} = require('../utils/booking');

const createBooking = onCall({ ...functionConfig }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para reservar.');
  }

  const {
    activityId, establishmentId, date, time,
    guestCount, specialRequests, paymentMethod,
  } = request.data;

  if (!activityId || !establishmentId || !date || !time || !guestCount) {
    throw new HttpsError('invalid-argument', 'Faltan datos de la reserva.');
  }

  if (![PAYMENT_METHOD.TRANSFER, PAYMENT_METHOD.CASH].includes(paymentMethod)) {
    throw new HttpsError('invalid-argument', 'Método de pago no válido para esta ruta.');
  }

  const { activity, establishment } = await loadActivityAndEstablishment(
    activityId,
    establishmentId
  );

  if (paymentMethod === PAYMENT_METHOD.TRANSFER && !establishment.bankDetails?.accountNumber) {
    throw new HttpsError(
      'failed-precondition',
      'Este establecimiento no tiene datos bancarios configurados.'
    );
  }

  await assertCapacityAvailable({ activityId, date, time, guestCount, activity });

  const { totalPrice, currency } = computeTotalPrice(activity, guestCount);

  const userSnap = await db.collection('users').doc(uid).get();
  const userData = userSnap.data() || {};

  const bookingDoc = buildBookingDoc({
    uid,
    tourist: {
      name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      email: userData.email || request.auth.token.email,
      phone: userData.phone,
    },
    activity,
    establishment,
    date,
    time,
    guestCount,
    specialRequests,
    totalPrice,
    currency,
    paymentMethod,
    status: BOOKING_STATUS.PENDING_PAYMENT,
    paymentStatus: PAYMENT_STATUS.PENDING,
  });

  const ref = await db.collection('bookings').add(bookingDoc);

  return {
    bookingId: ref.id,
    confirmationCode: bookingDoc.confirmationCode,
    totalPrice,
    currency,
  };
});

module.exports = { createBooking };

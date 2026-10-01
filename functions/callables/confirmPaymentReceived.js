// callables/confirmPaymentReceived.js

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { db, FieldValue } = require('../config/firebase');
const {
  FUNCTION_CONFIG,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} = require('../config/constants');
const { buildPaymentId, buildPaymentDoc, paymentRef, PROVIDER } = require('../utils/payments');

const confirmPaymentReceived = onCall({ ...FUNCTION_CONFIG }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión');

  const { bookingId, paidAt, reference } = request.data;
  if (!bookingId) throw new HttpsError('invalid-argument', 'Falta bookingId');

  const [bookingSnap, callerSnap] = await Promise.all([
    db.collection('bookings').doc(bookingId).get(),
    db.collection('users').doc(request.auth.uid).get(),
  ]);

  if (!bookingSnap.exists) throw new HttpsError('not-found', 'Reserva no encontrada');

  const booking = bookingSnap.data();
  const caller = callerSnap.data();
  if (!caller) throw new HttpsError('failed-precondition', 'Perfil incompleto');

  // Dueño (su uid ES el establishmentId) o empleado del mismo establecimiento
  const autorizado =
    request.auth.uid === booking.establishmentId ||
    caller.establishmentId === booking.establishmentId;

  if (!autorizado) throw new HttpsError('permission-denied', 'No autorizado');

  if (booking.paymentMethod === PAYMENT_METHOD.CARD ||
      booking.paymentMethod === 'paypal') {
    throw new HttpsError('failed-precondition', 'Esta reserva se pagó en línea');
  }

  if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
    return { success: true, alreadyPaid: true };   // idempotente
  }

  const paymentId = buildPaymentId({
    provider: PROVIDER.MANUAL,
    bookingId,
  });

  const paymentDoc = buildPaymentDoc({
    booking: { ...booking, touristId: booking.touristId },
    bookingId,
    amount: booking.totalPrice,
    currency: booking.currency,
    breakdown: booking.pricing || null,
    method: booking.paymentMethod,        // 'transfer' | 'cash'
    provider: PROVIDER.MANUAL,
    providerTransactionId: reference || null,   // número de transferencia, si lo dan
    paidAt: paidAt || null,               // fecha real del depósito
    recordedBy: request.auth.uid,
  });

  const batch = db.batch();
  batch.set(paymentRef(paymentId), paymentDoc);
  batch.update(bookingSnap.ref, {
    status: BOOKING_STATUS.CONFIRMED,
    paymentStatus: PAYMENT_STATUS.PAID,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return { success: true, paymentId };
});

module.exports = { confirmPaymentReceived };
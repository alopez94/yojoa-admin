// callables/checkInBooking.js
// Registra la llegada del visitante. NO toca el pago.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { db, FieldValue } = require('../config/firebase');
const { FUNCTION_CONFIG, BOOKING_STATUS } = require('../config/constants');

/** Fecha de hoy en Honduras. El servidor corre en UTC, así que no sirve new Date(). */
const todayInHonduras = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tegucigalpa' }).format(new Date());

const checkInBooking = onCall({ ...FUNCTION_CONFIG }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión');

  const { bookingId, code } = request.data;
  if (!bookingId || !code) {
    throw new HttpsError('invalid-argument', 'Código inválido');
  }

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

  if (!autorizado) {
    throw new HttpsError('permission-denied', 'Esta reserva no es de tu establecimiento');
  }

  // El código es lo que impide que sirva una captura de pantalla ajena:
  // sin él, bastaría con adivinar un bookingId.
  if (booking.confirmationCode !== code) {
    throw new HttpsError('failed-precondition', 'El código no corresponde a esta reserva');
  }

  // Idempotente: escanear dos veces no es un error.
  if (booking.status === BOOKING_STATUS.IN_PROGRESS) {
    return { success: true, alreadyCheckedIn: true, booking: resumen(booking, bookingId) };
  }

  if (booking.status === BOOKING_STATUS.COMPLETED) {
    throw new HttpsError('failed-precondition', 'Esta actividad ya fue completada');
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw new HttpsError('failed-precondition', 'Esta reserva fue cancelada');
  }

  // pending_payment entra a propósito: las reservas en efectivo llegan sin pagar.
  const estadosValidos = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING_PAYMENT];
  if (!estadosValidos.includes(booking.status)) {
    throw new HttpsError('failed-precondition', `Estado no válido: ${booking.status}`);
  }

  if (booking.date !== todayInHonduras()) {
    throw new HttpsError(
      'failed-precondition',
      `Esta reserva es para el ${booking.date}, no para hoy`
    );
  }

  await bookingSnap.ref.update({
    status: BOOKING_STATUS.IN_PROGRESS,
    checkedInAt: FieldValue.serverTimestamp(),
    checkedInBy: request.auth.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    alreadyCheckedIn: false,
    booking: resumen({ ...booking, status: BOOKING_STATUS.IN_PROGRESS }, bookingId),
  };
});

/** Lo que la pantalla del escáner necesita mostrar. */
const resumen = (booking, bookingId) => ({
  id: bookingId,
  activityName: booking.activityName,
  touristName: booking.touristContactInfo?.name || '',
  guestCount: booking.guestCount,
  time: booking.time,
  status: booking.status,
  paymentMethod: booking.paymentMethod,
  paymentStatus: booking.paymentStatus,
  totalPrice: booking.totalPrice,
  currency: booking.currency,
});

module.exports = { checkInBooking };
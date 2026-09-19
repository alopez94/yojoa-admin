// callables/sendPaymentInstructions.js
// Reenvío manual desde el panel. El envío automático lo hace onBookingCreated.

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { db, FieldValue } = require('../config/firebase');
const { FUNCTION_CONFIG, PAYMENT_METHOD } = require('../config/constants');
const { loadBankDetails } = require('../utils/booking');
const { sendEmail } = require('../utils/email');
const { paymentInstructions } = require('../emails');

const sendPaymentInstructions = onCall({ ...FUNCTION_CONFIG }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión');

  const { bookingId } = request.data;
  if (!bookingId) throw new HttpsError('invalid-argument', 'Falta bookingId');

  const [bookingSnap, callerSnap] = await Promise.all([
    db.collection('bookings').doc(bookingId).get(),
    db.collection('users').doc(request.auth.uid).get(),
  ]);

  if (!bookingSnap.exists) throw new HttpsError('not-found', 'Reserva no encontrada');
  if (!callerSnap.exists) throw new HttpsError('failed-precondition', 'Perfil incompleto');

  const booking = bookingSnap.data();
  const caller = callerSnap.data();

  if (caller.establishmentId !== booking.establishmentId) {
    throw new HttpsError('permission-denied', 'No autorizado');
  }

  if (booking.paymentMethod !== PAYMENT_METHOD.TRANSFER) {
    throw new HttpsError('failed-precondition', 'Esta reserva no es por transferencia');
  }

  const bank = await loadBankDetails(booking.establishmentId);
  if (!bank?.accountNumber) {
    throw new HttpsError(
      'failed-precondition',
      'Agrega tus datos bancarios en el perfil antes de enviar instrucciones'
    );
  }

  const sent = await sendEmail({
    to: booking.touristContactInfo.email,
    subject: `Instrucciones de pago — ${booking.activityName}`,
    html: paymentInstructions({
      touristName: booking.touristContactInfo.name,
      activityName: booking.activityName,
      establishmentName: booking.establishmentName,
      confirmationCode: booking.confirmationCode,
      date: booking.date,
      time: booking.time,
      guestCount: booking.guestCount,
      currency: booking.currency,
      totalPrice: booking.totalPrice,
      bankName: bank.bankName,
      accountHolder: bank.accountHolder,
      accountNumber: bank.accountNumber,
      accountType: bank.accountType === 'cheques' ? 'Cheques' : 'Ahorro',
      accountId: bank.identidad || null,
      bankNotes: bank.notes || null,
    }),
    context: `resend-instructions:${bookingId}`,
  });

  if (!sent) throw new HttpsError('internal', 'No se pudo enviar el correo');

  await bookingSnap.ref.update({
    paymentInstructionsSentAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});

module.exports = { sendPaymentInstructions };
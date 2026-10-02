// callables/capturePayPalPayment.js

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { buildPaymentId, buildPaymentDoc, paymentRef, PROVIDER } = require('../utils/payments');
const { db } = require('../config/firebase');
// FIX: usaba functionConfig, así que las credenciales de PayPal llegaban
// undefined y la captura fallaba siempre.
const { PAYPAL_CONFIG, BOOKING_STATUS, PAYMENT_STATUS } = require('../config/constants');
const { captureOrder } = require('../utils/paypal');
const { calculatePricing } = require('../utils/pricing');
const { loadActivityAndEstablishment, buildBookingDoc } = require('../utils/booking');

const capturePayPalPayment = onCall({ ...PAYPAL_CONFIG }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  // FIX: calculatePricing(totalPrice) estaba ARRIBA de esta línea, usando una
  // variable que todavía no existía. Ese era el ReferenceError.
  const {
    orderId, activityId, establishmentId,
    date, time, guestCount, specialRequests,
  } = request.data;

  if (!orderId || !activityId || !establishmentId) {
    throw new HttpsError('invalid-argument', 'Faltan campos requeridos');
  }

  // FIX: idempotencia. Si el cliente reintenta, no se crea una segunda reserva
  // para el mismo pago.
   const paymentId = buildPaymentId({
    provider: PROVIDER.PAYPAL,
    providerTransactionId: orderId,
  });

  const existingPayment = await paymentRef(paymentId).get();
  if (existingPayment.exists) {
    const prev = existingPayment.data();
    const prevBooking = await db.collection('bookings').doc(prev.bookingId).get();
    return {
      success: true,
      bookingId: prev.bookingId,
      confirmationCode: prevBooking.data()?.confirmationCode,
      totalPrice: prev.amount,
    };
  }

  // FIX: se leen los documentos ANTES de cobrar. Si el usuario o el
  // establecimiento no existen, es preferible fallar sin haber tomado el dinero.
  const { activity, establishment } = await loadActivityAndEstablishment(
    activityId,
    establishmentId
  );

  const userSnap = await db.collection('users').doc(request.auth.uid).get();
  const userData = userSnap.data();

  if (!userData) {
    throw new HttpsError('not-found', 'Tu perfil de usuario no existe');
  }

  const pricing = calculatePricing(activity.price * guestCount);

  // ── Recién ahora se cobra ──
  let captureData;
  try {
    captureData = await captureOrder(orderId);
  } catch (error) {
    console.error('PayPal capture request failed:', orderId, error);
    throw new HttpsError('internal', 'No se pudo procesar el pago');
  }

  if (captureData.status !== 'COMPLETED') {
    console.error('Capture not completed:', orderId, JSON.stringify(captureData));
    throw new HttpsError('failed-precondition', 'El pago no fue completado');
  }

  // ── El dinero ya se tomó. A partir de acá NO se puede lanzar sin dejar rastro ──
  try {
    const bookingDoc = buildBookingDoc({
      uid: request.auth.uid,
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
      totalPrice: pricing.total,
      currency: activity.currency,
      paymentMethod: 'paypal',
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PAID,
      paypal: { orderId, capturedAt: new Date().toISOString() },
    });

    const bookingRef = db.collection('bookings').doc();

    
    const paymentDoc = buildPaymentDoc({
      booking: { ...bookingDoc, touristId: request.auth.uid },
      bookingId: bookingRef.id,
      amount: pricing.total,
      currency: activity.currency,
      breakdown: {
      basePrice: pricing.basePrice,
        serviceFee: pricing.serviceFee,
        tax: pricing.tax,
      },
      method: 'paypal',
      provider: PROVIDER.PAYPAL,
      providerTransactionId: orderId,
      recordedBy: null,
    });

   
    const batch = db.batch();
    batch.set(bookingRef, {
      ...bookingDoc,
      pricing: {
        basePrice: pricing.basePrice,
        serviceFee: pricing.serviceFee,
        tax: pricing.tax,
        total: pricing.total,
      },
    });
    batch.set(paymentRef(paymentId), paymentDoc);
    await batch.commit();

    
    return {
      success: true,
      bookingId: bookingRef.id,
      confirmationCode: bookingDoc.confirmationCode,
      totalPrice: pricing.total,
    };
  } catch (error) {
    // Cobrado sin reserva: esto hay que poder encontrarlo en los logs y
    // resolverlo a mano. El orderId es la llave para el reembolso.
    console.error('PAGO COBRADO SIN RESERVA — revisar manualmente', {
      orderId,
      uid: request.auth.uid,
      activityId,
      error: error.message,
    });
    throw new HttpsError(
      'internal',
      'Tu pago fue procesado pero hubo un error al crear la reserva. Contáctanos con este código: ' +
      orderId
    );
  }
});

module.exports = { capturePayPalPayment };
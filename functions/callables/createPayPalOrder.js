// callables/createPayPalOrder.js

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { PAYPAL_CONFIG } = require('../config/constants');
const { createOrder } = require('../utils/paypal');
const { calculatePricing } = require('../utils/pricing');
const {
  loadActivityAndEstablishment,
  assertCapacityAvailable,
} = require('../utils/booking');

const createPayPalOrder = onCall({ ...PAYPAL_CONFIG }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  // FIX: antes recibía totalPrice del cliente. Ahora recibe qué se reserva y
  // el servidor calcula cuánto cuesta.
  const { activityId, establishmentId, guestCount, date, time } = request.data;
  

  if (!activityId || !establishmentId || !guestCount || !date || !time) {
    throw new HttpsError('invalid-argument', 'Faltan campos requeridos');
  }

  const { activity } = await loadActivityAndEstablishment(activityId, establishmentId);

  // FIX: no había verificación de cupo. Se podía pagar por un horario lleno.
  await assertCapacityAvailable({ activityId, date, time, guestCount, activity });

  const pricing = calculatePricing(activity.price * guestCount);

  try {
    const { orderId, approvalUrl } = await createOrder({
      pricing,
      currency: activity.currency,
      activityName: activity.name,
    });

    return { orderId, approvalUrl, pricing, currency: activity.currency };
  } catch (error) {
    // FIX: error.message exponía detalles internos de PayPal al cliente.
    console.error('PayPal order error:', error);
    throw new HttpsError('internal', 'No se pudo iniciar el pago');
  }
});

module.exports = { createPayPalOrder };
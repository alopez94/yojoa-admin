const { db, FieldValue, Timestamp } = require('../config/firebase')

const PAYMENT_TYPE = {
    PAYMENT: 'payment',
    REFUND: 'refund',
};

const PROVIDER = {
    PAYPAL: 'paypal',
    MANUAL: 'manual',  //transferencias y pagos en efectivo
}

/**
 * ID determinístico. Si la función corre dos veces, el segundo set()
 * sobreescribe el mismo documento en vez de crear un pago duplicado.
 */

const buildPaymentId = ({ provider, providerTransactionId, bookingId, type }) => {
    const prefix = type === PAYMENT_TYPE.REFUND ? 'refund' : 'pay';
    return provider === PROVIDER.PAYPAL
        ? `${prefix}_paypal_${providerTransactionId}`
        : `${prefix}_manual_${bookingId}`;
}

/**
 * Arma el documento. paidAt es CUÁNDO OCURRIÓ el pago, que no es lo mismo
 * que cuándo se registró: un establecimiento puede registrar el lunes
 * una transferencia que recibió el sábado. Para el reporte mensual
 * la fecha que cuenta es la del sábado.
 */

const buildPaymentDoc = ({
    booking,
    bookingId,
    amount,
    currency,
    breakdown = null,
    method,
    provider,
    providerTransactionId = null,
    type = PAYMENT_TYPE.PAYMENT,
    paidAt = null,
    recordedBy = null,
}) => ({
    bookingId,
    establishmentId: booking.establishmentId,
    touristId: booking.touristId,
    amount: type === PAYMENT_TYPE.REFUND ? -Math.abs(amount) : Math.abs(amount),
    currency,
    breakdown: breakdown || {
        basePrise: amount,
        serviceFee: 0,
        tax: 0
    },
    method,
    provider,
    providerTransactionId,
    type,
    paidAt: paidAt ? Timestamp.fromDate(new Date(paidAt)) : FieldValue.serverTimestamp(),
    recordedBy,              // uid de quien confirmó; null si fue automático
    createdAt: FieldValue.serverTimestamp(),
});

const paymentRef = (paymentId) => db.collection('payments').doc(paymentId);

module.exports = {
  PAYMENT_TYPE,
  PROVIDER,
  buildPaymentId,
  buildPaymentDoc,
  paymentRef,
};
// utils/booking.js
// Booking rules that BOTH createBooking (transfer/cash) and
// capturePayPalPayment (card) depend on. Keeping them here is what stops the
// two paths from drifting apart — the bug class that bit you before.

const { HttpsError } = require('firebase-functions/v2/https');
const { db, FieldValue } = require('../config/firebase');
const {
  OCCUPYING_STATUSES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
} = require('../config/constants');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1

const generateConfirmationCode = () => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `YT-${code}`;
};

/** Loads activity + establishment, throwing if either is missing. */
const loadActivityAndEstablishment = async (activityId, establishmentId) => {
  const [activitySnap, estSnap] = await Promise.all([
    db.collection('activities').doc(activityId).get(),
    db.collection('establishments').doc(establishmentId).get(),
  ]);

  if (!activitySnap.exists) {
    throw new HttpsError('not-found', 'La actividad no existe.');
  }
  if (!estSnap.exists) {
    throw new HttpsError('not-found', 'El establecimiento no existe.');
  }

  return {
    activity: { id: activitySnap.id, ...activitySnap.data() },
    establishment: { id: estSnap.id, ...estSnap.data() },
  };
};

/** Price is computed here, never taken from the client. */
const computeTotalPrice = (activity, guestCount) => ({
  totalPrice: activity.price * guestCount,
  currency: activity.currency,
});

/** Throws if the slot cannot absorb guestCount more people. */
const assertCapacityAvailable = async ({ activityId, date, time, guestCount, activity }) => {
  const snap = await db
    .collection('bookings')
    .where('activityId', '==', activityId)
    .where('date', '==', date)
    .where('time', '==', time)
    .where('status', 'in', OCCUPYING_STATUSES)
    .get();

  const booked = snap.docs.reduce((sum, doc) => sum + (doc.data().guestCount || 0), 0);
  const max = activity.maxCapacityPerInterval || activity.maxCapacity;

  if (booked + guestCount > max) {
    throw new HttpsError(
      'failed-precondition',
      `Solo quedan ${Math.max(0, max - booked)} espacios en este horario.`
    );
  }
};

/** The single definition of a booking document. */
const buildBookingDoc = ({
  uid, tourist, activity, establishment,
  date, time, guestCount, specialRequests,
  totalPrice, currency, paymentMethod,
  status, paymentStatus, paypal = null,
}) => ({
  touristId: uid,
  touristContactInfo: {
    name: tourist.name,
    email: tourist.email,
    phone: tourist.phone || null,
  },
  activityId: activity.id,
  activityName: activity.name,
  establishmentId: establishment.id,
  establishmentName: establishment.name,
  date,
  time,
  guestCount,
  specialRequests: specialRequests || '',
  totalPrice,
  currency,
  paymentMethod,
  paymentStatus: paymentStatus || PAYMENT_STATUS.PENDING,
  status: status || BOOKING_STATUS.PENDING_PAYMENT,
  confirmationCode: generateConfirmationCode(),
  ...(paypal ? { paypal } : {}),
  checkedInAt: null,
  checkedInBy: null,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

module.exports = {
  generateConfirmationCode,
  loadActivityAndEstablishment,
  computeTotalPrice,
  assertCapacityAvailable,
  buildBookingDoc,
};

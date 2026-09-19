// triggers/onBookingStatusChanged.js
// Sends the real confirmation email once a transfer or cash booking is marked
// as paid by the establishment.

const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { functionConfig, BOOKING_STATUS } = require('../config/constants');
const { sendEmail } = require('../utils/email');
const { bookingConfirmation } = require('../emails');

const onBookingStatusChanged = onDocumentUpdated(
  { document: 'bookings/{bookingId}', ...functionConfig },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const bookingId = event.params.bookingId;

    if (before.status === after.status) return;
    if (
      before.status !== BOOKING_STATUS.PENDING_PAYMENT ||
      after.status !== BOOKING_STATUS.CONFIRMED
    ) {
      return;
    }

    await sendEmail({
      to: after.touristContactInfo.email,
      subject: `✅ Reserva confirmada — ${after.activityName}`,
      html: bookingConfirmation({
        touristName: after.touristContactInfo.name,
        activityName: after.activityName,
        establishmentName: after.establishmentName,
        confirmationCode: after.confirmationCode,
        date: after.date,
        time: after.time,
        guestCount: after.guestCount,
        currency: after.currency,
        totalPrice: after.totalPrice,
      }),
      context: `confirmed:${bookingId}`,
    });
  }
);

module.exports = { onBookingStatusChanged };

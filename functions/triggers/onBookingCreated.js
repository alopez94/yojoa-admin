// triggers/onBookingCreated.js

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { db } = require('../config/firebase');
const { functionConfig, BOOKING_STATUS, PAYMENT_METHOD } = require('../config/constants');
const { sendEmail } = require('../utils/email');
const {
  bookingConfirmation,
  newBookingNotification,
  paymentInstructions,
  pendingCashBooking,
} = require('../emails');

const onBookingCreated = onDocumentCreated(
  { document: 'bookings/{bookingId}', ...functionConfig },
  async (event) => {
    const booking = event.data.data();
    const bookingId = event.params.bookingId;

    // Establishment first: the transfer email needs its bankDetails.
    let establishment = null;
    try {
      const estSnap = await db
        .collection('establishments')
        .doc(booking.establishmentId)
        .get();
      if (estSnap.exists) establishment = estSnap.data();
    } catch (error) {
      console.error('Error loading establishment:', bookingId, error);
    }

    const base = {
      touristName: booking.touristContactInfo.name,
      activityName: booking.activityName,
      establishmentName: booking.establishmentName,
      confirmationCode: booking.confirmationCode,
      date: booking.date,
      time: booking.time,
      guestCount: booking.guestCount,
      currency: booking.currency,
      totalPrice: booking.totalPrice,
    };

    let subject;
    let html;

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      subject = `✅ Reserva confirmada — ${booking.activityName}`;
      html = bookingConfirmation(base);
    } else if (booking.paymentMethod === PAYMENT_METHOD.TRANSFER) {
      const bank = establishment?.bankDetails;

      if (!bank?.accountNumber) {
        console.error('Transfer booking with no bankDetails:', bookingId);
        return;
      }

      subject = `🏦 Completa tu pago — ${booking.activityName}`;
      html = paymentInstructions({
        ...base,
        bankName: bank.bankName,
        accountHolder: bank.accountHolder,
        accountNumber: bank.accountNumber,
        accountType: bank.accountType === 'cheques' ? 'Cheques' : 'Ahorro',
        accountId: bank.accountOwnerId || null,
        bankNotes: bank.accountComments || null,
      });
    } else {
      subject = `💵 Reserva apartada — ${booking.activityName}`;
      html = pendingCashBooking({ ...base, address: establishment?.address || null });
    }

    await sendEmail({
      to: booking.touristContactInfo.email,
      subject,
      html,
      context: `tourist:${bookingId}`,
    });

    if (establishment?.email) {
      await sendEmail({
        to: establishment.email,
        subject:
          booking.status === BOOKING_STATUS.CONFIRMED
            ? `📅 Nueva reserva — ${booking.activityName}`
            : `📅 Nueva reserva por cobrar — ${booking.activityName}`,
        html: newBookingNotification({
          establishmentName: establishment.name,
          activityName: booking.activityName,
          confirmationCode: booking.confirmationCode,
          date: booking.date,
          time: booking.time,
          guestCount: booking.guestCount,
          currency: booking.currency,
          totalPrice: booking.totalPrice,
          touristName: booking.touristContactInfo.name,
          touristEmail: booking.touristContactInfo.email,
          touristPhone: booking.touristContactInfo.phone || 'No proporcionado',
          paymentMethod: booking.paymentMethod,
          paymentStatus: booking.paymentStatus,
        }),
        context: `establishment:${bookingId}`,
      });
    }
  }
);

module.exports = { onBookingCreated };

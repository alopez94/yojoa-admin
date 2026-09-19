// emails/index.js
// Barrel for the templates. Import from './emails' everywhere so no file has
// to know the casing of the individual filenames.
//
// WATCH THE CASING: your Mac's filesystem is case-insensitive, Cloud Build's
// Linux one is not. A require path that works locally can fail at deploy.
// These paths must match your actual filenames character for character.

const { bookingConfirmation } = require('./bookingConfirmation');
const { newBookingNotification } = require('./newBookingNotification');
const { paymentInstructions } = require('./paymentInstructions');
const { pendingCashBooking } = require('./pendingCashBooking');
const { employeeWelcome } = require('./employeeWelcome');
const {establishmentStatus} = require('./establishmentStatus');


module.exports = {
  bookingConfirmation,
  newBookingNotification,
  paymentInstructions,
  pendingCashBooking,
  employeeWelcome,
  establishmentStatus
};

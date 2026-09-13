const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { Resend } = require('resend');
const admin = require('firebase-admin');

const { FUNCTION_CONFIG, FROM_EMAIL} = require('../config/constants');
const { bookingConfirmation } = require('../emails/BookingConfirmation');
const { newBookingNotification } = require('../emails/NewBookingNotification');

const db = admin.firestore();

exports.onBookingCreated = onDocumentCreated(

);
const { HttpsError, onCall } = require('firebase-functions/v2/https');
const {db, FieldValue} = require('../config/firebase')

const {
  FUNCTION_CONFIG,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} = require('../config/constants');


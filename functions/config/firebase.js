// config/firebase.js
// Single place where the Admin SDK is initialised. Every other module
// imports `db` from here, never calls initializeApp() itself.

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

module.exports = { admin, db, FieldValue, Timestamp };

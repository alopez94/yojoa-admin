// callables/createEmployeeAccount.js
// El dueño del establecimiento da de alta a un empleado desde el panel.

const crypto = require('crypto');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { admin, db, FieldValue } = require('../config/firebase');
const { FUNCTION_CONFIG } = require('../config/constants');
const { sendEmail } = require('../utils/email');
const { employeeWelcome } = require('../emails');

/** Contraseña temporal con entropía real. Math.random() no sirve para esto. */
const generateTempPassword = () => {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) out += chars[bytes[i] % chars.length];
  return `${out}A1!`;
};

const createEmployeeAccount = onCall({ ...FUNCTION_CONFIG }, async (request) => {
  // 1. Auth
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
  }

  const { firstName, lastName, email, position, location, establishmentId } = request.data;

  if (!firstName || !lastName || !email || !establishmentId) {
    throw new HttpsError('invalid-argument', 'Faltan campos requeridos');
  }

  // 2. ¿Quién llama?
  const callerSnap = await db.collection('users').doc(request.auth.uid).get();
  const caller = callerSnap.data();

  // FIX: si el documento no existe, caller es undefined y caller.role reventaba
  // con un TypeError que llegaba al cliente como 'internal'.
  if (!caller) {
    throw new HttpsError('not-found', 'Tu usuario no existe');
  }

  if (caller.role !== 'establishment') {
    throw new HttpsError('permission-denied', 'Solo establecimientos pueden crear empleados');
  }

  // FIX (importante): faltaba verificar que el establishmentId que manda el
  // cliente sea EL SUYO. Sin esto, cualquier establecimiento podía crear
  // empleados en el establecimiento de otro.
  if (request.auth.uid !== establishmentId) {
    console.log("establecimiento recibido", establishmentId);
    throw new HttpsError(
      'permission-denied',
      'No puedes crear empleados en otro establecimiento'
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const tempPassword = generateTempPassword();

  // 3. Cuenta de Firebase Auth
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email: normalizedEmail,
      password: tempPassword,
      displayName: `${firstName} ${lastName}`,
    });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Este email ya tiene una cuenta');
    }
    if (error.code === 'auth/invalid-email') {
      throw new HttpsError('invalid-argument', 'El email no es válido');
    }
    // FIX: error.message exponía detalles internos al cliente.
    console.error('createUser failed:', error);
    throw new HttpsError('internal', 'No se pudo crear la cuenta');
  }

  // 4. Documento de Firestore
  // FIX: si esto fallaba, quedaba una cuenta de Auth sin documento — el usuario
  // podía entrar pero sin rol. Ahora se revierte.
  try {
    await db.collection('users').doc(userRecord.uid).set({
      firstName,
      lastName,
      email: normalizedEmail,
      role: 'establishment_employee',
      establishmentId,
      position: position || '',
      location: location || '',
      status: 'Active',
      isEmployee: true,
      isDeleted: false,
      createdBy: request.auth.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Firestore write failed, rolling back auth user:', error);
    await admin.auth().deleteUser(userRecord.uid).catch(() => {});
    throw new HttpsError('internal', 'No se pudo guardar el empleado');
  }

  // 5. Correo de bienvenida
  // FIX: antes estaba dentro del try general, así que un fallo de Resend tiraba
  // 'internal' DESPUÉS de crear la cuenta: el dueño veía un error, reintentaba,
  // y recibía 'already-exists' con la cuenta ya creada y sin correo enviado.
  // sendEmail nunca lanza; devuelve false y lo registra.
  const emailSent = await sendEmail({
    to: normalizedEmail,
    subject: '¡Bienvenido a Yojoa Travel! Tu cuenta ha sido creada',
    html: employeeWelcome({
      firstName,
      email: normalizedEmail,
      tempPassword,
    }),
    context: `employee:${userRecord.uid}`,
  });

  return { success: true, userId: userRecord.uid, emailSent };
});

module.exports = { createEmployeeAccount };
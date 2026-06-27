const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { Resend } = require('resend');

//const { bookingConfirmation } = require('./emails/BookingConfirmation');
//const { newBookingNotification } = require('./emails/NewBookingNotification');
//const { establishmentStatus } = require('./emails/EstablishmentStatus');

admin.initializeApp();
const db = admin.firestore();
const FROM_EMAIL = 'Yojoa Travel <noreply@yojoatravel.com>';

const functionConfig = {
  timeoutSeconds: 30,
  memory: '256MiB',
  maxInstances: 10,
  secrets: ['RESEND_API_KEY'],
  cors: true,
};

// ─────────────────────────────────────────
// TRIGGER: New booking created
// ─────────────────────────────────────────
/* 
exports.onBookingCreated = onDocumentCreated(
  { document: 'bookings/{bookingId}', ...functionConfig },
  async (event) => {
    const booking = event.data.data();
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      booking.touristContactInfo.email,
        subject: `✅ Reserva confirmada — ${booking.activityName}`,
        html:    bookingConfirmation({
          touristName:       booking.touristContactInfo.name,
          activityName:      booking.activityName,
          establishmentName: booking.establishmentName,
          confirmationCode:  booking.confirmationCode,
          date:              booking.date,
          time:              booking.time,
          guestCount:        booking.guestCount,
          currency:          booking.currency,
          totalPrice:        booking.totalPrice,
        }),
      });

      const estSnap = await db
        .collection('establishments')
        .doc(booking.establishmentId)
        .get();

      if (estSnap.exists) {
        const establishment = estSnap.data();
        await resend.emails.send({
          from:    FROM_EMAIL,
          to:      establishment.email,
          subject: `📅 Nueva reserva — ${booking.activityName}`,
          html:    newBookingNotification({
            establishmentName: establishment.name,
            activityName:      booking.activityName,
            confirmationCode:  booking.confirmationCode,
            date:              booking.date,
            time:              booking.time,
            guestCount:        booking.guestCount,
            currency:          booking.currency,
            totalPrice:        booking.totalPrice,
            touristName:       booking.touristContactInfo.name,
            touristEmail:      booking.touristContactInfo.email,
            touristPhone:      booking.touristContactInfo.phone || 'No proporcionado',
          }),
        });
      }

      console.log('Booking emails sent:', event.params.bookingId);
    } catch (error) {
      console.error('Error sending emails:', error);
    }
  }
);

// ─────────────────────────────────────────
// TRIGGER: Establishment status changed
// ─────────────────────────────────────────
exports.onEstablishmentStatusChanged = onDocumentUpdated(
  { document: 'establishments/{establishmentId}', ...functionConfig },
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (before.status === after.status) return null;
    if (!['approved', 'rejected'].includes(after.status)) return null;

    const isApproved = after.status === 'approved';

    try {
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      after.email,
        subject: isApproved
          ? '✅ ¡Tu establecimiento fue aprobado! — Yojoa Travel'
          : '❌ Tu solicitud no fue aprobada — Yojoa Travel',
        html: establishmentStatus({
          establishmentName: after.name,
          isApproved,
          adminFeedback:     after.adminFeedback || '',
          dashboardUrl:      'https://yojoatravel.com/dashboard',
        }),
      });

      console.log('Status email sent:', event.params.establishmentId);
    } catch (error) {
      console.error('Error sending status email:', error);
    }

    return null;
  }
);
*/
// ─────────────────────────────────────────
// HTTP CALLABLE: Create employee account
// ─────────────────────────────────────────
exports.createEmployeeAccount = onCall(
  { ...functionConfig },
  async (request) => {
    // 1. Auth check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión');
    }

    // 2. Verify caller is establishment owner
    const callerSnap = await db.collection('users').doc(request.auth.uid).get();
    const caller = callerSnap.data();

    if (caller.role !== 'establishment') {
      throw new HttpsError('permission-denied', 'Solo establecimientos pueden crear empleados');
    }

    const { firstName, lastName, email, position, location, establishmentId } = request.data;

    if (!firstName || !lastName || !email || !establishmentId) {
      throw new HttpsError('invalid-argument', 'Faltan campos requeridos');
    }

    try {
      // 3. Create Firebase Auth account
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
      const userRecord = await admin.auth().createUser({
        email,
        password:    tempPassword,
        displayName: `${firstName} ${lastName}`,
      });

      // 4. Create Firestore user document
      await db.collection('users').doc(userRecord.uid).set({
        firstName,
        lastName,
        email,
        role:            'establishment_employee',
        establishmentId,
        position:        position || '',
        location:        location || '',
        status:          'Active',
        isEmployee:      true,
        createdAt:       admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:       admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Send welcome email
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      email,
        subject: '¡Bienvenido a Yojoa Travel! Tu cuenta ha sido creada',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1a56db;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0">🌊 Yojoa Travel</h1>
            </div>
            <div style="padding:32px;background:#fff">
              <h2>Hola ${firstName}, tu cuenta ha sido creada</h2>
              <p>Tu acceso a la app de Yojoa Travel está listo.</p>
              <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0">
                <p style="margin:0"><strong>Email:</strong> ${email}</p>
                <p style="margin:8px 0 0"><strong>Contraseña temporal:</strong> ${tempPassword}</p>
              </div>
              <p>Descarga la app de Yojoa Travel e inicia sesión con estas credenciales.</p>
              <p style="color:#dc2626"><strong>⚠️ Cambia tu contraseña después de iniciar sesión.</strong></p>
            </div>
          </div>
        `,
      });

      return { success: true, userId: userRecord.uid };

    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        throw new HttpsError('already-exists', 'Este email ya tiene una cuenta');
      }
      throw new HttpsError('internal', error.message);
    }
  }
);

// ─────────────────────────────────────────
// HTTP CALLABLE: Create booking with validation
// ─────────────────────────────────────────
exports.createBooking = onCall(
  { ...functionConfig },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para hacer una reserva');
    }

    const { activityId, establishmentId, date, time, guestCount, specialRequests } = request.data;

    if (!activityId || !establishmentId || !date || !time || !guestCount) {
      throw new HttpsError('invalid-argument', 'Faltan campos requeridos');
    }

    const activitySnap = await db.collection('activities').doc(activityId).get();
    if (!activitySnap.exists) {
      throw new HttpsError('not-found', 'Actividad no encontrada');
    }
    const activity = activitySnap.data();

    const bookingsSnap = await db.collection('bookings')
      .where('activityId', '==', activityId)
      .where('date', '==', date)
      .where('time', '==', time)
      .where('status', '==', 'confirmed')
      .get();

    const bookedGuests = bookingsSnap.docs.reduce((sum, doc) => {
      return sum + (doc.data().guestCount || 0);
    }, 0);

    const maxPerInterval = activity.maxCapacityPerInterval || activity.maxCapacity;

    if (bookedGuests + guestCount > maxPerInterval) {
      throw new HttpsError(
        'resource-exhausted',
        `Solo quedan ${maxPerInterval - bookedGuests} espacios disponibles`
      );
    }

    const [userSnap, estSnap] = await Promise.all([
      db.collection('users').doc(request.auth.uid).get(),
      db.collection('establishments').doc(establishmentId).get(),
    ]);

    const userData      = userSnap.data();
    const establishment = estSnap.data();

    const confirmationCode = 'YT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const totalPrice       = activity.price * guestCount;

    const bookingRef = await db.collection('bookings').add({
      touristId:          request.auth.uid,
      establishmentId,
      activityId,
      activityName:       activity.name,
      establishmentName:  establishment.name,
      date,
      time,
      guestCount,
      specialRequests:    specialRequests || '',
      totalPrice,
      currency:           activity.currency,
      status:             'confirmed',
      confirmationCode,
      touristContactInfo: {
        name:  `${userData.firstName} ${userData.lastName}`,
        email: request.auth.token.email,
        phone: userData.phone || '',
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success:          true,
      bookingId:        bookingRef.id,
      confirmationCode,
      totalPrice,
    };
  }
);
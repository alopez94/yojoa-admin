exports.createEmployeeAccount = functions
    .runWith(runtimeOpts)
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'No autorizado');
        }

        const callerSnap = await db.collection('users').doc(context.auth.uid).get();
        const caller = callerSnap.data();

        if (caller.role !== 'establishment') {
            throw new functions.https.HttpsError('permission-denied', 'Solo establecimientos pueden crear empleados');
        }

        const { firstName, lastName, email, position, location, establishmentId } = data;

        try {
            // 2. Create Firebase Auth account with temp password
            const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
            const userRecord = await admin.auth().createUser({
                email,
                password: tempPassword,
                displayName: `${firstName} ${lastName}`,
            });

            // 3. Create Firestore user document
            await db.collection('users').doc(userRecord.uid).set({
                firstName,
                lastName,
                email,
                role: 'establishment_employee',
                establishmentId,
                position: position || '',
                location: location || '',
                status: 'Active',
                isEmployee: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // 4. Send welcome email with temp password via Resend
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: 'Yojoa Travel <noreply@yojoatravel.com>',
                to: email,
                subject: '¡Bienvenido a Yojoa Travel! Tu cuenta ha sido creada',
                html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1a56db;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0">🌊 Yojoa Travel</h1>
            </div>
            <div style="padding:32px;background:#fff">
              <h2>Hola ${firstName}, tu cuenta ha sido creada</h2>
              <p>El establecimiento te ha dado acceso a la app de Yojoa Travel.</p>
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

        }
        catch (error) {
            if (error.code === 'auth/email-already-exists') {
                throw new functions.https.HttpsError('already-exists', 'Este email ya tiene una cuenta');
            }
            throw new functions.https.HttpsError('internal', error.message);
        }
    });
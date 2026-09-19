// triggers/onEstablishmentStatusChanged.js

const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { FUNCTION_CONFIG, DASHBOARD_URL } = require('../config/constants');
const { sendEmail } = require('../utils/email');
const { establishmentStatus } = require('../emails');

const onEstablishmentStatusChanged = onDocumentUpdated(
  { document: 'establishments/{establishmentId}', ...FUNCTION_CONFIG },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status === after.status) return null;
    if (!['approved', 'rejected'].includes(after.status)) return null;

    const isApproved = after.status === 'approved';

    await sendEmail({
      to: after.email,
      subject: isApproved
        ? '✅ ¡Tu establecimiento fue aprobado! — Yojoa Travel'
        : '❌ Tu solicitud no fue aprobada — Yojoa Travel',
      html: establishmentStatus({
        establishmentName: after.name,
        isApproved,
        adminFeedback: after.adminFeedback || '',
        dashboardUrl: DASHBOARD_URL,
      }),
      context: `establishment-status:${event.params.establishmentId}`,
    });

    return null;
  }
);

module.exports = { onEstablishmentStatusChanged };
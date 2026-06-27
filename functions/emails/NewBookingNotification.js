const newBookingNotification = ({
  establishmentName,
  activityName,
  confirmationCode,
  date,
  time,
  guestCount,
  currency,
  totalPrice,
  touristName,
  touristEmail,
  touristPhone,
}) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#f5f5f5;font-family:sans-serif;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
    <div style="background:#1a56db;padding:24px">
      <h1 style="color:#ffffff;margin:0;font-size:24px">🌊 Yojoa Travel</h1>
    </div>
    <div style="padding:32px">
      <h2 style="color:#1a1a1a">Nueva reserva recibida 📅</h2>
      <p style="color:#444;font-size:15px">
        Tienes una nueva reserva en <strong>${establishmentName}</strong>.
      </p>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:16px 0">
        <h3 style="font-size:16px;color:#1a1a1a;margin:0 0 12px">Detalles de la reserva</h3>
        <hr style="border-color:#e5e7eb;margin:12px 0">
        <table style="width:100%">
          <tr><td style="color:#6b7280;font-size:14px;padding:4px 0;width:40%">Código</td><td style="color:#1a1a1a;font-size:14px;font-weight:500">${confirmationCode}</td></tr>
          <tr><td style="color:#6b7280;font-size:14px;padding:4px 0">Actividad</td><td style="color:#1a1a1a;font-size:14px;font-weight:500">${activityName}</td></tr>
          <tr><td style="color:#6b7280;font-size:14px;padding:4px 0">Fecha</td><td style="color:#1a1a1a;font-size:14px;font-weight:500">${date}</td></tr>
          <tr><td style="color:#6b7280;font-size:14px;padding:4px 0">Hora</td><td style="color:#1a1a1a;font-size:14px;font-weight:500">${time}</td></tr>
          <tr><td style="color:#6b7280;font-size:14px;padding:4px 0">Personas</td><td style="color:#1a1a1a;font-size:14px;font-weight:500">${guestCount}</td></tr>
        </table>
        <hr style="border-color:#e5e7eb;margin:12px 0">
        <table style="width:100%">
          <tr>
            <td style="color:#1a1a1a;font-size:16px;font-weight:700;width:40%">Total</td>
            <td style="color:#1a56db;font-size:18px;font-weight:700">${currency} ${totalPrice}</td>
          </tr>
        </table>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:16px 0">
        <h3 style="font-size:16px;color:#1a1a1a;margin:0 0 12px">Información del cliente</h3>
        <hr style="border-color:#e5e7eb;margin:12px 0">
        <table style="width:100%">
          <tr><td style="color:#6b7280;font-size:14px;padding:4px 0;width:40%">Nombre</td><td style="color:#1a1a1a;font-size:14px;font-weight:500">${touristName}</td></tr>
          <tr><td style="color:#6b7280;font-size:14px;padding:4px 0">Email</td><td style="color:#1a1a1a;font-size:14px;font-weight:500">${touristEmail}</td></tr>
          <tr><td style="color:#6b7280;font-size:14px;padding:4px 0">Teléfono</td><td style="color:#1a1a1a;font-size:14px;font-weight:500">${touristPhone}</td></tr>
        </table>
      </div>
    </div>
    <div style="background:#f9fafb;padding:20px;text-align:center">
      <p style="color:#9ca3af;font-size:13px;margin:0">Yojoa Travel · info@yojoatravel.com</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = { newBookingNotification };
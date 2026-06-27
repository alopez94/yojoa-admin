const establishmentStatus = ({
  establishmentName,
  isApproved,
  adminFeedback,
  dashboardUrl,
}) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#f5f5f5;font-family:sans-serif;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
    <div style="background:${isApproved ? '#059669' : '#dc2626'};padding:24px">
      <h1 style="color:#ffffff;margin:0;font-size:24px">🌊 Yojoa Travel</h1>
    </div>
    <div style="padding:32px">
      <h2 style="color:#1a1a1a">
        ${isApproved ? '¡Tu establecimiento fue aprobado! 🎉' : 'Tu solicitud no fue aprobada'}
      </h2>
      ${isApproved ? `
        <p style="color:#444;font-size:15px">
          Tu establecimiento <strong>${establishmentName}</strong> ha sido aprobado
          y ya es visible para los turistas en Yojoa Travel.
        </p>
        <ul style="color:#444;font-size:15px;line-height:28px">
          <li>Completa tu perfil con fotos y horarios</li>
          <li>Agrega tus actividades y servicios</li>
          <li>Empieza a recibir reservas</li>
        </ul>
        <a href="${dashboardUrl}"
          style="display:inline-block;background:#1a56db;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
          Ir a mi panel
        </a>
      ` : `
        <p style="color:#444;font-size:15px">
          Lamentablemente tu solicitud para <strong>${establishmentName}</strong> no fue aprobada.
        </p>
        ${adminFeedback ? `
          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:4px;margin:16px 0">
            <p style="color:#dc2626;font-size:13px;font-weight:600;margin:0">Motivo:</p>
            <p style="color:#444;font-size:15px;margin:8px 0 0">${adminFeedback}</p>
          </div>
        ` : ''}
        <p style="color:#444;font-size:15px">
          Contáctanos en
          <a href="mailto:info@yojoatravel.com" style="color:#1a56db">info@yojoatravel.com</a>
        </p>
      `}
    </div>
    <div style="background:#f9fafb;padding:20px;text-align:center">
      <p style="color:#9ca3af;font-size:13px;margin:0">Yojoa Travel · info@yojoatravel.com</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = { establishmentStatus };
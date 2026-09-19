// emails/EmployeeWelcome.js

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const employeeWelcome = ({ firstName, email, tempPassword }) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#1a56db;padding:24px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">🌊 Yojoa Travel</h1>
  </div>
  <div style="padding:32px;background:#fff;border-radius:0 0 12px 12px">
    <h2 style="margin:0 0 12px;font-size:20px;color:#111827">Hola ${esc(firstName)}, tu cuenta ha sido creada</h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#111827">
      Tu acceso a la app de Yojoa Travel está listo.
    </p>

    <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:0 0 20px">
      <p style="margin:0;font-size:14px;color:#111827"><strong>Email:</strong> ${esc(email)}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#111827">
        <strong>Contraseña temporal:</strong>
        <span style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:15px">${esc(tempPassword)}</span>
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#111827">
      Descarga la app de Yojoa Travel e inicia sesión con estas credenciales.
    </p>

    <div style="background:#FEF3C7;border-left:4px solid #D97706;border-radius:6px;padding:14px;margin:0 0 20px">
      <p style="margin:0;font-size:13px;line-height:20px;color:#92400E">
        <strong>Cambia tu contraseña después de iniciar sesión.</strong>
        Este correo contiene tu contraseña en texto plano: bórralo una vez que hayas entrado.
      </p>
    </div>

    <p style="margin:0;font-size:12px;line-height:18px;color:#6B7280">
      Si no esperabas este correo, avisa a tu establecimiento.
    </p>
  </div>
</div>`;

module.exports = { employeeWelcome };
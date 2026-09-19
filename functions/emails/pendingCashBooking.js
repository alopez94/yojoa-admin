const BRAND = {
  blue: '#1D4ED8',
  blueDark: '#1a56db',
  blueSoft: '#eff6ff',
  amber: '#FEF3C7',
  amberText: '#92400E',
  amberRule: '#D97706',
  text: '#111827',
  muted: '#6B7280',
  rule: '#E5E7EB',
  page: '#F3F4F6',
};
 
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
 
const money = (currency, amount) =>
  `${esc(currency)} ${Number(amount || 0).toLocaleString('es-HN')}`;


const layout = ({ preheader, bodyHtml }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Yojoa Travel</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.page};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:${BRAND.blue};padding:24px 28px;">
              <span style="font-size:22px;">🌊</span>
              <span style="color:#FFFFFF;font-size:22px;font-weight:700;vertical-align:middle;margin-left:8px;">Yojoa Travel</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;border-top:1px solid ${BRAND.rule};">
              <p style="margin:0;font-size:12px;line-height:18px;color:${BRAND.muted};">
                Yojoa Travel · Cuenca del Lago de Yojoa, Honduras<br>
                Este correo se envió porque hiciste una reserva en nuestra aplicación.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
 
const pendingBar = (text) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
  <tr>
    <td style="background:${BRAND.amber};border-left:4px solid ${BRAND.amberRule};border-radius:6px;padding:12px 14px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:${BRAND.amberText};">${esc(text)}</p>
    </td>
  </tr>
</table>`;
 
const codeBox = (label, code) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr>
    <td align="center" style="background:${BRAND.blueSoft};border-radius:12px;padding:20px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:${BRAND.blueDark};">${esc(label)}</p>
      <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:2px;color:${BRAND.blueDark};">${esc(code)}</p>
    </td>
  </tr>
</table>`;
 
const row = (label, value, opts = {}) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid ${BRAND.rule};font-size:14px;color:${BRAND.muted};">${esc(label)}</td>
    <td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.rule};font-size:14px;font-weight:${opts.strong ? '700' : '500'};color:${opts.color || BRAND.text};">${value}</td>
  </tr>`;
 
const detailsCard = (title, rowsHtml) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;padding:4px 18px 14px;margin:0 0 20px;">
  <tr><td colspan="2" style="padding:14px 0 4px;font-size:15px;font-weight:700;color:${BRAND.text};">${esc(title)}</td></tr>
  ${rowsHtml}
</table>`;
 
const bookingRows = ({ establishmentName, activityName, date, time, guestCount, currency, totalPrice }) => `
  ${row('Establecimiento', esc(establishmentName))}
  ${row('Actividad', esc(activityName))}
  ${row('Fecha', esc(date))}
  ${row('Hora', esc(time))}
  ${row('Personas', esc(guestCount))}
  ${row('Total', money(currency, totalPrice), { strong: true, color: BRAND.blueDark })}`;


const pendingCashBooking = ({
  touristName, activityName, establishmentName, confirmationCode,
  date, time, guestCount, currency, totalPrice, address,
}) =>
  layout({
    preheader: `Tu espacio está apartado. Paga ${money(currency, totalPrice)} en efectivo al llegar.`,
    bodyHtml: `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.text};">Tu espacio está apartado</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:${BRAND.text};">
        Hola <strong>${esc(touristName)}</strong>, guardamos tu lugar en ${esc(activityName)}.
        Pagarás en efectivo al llegar.
      </p>
 
      ${pendingBar('Pendiente de pago')}
 
      ${codeBox('Código de confirmación', confirmationCode)}
 
      <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:${BRAND.text};">
        Presenta este código en ${esc(establishmentName)} el día de tu actividad y paga
        <strong>${money(currency, totalPrice)}</strong> en efectivo.
      </p>
 
      ${detailsCard('Detalles de tu reserva', `
        ${bookingRows({ establishmentName, activityName, date, time, guestCount, currency, totalPrice })}
        ${address ? row('Dirección', esc(address)) : ''}
      `)}
 
      <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:${BRAND.text};">Antes de ir</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:21px;color:${BRAND.muted};">
        Llega unos minutos antes de la hora reservada. Lleva el monto exacto si puedes.
      </p>
 
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:${BRAND.amber};border-radius:6px;padding:14px;">
            <p style="margin:0;font-size:13px;line-height:20px;color:${BRAND.amberText};">
              Si tus planes cambian, cancela desde la aplicación para liberar el espacio.
            </p>
          </td>
        </tr>
      </table>`,
  });
 
module.exports = { pendingCashBooking };
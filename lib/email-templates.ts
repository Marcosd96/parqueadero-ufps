/* ─── Email templates for registration status notifications ─────────────── */

interface RegistrationData {
  fullName: string;
  plate: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  institutionalCode: string;
}

/* ─── Shared layout wrapper ─────────────────────────────────────────────── */
function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UFPS PARKING</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#003c8f,#1a73e8);padding:32px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:10px;padding:10px 14px;font-size:22px;margin-bottom:12px;">🅿️</span>
                    <div style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">UFPS PARKING</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:2px;">UFPS — Parqueadero Universitario</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                Este correo fue generado automáticamente por el sistema de parqueadero de la
                <strong>Universidad Francisco de Paula Santander</strong>.<br/>
                No respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─── Approved template ─────────────────────────────────────────────────── */
export function approvedEmailHtml(data: RegistrationData): string {
  const vehicle = [data.vehicleBrand, data.vehicleModel].filter(Boolean).join(" ");
  return emailLayout(`
    <!-- Status badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center;margin-bottom:12px;">✅</div>
      <h1 style="margin:0;font-size:22px;font-weight:900;color:#166534;letter-spacing:-0.5px;">¡Acceso aprobado!</h1>
    </div>

    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Hola <strong>${data.fullName}</strong>, tu solicitud de acceso al parqueadero universitario ha sido
      <strong style="color:#16a34a;">aprobada</strong> por el equipo administrativo.
    </p>

    <!-- Vehicle card -->
    <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#4ade80;">Vehículo registrado</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;">
            <span style="font-size:13px;color:#6b7280;">Placa</span><br/>
            <strong style="font-size:16px;color:#111827;font-family:monospace;letter-spacing:1px;">${data.plate}</strong>
          </td>
          ${vehicle ? `
          <td style="padding:4px 0;">
            <span style="font-size:13px;color:#6b7280;">Vehículo</span><br/>
            <strong style="font-size:15px;color:#111827;">${vehicle}</strong>
          </td>` : ""}
          <td style="padding:4px 0;">
            <span style="font-size:13px;color:#6b7280;">Código</span><br/>
            <strong style="font-size:15px;color:#111827;font-family:monospace;">${data.institutionalCode}</strong>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
      A partir de ahora tu vehículo está habilitado para ingresar al parqueadero universitario.
      Presenta tu carnet institucional al celador en caso de ser requerido.
    </p>

    <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:4px;padding:14px 16px;">
      <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.5;">
        ℹ️ Si cambias de vehículo o pierdes acceso, deberás enviar una nueva solicitud a través del portal.
      </p>
    </div>
  `);
}

/* ─── Rejected template ─────────────────────────────────────────────────── */
export function rejectedEmailHtml(data: RegistrationData): string {
  return emailLayout(`
    <!-- Status badge -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#fee2e2;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;text-align:center;margin-bottom:12px;">❌</div>
      <h1 style="margin:0;font-size:22px;font-weight:900;color:#991b1b;letter-spacing:-0.5px;">Solicitud no aprobada</h1>
    </div>

    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Hola <strong>${data.fullName}</strong>, lamentamos informarte que tu solicitud de acceso al
      parqueadero universitario ha sido <strong style="color:#dc2626;">rechazada</strong> por el equipo administrativo.
    </p>

    <!-- Request summary -->
    <div style="background:#fff1f2;border:1.5px solid #fecaca;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#f87171;">Solicitud presentada</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;">
            <span style="font-size:13px;color:#6b7280;">Placa</span><br/>
            <strong style="font-size:16px;color:#111827;font-family:monospace;letter-spacing:1px;">${data.plate}</strong>
          </td>
          <td style="padding:4px 0;">
            <span style="font-size:13px;color:#6b7280;">Código</span><br/>
            <strong style="font-size:15px;color:#111827;font-family:monospace;">${data.institutionalCode}</strong>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
      Los motivos más comunes de rechazo son: documentos ilegibles, placa inválida o información
      inconsistente. Puedes corregir los datos y enviar una nueva solicitud.
    </p>

    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;padding:14px 16px;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
        ⚠️ Si crees que esto es un error, contacta directamente a la oficina de parqueadero o
        visita la portería principal con tu documentación.
      </p>
    </div>
  `);
}

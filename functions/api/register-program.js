// Cloudflare Pages Function: sends an email notification (via Resend) when
// someone submits the "Join / Daftar" form on a program detail page.
//
// The actual registration record is written to Supabase directly from the
// browser (program_registrations, RLS lets anon insert — see js/program-hub.js),
// so a submission is never lost even if this function or Resend is
// unreachable; this endpoint only best-effort notifies the admin by email.
//
// Cloudflare secrets/vars needed (Pages dashboard -> Settings -> Environment
// variables), none of which are ever sent to the browser:
//   RESEND_API_KEY    - from resend.com
//   PROGRAM_NOTIFY_TO - the admin inbox to notify, e.g. ifai.space@gmail.com
//   RESEND_FROM       - optional; defaults to Resend's sandbox sender, which
//                       only delivers to the email the Resend account itself
//                       was created with. Once a sending domain is verified
//                       in Resend, set this to e.g. "IFAI <noreply@myifai.com>"
//                       to notify any address.
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESEND_API_KEY || !env.PROGRAM_NOTIFY_TO) {
    // Not configured yet: the DB insert already happened client-side, so the
    // registration itself is not lost — only this notification is skipped.
    return json({ error: 'Email notification is not configured yet.' }, 501);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();
  const programTitle = (body.program_title || '').trim();
  const programId = (body.program_id || '').trim();
  const isId = body.lang !== 'en';

  if (!name || !email || !programTitle) {
    return json({ error: 'Missing name, email, or program_title.' }, 400);
  }

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fromAddress = env.RESEND_FROM || 'IFAI <onboarding@resend.dev>';
  const pageUrl = programId ? `https://www.myifai.com/program-detail?id=${encodeURIComponent(programId)}` : 'https://www.myifai.com/program';

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [env.PROGRAM_NOTIFY_TO],
      reply_to: email,
      subject: `Pendaftaran baru: ${programTitle}`,
      html: `
        <p><strong>Program:</strong> ${esc(programTitle)}</p>
        <p><strong>Nama:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>WhatsApp:</strong> ${esc(phone || '-')}</p>
        <p><a href="${esc(pageUrl)}">Lihat halaman program</a></p>
      `,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text();
    return json({ error: 'Resend request failed.', detail }, resendRes.status);
  }

  // Best-effort confirmation to the registrant themselves. Sent only if the
  // sending domain is verified (RESEND_FROM set) — the sandbox sender can't
  // deliver to arbitrary addresses, so skip it rather than fail silently.
  if (env.RESEND_FROM) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: isId ? `Pendaftaran diterima: ${programTitle}` : `Registration received: ${programTitle}`,
        html: isId ? `
          <p>Hai ${esc(name)},</p>
          <p>Pendaftaranmu untuk <strong>${esc(programTitle)}</strong> sudah kami terima. Tim IFAI akan menghubungimu melalui email atau WhatsApp yang kamu daftarkan jika ada informasi lebih lanjut.</p>
          <p><a href="${esc(pageUrl)}">Lihat halaman program</a></p>
          <p>Terima kasih,<br>Tim IFAI</p>
        ` : `
          <p>Hi ${esc(name)},</p>
          <p>Your registration for <strong>${esc(programTitle)}</strong> has been received. The IFAI team will reach out by email or WhatsApp if there's anything further.</p>
          <p><a href="${esc(pageUrl)}">View program page</a></p>
          <p>Thanks,<br>IFAI Team</p>
        `,
      }),
    }).catch(() => {});
  }

  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

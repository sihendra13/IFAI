// Cloudflare Pages Function: proxies translate requests to DeepL.
// The DeepL API key lives only in the Cloudflare secret DEEPL_API_KEY —
// it is never sent to or readable by the browser.
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DEEPL_API_KEY) {
    return json({ error: 'Server is missing DEEPL_API_KEY.' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const text = (body.text || '').trim();
  const targetLang = body.target_lang || 'EN-US';
  const sourceLang = body.source_lang || 'ID';

  if (!text) {
    return json({ error: 'Missing text.' }, 400);
  }

  const params = new URLSearchParams();
  params.append('text', text);
  params.append('target_lang', targetLang);
  params.append('source_lang', sourceLang);

  // Free-plan keys (suffixed ":fx") must use the api-free host.
  const apiHost = env.DEEPL_API_KEY.endsWith(':fx')
    ? 'https://api-free.deepl.com'
    : 'https://api.deepl.com';

  const deeplRes = await fetch(`${apiHost}/v2/translate`, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!deeplRes.ok) {
    const detail = await deeplRes.text();
    return json({ error: 'DeepL request failed.', detail }, deeplRes.status);
  }

  const data = await deeplRes.json();
  const translated = data.translations?.[0]?.text || '';
  return json({ translated });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

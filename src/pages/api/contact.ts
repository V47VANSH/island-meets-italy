/**
 * Contact form endpoint (§7.6).
 *
 * The only route on the site that is not prerendered — the six pages stay
 * static, this runs on demand on Cloudflare Workers.
 *
 * Delivery rules, deliberately fail-loud:
 *
 *   development — if there is no recipient or no API key, the submission is
 *                 logged and reported as success, so the form can be demoed.
 *
 *   production  — if either is missing, this returns 503 and the form tells
 *                 the visitor it could not send. A real inquiry must never be
 *                 silently dropped, so a "success" that sent nothing is worse
 *                 than an honest failure.
 *
 * Resend is called over its REST API with plain fetch. No SDK, no dependency.
 * The API key is read from the Worker environment and never from config.
 */
import type { APIRoute } from 'astro';
import { site } from '@/config/site';

export const prerender = false;

interface Env {
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  /** Overrides site.contact.formRecipient without a rebuild, if wanted. */
  CONTACT_RECIPIENT?: string;
  RESEND_FROM?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Cloudflare Turnstile, verified only once a secret is configured (§7.6). */
async function turnstileOk(token: string | null, secret: string | undefined, ip: string | null) {
  if (!secret) return true; // not configured yet — do not block real people
  if (!token) return false;

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body },
    );
    const result = (await res.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const env = ((locals as { runtime?: { env?: Env } }).runtime?.env ?? {}) as Env;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'unreadable' }, 400);
  }

  const value = (key: string) => String(form.get(key) ?? '').trim();

  // Honeypot: a person never sees this field, so anything in it is a bot.
  // Answer 200 so the bot believes it succeeded and does not retry.
  if (value('company')) return json({ ok: true });

  const name = value('name');
  const email = value('email');
  const inquiryType = value('inquiryType') || site.inquiryTypes[0];
  const message = value('message');

  const invalid: string[] = [];
  if (!name) invalid.push('name');
  if (!email || !EMAIL.test(email)) invalid.push('email');
  if (!message) invalid.push('message');
  if (!site.inquiryTypes.includes(inquiryType as (typeof site.inquiryTypes)[number])) {
    invalid.push('inquiryType');
  }
  if (invalid.length > 0) return json({ ok: false, error: 'invalid', fields: invalid }, 422);

  const passed = await turnstileOk(
    (form.get('cf-turnstile-response') as string | null) ?? null,
    env.TURNSTILE_SECRET_KEY,
    clientAddress ?? null,
  );
  if (!passed) return json({ ok: false, error: 'challenge' }, 403);

  const recipient = env.CONTACT_RECIPIENT ?? site.contact.formRecipient;
  const apiKey = env.RESEND_API_KEY;

  if (!recipient || !apiKey) {
    if (import.meta.env.DEV) {
      console.log('[contact] no recipient or API key — logging instead of sending', {
        name,
        email,
        inquiryType,
        message: message.slice(0, 120),
      });
      return json({ ok: true, delivered: false, note: 'logged in development' });
    }

    // Production with nothing configured: say so rather than pretend.
    console.error(
      '[contact] submission could not be delivered: ' +
        `${!recipient ? 'no recipient configured' : ''}` +
        `${!recipient && !apiKey ? ' and ' : ''}` +
        `${!apiKey ? 'no RESEND_API_KEY in the environment' : ''}`,
    );
    return json({ ok: false, error: 'not-configured' }, 503);
  }

  const subject = `Island Meets Italy — ${inquiryType} from ${name}`;
  const text = [
    `Inquiry type: ${inquiryType}`,
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    message,
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM ?? 'Island Meets Italy <website@islandmeetsitaly.com>',
        to: [recipient],
        reply_to: email,
        subject,
        text,
      }),
    });

    if (!res.ok) {
      console.error('[contact] Resend rejected the send', res.status, await res.text());
      return json({ ok: false, error: 'send-failed' }, 502);
    }
  } catch (error) {
    console.error('[contact] Resend request threw', error);
    return json({ ok: false, error: 'send-failed' }, 502);
  }

  return json({ ok: true, delivered: true });
};

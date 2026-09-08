/**
 * HR:RUSH FOR PRACTICE — minimal Cloudflare Worker + D1 backend.
 * Same shape as sofiasummit-events-api: one Worker, one D1 database,
 * no framework. Handles only what the public site needs right now —
 * the student application form. CV upload and an admin review panel
 * are intentionally left out of this first version (would need R2 for
 * file storage) and can be added the same way sofiasummit's backend
 * grows incrementally.
 */

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env),
    },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateApplication(body) {
  const errors = [];
  const required = ['firstName', 'lastName', 'university', 'specialty', 'phone', 'email'];
  for (const field of required) {
    if (!body || typeof body[field] !== 'string' || body[field].trim() === '') {
      errors.push(`Missing field: ${field}`);
    }
  }
  if (body && body.email && !EMAIL_RE.test(body.email.trim())) {
    errors.push('Invalid email');
  }
  if (body && body.phone && body.phone.trim().length < 6) {
    errors.push('Invalid phone');
  }
  // Basic length caps so a malformed/abusive payload can't bloat the row.
  for (const field of required) {
    if (body && typeof body[field] === 'string' && body[field].length > 200) {
      errors.push(`Field too long: ${field}`);
    }
  }
  return errors;
}

async function handleApply(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ success: false, errors: ['Invalid JSON body'] }, 400, env);
  }

  const errors = validateApplication(body);
  if (errors.length) {
    return json({ success: false, errors }, 400, env);
  }

  const { firstName, lastName, university, specialty, phone, email } = body;

  try {
    const result = await env.DB.prepare(
      `INSERT INTO applications (first_name, last_name, university, specialty, phone, email)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(firstName.trim(), lastName.trim(), university.trim(), specialty.trim(), phone.trim(), email.trim().toLowerCase())
      .run();

    return json({ success: true, id: result.meta.last_row_id }, 201, env);
  } catch (e) {
    console.error('DB insert failed', e);
    return json({ success: false, errors: ['Server error, please try again'] }, 500, env);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return json({ status: 'ok' }, 200, env);
    }

    if (url.pathname === '/api/apply' && request.method === 'POST') {
      return handleApply(request, env);
    }

    return json({ success: false, errors: ['Not found'] }, 404, env);
  },
};

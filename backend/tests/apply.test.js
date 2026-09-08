// Minimal smoke tests for the /api/apply validation logic.
// Run with: npm install --save-dev vitest && npx vitest run
// (kept intentionally small — same scope as sofiasummit's own test setup)

import { describe, it, expect } from 'vitest';

// Re-implemented here rather than imported, since src/index.js exports a
// Worker `fetch` handler, not the validator directly. Keep this in sync
// with the real validateApplication() in ../src/index.js if that changes.
function validateApplication(body) {
  const errors = [];
  const required = ['firstName', 'lastName', 'university', 'specialty', 'phone', 'email'];
  for (const field of required) {
    if (!body || typeof body[field] !== 'string' || body[field].trim() === '') {
      errors.push(`Missing field: ${field}`);
    }
  }
  if (body && body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    errors.push('Invalid email');
  }
  if (body && body.phone && body.phone.trim().length < 6) {
    errors.push('Invalid phone');
  }
  return errors;
}

describe('validateApplication', () => {
  const valid = {
    firstName: 'Иван',
    lastName: 'Иванов',
    university: 'СУ',
    specialty: 'Маркетинг',
    phone: '+359888888888',
    email: 'ivan@example.com',
  };

  it('accepts a fully filled, valid application', () => {
    expect(validateApplication(valid)).toEqual([]);
  });

  it('flags missing required fields', () => {
    const errors = validateApplication({ ...valid, firstName: '' });
    expect(errors).toContain('Missing field: firstName');
  });

  it('flags an invalid email', () => {
    const errors = validateApplication({ ...valid, email: 'not-an-email' });
    expect(errors).toContain('Invalid email');
  });

  it('flags a too-short phone number', () => {
    const errors = validateApplication({ ...valid, phone: '123' });
    expect(errors).toContain('Invalid phone');
  });
});

import { describe, it, expect } from 'vitest';
import { passwordProblems, validateBookingNotes, validateGig, validateRegister } from '../utils/validation';
import { displayRef, monthlyTotals } from '../utils/format';

describe('validation (mirrors the API rules)', () => {
  it('lists missing password rules', () => {
    expect(passwordProblems('abc')).toEqual(['at least 8 characters', 'an uppercase letter', 'a number']);
    expect(passwordProblems('StrongPass123')).toEqual([]);
  });

  it('does not allow registering as admin', () => {
    const errors = validateRegister({ name: 'Eve', email: 'e@x.co', password: 'StrongPass123', confirmPassword: 'StrongPass123', role: 'admin' });
    expect(errors.role).toBeDefined();
  });

  it('enforces the gig price range', () => {
    expect(validateGig({ title: 'Logo', description: 'A clean modern logo.', category: 'Design', price: '0' }).price).toBeDefined();
    expect(validateGig({ title: 'Logo', description: 'A clean modern logo.', category: 'Design', price: '100' })).toEqual({});
  });

  it('caps booking notes at 500 characters', () => {
    expect(validateBookingNotes('x'.repeat(501))).not.toBe('');
    expect(validateBookingNotes('ok')).toBe('');
  });
});

describe('formatting', () => {
  it('builds short receipt references', () => {
    expect(displayRef('TXN', 'a1b2c3d4-3333')).toBe('TXN-A1B2C3D4');
  });

  it('totals transactions into the last six months', () => {
    const now = new Date(2026, 9, 15);
    const months = monthlyTotals(
      [
        { amount: 100, createdAt: new Date(2026, 9, 2).toISOString() },
        { amount: 50.25, createdAt: new Date(2026, 9, 9).toISOString() },
        { amount: 70, createdAt: new Date(2026, 7, 9).toISOString() },
        { amount: 999, createdAt: new Date(2025, 0, 1).toISOString() }, // too old
      ],
      6,
      now
    );
    expect(months).toHaveLength(6);
    expect(months[5].total).toBe(150.25);
    expect(months[3].total).toBe(70);
    expect(months.reduce((s, m) => s + m.total, 0)).toBe(220.25);
  });
});

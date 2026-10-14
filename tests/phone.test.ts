import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatPhone } from '../src/shared/lib/phone/index.ts';
test('phone entry formats local, domestic and pasted international numbers without truncation', () => {
  assert.equal(formatPhone('291234567'), '+375 29 123 45 67');
  assert.equal(formatPhone('80291234567'), '+375 29 123 45 67');
  assert.equal(formatPhone('+375 (29) 123-45-67'), '+375 29 123 45 67');
  assert.equal(formatPhone('+3752'), '+375 2');
  assert.equal(formatPhone(''), '');
  assert.equal(formatPhone('+48 123 456 789'), '+48123456789');
  assert.equal(formatPhone('+3752912345678'), '+375 29 123 45 678');
});

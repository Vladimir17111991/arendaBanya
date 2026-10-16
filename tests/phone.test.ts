import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editPhone, formatPhone, PHONE_PATTERN } from '../src/shared/lib/phone/index.ts';

test('phone mask accepts Belarusian formats and limits the subscriber number to nine digits', () => {
  for (const value of ['291234567', '80291234567', '+375 (29) 123-45-67', '375291234567']) {
    assert.equal(formatPhone(value), '+375 (29) 123-45-67');
  }
  assert.equal(formatPhone('+375291234567890'), '+375 (29) 123-45-67');
  assert.equal(formatPhone(''), '+375');
  assert.equal(formatPhone('+48 123 456 789'), '+375');
  assert.equal(formatPhone('+3752'), '+375 (2');
});

test('typing rejects extra digits and letters without corrupting existing digits', () => {
  const full = '+375 (29) 123-45-67';
  assert.equal(editPhone(full, 10, 10, '9').value, full);
  assert.equal(editPhone(full, 19, 19, 'abc123').value, full);
  assert.deepEqual(editPhone(full, 6, 8, '44'), { value: '+375 (44) 123-45-67', caret: 10 });
  let state = { value: '+375', caret: 4 };
  for (const digit of '291234567') state = editPhone(state.value, state.caret, state.caret, digit);
  assert.deepEqual(state, { value: full, caret: 19 });
});

test('deletion skips separators and never removes the fixed country prefix', () => {
  const full = '+375 (29) 123-45-67';
  assert.deepEqual(editPhone(full, 0, full.length, '', 'backward'), { value: '+375', caret: 4 });
  assert.equal(editPhone('+375', 4, 4, '', 'backward').value, '+375');
  assert.equal(editPhone(full, 4, 4, '', 'backward').value, full);
  assert.equal(editPhone(full, 14, 14, '', 'backward').value, '+375 (29) 124-56-7');
  assert.equal(editPhone(full, 13, 13, '', 'forward').value, '+375 (29) 123-56-7');
});

test('form validation accepts only a complete masked phone number', () => {
  const valid = new RegExp(`^(?:${PHONE_PATTERN})$`, 'u');
  assert.ok(valid.test('+375 (29) 123-45-67'));
  for (const value of [
    '+375',
    '+375 (29)',
    '+375 (29) 123-45-6',
    '+375 (29) 123-45-678',
    '+48 (29) 123-45-67',
  ])
    assert.equal(valid.test(value), false);
});

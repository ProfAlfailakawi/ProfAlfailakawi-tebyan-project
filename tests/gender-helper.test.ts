import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  detectGender, normalizeArabicString, isGenericOrNicknameName, resolveUserAddressing,
  buildUserAddressingInstruction, getGenderWord,
} from '../src/utils/genderHelper';

test('normalizeArabicString strips diacritics and unifies alef forms', () => {
  assert.equal(normalizeArabicString('أَحْمَد'), 'احمد');
  assert.equal(normalizeArabicString('إبراهيم'), 'ابراهيم');
  assert.equal(normalizeArabicString(''), '');
});

test('detectGender: empty input is neutral', () => {
  assert.equal(detectGender(''), 'neutral');
  assert.equal(detectGender(null), 'neutral');
  assert.equal(detectGender(undefined), 'neutral');
  assert.equal(detectGender('   '), 'neutral');
});

test('detectGender: male names that end like female ones stay male', () => {
  for (const n of ['حمزة', 'مصطفى', 'موسى', 'علاء']) assert.equal(detectGender(n), 'male', n);
});

test('detectGender: Arabic feminine endings and common English names', () => {
  assert.equal(detectGender('سارة'), 'female');
  assert.equal(detectGender('Sarah'), 'female');
  assert.equal(detectGender('ahmed'), 'male');
  assert.equal(detectGender('Qzxv'), 'neutral');
});

test('detectGender only looks at the first word', () => {
  assert.equal(detectGender('ahmed sarah'), 'male');
});

test('isGenericOrNicknameName flags placeholders, handles and digits', () => {
  for (const n of ['', null, undefined, 'ضيف', 'Guest', 'admin', '@someone', 'user_77', 'abu-x']) {
    assert.equal(isGenericOrNicknameName(n as string | null | undefined), true, String(n));
  }
  assert.equal(isGenericOrNicknameName('Sarah Ali'), false);
});

test('resolveUserAddressing: guests and empty names are never addressed by name', () => {
  const guest = resolveUserAddressing('Sarah', true);
  assert.deepEqual([guest.shouldUseName, guest.reason, guest.gender, guest.isGuest], [false, 'guest', 'neutral', true]);
  for (const empty of [null, '', 'New User']) {
    const p = resolveUserAddressing(empty);
    assert.deepEqual([p.shouldUseName, p.reason], [false, 'empty'], String(empty));
  }
});

test('resolveUserAddressing: generic and unknown-gender names fall back to a neutral guest address', () => {
  const generic = resolveUserAddressing('@abc');
  assert.deepEqual([generic.shouldUseName, generic.reason, generic.name], [false, 'generic', 'ضيف']);
  const unknown = resolveUserAddressing('Qzxv Plmk');
  assert.deepEqual([unknown.shouldUseName, unknown.reason, unknown.gender], [false, 'unknown-gender', 'neutral']);
});

test('resolveUserAddressing: a clear personal name is used, skipping a Dr. prefix', () => {
  const p = resolveUserAddressing('Dr ahmed');
  assert.deepEqual([p.shouldUseName, p.reason, p.gender, p.name], [true, 'personal-name', 'male', 'ahmed']);
  const f = resolveUserAddressing('Sarah Ali');
  assert.deepEqual([f.shouldUseName, f.gender, f.firstName], [true, 'female', 'Sarah']);
});

test('buildUserAddressingInstruction reflects the profile', () => {
  const named = buildUserAddressingInstruction(resolveUserAddressing('Sarah Ali'));
  assert.match(named, /female/);
  assert.match(named, /"Sarah"/);
  const guest = buildUserAddressingInstruction(resolveUserAddressing('x', true));
  assert.match(guest, /neutral/);
  assert.match(guest, /لا تستخدم اسم المستخدم/);
});

test('getGenderWord picks the matching word', () => {
  assert.equal(getGenderWord('male', 'm', 'f', 'n'), 'm');
  assert.equal(getGenderWord('female', 'm', 'f', 'n'), 'f');
  assert.equal(getGenderWord('neutral', 'm', 'f', 'n'), 'n');
});

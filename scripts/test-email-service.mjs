import assert from 'node:assert/strict';
import { getEmailService } from '../server/_utils/email-service.js';

for (const key of ['name-check', 'namecheck', 'namecheck-1']) {
  assert.deepEqual(getEmailService(key), { service: 'name-check', isBaby: false, isNameCheck: true });
}
for (const [key, service] of [
  ['perfect-baby-name-report', 'perfect-baby-name-report'],
  ['complete-baby-name-blueprint', 'complete-baby-name-blueprint'],
  ['single', 'perfect-baby-name-report'],
  ['premium', 'complete-baby-name-blueprint'],
]) {
  assert.deepEqual(getEmailService(key), { service, isBaby: true, isNameCheck: false });
}
assert.equal(getEmailService('baby_name').isBaby, true);
assert.equal(getEmailService('unknown').isBaby, false);
assert.equal(getEmailService(undefined).isBaby, false);
console.log('Email service classification checks passed.');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  isValidResumeId,
  normalizeResumeId,
  normalizeReturnTo,
} = require('../lib/crm/resume-id');

test('normalizeResumeId decodes and strips query params', () => {
  const input = 'res_1765723370787%3Ffrom%3D%252Fcrm';
  const result = normalizeResumeId(input);
  assert.equal(result.raw, input);
  assert.equal(result.normalized, 'res_1765723370787');
});

test('normalizeResumeId handles missing values', () => {
  const result = normalizeResumeId(undefined);
  assert.equal(result.raw, undefined);
  assert.equal(result.normalized, undefined);
});

test('isValidResumeId accepts res_ ids with digits', () => {
  assert.equal(isValidResumeId('res_1765723370787'), true);
  assert.equal(isValidResumeId('res_1234567890'), true);
});

test('isValidResumeId rejects invalid ids', () => {
  assert.equal(isValidResumeId('rec_1234567890'), false);
  assert.equal(isValidResumeId('res-1234567890'), false);
  assert.equal(isValidResumeId(''), false);
});

test('normalizeReturnTo accepts crm paths only', () => {
  assert.equal(normalizeReturnTo('/crm?q=080&pageSize=20'), '/crm?q=080&pageSize=20');
  assert.equal(normalizeReturnTo('https%3A%2F%2Fevil.com'), '/crm');
  assert.equal(normalizeReturnTo(undefined), '/crm');
});

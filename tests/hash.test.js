const test = require('node:test');
const assert = require('node:assert/strict');
const { sha256, buildMerkleRoot } = require('../src/utils/hash');

test('sha256 is deterministic', () => {
  assert.equal(sha256('hello'), sha256('hello'));
  assert.notEqual(sha256('hello'), sha256('world'));
});

test('Merkle root is stable for the same ordered events', () => {
  const events = [
    { event_id: 'e1', event_type: 'job.processed', created_at: '2026-01-01T00:00:00Z', actor_id: 'u1' },
    { event_id: 'e2', event_type: 'job.feedback', created_at: '2026-01-01T00:01:00Z', actor_id: 'u1', related_job_id: 'j1' }
  ];
  assert.equal(buildMerkleRoot(events), buildMerkleRoot(events));
  assert.match(buildMerkleRoot(events), /^[a-f0-9]{64}$/);
});

test('empty event list has no Merkle root', () => {
  assert.equal(buildMerkleRoot([]), null);
});

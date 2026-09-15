const crypto = require('crypto');

function sha256(value) {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex');
}

function buildAuditLeaf(event) {
  const fields = [
    event.event_id || '',
    event.event_type || '',
    event.created_at || '',
    event.actor_id || 'anonymous',
    event.related_job_id || '',
    event.related_resource_hash || ''
  ];
  return sha256(fields.join('|'));
}

function buildMerkleRoot(events) {
  if (!events || events.length === 0) return null;

  let level = events.map(buildAuditLeaf);
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      const pair = [left, right].sort().join('');
      next.push(sha256(pair));
    }
    level = next;
  }
  return level[0];
}

module.exports = { sha256, buildAuditLeaf, buildMerkleRoot };

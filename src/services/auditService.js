const { buildMerkleRoot } = require('../utils/hash');

async function appendAuditEvent(store, event) {
  const batch = await store.getOpenBatch();
  const storedEvent = await store.addEvent({ ...event, batch_id: batch.batch_id });
  const events = await store.listEventsByBatch(batch.batch_id);
  const root = buildMerkleRoot(events);
  await store.updateBatch(batch.batch_id, {
    merkle_root: root,
    item_count: events.length
  });
  return { event: storedEvent, merkle_root: root };
}

module.exports = { appendAuditEvent };

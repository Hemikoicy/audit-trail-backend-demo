const { randomUUID } = require('crypto');

class MemoryStore {
  constructor() {
    this.events = [];
    this.resources = [];
    this.batches = [];
  }

  async getOpenBatch() {
    let batch = this.batches.find((item) => item.status === 'OPEN');
    if (!batch) {
      batch = {
        batch_id: `batch_${randomUUID()}`,
        status: 'OPEN',
        merkle_root: null,
        item_count: 0,
        updated_at: new Date().toISOString()
      };
      this.batches.push(batch);
    }
    return batch;
  }

  async addEvent(event) {
    const stored = { ...event, created_at: event.created_at || new Date().toISOString() };
    this.events.push(stored);
    return stored;
  }

  async listEventsByBatch(batchId) {
    return this.events
      .filter((event) => event.batch_id === batchId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async updateBatch(batchId, patch) {
    const batch = this.batches.find((item) => item.batch_id === batchId);
    if (!batch) throw new Error('Batch not found');
    Object.assign(batch, patch, { updated_at: new Date().toISOString() });
    return batch;
  }

  async addResource(resource) {
    const stored = {
      id: this.resources.length + 1,
      ...resource,
      created_at: new Date().toISOString()
    };
    this.resources.push(stored);
    return stored;
  }

  async findTimeline(id) {
    return this.events
      .filter((event) =>
        event.event_id === id ||
        event.related_job_id === id ||
        event.related_resource_hash === id
      )
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async exportData() {
    return {
      audit_events: this.events,
      audit_batches: this.batches,
      resources: this.resources
    };
  }
}

module.exports = { MemoryStore };

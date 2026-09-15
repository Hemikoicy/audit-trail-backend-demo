const { randomUUID } = require('crypto');
const { createClient } = require('@supabase/supabase-js');

class SupabaseStore {
  constructor(url, key) {
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY are required when STORAGE_MODE=supabase');
    }
    this.client = createClient(url, key);
  }

  async getOpenBatch() {
    const { data, error } = await this.client
      .from('audit_batches')
      .select('*')
      .eq('status', 'OPEN')
      .maybeSingle();
    if (error) throw error;
    if (data) return data;

    const batch = {
      batch_id: `batch_${randomUUID()}`,
      status: 'OPEN',
      merkle_root: null,
      item_count: 0
    };
    const result = await this.client.from('audit_batches').insert([batch]).select().single();
    if (result.error) throw result.error;
    return result.data;
  }

  async addEvent(event) {
    const result = await this.client.from('audit_events').insert([event]).select().single();
    if (result.error) throw result.error;
    return result.data;
  }

  async listEventsByBatch(batchId) {
    const { data, error } = await this.client
      .from('audit_events')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async updateBatch(batchId, patch) {
    const result = await this.client
      .from('audit_batches')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('batch_id', batchId)
      .select()
      .single();
    if (result.error) throw result.error;
    return result.data;
  }

  async addResource(resource) {
    const result = await this.client.from('resources').insert([resource]).select().single();
    if (result.error) throw result.error;
    return result.data;
  }

  async findTimeline(id) {
    const safeId = String(id).replace(/[(),]/g, '');
    const { data, error } = await this.client
      .from('audit_events')
      .select('*')
      .or(`event_id.eq.${safeId},related_job_id.eq.${safeId},related_resource_hash.eq.${safeId}`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async exportData() {
    const tables = ['audit_events', 'audit_batches', 'resources'];
    const result = {};
    for (const table of tables) {
      const { data, error } = await this.client.from(table).select('*');
      if (error) throw error;
      result[table] = data || [];
    }
    return result;
  }
}

module.exports = { SupabaseStore };

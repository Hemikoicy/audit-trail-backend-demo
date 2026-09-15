const { config } = require('../config');
const { MemoryStore } = require('./memoryStore');
const { SupabaseStore } = require('./supabaseStore');

function createStore() {
  if (config.storageMode === 'supabase') {
    return new SupabaseStore(config.supabaseUrl, config.supabaseKey);
  }
  return new MemoryStore();
}

module.exports = { createStore };

const config = {
  port: Number(process.env.PORT || 3000),
  storageMode: process.env.STORAGE_MODE || 'memory',
  processorMode: process.env.PROCESSOR_MODE || 'mock',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || ''
};

module.exports = { config };

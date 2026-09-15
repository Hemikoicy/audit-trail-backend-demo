const { config } = require('../config');

async function processText(input) {
  if (config.processorMode === 'openai') {
    if (!config.openaiApiKey || !config.openaiModel) {
      throw new Error('OPENAI_API_KEY and OPENAI_MODEL are required when PROCESSOR_MODE=openai');
    }

    const OpenAI = require('openai');
    const client = new OpenAI({ apiKey: config.openaiApiKey });
    const completion = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        { role: 'system', content: 'Return a concise summary of the supplied text.' },
        { role: 'user', content: input }
      ]
    });

    return {
      provider: 'openai',
      output: completion.choices?.[0]?.message?.content || ''
    };
  }

  return {
    provider: 'mock',
    output: `Processed: ${String(input).slice(0, 160)}`
  };
}

module.exports = { processText };

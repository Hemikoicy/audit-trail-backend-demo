const express = require('express');
const { randomUUID } = require('crypto');
const cors = require('cors');
const AdmZip = require('adm-zip');
const { createStore } = require('./store');
const { processText } = require('./services/processor');
const { appendAuditEvent } = require('./services/auditService');
const { sha256 } = require('./utils/hash');

function toCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((row) => headers.map((key) => escape(row[key])).join(','))].join('\n');
}

function createApp(store = createStore()) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/version', (_req, res) => {
    res.json({ api_version: '1.0.0', schema_version: 'portfolio_v1' });
  });

  app.post('/api/jobs', async (req, res) => {
    try {
      const { actor_id, input } = req.body || {};
      if (typeof input !== 'string' || !input.trim()) {
        return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'input is required' } });
      }

      const jobId = `job_${randomUUID()}`;
      const processed = await processText(input);
      const inputHash = sha256(input);
      const outputHash = sha256(processed.output);

      const audit = await appendAuditEvent(store, {
        event_id: `evt_${randomUUID()}`,
        event_type: 'job.processed',
        actor_id: actor_id || 'anonymous',
        related_job_id: jobId,
        metadata: { provider: processed.provider, input_hash: inputHash, output_hash: outputHash }
      });

      res.status(201).json({
        job_id: jobId,
        provider: processed.provider,
        output: processed.output,
        proof: { input_hash: inputHash, output_hash: outputHash, merkle_root: audit.merkle_root },
        verify_url: `/api/verify?id=${jobId}`
      });
    } catch (error) {
      res.status(500).json({ error: { code: 'PROCESSING_FAILED', message: error.message } });
    }
  });

  app.post('/api/feedback', async (req, res) => {
    try {
      const { job_id, actor_id, rating } = req.body || {};
      if (!job_id || !['positive', 'negative'].includes(rating)) {
        return res.status(400).json({ error: { code: 'INVALID_FEEDBACK', message: 'job_id and rating are required' } });
      }

      const audit = await appendAuditEvent(store, {
        event_id: `evt_${randomUUID()}`,
        event_type: 'job.feedback',
        actor_id: actor_id || 'anonymous',
        related_job_id: job_id,
        metadata: { rating }
      });

      res.status(201).json({ event_id: audit.event.event_id, merkle_root: audit.merkle_root });
    } catch (error) {
      res.status(500).json({ error: { code: 'FEEDBACK_FAILED', message: error.message } });
    }
  });

  app.post('/api/resources', async (req, res) => {
    try {
      const { job_id, actor_id, content } = req.body || {};
      if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: { code: 'INVALID_CONTENT', message: 'content is required' } });
      }

      const resourceHash = sha256(content);
      const resource = await store.addResource({
        job_id: job_id || null,
        content_digest: resourceHash
      });

      const audit = await appendAuditEvent(store, {
        event_id: `evt_${randomUUID()}`,
        event_type: 'resource.registered',
        actor_id: actor_id || 'anonymous',
        related_job_id: job_id || null,
        related_resource_hash: resourceHash,
        metadata: { resource_id: resource.id }
      });

      res.status(201).json({
        resource_id: resource.id,
        resource_hash: resourceHash,
        merkle_root: audit.merkle_root,
        verify_url: `/api/verify?id=${resourceHash}`
      });
    } catch (error) {
      res.status(500).json({ error: { code: 'RESOURCE_REGISTRATION_FAILED', message: error.message } });
    }
  });

  app.get('/api/verify', async (req, res) => {
    try {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: { code: 'MISSING_ID', message: 'id is required' } });
      }
      const timeline = await store.findTimeline(id);
      res.json({ query_id: id, state: timeline.length ? 'found' : 'not_found', timeline });
    } catch (error) {
      res.status(500).json({ error: { code: 'VERIFY_FAILED', message: error.message } });
    }
  });

  app.get('/api/audit/export', async (_req, res) => {
    try {
      const data = await store.exportData();
      const zip = new AdmZip();
      for (const [name, rows] of Object.entries(data)) {
        zip.addFile(`${name}.csv`, Buffer.from(toCsv(rows), 'utf8'));
      }
      res.set('Content-Type', 'application/zip');
      res.set('Content-Disposition', 'attachment; filename="audit-export.zip"');
      res.send(zip.toBuffer());
    } catch (error) {
      res.status(500).json({ error: { code: 'EXPORT_FAILED', message: error.message } });
    }
  });

  return app;
}

module.exports = { createApp };

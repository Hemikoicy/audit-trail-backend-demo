# API examples

## Health check

```bash
curl http://localhost:3000/healthz
```

## Create a processing job

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H 'Content-Type: application/json' \
  -d '{"actor_id":"demo-user","input":"Please summarize this sample text."}'
```

## Register feedback

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H 'Content-Type: application/json' \
  -d '{"job_id":"JOB_ID","actor_id":"demo-user","rating":"positive"}'
```

## Register a resource digest

```bash
curl -X POST http://localhost:3000/api/resources \
  -H 'Content-Type: application/json' \
  -d '{"job_id":"JOB_ID","actor_id":"demo-user","content":"sample resource body"}'
```

The original resource body is not stored by this demo. Only its SHA-256 digest is saved.

## Verify an audit timeline

```bash
curl 'http://localhost:3000/api/verify?id=JOB_ID'
```

## Export audit data

```bash
curl -o audit-export.zip http://localhost:3000/api/audit/export
```

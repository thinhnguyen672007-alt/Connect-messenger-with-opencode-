# Messenger to OpenCode

Webhook bridge: Messenger -> Node.js -> queue/worker -> OpenCode -> Messenger Send API. Small commits, Architecture C direction.

## Flow

`Messenger/Page -> Meta Webhook -> Node.js API -> in-memory queue (dev) -> worker -> OpenCode placeholder -> Messenger Send API`

Production target: Redis/BullMQ + PostgreSQL + authenticated `opencode serve` integration.

## Current Features

- `GET /health`
- `GET /webhook` Meta verification (`hub.mode`, `hub.verify_token`, `hub.challenge`)
- `POST /webhook` raw-body HMAC verify (`X-Hub-Signature-256`, timing-safe)
- Body size limit, invalid JSON rejection
- Messenger message extraction, echo skip, `mid` dedupe (in-memory TTL)
- In-memory queue + worker
- Placeholder OpenCode reply generator
- Messenger Send API sender (skips when `PAGE_ACCESS_TOKEN` missing)
- Structured JSON logging

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Env

| Name | Required | Purpose |
|---|---|---|
| `VERIFY_TOKEN` | yes | Meta webhook GET verification |
| `APP_SECRET` | yes | HMAC verify for POST webhook |
| `PORT` | no | Server port, default `3000` |
| `PAGE_ACCESS_TOKEN` | for send | Messenger Send API token |

## Local Test

```bash
# health
curl -s http://127.0.0.1:3000/health

# webhook verify
curl -s "http://127.0.0.1:3000/webhook?hub.mode=subscribe&hub.verify_token=dev_verify_token&hub.challenge=123"
```

For POST signature test, compute `sha256=` HMAC over raw body with `APP_SECRET`.

## Security Notes

- Verify signature on **raw body** before JSON parse.
- Dedupe by `message.mid`, not `entry[].id`.
- ACK `200` only after event accepted; heavy work async.
- Do not commit `.env`.

# Messenger to OpenCode

Minimal webhook server (GET only).

## Endpoints

- `GET /health` -> `{ "status": "ok" }`
- `GET /webhook` -> Meta verify handshake (`hub.mode`, `hub.verify_token`, `hub.challenge`)

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Env

| Name | Required | Purpose |
|---|---|---|
| `VERIFY_TOKEN` | yes | Meta webhook verification token |
| `APP_SECRET` | yes | Meta app secret; required at startup, request signature verification not wired yet |
| `PORT` | no | Default `3000` |

## Test

```bash
curl -s http://127.0.0.1:3000/health
curl -s "http://127.0.0.1:3000/webhook?hub.mode=subscribe&hub.verify_token=dev_verify_token&hub.challenge=123"
```

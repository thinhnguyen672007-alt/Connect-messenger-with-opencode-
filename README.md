# Messenger to OpenCode

A learning project in backend engineering with Node.js and TypeScript: receive requests from Facebook Messenger through a webhook, hand the work to OpenCode, and send the result back to the user.

The server is intentionally built on raw `node:http` (no framework) to learn what happens under the hood.

## How it works

```
Messenger user -> Meta webhook -> this server -> OpenCode -> reply to Messenger
```

Only the first hop is wired so far (see Status). The server currently handles the Meta webhook verification handshake and a health check.

## Endpoints

- `GET /health` -> `{ "status": "ok" }`
- `GET /webhook` -> Meta verify handshake (`hub.mode`, `hub.verify_token`, `hub.challenge`)

## Status

- [x] `GET /health`
- [x] `GET /webhook` verification handshake
- [x] Raw body reader with a 1 MB cap (groundwork for signature checks)
- [ ] `POST /webhook` with HMAC-SHA256 signature verification (`APP_SECRET`)
- [ ] Parse incoming message events
- [ ] Dispatch tasks to OpenCode
- [ ] Reply to the user through the Messenger Send API

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
| `PORT` | no | Fixed at `3000` for now |

## Test

```bash
curl -s http://127.0.0.1:3000/health
curl -s "http://127.0.0.1:3000/webhook?hub.mode=subscribe&hub.verify_token=<your-token>&hub.challenge=1234"
```

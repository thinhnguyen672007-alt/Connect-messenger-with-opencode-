# Messenger to OpenCode

A learning project in backend engineering with Node.js and TypeScript: receive requests from Facebook Messenger through a webhook, hand the work to OpenCode, and send the result back to the user.

The server is intentionally built on raw `node:http` (no framework) to learn what happens under the hood.

## How it works

The idea is simple: I send a message to a Messenger bot, the bot passes it to OpenCode, OpenCode does the work, and the result comes back to the same chat.

```
Messenger -> Meta webhook -> this server -> OpenCode -> reply to Messenger
```

Step by step:

1. I send a message to the bot on Messenger.
2. Meta forwards the message to this server as a webhook request. Before trusting it, the server verifies the signature Meta sends with the request, using the app secret and the raw body, so random requests from the internet get rejected.
3. The server reads the message text and turns it into a task for OpenCode.
4. OpenCode runs the task and returns the result.
5. The server sends the result back to me through the Messenger Send API.

Where it stands today: only the first hop is real. The server answers the Meta verification handshake on `GET /webhook`, serves `GET /health`, and the HMAC signature check is already written, ready to guard the POST handler. Parsing messages, dispatching to OpenCode and replying are still open in the Status list below.

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

# Agent Chat Mode (Contributor Notes)

This document describes the current implementation only.

## Chat Data Model

### Wire response model
Defined in `src/features/agents/services/chatService.ts`:
- `AgentChatResponse`
  - `agentId: string`
  - `reply: string`
  - `timestamp: string`

### Local hook state
Defined in `src/features/agents/hooks/useAgentChat.ts`:
- `isSending: boolean`
- `error: string | null`
- `send(message: string): Promise<AgentChatResponse>`

### Draft chat types (not currently wired)
Defined in `src/features/agents/types/chat.ts`:
- `ChatMessage`
- `AgentThread`

These types are not persisted or connected to store/UI yet.

## Prompt Seeding Strategy

Current behavior:
- Frontend sends only `{ message }`.
- Frontend does not generate or attach system prompts.
- Frontend does not inject agent personality or raid context into chat requests.

Implication:
- Prompt seeding is backend responsibility in the current architecture.
- If backend wants per-agent persona seeding, it should derive from `agentId` and server-side data.

## State and Persistence Design

Current behavior:
- Chat mode is stateless on the client except transient hook flags (`isSending`, `error`).
- No chat transcript persistence in localStorage or Zustand.
- No thread index, unread counters, or client-side replay.

Related persistence in this app:
- Raid state persists under localStorage key `party-leader-raid-state-v1`.
- That key does not include chat thread history.

## Troubleshooting

### Missing agent prompt
Symptoms:
- Backend returns persona/prompt-related error or generic failure.

Checks:
1. Verify the `agentId` in request path is valid for your backend.
2. Verify backend has a prompt/persona mapping for that `agentId`.
3. Verify `VITE_API_BASE_URL` points to the correct API host.

Notes:
- Frontend does not send a prompt payload.
- Any "missing prompt" issue is server-side in current implementation.

### Reset/regenerate behavior
Current behavior:
- No frontend action exists for "reset thread" or "regenerate reply".
- Retrying means calling `send(message)` again.
- Any regenerate/reset semantics must be implemented by backend endpoint behavior.

### Persistence reset instructions
To reset app-persisted raid state in browser:
1. Open DevTools Console.
2. Run:
```js
localStorage.removeItem("party-leader-raid-state-v1");
```
3. Reload the app.

There is no separate persisted chat key to clear in the current implementation.

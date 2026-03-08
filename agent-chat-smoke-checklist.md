# Agent Chat Mode Smoke Checklist

## Manual Smoke (5-10 min)

1. Thread isolation per agent
- Open chat for `agent-1` and send one message.
- Switch to `agent-2` and send a different message.
- Verify each thread only shows its own messages.
- Switch back/forth and confirm no cross-thread bleed.

2. Persona seed presence
- Open chat for each agent at least once.
- Verify each new thread starts with one `system` persona seed message.
- Confirm seed content matches that agent's prompt/identity.

3. Send flow + timestamps
- Send a user message in an active agent thread.
- Verify user message appends immediately.
- Verify assistant reply appends after send completes.
- Verify both entries display parseable timestamps.

4. Reset thread safety
- In two agent threads, add messages to both.
- Click `Reset Thread` on only one agent.
- Verify reset thread is reduced to persona seed only.
- Verify other agent thread remains unchanged.

5. Regenerate last response
- Send a prompt and wait for assistant reply.
- Click `Regenerate Last Response`.
- Verify only the latest assistant response is replaced/updated.
- Verify latest user prompt remains intact.

6. Persistence and rehydration
- Send messages in at least one thread.
- Refresh page.
- Verify chat threads rehydrate with prior messages.
- Verify selected/active thread behavior remains consistent.

7. Malformed localStorage fallback
- Manually set invalid JSON in `party-leader-agent-chat-threads-v1`.
- Refresh page.
- Verify app does not crash and initializes safe defaults.
- Manually set partially invalid thread payload and refresh.
- Verify invalid entries are sanitized and system seed is preserved.

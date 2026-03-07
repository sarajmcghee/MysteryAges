# Raid Flow MVP QA Smoke Checklist

## Manual Smoke (5-10 min)

1. Assign + reassign
- Assign an unassigned task to an idle agent from `Quick Assign`.
- Reassign that same task to a different agent.
- Verify task assignee and both agent cards update (`current task`, `state`, `status`).
- Verify latest timeline entries are `task_assigned` and ordered newest first.

2. Status transitions
- Move one assigned task through `in_progress -> blocked -> in_progress -> done`.
- Verify blocker reason is added on `blocked` and cleared once unblocked/done.
- Verify agent state tracks transitions (`working`, `blocked`, then `completed` when done).

3. Blocked -> resolved
- Resolve one blocked task that has an assignee; confirm status becomes `in_progress`.
- Resolve one blocked task without assignee; confirm status becomes `todo`.
- Verify each resolution creates a `blocker_resolved` timeline event with note text.

4. Dependency behavior
- Set a dependent task to `blocked` and complete all required dependency tasks.
- Verify dependent task auto-transitions to `todo` and blocker reason clears.
- Verify timeline logs auto-unblock as `task_status_changed` with auto-unblock note.
- Confirm tasks with incomplete dependencies remain `blocked`.

5. Per-agent load selectors
- Ensure one agent has only `done` tasks and another has active assigned tasks.
- Verify load display excludes `done` tasks and matches active assignment counts.

6. Persistence + rehydration
- Perform at least one assign/status change.
- Refresh the page.
- Verify tasks, filters, selected task, and timeline remain as before refresh.
- Clear local storage key `party-leader-raid-state-v1` and refresh; verify seed state reloads.

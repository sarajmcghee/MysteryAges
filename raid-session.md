# Raid Session Playbook

Operational guide for the Party Leader during a live session.

## Session Goal
Drive the raid from `prep` to `cleanup` while meeting boss victory conditions with minimal blocked and unassigned work.

## Control Surface Map

- Boss objective and phase controls: `BossPanel`
- Work execution and status lanes: `TaskBoard`
- Team capacity and capability view: `AgentRoster`
- Active impediments and resolution actions: `BlockerPanel`
- Decision and activity history: `RaidTimeline`
- Fast assignment/reassignment: `TaskAssignmentModal`

## Standard Loop (5-10 minute cadence)

1. Check top badges: `Phase`, `Progress`, `Blocked`, `Unassigned`.
2. Resolve blockers before adding new work.
3. Assign or rebalance tasks based on role, load, and dependencies.
4. Update task statuses as execution changes.
5. Verify timeline entries for critical actions.

## Party Leader Operating Guide

### 1) Create Boss (or refresh objective)

The seed boss is loaded from storage, but each session should confirm and align:

1. Review boss fields in `BossPanel`:
- objective
- victory condition
- mechanics
- phase
- enrage timer
2. Set current phase using buttons: `prep`, `pull`, `execute`, `cleanup`.
3. Define session-level win criteria from the boss victory condition (for example: "all P1/P2 tasks done, no blockers").

Leader check:
- Team can restate objective in one sentence.
- Mechanics list matches current risks.

### 2) Assign Tasks

Use one of three assignment entry points:
- Header `Quick Assign`
- `TaskBoard` -> `Assign`
- `AgentRoster` -> `Assign Task`

Assignment procedure:
1. Prioritize `P1` then `P2` tasks.
2. Confirm dependencies (`dependsOnTaskIds`) are either done or actively progressing.
3. Match by agent role + skill tags + current load.
4. Confirm assignment in modal and ensure task moves toward `in_progress`.

Reassignment rules:
- Reassign if a task stalls >1 cycle.
- Reassign if agent needs cannot be met quickly.
- Keep specialized agents focused on bottleneck tasks.

Leader check:
- `Unassigned` badge trends to `0`.
- No high-priority task sits in `todo` for multiple cycles.

### 3) Handle Blockers

Blockers are visible in both `TaskBoard` and `BlockerPanel`.

Resolution workflow:
1. Open blocker in `BlockerPanel`.
2. Add concrete resolution note in the text area (what changed, who unblocked, next step).
3. Click `Resolve Blocker`.
4. Confirm status transition:
- assigned task -> `in_progress`
- unassigned task -> `todo`
5. Confirm `blocker_resolved` event appears in timeline.

Dependency-driven unblocking:
- When a dependency task is marked `done`, blocked dependents may auto-transition to `todo` if dependency rules are satisfied.
- Validate these auto-unblocks in timeline and reassign quickly.

Leader check:
- `Blocked` badge returns to `0` or stable low count.
- Every blocker has a note and an owner.

### 4) Track Progress

Primary KPI:
- Progress percent = `done / total tasks`.

Supporting signals:
- Blocked count
- Unassigned count
- Agent load balance
- Agent state distribution (`working`, `blocked`, `idle`, etc.)

Progress management pattern:
1. Move tasks to correct status in real time.
2. Use `Focus` on a task before status updates to reduce context mistakes.
3. Use filters (`blocked only`, status/agent filters, reset filters) for triage sweeps.
4. Run a midpoint rebalance: move idle agents to critical path tasks.

Leader check:
- Progress rises consistently during `execute`.
- End-of-session objective aligns with boss victory condition.

### 5) Interpret Timeline

Timeline event types:
- `task_assigned`: assignment/reassignment happened
- `task_status_changed`: execution state changed (including auto-unblock notes)
- `blocker_resolved`: explicit unblock action recorded

How to read the feed:
1. Most recent events are at the top.
2. Each entry includes localized timestamp plus task/agent context.
3. Notes explain intent; treat missing/weak notes as a process gap.

Use timeline for:
- Reconstructing decision sequence
- Spotting thrash (frequent reassignments/status flips)
- Auditing blocker handling quality
- Building post-session retro notes

Leader check:
- Every major decision leaves an event.
- Event notes are specific enough for a third party to understand context.

## Session Closeout Checklist

1. Set phase to `cleanup`.
2. Confirm no forgotten blockers.
3. Confirm priorities `P1`/`P2` are complete or explicitly deferred.
4. Capture unresolved risks from mechanics and blocker notes.
5. Preserve timeline for retro and next-session planning.

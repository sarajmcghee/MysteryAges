import { useMemo, useState } from "react";
import { useRaidStore } from "../state/raidStore";
import { selectBlockedTasks, selectBoss, selectTasks, selectUnassignedTasks } from "../state/selectors";
import { Badge, Button } from "../../../shared/ui/primitives";
import { BossPanel } from "./BossPanel";
import { AgentRoster } from "./AgentRoster";
import { TaskBoard } from "./TaskBoard";
import { BlockerPanel } from "./BlockerPanel";
import { TaskAssignmentModal } from "./TaskAssignmentModal";
import { RaidTimeline } from "./RaidTimeline";
import { HeroDogma } from "./HeroDogma";
import { AgentChatShell } from "../../agents/components/AgentChatShell";
import { AgentAvatar } from "../../agents/components/AgentAvatar";
import type { ID } from "../types/raid";

export function RaidPage() {
  const boss = useRaidStore(selectBoss);
  const tasks = useRaidStore(selectTasks);
  const blockedTasks = useRaidStore(selectBlockedTasks);
  const unassignedTasks = useRaidStore(selectUnassignedTasks);
  const agents = useRaidStore((state) => state.raid.agents);

  const [isAssignOpen, setAssignOpen] = useState(false);
  const [preferredAgentId, setPreferredAgentId] = useState<ID | undefined>();
  const [preferredTaskId, setPreferredTaskId] = useState<ID | undefined>();

  const progress = useMemo(() => {
    const done = tasks.filter((task) => task.status === "done").length;
    return tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  }, [tasks]);

  const openAssign = (agentId?: ID, taskId?: ID) => {
    setPreferredAgentId(agentId);
    setPreferredTaskId(taskId);
    setAssignOpen(true);
  };

  const openCommandDeck = () => {
    const commandDeck = document.getElementById("raid-command-deck");
    if (commandDeck) {
      commandDeck.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main className="raid-page">
      <HeroDogma
        agentsOnline={agents.filter((agent) => agent.status === "online" || agent.status === "busy").length}
        activeBoss={boss.name}
        blockers={blockedTasks.length}
        onPrimaryAction={openCommandDeck}
        onSecondaryAction={() => openAssign()}
      />

      <header id="raid-command-deck" className="raid-header">
        <div className="stack-xs">
          <h1>Party Leader Console</h1>
          <p className="muted">Coordinate agents, clear blockers, and close the boss objective before enrage.</p>
        </div>
        <div className="row-wrap gap-xs">
          <Badge tone="brand">Phase: {boss.currentPhase}</Badge>
          <Badge tone="ok">Progress: {progress}%</Badge>
          <Badge tone={blockedTasks.length ? "danger" : "ok"}>Blocked: {blockedTasks.length}</Badge>
          <Badge tone={unassignedTasks.length ? "warn" : "ok"}>Unassigned: {unassignedTasks.length}</Badge>
          <Button size="sm" onClick={() => openAssign()}>
            Quick Assign
          </Button>
        </div>
      </header>

      <section className="party-lineup" aria-label="Party lineup">
        {agents.map((agent) => (
          <article key={agent.id} className="party-lineup__member">
            <AgentAvatar
              agentId={agent.id}
              handle={agent.handle}
              role={agent.role}
              variant="idle"
              size={56}
              loading="lazy"
              className="party-lineup__avatar"
            />
            <div className="party-lineup__meta">
              <strong>{agent.handle}</strong>
              <small>{agent.role}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="raid-layout">
        <div className="left-column stack-md">
          <BossPanel />
          <TaskBoard onOpenAssign={openAssign} />
        </div>
        <div className="right-column stack-md">
          <AgentRoster onOpenAssign={openAssign} />
          <BlockerPanel />
          <RaidTimeline />
        </div>
      </section>

      <AgentChatShell agents={agents} />

      <TaskAssignmentModal
        isOpen={isAssignOpen}
        preferredAgentId={preferredAgentId}
        preferredTaskId={preferredTaskId}
        onClose={() => setAssignOpen(false)}
      />
    </main>
  );
}

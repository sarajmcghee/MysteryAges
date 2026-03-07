import { useRaidStore } from "../state/raidStore";
import { selectBoss } from "../state/selectors";
import { Badge, Button, Card } from "../../../shared/ui/primitives";
import type { RaidPhase } from "../types/raid";

const phases: RaidPhase[] = ["prep", "pull", "execute", "cleanup"];

export function BossPanel() {
  const boss = useRaidStore(selectBoss);
  const setBossPhase = useRaidStore((state) => state.setBossPhase);

  return (
    <Card
      title={`Boss: ${boss.name}`}
      actions={<Badge tone="brand">Tier {boss.tier}</Badge>}
    >
      <div className="stack-sm">
        <p className="muted">{boss.objective}</p>
        <p><strong>Victory:</strong> {boss.victoryCondition}</p>
        <div className="chip-row">
          {boss.mechanics.map((mechanic) => (
            <Badge key={mechanic} tone="warn">
              {mechanic}
            </Badge>
          ))}
        </div>
        <div className="phase-row">
          {phases.map((phase) => (
            <Button
              key={phase}
              variant={boss.currentPhase === phase ? "primary" : "ghost"}
              size="sm"
              onClick={() => setBossPhase(phase)}
            >
              {phase}
            </Button>
          ))}
        </div>
        {boss.enrageTimerSec ? (
          <p className="muted">Enrage timer: {Math.round(boss.enrageTimerSec / 60)} min</p>
        ) : null}
      </div>
    </Card>
  );
}

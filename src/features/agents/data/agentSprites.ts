import type { ID } from "../../raid/types/raid";

export type AgentSpriteVariant = "portrait" | "idle";

export interface AgentSpriteSet {
  portrait?: string;
  idle?: string;
}

const AGENT_SPRITES: Record<ID, AgentSpriteSet> = {
  "agent-1": {
    portrait: "sprites/agents/ui-portrait.png",
    idle: "sprites/agents/ui-idle.png"
  },
  "agent-2": {
    portrait: "sprites/agents/architect-portrait.png",
    idle: "sprites/agents/architect-idle.png"
  },
  "agent-3": {
    portrait: "sprites/agents/qa-portrait.png",
    idle: "sprites/agents/qa-idle.png"
  },
  "agent-4": {
    portrait: "sprites/agents/debug-portrait.png",
    idle: "sprites/agents/debug-idle.png"
  }
};

function withBase(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${path.replace(/^\//, "")}`;
}

export function getAgentSprite(agentId: ID, variant: AgentSpriteVariant): string | undefined {
  const spritePath = AGENT_SPRITES[agentId]?.[variant];
  return spritePath ? withBase(spritePath) : undefined;
}

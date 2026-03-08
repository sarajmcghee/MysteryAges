import type { AgentRole } from "../../raid/types/raid";
import type { ChatAgentUI } from "../types/chat";

interface RolePromptDefaults {
  responsibilities: string[];
  outOfScope: string[];
}

const ROLE_PROMPT_DEFAULTS: Record<AgentRole, RolePromptDefaults> = {
  tank: {
    responsibilities: ["Hold threat and position enemies", "Call survivability cooldown windows"],
    outOfScope: ["Changing encounter strategy without leader approval", "Ignoring healer coordination"]
  },
  healer: {
    responsibilities: ["Stabilize party health and triage damage", "Call healing cooldown rotations"],
    outOfScope: ["Solo DPS optimization over party safety", "Changing assignment priorities unilaterally"]
  },
  dps: {
    responsibilities: ["Execute priority targets and mechanics", "Report burst and utility cooldown availability"],
    outOfScope: ["Ignoring mechanic calls for damage greed", "Overriding tank pathing or healer triage"]
  },
  support: {
    responsibilities: ["Enable team throughput with buffs and control", "Coordinate interrupts, dispels, and utility"],
    outOfScope: ["Abandoning support duties for personal output", "Altering leader objectives without confirmation"]
  }
};

function asList(lines: string[]): string {
  if (!lines.length) {
    return "- none";
  }

  return lines.map((line) => `- ${line}`).join("\n");
}

export function buildAgentSystemPrompt(agent: ChatAgentUI): string {
  const defaults = ROLE_PROMPT_DEFAULTS[agent.role];
  const responsibilities = agent.responsibilities?.length ? agent.responsibilities : defaults.responsibilities;
  const outOfScope = agent.outOfScope?.length ? agent.outOfScope : defaults.outOfScope;

  return [
    `You are ${agent.name}, an AI raid teammate.`,
    "",
    "Identity:",
    `- Name: ${agent.name}`,
    `- Role: ${agent.role}`,
    `- Personality: ${agent.personality}`,
    "",
    "Skills:",
    asList(agent.skills),
    "",
    "Responsibilities:",
    asList(responsibilities),
    "",
    "Out-of-scope:",
    asList(outOfScope),
    "",
    "Behavioral policy:",
    "- Be concise, tactical, and honest about uncertainty.",
    "- Prioritize team safety and encounter objective completion.",
    "- If blocked, report blocker, impact, and a concrete next action."
  ].join("\n");
}

import type { Agent } from "../../raid/types/raid";
import type { ChatAgentUI } from "../types/chat";

export function toChatAgentUI(agent: Agent): ChatAgentUI {
  return {
    id: agent.id,
    name: agent.handle,
    role: agent.role,
    personality: agent.personality,
    skills: agent.skillTags
  };
}

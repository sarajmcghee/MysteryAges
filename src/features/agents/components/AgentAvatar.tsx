import { useMemo, useState } from "react";
import { getAgentSprite, type AgentSpriteVariant } from "../data/agentSprites";

interface AgentAvatarProps {
  agentId: string;
  handle: string;
  role: string;
  variant?: AgentSpriteVariant;
  size?: number;
  className?: string;
  loading?: "eager" | "lazy";
}

export function AgentAvatar({
  agentId,
  handle,
  role,
  variant = "portrait",
  size = 56,
  className = "",
  loading = "lazy"
}: AgentAvatarProps) {
  const [broken, setBroken] = useState(false);
  const src = useMemo(() => getAgentSprite(agentId, variant), [agentId, variant]);
  const initial = handle.trim().charAt(0).toUpperCase() || "?";
  const label = `${handle} ${variant} sprite`;

  return (
    <span
      className={`agent-avatar ${className}`.trim()}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      {src && !broken ? (
        <img
          src={src}
          alt={label}
          width={size}
          height={size}
          loading={loading}
          decoding="async"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="agent-avatar__fallback" title={`${handle} (${role})`}>
          {initial}
        </span>
      )}
    </span>
  );
}

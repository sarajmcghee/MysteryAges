interface ChatControlsProps {
  onReset: () => void;
  onRegenerate: () => void;
  disabled?: boolean;
}

export function ChatControls({ onReset, onRegenerate, disabled = false }: ChatControlsProps) {
  return (
    <div className="chat-controls" role="group" aria-label="Chat controls">
      <button type="button" onClick={onRegenerate} disabled={disabled}>
        Regenerate
      </button>
      <button type="button" onClick={onReset} disabled={disabled}>
        Reset Thread
      </button>
    </div>
  );
}

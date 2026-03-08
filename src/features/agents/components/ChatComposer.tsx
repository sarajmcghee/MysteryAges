import { useState } from "react";

interface ChatComposerProps {
  disabled?: boolean;
  onSend: (text: string) => void;
}

export function ChatComposer({ disabled = false, onSend }: ChatComposerProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) {
      return;
    }
    onSend(trimmed);
    setValue("");
  };

  return (
    <form
      className="chat-composer"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label htmlFor="chat-compose" className="visually-hidden">Message</label>
      <textarea
        id="chat-compose"
        className="chat-composer__input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type instructions or ask for a status update..."
        rows={3}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
      />
      <button className="chat-composer__send" type="submit" disabled={disabled || value.trim().length === 0}>
        Send
      </button>
    </form>
  );
}

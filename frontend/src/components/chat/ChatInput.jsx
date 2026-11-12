import { useState } from "react";
import { SendHorizontal } from "lucide-react";

/**
 * Multi-line chat composer supporting Enter to send and Shift+Enter for new lines.
 */
function ChatInput({ onSend, disabled = false, topK, onTopKChange }) {
  const [question, setQuestion] = useState("");

  const trimmed = question.trim();
  const canSubmit = !disabled && trimmed.length >= 2;

  const submitQuestion = () => {
    if (!canSubmit) {
      return;
    }
    const textToSend = trimmed;
    setQuestion("");
    onSend(textToSend);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitQuestion();
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submitQuestion();
    }
  };

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      <label htmlFor="chat-question-input" className="sr-only">
        Ask a question about your uploaded documents
      </label>

      <textarea
        id="chat-question-input"
        className="chat-composer__textarea"
        rows={2}
        placeholder="Ask a question grounded in your uploaded documents..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={2000}
      />

      <div className="chat-composer__footer">
        <div className="chat-composer__controls">
          <label htmlFor="chat-topk-select" className="chat-composer__topk-label">
            Context chunks:
          </label>
          <select
            id="chat-topk-select"
            className="select select--compact"
            value={topK}
            onChange={(e) => onTopKChange(Number(e.target.value))}
            disabled={disabled}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <option key={num} value={num}>
                Top {num}
              </option>
            ))}
          </select>
          <span className="chat-composer__hint">
            Enter to send • Shift+Enter for newline
          </span>
        </div>

        <button
          type="submit"
          className="btn btn--primary"
          disabled={!canSubmit}
          aria-label="Send question"
        >
          <SendHorizontal size={16} aria-hidden="true" />
          <span>Send</span>
        </button>
      </div>
    </form>
  );
}

export default ChatInput;


import { Bot, FileText, User } from "lucide-react";
import { formatDateTime } from "../../utils/formatDate";

function formatSimilarityScore(score) {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return null;
  }
  if (score >= 0 && score <= 1) {
    return `${(score * 100).toFixed(1)}% match`;
  }
  return `Score ${score.toFixed(4)}`;
}

/**
 * Single conversation message bubble for user prompts and AI answers
 * with grounded source references below assistant responses.
 */
function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const sources = Array.isArray(message.sources) ? message.sources : [];

  return (
    <article
      className={`chat-message ${isUser ? "chat-message--user" : "chat-message--assistant"}`}
      aria-label={isUser ? "Your message" : "AI Assistant response"}
    >
      <div
        className={`chat-message__avatar ${isUser ? "chat-message__avatar--user" : "chat-message__avatar--assistant"}`}
        aria-hidden="true"
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className="chat-message__body">
        <div className="chat-message__meta">
          <span className="chat-message__author">
            {isUser ? "You" : "Knowledge Assistant"}
          </span>
          {message.timestamp && (
            <span className="chat-message__time">
              {formatDateTime(message.timestamp)}
            </span>
          )}
        </div>

        <div
          className={`chat-bubble ${isUser ? "chat-bubble--user" : "chat-bubble--assistant"}`}
        >
          <p className="chat-bubble__text">{message.content}</p>
        </div>

        {!isUser && sources.length > 0 && (
          <div className="chat-sources" aria-label="Source documents">
            <div className="chat-sources__header">
              <FileText size={13} aria-hidden="true" />
              <span>
                Sources ({message.totalSources ?? sources.length})
              </span>
            </div>

            <div className="chat-sources__list">
              {sources.map((source) => {
                const scoreText = formatSimilarityScore(source.score);
                return (
                  <div
                    key={`${source.document_id}-${source.chunk_id}`}
                    className="source-chip"
                  >
                    <div className="source-chip__main">
                      <span className="source-chip__title">
                        {source.document_title || `Document #${source.document_id}`}
                      </span>
                      <span className="source-chip__meta">
                        Doc #{source.document_id} • Chunk {source.chunk_index} (ID{" "}
                        {source.chunk_id})
                      </span>
                    </div>
                    {scoreText && (
                      <span
                        className="badge badge--blue"
                        title={`Raw similarity score: ${source.score}`}
                      >
                        {scoreText}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default ChatMessage;


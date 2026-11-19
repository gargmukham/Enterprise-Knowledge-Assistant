import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  Info,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Header from "../components/layout/Header";
import ChatMessage from "../components/chat/ChatMessage";
import ChatInput from "../components/chat/ChatInput";
import { useAssistantChat } from "../hooks/useKnowledge";

/**
 * AI Assistant Q&A page connected to POST /knowledge/ask.
 * Messages are stored in browser React state for the current session only.
 */
function Chat() {
  const {
    messages,
    loading,
    error,
    canRetry,
    sendQuestion,
    retryLastQuestion,
    clearConversation,
  } = useAssistantChat();

  const [topK, setTopK] = useState(5);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = (questionText) => {
    sendQuestion(questionText, topK);
  };

  const headerActions = (
    <button
      type="button"
      className="btn btn--secondary"
      onClick={clearConversation}
      disabled={messages.length === 0 || loading}
    >
      <Trash2 size={15} aria-hidden="true" />
      <span>New Conversation</span>
    </button>
  );

  return (
    <div className="page page--chat">
      <Header
        title="AI Assistant"
        breadcrumb="AI Assistant"
        description="Ask questions grounded in your uploaded enterprise documents."
        actions={headerActions}
      />

      <main className="page-body page-body--chat">
        <div className="chat-shell card">
          <div className="chat-shell__notice">
            <Info size={14} aria-hidden="true" />
            <span>
              Session-only chat: messages are kept in this browser tab and are not
              permanently saved on the server.
            </span>
          </div>

          <div
            className="chat-thread"
            role="log"
            aria-label="Conversation history"
            aria-live="polite"
          >
            {messages.length === 0 && !loading ? (
              <div className="chat-empty">
                <div className="chat-empty__icon" aria-hidden="true">
                  <MessageSquare size={26} />
                </div>
                <h2 className="chat-empty__title">
                  Ask the Enterprise Knowledge Assistant
                </h2>
                <p className="chat-empty__text">
                  Enter a question below. The assistant retrieves the most relevant
                  chunks from your uploaded documents and returns an answer with
                  source citations and similarity scores.
                </p>
              </div>
            ) : (
              <div className="chat-messages">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}

                {loading && (
                  <div className="chat-message chat-message--assistant">
                    <div
                      className="chat-message__avatar chat-message__avatar--assistant"
                      aria-hidden="true"
                    >
                      <Bot size={16} />
                    </div>
                    <div className="chat-message__body">
                      <div className="chat-bubble chat-bubble--assistant chat-bubble--loading">
                        <Loader2 size={16} className="spin" aria-hidden="true" />
                        <span>Searching documents and generating answer...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {error && (
            <div className="chat-error" role="alert">
              <div className="chat-error__info">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
              {canRetry && (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={retryLastQuestion}
                  disabled={loading}
                >
                  <RefreshCw size={13} aria-hidden="true" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          <div className="chat-shell__composer">
            <ChatInput
              onSend={handleSend}
              disabled={loading}
              topK={topK}
              onTopKChange={setTopK}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chat;


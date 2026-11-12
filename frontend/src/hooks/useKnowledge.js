import { useCallback, useState } from "react";
import {
  askKnowledgeAssistant,
  searchKnowledgeBase,
} from "../api/knowledgeService";
import { extractErrorMessage } from "../api/axios";

/**
 * Manage in-session AI Assistant conversation state (no server-side history API).
 */
export function useAssistantChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFailedRequest, setLastFailedRequest] = useState(null);

  const sendQuestion = useCallback(async (questionText, topK = 5, skipAddingUserMessage = false) => {
    const trimmed = questionText.trim();
    if (trimmed.length < 2) {
      setError("Please enter at least 2 characters.");
      return null;
    }

    setError("");
    setLastFailedRequest(null);

    if (!skipAddingUserMessage) {
      const userMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    setLoading(true);
    try {
      const data = await askKnowledgeAssistant(trimmed, topK);
      const assistantMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        totalSources: data.total_sources,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      return data;
    } catch (err) {
      const message =
        err.userMessage ||
        extractErrorMessage(err, "Unable to get an answer from the AI service.");
      setError(message);
      setLastFailedRequest({ question: trimmed, topK });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const retryLastQuestion = useCallback(() => {
    if (!lastFailedRequest) {
      return null;
    }
    return sendQuestion(
      lastFailedRequest.question,
      lastFailedRequest.topK,
      true
    );
  }, [lastFailedRequest, sendQuestion]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError("");
    setLastFailedRequest(null);
  }, []);

  return {
    messages,
    loading,
    error,
    canRetry: Boolean(lastFailedRequest),
    sendQuestion,
    retryLastQuestion,
    clearConversation,
  };
}

/**
 * Manage semantic / keyword knowledge search state.
 */
export function useKnowledgeSearch() {
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [lastQuery, setLastQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSearch = useCallback(async (queryText, topK = 5) => {
    const trimmed = queryText.trim();
    if (trimmed.length < 2) {
      setError("Please enter at least 2 characters to search.");
      return null;
    }

    setLoading(true);
    setError("");
    try {
      const data = await searchKnowledgeBase(trimmed, topK);
      setResults(data.results);
      setTotalResults(data.total_results);
      setLastQuery(data.query);
      setHasSearched(true);
      return data;
    } catch (err) {
      const message =
        err.userMessage ||
        extractErrorMessage(err, "Search failed. Please verify the backend is running.");
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setResults([]);
    setTotalResults(0);
    setLastQuery("");
    setHasSearched(false);
    setError("");
  }, []);

  return {
    results,
    totalResults,
    lastQuery,
    hasSearched,
    loading,
    error,
    runSearch,
    clearSearch,
  };
}


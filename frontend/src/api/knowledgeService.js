import apiClient from "./axios";

/**
 * Ask a question grounded in uploaded enterprise documents via POST /knowledge/ask.
 * Backend AskRequest accepts question (min 2 chars) and top_k (1-10, default 5).
 */
export async function askKnowledgeAssistant(question, topK = 5) {
  const safeTopK = Math.min(Math.max(Number(topK) || 5, 1), 10);

  const response = await apiClient.post(
    "/knowledge/ask",
    {
      question: question.trim(),
      top_k: safeTopK,
    },
    { timeout: 60000 }
  );

  const data = response.data || {};
  return {
    question: data.question ?? question.trim(),
    answer: data.answer ?? "",
    total_sources:
      typeof data.total_sources === "number"
        ? data.total_sources
        : Array.isArray(data.sources)
          ? data.sources.length
          : 0,
    sources: Array.isArray(data.sources) ? data.sources : [],
  };
}

/**
 * Run semantic / keyword chunk search via POST /knowledge/search.
 * Backend SearchRequest accepts query (min 2 chars) and top_k (1-20, default 5).
 */
export async function searchKnowledgeBase(query, topK = 5) {
  const safeTopK = Math.min(Math.max(Number(topK) || 5, 1), 20);

  const response = await apiClient.post("/knowledge/search", {
    query: query.trim(),
    top_k: safeTopK,
  });

  const data = response.data || {};
  return {
    query: data.query ?? query.trim(),
    total_results:
      typeof data.total_results === "number"
        ? data.total_results
        : Array.isArray(data.results)
          ? data.results.length
          : 0,
    results: Array.isArray(data.results) ? data.results : [],
  };
}


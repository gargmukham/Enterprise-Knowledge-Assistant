import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Header from "../components/layout/Header";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import { useKnowledgeSearch } from "../hooks/useKnowledge";

function formatScoreBadge(score) {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return null;
  }
  if (score >= 0 && score <= 1) {
    return `${(score * 100).toFixed(1)}% match`;
  }
  return `Score ${score.toFixed(4)}`;
}

/**
 * Semantic and keyword knowledge search page connected to POST /knowledge/search.
 */
function KnowledgeSearch() {
  const {
    results,
    totalResults,
    lastQuery,
    hasSearched,
    loading,
    error,
    runSearch,
    clearSearch,
  } = useKnowledgeSearch();

  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);

  const handleSubmit = (event) => {
    event.preventDefault();
    runSearch(query, topK);
  };

  const handleClear = () => {
    setQuery("");
    clearSearch();
  };

  const headerActions = (
    <Link to="/chat" className="btn btn--secondary">
      <MessageSquare size={15} aria-hidden="true" />
      <span>Open AI Assistant</span>
    </Link>
  );

  return (
    <div className="page">
      <Header
        title="Knowledge Search"
        breadcrumb="Knowledge Search"
        description="Search indexed document chunks by meaning or keywords across your repository."
        actions={headerActions}
      />

      <main className="page-body">
        <section className="card mb-5" aria-label="Search query controls">
          <form className="search-bar-form" onSubmit={handleSubmit}>
            <div className="search-bar-form__main">
              <div className="search-input-wrap search-input-wrap--grow">
                <Search
                  size={17}
                  className="search-input-wrap__icon"
                  aria-hidden="true"
                />
                <label htmlFor="knowledge-query-input" className="sr-only">
                  Search knowledge base
                </label>
                <input
                  id="knowledge-query-input"
                  type="text"
                  className="input input--lg input--with-icon"
                  placeholder="Enter a topic, policy name, or question (at least 2 characters)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  maxLength={2000}
                />
                {query && (
                  <button
                    type="button"
                    className="search-input-wrap__clear"
                    aria-label="Clear search query"
                    onClick={handleClear}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="search-bar-form__topk">
                <label htmlFor="knowledge-topk-select" className="form-label mb-0">
                  Top K
                </label>
                <select
                  id="knowledge-topk-select"
                  className="select"
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  disabled={loading}
                >
                  {Array.from({ length: 20 }, (_, idx) => idx + 1).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--lg"
                disabled={loading || query.trim().length < 2}
              >
                <Search size={16} aria-hidden="true" />
                <span>{loading ? "Searching..." : "Search"}</span>
              </button>
            </div>
          </form>
        </section>

        {loading ? (
          <div className="card">
            <LoadingState message="Searching document chunks..." />
          </div>
        ) : error ? (
          <div className="card">
            <ErrorState
              title="Search could not be completed"
              message={error}
              onRetry={() => runSearch(query, topK)}
            />
          </div>
        ) : !hasSearched ? (
          <div className="card">
            <EmptyState
              icon={Sparkles}
              title="Search across uploaded documents"
              description="Enter at least 2 characters and select Top K (1–20) to retrieve the highest-scoring document chunks."
            />
          </div>
        ) : results.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Search}
              title="No matching chunks found"
              description={`No indexed document chunks matched "${lastQuery}". Try broadening your query or uploading additional documents.`}
              action={
                <Link to="/documents" className="btn btn--secondary btn--sm">
                  Go to Documents
                </Link>
              }
            />
          </div>
        ) : (
          <section aria-label="Search results">
            <div className="results-summary">
              <p className="results-summary__text">
                Showing <strong>{totalResults}</strong>{" "}
                {totalResults === 1 ? "result" : "results"} for{" "}
                <span className="results-summary__query">“{lastQuery}”</span>
              </p>
            </div>

            <div className="results-list">
              {results.map((item, index) => {
                const scoreBadge = formatScoreBadge(item.score);
                return (
                  <article
                    key={`${item.document_id}-${item.chunk_id}-${index}`}
                    className="card result-card"
                  >
                    <div className="result-card__header">
                      <div className="result-card__title-group">
                        <span className="result-card__rank">#{index + 1}</span>
                        <FileText
                          size={16}
                          className="text-primary"
                          aria-hidden="true"
                        />
                        <h2 className="result-card__title">
                          {item.document_title || `Document #${item.document_id}`}
                        </h2>
                      </div>

                      {scoreBadge && (
                        <span
                          className="badge badge--blue"
                          title={`Raw similarity score: ${item.score}`}
                        >
                          {scoreBadge}
                        </span>
                      )}
                    </div>

                    <div className="result-card__meta">
                      <span>Document ID: {item.document_id}</span>
                      <span>•</span>
                      <span>Chunk Index: {item.chunk_index}</span>
                      <span>•</span>
                      <span>Chunk ID: {item.chunk_id}</span>
                      {typeof item.score === "number" && (
                        <>
                          <span>•</span>
                          <span>Score: {item.score.toFixed(4)}</span>
                        </>
                      )}
                    </div>

                    <div className="result-card__excerpt">
                      <p>{item.chunk_text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default KnowledgeSearch;


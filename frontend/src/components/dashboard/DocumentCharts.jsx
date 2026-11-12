import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, CalendarDays } from "lucide-react";
import EmptyState from "../common/EmptyState";
import { formatShortDate, toDateKey } from "../../utils/formatDate";

/**
 * Recharts visualizations derived strictly from live documents data:
 * 1) Documents by Category
 * 2) Daily Upload Activity (when timestamps exist)
 */
function DocumentCharts({ documents = [] }) {
  const categoryData = useMemo(() => {
    if (!documents.length) {
      return [];
    }

    const counts = new Map();
    documents.forEach((doc) => {
      const categoryName = doc.category?.trim() || "Uncategorized";
      counts.set(categoryName, (counts.get(categoryName) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [documents]);

  const activityData = useMemo(() => {
    const countsByDay = new Map();

    documents.forEach((doc) => {
      const dateKey = toDateKey(doc.uploaded_at);
      if (!dateKey) {
        return;
      }
      countsByDay.set(dateKey, (countsByDay.get(dateKey) || 0) + 1);
    });

    return Array.from(countsByDay.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .slice(-14)
      .map(([dateKey, uploads]) => ({
        dateKey,
        label: formatShortDate(`${dateKey}T00:00:00`),
        uploads,
      }));
  }, [documents]);

  return (
    <div className="charts-grid">
      <section className="card chart-card" aria-label="Documents by category chart">
        <div className="card__header">
          <div>
            <h2 className="card__title">Documents by Category</h2>
            <p className="card__subtitle">
              Distribution across active document categories
            </p>
          </div>
        </div>

        <div className="chart-card__body">
          {categoryData.length === 0 ? (
            <EmptyState
              compact
              icon={BarChart3}
              title="No category data yet"
              description="Upload documents to see how your knowledge base is organized."
            />
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <BarChart
                  data={categoryData}
                  margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "13px",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Documents"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="card chart-card" aria-label="Recent upload activity chart">
        <div className="card__header">
          <div>
            <h2 className="card__title">Recent Upload Activity</h2>
            <p className="card__subtitle">
              Uploads grouped by date from document timestamps
            </p>
          </div>
        </div>

        <div className="chart-card__body">
          {activityData.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarDays}
              title="No upload activity recorded"
              description="Upload timestamps will appear here once documents are added."
            />
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                <BarChart
                  data={activityData}
                  margin={{ top: 8, right: 12, left: -16, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "13px",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  <Bar
                    dataKey="uploads"
                    name="Uploads"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DocumentCharts;


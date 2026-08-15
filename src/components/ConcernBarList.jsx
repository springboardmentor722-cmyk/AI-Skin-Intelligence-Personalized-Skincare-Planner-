import "./ConcernBarList.css";

export default function ConcernBarList({ title, data }) {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="glass-card concern-bar-card">
      <h3>{title}</h3>
      {data.length === 0 ? (
        <p className="donut-empty">Not enough data yet.</p>
      ) : (
        <div className="concern-bar-list">
          {data.map((d) => (
            <div key={d.label} className="concern-bar-row">
              <div className="concern-bar-top">
                <span>{d.label}</span>
                <span>{Math.round((d.count / total) * 100)}%</span>
              </div>
              <div className="concern-bar-track">
                <div className="concern-bar-fill" style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

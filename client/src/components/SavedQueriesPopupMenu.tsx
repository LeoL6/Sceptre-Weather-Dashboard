import React, { useEffect, useState } from "react";
import { db, CachedWeather } from "./WeatherCacher";
import "./SavedQueriesPopupMenu.css";

interface SavedQueriesMenuProps {
  onSelect: (query: CachedWeather) => void;
  onClose: () => void;
}

const SavedQueriesMenu: React.FC<SavedQueriesMenuProps> = ({ onSelect, onClose }) => {
  const [queries, setQueries] = useState<CachedWeather[]>([]);

  useEffect(() => {
    db.cachedWeather.orderBy("timestamp").reverse().toArray().then(setQueries);
  }, []);

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <h3>Saved Queries</h3>
        {queries.length === 0 ? (
          <p className="empty">No saved weather data yet.</p>
        ) : (
          <ul className="query-list">
            {queries.map((q) => (
              <li key={q.id} onClick={() => onSelect(q)}>
                📍 ({q.lat.toFixed(2)}, {q.lon.toFixed(2)}) — {q.date}
                <span className="types">[{q.selectedTypes.join(", ")}]</span>
              </li>
            ))}
          </ul>
        )}
        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default SavedQueriesMenu;

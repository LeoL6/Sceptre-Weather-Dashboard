import { useState } from "react";
import { ClipLoader } from "react-spinners";
import MapPicker from "./components/MapPicker";
import DataSelector from "./components/DataSelector";
import WeatherChart from "./components/WeatherChart";
import DownloadButton from "./components/DownloadButton";
import SavedQueriesMenu from "./components/SavedQueriesPopupMenu";
import { CachedWeather, db } from "./components/WeatherCacher";
import "./App.css";

export default function App() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [lat, setLat] = useState(45.5);
  const [lon, setLon] = useState(-73.6);  
  const [date, setDate] = useState("2025-01-01");

  const [showPopupMenu, setShowPopupMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (selectedTypes.length === 0) return;

    setLoading(true);      // show spinner
    setWeatherData([]);     // clear old charts

    try {
      const existing = await db.cachedWeather
        .where({ lat, lon, date })
        .first();

      if (existing) {
        return existing.data; 
      }

      const res = await fetch("http://localhost:8000/get_weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon, date, types: selectedTypes }),
      });
      const data = await res.json();

      const existingCache = await db.cachedWeather
        .where("[lat+lon+date]")
        .equals([lat, lon, date])
        .first();

      if (existingCache) {
        // Update existing record
        await db.cachedWeather.update(existingCache.id!, {
          selectedTypes,
          data,
          timestamp: Date.now(),
        });
      console.log("Updated existing cached query:", { lat, lon, date });
      } else {
        // Add new record
        await db.cachedWeather.add({
          lat,
          lon,
          date,
          selectedTypes,
          data,
          timestamp: Date.now(),
        });
        console.log("Cached new weather query:", { lat, lon, date });
      }

      setWeatherData(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false); 
    }
  };

  const handleSelectQuery = async (query: CachedWeather) => {
    try {
      // Fetch the full record (in case it’s large)
      const cached = await db.cachedWeather.get(query.id!);
      if (cached?.data) {
        setWeatherData(cached.data);
        setShowPopupMenu(false);
        console.log("Loaded cached query:", cached);
      }
    } catch (err) {
      console.error("Error loading cached query:", err);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1>Weather Dashboard</h1>

        <div className="input-row">
          <label>Latitude
            <input
              type="number"
              step="0.01"
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
            />
          </label>
          <label>Longitude 
            <input
              type="number"
              step="0.01"
              placeholder="Longitude"
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value))}
            />
          </label>
          <label>Date 
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        <MapPicker
          lat={lat}
          lon={lon}
          onChange={(newLat, newLon) => {
            setLat(newLat);
            setLon(newLon);
          }}
        />

        <div className="data-selector">
          <DataSelector onChange={(types) => setSelectedTypes(types)} />
        </div>

        <div className="control-rack">
          <button 
          className="previous-query-button" 
          disabled={loading}
          style={{
            opacity: loading ? 0.6 : 1, 
            cursor: loading ? "not-allowed" : "pointer", 
          }}
          onClick={() => setShowPopupMenu(true)}>
            Load Data
          </button>

          <DownloadButton data={weatherData} lat={lat} lon={lon} date={date} loading={loading} />
        </div>

        <button 
        className="fetch-button" 
        disabled={selectedTypes.length === 0 || loading}
        style={{
          opacity: selectedTypes.length === 0 || loading ? 0.6 : 1, 
          cursor: selectedTypes.length === 0 || loading ? "not-allowed" : "pointer",
        }}
        onClick={handleFetch}>
          {loading ? "Fetching..." : "Fetch Weather"}
        </button>
      </div>

      <div className="charts-container">
        {showPopupMenu && (
          <SavedQueriesMenu
            onSelect={handleSelectQuery}  
            onClose={() => setShowPopupMenu(false)}
          />
        )}

        {loading && (
          <div style={{ 
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
              zIndex: 10,
            }}>
              <ClipLoader color="#007bff" size={50} />
              <p>Querying API...</p>
          </div>
        )}

        {weatherData &&
        selectedTypes.map((type) => {
          const key = type.toLowerCase();
          if (!weatherData[key]) return null;

          let unit = "";
          let color = "#00bcd4";

          switch (type) {
            case "Temperature":
              unit = "°C";
              color = "#ff2222ff";
              break;
            case "Rainfall":
              unit = "mm";
              color = "#2196f3";
              break;
            case "Snowfall":
              unit = "cm";
              color = "#bfd9eeff";
              break;
            case "Wind":
              unit = "m/s";
              color = "#4caf50";
              break;
            case "Dust":
              unit = "µg/m³";
              color = "#f39821ff";
              break;
          }

          return (
              <WeatherChart
                key={type}
                title={type}
                hourlyData={weatherData[key]}
                unit={unit}
                color={color}
              />
          );
        })}
      </div>
    </div>
  );
}

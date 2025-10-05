import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPickerProps {
  lat: number;
  lon: number;
  onChange: (lat: number, lon: number) => void;
}

function MapClickHandler({ onChange }: { onChange: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ lat, lon, onChange }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([lat, lon]);

  const handleChange = (newLat: number, newLon: number) => {
    setPosition([newLat, newLon]);
    onChange(newLat, newLon);
  };

  return (
    <div style={{ height: "250px", width: "100%", borderRadius: "10px", marginBottom: "20px", overflow: "hidden" }}>
      <MapContainer
        center={position}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onChange={handleChange} />
        <Marker position={position} icon={markerIcon}></Marker>
      </MapContainer>
    </div>
  );
}

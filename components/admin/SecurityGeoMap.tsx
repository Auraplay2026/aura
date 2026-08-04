"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

interface SecurityGeoMapProps {
  stateCounts: Record<string, number>;
  totalUsers: number;
}

export function SecurityGeoMap({ stateCounts, totalUsers }: SecurityGeoMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full min-h-[180px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-wider">
        Loading Geographic Map Engine...
      </div>
    );
  }

  // Dynamically import Leaflet components client-side only
  const { MapContainer, TileLayer, CircleMarker, Popup } = require("react-leaflet");

  // State coordinates mapping (India regions)
  const STATE_COORDINATES: Record<string, [number, number]> = {
    "Maharashtra": [19.7515, 75.7139],
    "Delhi": [28.7041, 77.1025],
    "Karnataka": [15.3173, 75.7139],
    "Tamil Nadu": [11.1271, 78.6569],
    "Telangana": [18.1124, 79.0193],
    "Gujarat": [22.2587, 71.1924],
    "West Bengal": [22.9868, 87.8550],
    "Rajasthan": [27.0238, 74.2179],
    "Punjab": [31.1471, 75.3412],
    "Uttar Pradesh": [26.8467, 80.9462],
    "Not Verified": [20.5937, 78.9629],
  };

  return (
    <div className="w-full h-[180px] rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={4}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {Object.entries(stateCounts).map(([stateName, count]) => {
          const coords = STATE_COORDINATES[stateName] || [20.5937 + (Math.random() - 0.5) * 4, 78.9629 + (Math.random() - 0.5) * 4];
          const radius = Math.max(6, Math.min(24, count * 5));
          return (
            <CircleMarker
              key={stateName}
              center={coords}
              radius={radius}
              pathOptions={{
                color: "#e11d48",
                fillColor: "#f43f5e",
                fillOpacity: 0.6,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs font-bold font-sans">
                  <p className="text-slate-900 uppercase font-black">{stateName}</p>
                  <p className="text-rose-600 font-mono mt-0.5">{count} Active User Session(s)</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

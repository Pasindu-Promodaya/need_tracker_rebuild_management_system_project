"use client";

import { useEffect, useRef, useState } from "react";
import { Organization } from "@/lib/api";
import "leaflet/dist/leaflet.css";

let L: any = null;

const initLeaflet = async () => {
  if (!L) {
    L = await import("leaflet");
  }
  return L;
};

interface AdvancedSriLankaMapProps {
  organizations?: Organization[];
}

export default function AdvancedSriLankaMap({ organizations = [] }: AdvancedSriLankaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hospitalCount, setHospitalCount] = useState(9);
  const [totalBeds, setTotalBeds] = useState(12000);

  useEffect(() => {
    let isCancelled = false;

    const hospitalLocations = [
      { id: 1, name: "National Hospital", district: "Colombo", lat: 6.9271, lng: 80.7789, beds: 3000 },
      { id: 2, name: "Central Provincial Hospital", district: "Kandy", lat: 7.2906, lng: 80.6337, beds: 2500 },
      { id: 3, name: "Jaffna Teaching Hospital", district: "Jaffna", lat: 9.6615, lng: 80.7855, beds: 1200 },
      { id: 4, name: "Trincomalee General Hospital", district: "Trincomalee", lat: 8.5874, lng: 81.2346, beds: 800 },
      { id: 5, name: "Galle Teaching Hospital", district: "Galle", lat: 6.0535, lng: 80.2181, beds: 1500 },
      { id: 6, name: "Ratnapura District Hospital", district: "Ratnapura", lat: 6.6978, lng: 80.7915, beds: 600 },
      { id: 7, name: "Kurunegala General Hospital", district: "Kurunegala", lat: 7.4839, lng: 80.6353, beds: 1000 },
      { id: 8, name: "Anuradhapura Hospital", district: "Anuradhapura", lat: 8.3128, lng: 80.7129, beds: 1100 },
      { id: 9, name: "Badulla Teaching Hospital", district: "Badulla", lat: 6.9914, lng: 81.0709, beds: 900 },
    ];

    const initMap = async () => {
      if (!mapContainer.current || map.current) {
        return;
      }

      const container = mapContainer.current;

      try {
        const LeafletLib = await initLeaflet();

        if (isCancelled || map.current) {
          return;
        }

        // In React Strict Mode, effects can run twice in development.
        // Reset previous Leaflet binding on the same DOM node before creating a new map.
        if ((container as any)._leaflet_id) {
          (container as any)._leaflet_id = undefined;
          container.innerHTML = "";
        }

        // Initialize map
        map.current = LeafletLib.map(container, {
          preferCanvas: true,
          attributionControl: true,
          zoomControl: true,
        }).setView([7.8731, 80.7718], 8);

        // Add OpenStreetMap tile layer (faster and more reliable)
        LeafletLib.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
            minZoom: 6,
          }
        ).addTo(map.current);

        // Fix Leaflet marker icons
        LeafletLib.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Add hospital markers
        hospitalLocations.forEach((hospital) => {
          const marker = LeafletLib.marker([hospital.lat, hospital.lng], {
            title: hospital.name,
          }).addTo(map.current);

          const popupContent = `
            <div style="padding: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af; font-size: 13px;">${hospital.name}</h3>
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
              <div style="font-size: 12px; color: #374151; line-height: 1.6;">
                <p style="margin: 4px 0;"><strong>📍 District:</strong> ${hospital.district}</p>
                <p style="margin: 4px 0;"><strong>🛏️ Beds:</strong> ${hospital.beds}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: 600;">🟢 Active</span></p>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, { maxWidth: 250, maxHeight: 200 });
          marker.on('click', () => marker.openPopup());
        });

        // Calculate statistics
        const beds = hospitalLocations.reduce((sum, h) => sum + h.beds, 0);
        setHospitalCount(hospitalLocations.length);
        setTotalBeds(beds);

        setMapError(null);
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError("Map failed to load. Please refresh the page.");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isCancelled = true;
      if (map.current) {
        map.current.off();
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl relative">
      <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />

      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center z-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-white mx-auto mb-3"></div>
            <p className="text-sm font-medium">Loading Sri Lanka Map...</p>
            <p className="text-xs text-blue-100 mt-1">Initializing 9 hospital locations</p>
          </div>
        </div>
      )}

      {mapError && !isLoading && (
        <div className="absolute inset-0 bg-red-50/95 flex items-center justify-center z-50">
          <div className="text-center px-4">
            <p className="text-sm font-semibold text-red-700">{mapError}</p>
            <p className="text-xs text-red-600 mt-1">Check network access to OpenStreetMap tiles.</p>
          </div>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-40 max-w-xs pointer-events-auto hover:shadow-xl transition-shadow cursor-default">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-bold text-gray-900">HOSPITAL NETWORK</span>
        </div>
        <div className="space-y-2 text-xs text-gray-700 font-medium">
          <p>🏥 9 Active Hospitals</p>
          <p>📍 Click markers for details</p>
          <p>🔍 Drag to pan, scroll to zoom</p>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 rounded-lg shadow-lg px-4 py-2 z-40 pointer-events-none backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-semibold text-gray-900">✨ Live Coverage Across Sri Lanka</span>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-95 rounded-lg shadow-lg p-3 z-40 pointer-events-none backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{hospitalCount}</div>
            <div className="text-xs text-gray-600 font-medium">Hospitals</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{totalBeds.toLocaleString()}</div>
            <div className="text-xs text-gray-600 font-medium">Total Beds</div>
          </div>
        </div>
      </div>
    </div>
  );
}

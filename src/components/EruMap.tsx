import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const incidentIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
});

const substationIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
});

function hasValidCoords(item: any) {
  return (
    item &&
    item.latitude !== null &&
    item.longitude !== null &&
    item.latitude !== undefined &&
    item.longitude !== undefined &&
    !Number.isNaN(Number(item.latitude)) &&
    !Number.isNaN(Number(item.longitude))
  );
}

function RecenterMap({ selectedIncident }: { selectedIncident: any }) {
  const map = useMap();

  useEffect(() => {
    if (hasValidCoords(selectedIncident)) {
      map.flyTo(
        [Number(selectedIncident.latitude), Number(selectedIncident.longitude)],
        16,
        {
          animate: true,
          duration: 0.8,
        }
      );
    } else {
      map.flyTo([14.5995, 120.9842], 13, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedIncident, map]);

  return null;
}

export default function EruMap({ selectedIncident, substations = [] }: any) {
  const defaultPosition: [number, number] = [14.5995, 120.9842];
  const validSubstations = substations.filter(hasValidCoords);

  return (
    <MapContainer
      center={defaultPosition}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <RecenterMap selectedIncident={selectedIncident} />

      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {hasValidCoords(selectedIncident) && (
        <Marker
          position={[
            Number(selectedIncident.latitude),
            Number(selectedIncident.longitude),
          ]}
          icon={incidentIcon}
        >
          <Popup>
            {selectedIncident.incident_type}
            <br />
            {selectedIncident.location_name || "No location name"}
          </Popup>
        </Marker>
      )}

      {validSubstations.map((s: any) => (
        <Marker
          key={s.substation_id}
          position={[Number(s.latitude), Number(s.longitude)]}
          icon={substationIcon}
        >
          <Popup>
            {s.substation_name}
            <br />
            {s.address || ""}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
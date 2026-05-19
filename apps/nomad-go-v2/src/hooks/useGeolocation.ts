import { useState, useEffect, useMemo } from "react";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MissionLocation {
  id: string;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
}

export function useGeolocation(missions?: MissionLocation[]) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Calculate distance between user and all provided missions
  const { distances, activeMissionId } = useMemo(() => {
    const distMap: Record<string, number> = {};
    let activeId: string | null = null;

    if (!coords || !missions) return { distances: distMap, activeMissionId: null };

    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters

    missions.forEach((m) => {
      if (m.latitude && m.longitude) {
        const dLat = toRad(m.latitude - coords.latitude);
        const dLon = toRad(m.longitude - coords.longitude);
        const lat1 = toRad(coords.latitude);
        const lat2 = toRad(m.latitude);

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        distMap[m.id] = distance;

        if (distance <= m.radiusMeters) {
          activeId = m.id;
        }
      }
    });

    return { distances: distMap, activeMissionId: activeId };
  }, [coords, missions]);

  return { coords, error, distances, activeMissionId };
}

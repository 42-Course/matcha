import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import axiosInstance from '@api/axios';

interface UserLocation {
  id: number;
  username: string;
  latitude: string;
  longitude: string;
  city: string;
  country: string;
  online_status: 't' | 'f';
}

interface GlobePoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  label: string;
}

export function EarthBackground() {
  const globeEl = useRef<any>(null);
  const [points, setPoints] = useState<GlobePoint[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await axiosInstance.get('/admin/stats/user-locations') as unknown as UserLocation[];

        const newPoints: GlobePoint[] = data.map(user => ({
          lat: parseFloat(user.latitude),
          lng: parseFloat(user.longitude),
          size: user.online_status === 't' ? 0.3 : 0.15,
          color: user.online_status === 't' ? '#10b981' : '#6b7280',
          label: user.username,
        }));

        setPoints(newPoints);
      } catch (err) {
        console.error('Failed to fetch user locations for background:', err);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (globeEl.current && globeEl.current.controls) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.3;
      globeEl.current.controls().enableZoom = false;
    }
  }, []);

  return (
    <div className="fixed inset-0 opacity-50" style={{ zIndex: 0 }}>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius="size"
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.15}
        width={window.innerWidth}
        height={window.innerHeight}
      />
    </div>
  );
}

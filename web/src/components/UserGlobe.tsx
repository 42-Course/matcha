import { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';
import axiosInstance from '@api/axios';
import toast from 'react-hot-toast';
import { Users, Wifi, Maximize2, Minimize2, Monitor, Globe2 } from 'lucide-react';

type ViewMode = 'normal' | 'fullscreen' | 'fullheight';
type GlobeTexture = 'blue-marble' | 'night' | 'topography' | 'natural';

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
  username: string;
  city: string;
  country: string;
  online: boolean;
}

export function UserGlobe() {
  const [users, setUsers] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('globe_view_mode') as ViewMode) || 'normal';
  });
  const [texture, setTexture] = useState<GlobeTexture>(() => {
    return (localStorage.getItem('globe_texture') as GlobeTexture) || 'blue-marble';
  });
  const globeEl = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUserLocations = async () => {
    try {
      const data = await axiosInstance.get('/admin/stats/user-locations') as unknown as UserLocation[];
      setUsers(data || []);
      setLoading(false);
    } catch (err) {
      toast.error(`Failed to fetch user locations: ${err}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserLocations();

    // Poll every 30 seconds to update online status
    const interval = setInterval(() => {
      fetchUserLocations();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      // Auto-rotate
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  const points: GlobePoint[] = users.map(user => ({
    lat: parseFloat(user.latitude),
    lng: parseFloat(user.longitude),
    size: user.online_status === 't' ? 0.8 : 0.5,
    color: user.online_status === 't' ? '#10b981' : '#6b7280',
    label: user.username,
    username: user.username,
    city: user.city || 'Unknown',
    country: user.country || 'Unknown',
    online: user.online_status === 't',
  }));

  const onlineCount = users.filter(u => u.online_status === 't').length;
  const totalCount = users.length;

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setViewMode('normal');
      } else {
        containerRef.current.requestFullscreen();
        setViewMode('fullscreen');
      }
    }
  };

  const getGlobeHeight = () => {
    switch (viewMode) {
      case 'fullscreen':
        return '100vh';
      case 'fullheight':
        return 'calc(100vh - 200px)';
      default:
        return '800px';
    }
  };

  const getGlobeTextures = () => {
    const textures = {
      'blue-marble': {
        globe: '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
        bump: '//unpkg.com/three-globe/example/img/earth-topology.png',
      },
      'night': {
        globe: '//unpkg.com/three-globe/example/img/earth-night.jpg',
        bump: '//unpkg.com/three-globe/example/img/earth-topology.png',
      },
      'topography': {
        globe: '//unpkg.com/three-globe/example/img/earth-topology.png',
        bump: '//unpkg.com/three-globe/example/img/earth-topology.png',
      },
      'natural': {
        globe: '//unpkg.com/three-globe/example/img/earth-day.jpg',
        bump: '//unpkg.com/three-globe/example/img/earth-topology.png',
      },
    };
    return textures[texture];
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('globe_view_mode', mode);
  };

  const handleTextureChange = (newTexture: GlobeTexture) => {
    setTexture(newTexture);
    localStorage.setItem('globe_texture', newTexture);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-gray-900 dark:text-white">Loading globe...</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Locations</h3>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleViewModeChange('normal')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewMode === 'normal'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Normal View"
          >
            <Monitor size={18} />
            <span className="text-sm">Normal</span>
          </button>
          <button
            onClick={() => handleViewModeChange('fullheight')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              viewMode === 'fullheight'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title="Full Height"
          >
            <Minimize2 size={18} />
            <span className="text-sm">Full Height</span>
          </button>
          <button
            onClick={handleFullscreen}
            className="px-3 py-2 rounded-lg flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 size={18} />
            <span className="text-sm">Fullscreen</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Globe2 className="text-gray-600 dark:text-gray-400" size={20} />
        <button
          onClick={() => handleTextureChange('blue-marble')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            texture === 'blue-marble'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Blue Marble
        </button>
        <button
          onClick={() => handleTextureChange('natural')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            texture === 'natural'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Natural
        </button>
        <button
          onClick={() => handleTextureChange('night')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            texture === 'night'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Night Lights
        </button>
        <button
          onClick={() => handleTextureChange('topography')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            texture === 'topography'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Topography
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <Users className="text-blue-500" size={20} />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Total Users: {totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <Wifi className="text-green-500" size={20} />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Online Now: {onlineCount}
          </span>
        </div>
      </div>

      <div className="relative">
        <div
          className="rounded-lg overflow-hidden bg-black flex items-center justify-center"
          style={{ height: getGlobeHeight() }}
        >
          <Globe
            ref={globeEl}
            globeImageUrl={getGlobeTextures().globe}
            bumpImageUrl={getGlobeTextures().bump}
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointAltitude={0.01}
            pointRadius="size"
            pointLabel={(d: any) => `
              <div style="
                background: rgba(0, 0, 0, 0.8);
                padding: 8px 12px;
                border-radius: 6px;
                color: white;
                font-family: sans-serif;
                font-size: 12px;
              ">
                <div style="font-weight: bold; margin-bottom: 4px; color: ${d.online ? '#10b981' : '#6b7280'};">
                  ${d.online ? '🟢' : '⚫'} ${d.username}
                </div>
                <div>${d.city}, ${d.country}</div>
                <div style="font-size: 10px; color: ${d.online ? '#10b981' : '#9ca3af'};">
                  ${d.online ? 'Online' : 'Offline'}
                </div>
              </div>
            `}
            atmosphereColor="#3b82f6"
            atmosphereAltitude={0.25}
          />
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Online Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Offline Users</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ReactNode } from 'react';
import { useUserMe } from '@/hooks/useUserMe';
import { EarthBackground } from './backgrounds/EarthBackground';

type BackgroundType = 'none' | 'earth' | 'gradient-purple' | 'gradient-ocean' | 'gradient-sunset' | 'custom';

interface BackgroundWrapperProps {
  children: ReactNode;
}

export function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  const { user } = useUserMe();

  const backgroundType = (user?.background_type as BackgroundType) || 'none';
  const backgroundUrl = user?.background_url;

  const gradients: Record<string, string> = {
    'gradient-purple': 'bg-gradient-to-br from-purple-400 via-pink-500 to-red-500',
    'gradient-ocean': 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500',
    'gradient-sunset': 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500',
  };

  const renderBackground = () => {
    if (!user || backgroundType === 'none' || !backgroundType) {
      return null;
    }

    if (backgroundType === 'earth') {
      return <EarthBackground />;
    }

    if (backgroundType === 'custom' && backgroundUrl) {
      return (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-50"
          style={{ backgroundImage: `url(${backgroundUrl})`, zIndex: 0 }}
        />
      );
    }

    const gradientClass = gradients[backgroundType];
    if (gradientClass) {
      return (
        <div
          className={`fixed inset-0 opacity-70 ${gradientClass}`}
          style={{ zIndex: 0 }}
        />
      );
    }

    return null;
  };

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900">
      {renderBackground()}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

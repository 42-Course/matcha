import { useState, useEffect } from 'react';
import { useUserMe } from '@/hooks/useUserMe';
import { Link } from 'react-router-dom';
import axiosInstance from '@api/axios';
import {
  Target, Flame, Clock, Heart, MessageCircle, Eye,
  Star, TrendingUp, MapPin, CheckCircle, Shield, ChevronDown, ChevronUp, Minimize2, X, User
} from 'lucide-react';
import { MatchResult } from '@/types/match';

interface DashboardStats {
  total_likes_given: number;
  total_likes_received: number;
  total_matches: number;
  total_messages_sent: number;
  total_profile_views: number;
  total_dates: number;
  login_streak: number;
  profile_completeness: number;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  icon: React.ReactNode;
  completed: boolean;
  action?: string;
  actionLink?: string;
}

function SuggestionCard({
  match,
  onLike,
  onReject,
}: {
  match: MatchResult;
  onLike: (username: string) => void;
  onReject: (username: string) => void;
}) {
  const { user, score } = match;
  const profilePic = user.pictures?.find((p) => p.is_profile === 't')?.url;
  const age = new Date().getFullYear() - parseInt(user.birth_year, 10);

  return (
    <div className="bg-white/60 dark:bg-gray-700/60 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
      <Link to={`/profile/${user.username}`} className="block">
        {profilePic ? (
          <img
            src={profilePic}
            alt={user.username}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <User size={48} className="text-gray-400" />
          </div>
        )}

        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {user.first_name}, {age}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</p>

          {user.city && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <MapPin size={12} />
              {user.city}, {user.country}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-1.5 rounded-full"
                style={{ width: `${score.total}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {Math.round(score.total)}%
            </span>
          </div>
        </div>
      </Link>

      <div className="p-4 pt-0 flex gap-2">
        <button
          onClick={() => onReject(user.username)}
          className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
        >
          <X size={18} />
          Pass
        </button>
        <button
          onClick={() => onLike(user.username)}
          className="flex-1 py-2 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
        >
          <Heart size={18} fill="currentColor" />
          Like
        </button>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useUserMe();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionStart] = useState(Date.now());
  const [sessionTime, setSessionTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showQuests, setShowQuests] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<MatchResult[]>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [waitingStartTime] = useState(Date.now());
  const [waitingTime, setWaitingTime] = useState(0);

  const loveQuotes = [
    "Love is like Wi-Fi... you can't see it, but you know when you've lost connection 💘",
    "They say patience is a virtue... but waiting for love is an adventure 🌟",
    "The best things in life are worth waiting for... especially love ❤️",
    "Love doesn't need an algorithm, but it helps 😉",
    "Your perfect match is out there, probably scrolling too 📱",
    "Good things come to those who wait... great things come to those who swipe right 💕",
    "Love is in the air... and in the data 💫",
    "Waiting for love is like waiting for pizza... worth every second 🍕❤️",
    "The heart wants what it wants... sometimes it just takes time ⏰💖",
    "Love at first sight? More like love at first like 😍",
  ];

  const fetchStats = async () => {
    try {
      // Fetch data from actual endpoints
      const [
        likesGiven,
        likesReceived,
        matches,
        messages,
        profileViews,
        dates,
        me
      ] = await Promise.all([
        axiosInstance.get('/me/likes') as unknown as any[],
        axiosInstance.get('/me/liked_by') as unknown as any[],
        axiosInstance.get('/me/matches') as unknown as any[],
        axiosInstance.get('/me/messages') as unknown as any[],
        axiosInstance.get('/me/views') as unknown as any[],
        axiosInstance.get('/me/dates') as unknown as any[],
        axiosInstance.get('/me') as unknown as any,
      ]);

      // Calculate profile completeness
      const calculateProfileCompleteness = (user: any) => {
        const fields = [
          user.first_name,
          user.last_name,
          user.biography,
          user.birth_year,
          user.gender,
          user.sexual_preferences,
          user.city,
          user.country,
          user.profile_picture_id,
        ];
        const completed = fields.filter(f => f !== null && f !== undefined && f !== '').length;
        return Math.round((completed / fields.length) * 100);
      };

      setStats({
        total_likes_given: Array.isArray(likesGiven) ? likesGiven.length : 0,
        total_likes_received: Array.isArray(likesReceived) ? likesReceived.length : 0,
        total_matches: Array.isArray(matches) ? matches.length : 0,
        total_messages_sent: Array.isArray(messages) ? messages.length : 0,
        total_profile_views: Array.isArray(profileViews) ? profileViews.length : 0,
        total_dates: Array.isArray(dates) ? dates.length : 0,
        login_streak: 1, // TODO: Implement login streak tracking
        profile_completeness: calculateProfileCompleteness(me),
      });
      setLoading(false);
    } catch (err) {
      // Fallback to defaults if endpoints fail
      setStats({
        total_likes_given: 0,
        total_likes_received: 0,
        total_matches: 0,
        total_messages_sent: 0,
        total_profile_views: 0,
        total_dates: 0,
        login_streak: 1,
        profile_completeness: 50,
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Fetch profile suggestions
    const fetchSuggestions = async () => {
      try {
        // Fetch discover results and already-liked users in parallel
        const [discoverResponse, likedUsers] = await Promise.all([
          axiosInstance.post('/me/discover', {}) as unknown as any,
          axiosInstance.get('/me/likes') as unknown as any,
        ]);

        // Handle both wrapped and unwrapped responses
        let matches = [];
        if (discoverResponse?.data && Array.isArray(discoverResponse.data)) {
          matches = discoverResponse.data;
        } else if (Array.isArray(discoverResponse)) {
          matches = discoverResponse;
        }

        // Get list of already-liked usernames
        // likedUsers response is { data: [...] } with user objects containing username
        const likedData = likedUsers?.data || likedUsers || [];
        const likedUsernames = Array.isArray(likedData)
          ? likedData.map((user: any) => user.username).filter(Boolean)
          : [];

        // Filter out users we've already liked
        const filteredMatches = matches.filter((match: MatchResult) =>
          !likedUsernames.includes(match.user.username)
        );

        setSuggestions(filteredMatches.slice(0, 5));
      } catch (err) {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStart]);

  // Rotate love quotes when minimized (slower)
  useEffect(() => {
    if (isMinimized) {
      const quoteInterval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % loveQuotes.length);
      }, 20000); // Change quote every 20 seconds

      return () => clearInterval(quoteInterval);
    }
  }, [isMinimized, loveQuotes.length]);

  // Update waiting time counter
  useEffect(() => {
    if (isMinimized) {
      const waitInterval = setInterval(() => {
        setWaitingTime(Math.floor((Date.now() - waitingStartTime) / 1000));
      }, 1000);

      return () => clearInterval(waitInterval);
    }
  }, [isMinimized, waitingStartTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatWaitingTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return {
      hours: String(hrs).padStart(2, '0'),
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
    };
  };

  const quests: Quest[] = [
    {
      id: 'daily-like',
      title: 'Spread the Love',
      description: 'Like 5 profiles today',
      progress: Math.min(stats?.total_likes_given || 0, 5),
      target: 5,
      icon: <Heart className="text-pink-500" size={20} />,
      completed: (stats?.total_likes_given || 0) >= 5,
      action: 'Browse',
      actionLink: '/discover',
    },
    {
      id: 'start-conversation',
      title: 'Break the Ice',
      description: 'Send a message',
      progress: Math.min(stats?.total_messages_sent || 0, 1),
      target: 1,
      icon: <MessageCircle className="text-blue-500" size={20} />,
      completed: (stats?.total_messages_sent || 0) >= 1,
      action: 'Messages',
      actionLink: '/conversations',
    },
    {
      id: 'complete-profile',
      title: 'Perfect Profile',
      description: 'Complete your profile',
      progress: stats?.profile_completeness || 0,
      target: 100,
      icon: <Star className="text-purple-500" size={20} />,
      completed: (stats?.profile_completeness || 0) >= 100,
      action: 'Edit',
      actionLink: '/profile/edit',
    },
  ];

  const isAdmin = user?.username === 'pulgamecanica';

  if (loading) {
    return null;
  }

  // Minimized view - romantic waiting screen
  if (isMinimized) {
    const timeComponents = formatWaitingTime(waitingTime);

    return (
      <div className="min-h-screen flex items-end justify-center pb-20">
        <div className="text-center space-y-8 animate-fade-in max-w-4xl px-6">
          {/* Animated Clock - Time Waited for Love */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
              Time Waited for Love
            </p>
            <div className="flex justify-center gap-3 md:gap-6">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-xl flex items-center justify-center border-2 border-pink-200 dark:border-pink-700 animate-pulse-slow">
                    <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-pink-500 to-purple-500">
                      {timeComponents.hours}
                    </span>
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Clock size={16} className="text-pink-500 animate-spin-slow" />
                  </div>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-semibold">
                  Hours
                </span>
              </div>

              {/* Separator */}
              <div className="flex items-center pb-6">
                <span className="text-3xl md:text-4xl font-bold text-pink-500 animate-pulse">:</span>
              </div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-xl flex items-center justify-center border-2 border-purple-200 dark:border-purple-700 animate-pulse-slow">
                    <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-500 to-blue-500">
                      {timeComponents.minutes}
                    </span>
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Heart size={16} className="text-purple-500 animate-pulse" fill="currentColor" />
                  </div>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-semibold">
                  Minutes
                </span>
              </div>

              {/* Separator */}
              <div className="flex items-center pb-6">
                <span className="text-3xl md:text-4xl font-bold text-purple-500 animate-pulse">:</span>
              </div>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-xl flex items-center justify-center border-2 border-blue-200 dark:border-blue-700 animate-pulse-slow">
                    <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-cyan-500">
                      {timeComponents.seconds}
                    </span>
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Star size={16} className="text-blue-500 animate-spin-slow" />
                  </div>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-semibold">
                  Seconds
                </span>
              </div>
            </div>
          </div>

          {/* Love Quote with fade animation */}
          <div className="min-h-[120px] flex items-center justify-center">
            <p
              key={currentQuoteIndex}
              className="text-2xl md:text-3xl font-light text-gray-800 dark:text-gray-200 max-w-2xl animate-fade-in"
            >
              {loveQuotes[currentQuoteIndex]}
            </p>
          </div>

          {/* Heartbeat animation */}
          <div className="flex justify-center">
            <Heart
              size={48}
              className="text-pink-500 animate-pulse"
              fill="currentColor"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsMinimized(false)}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md hover:bg-white/80 dark:hover:bg-gray-800/80 text-gray-900 dark:text-white rounded-xl font-semibold shadow-xl transition-all border border-gray-200 dark:border-gray-600"
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Heart size={16} className="text-pink-600 dark:text-pink-400" fill="currentColor" />
              </div>
              <span>Return to Dashboard</span>
            </button>

            <Link
              to="/discover"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md hover:bg-white/80 dark:hover:bg-gray-800/80 text-gray-900 dark:text-white rounded-xl font-semibold shadow-xl transition-all border border-gray-200 dark:border-gray-600"
            >
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Heart size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <span>Browse Profiles</span>
            </Link>
          </div>

          {/* Subtle hint */}
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            ✨ Your perfect match could be one click away ✨
          </p>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          .animate-fade-in {
            animation: fadeIn 1.5s ease-in;
          }
          @keyframes pulse-slow {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 20px 25px -5px rgba(236, 72, 153, 0.3);
            }
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Floating Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl p-6 mb-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Hey {user?.first_name || user?.username}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Ready to find your match?</p>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              title="Minimize dashboard to enjoy background"
            >
              <Minimize2 size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-white/60 dark:bg-gray-700/60 rounded-lg p-3 text-center">
              <Clock className="mx-auto mb-1 text-blue-500" size={20} />
              <div className="text-lg font-bold text-gray-900 dark:text-white">{formatTime(sessionTime)}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Session</div>
            </div>
            <div className="bg-white/60 dark:bg-gray-700/60 rounded-lg p-3 text-center">
              <Flame className="mx-auto mb-1 text-orange-500" size={20} />
              <div className="text-lg font-bold text-gray-900 dark:text-white">{stats?.login_streak || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Day Streak</div>
            </div>
            <div className="bg-white/60 dark:bg-gray-700/60 rounded-lg p-3 text-center">
              <Heart className="mx-auto mb-1 text-pink-500" size={20} />
              <div className="text-lg font-bold text-gray-900 dark:text-white">{stats?.total_matches || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Matches</div>
            </div>
            <div className="bg-white/60 dark:bg-gray-700/60 rounded-lg p-3 text-center">
              <Star className="mx-auto mb-1 text-purple-500" size={20} />
              <div className="text-lg font-bold text-gray-900 dark:text-white">{stats?.profile_completeness || 0}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Profile</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Quests */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <button
                onClick={() => setShowQuests(!showQuests)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center gap-3">
                  <Target className="text-blue-500" size={24} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Quests</h2>
                </div>
                {showQuests ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {showQuests && (
                <div className="p-4 pt-0 space-y-3">
                  {quests.map((quest) => (
                    <div
                      key={quest.id}
                      className={`border-2 rounded-xl p-3 transition-all ${
                        quest.completed
                          ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-white/40 dark:bg-gray-700/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">{quest.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-sm text-gray-900 dark:text-white">{quest.title}</h3>
                            {quest.completed && <CheckCircle className="text-green-500 flex-shrink-0" size={16} />}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{quest.description}</p>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-2">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                quest.completed ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min((quest.progress / quest.target) * 100, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {quest.progress}/{quest.target}
                            </span>
                            {!quest.completed && quest.actionLink && (
                              <Link
                                to={quest.actionLink}
                                className="text-xs px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition"
                              >
                                {quest.action}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <button
                onClick={() => setShowActions(!showActions)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-gray-700/50 transition"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                {showActions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {showActions && (
                <div className="p-4 pt-0 space-y-2">
                  <Link
                    to="/discover"
                    className="flex items-center gap-3 w-full py-3 px-4 bg-white/40 dark:bg-gray-700/40 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-lg transition border border-gray-200 dark:border-gray-600"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Heart size={16} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Browse Profiles</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 w-full py-3 px-4 bg-white/40 dark:bg-gray-700/40 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-lg transition border border-gray-200 dark:border-gray-600"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">View My Profile</span>
                  </Link>
                  <Link
                    to="/conversations"
                    className="flex items-center gap-3 w-full py-3 px-4 bg-white/40 dark:bg-gray-700/40 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-lg transition border border-gray-200 dark:border-gray-600"
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                      <MessageCircle size={16} className="text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Messages</span>
                  </Link>
                  <Link
                    to="/profile/edit"
                    className="flex items-center gap-3 w-full py-3 px-4 bg-white/40 dark:bg-gray-700/40 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-lg transition border border-gray-200 dark:border-gray-600"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Star size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Edit Profile</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 w-full py-3 px-4 bg-white/40 dark:bg-gray-700/40 hover:bg-white/60 dark:hover:bg-gray-700/60 rounded-lg transition border border-gray-200 dark:border-gray-600"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Admin Dashboard</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Profile Suggestions - Carousel */}
          <div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center gap-3">
                  <Heart className="text-pink-500" size={24} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Suggested For You</h2>
                  {suggestions.length > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({currentSuggestionIndex + 1}/{suggestions.length})
                    </span>
                  )}
                </div>
                {showSuggestions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {showSuggestions && (
                <div className="p-6 pt-0">
                  {suggestions.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No suggestions available right now. Check back later!
                    </p>
                  ) : (
                    <div>
                      <SuggestionCard
                        match={suggestions[currentSuggestionIndex]}
                        onLike={async (username) => {
                          try {
                            await axiosInstance.post('/me/like', { username });
                            const newSuggestions = suggestions.filter(s => s.user.username !== username);
                            setSuggestions(newSuggestions);
                            if (currentSuggestionIndex >= newSuggestions.length) {
                              setCurrentSuggestionIndex(Math.max(0, newSuggestions.length - 1));
                            }
                            // Refresh stats to update quest progress
                            fetchStats();
                          } catch (err) {
                            // Silently handle error
                          }
                        }}
                        onReject={(username) => {
                          const newSuggestions = suggestions.filter(s => s.user.username !== username);
                          setSuggestions(newSuggestions);
                          if (currentSuggestionIndex >= newSuggestions.length) {
                            setCurrentSuggestionIndex(Math.max(0, newSuggestions.length - 1));
                          }
                        }}
                      />

                      {/* Navigation dots */}
                      {suggestions.length > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                          {suggestions.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentSuggestionIndex(index)}
                              className={`w-2 h-2 rounded-full transition ${
                                index === currentSuggestionIndex
                                  ? 'bg-pink-500 w-6'
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Activity Stats */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-green-500" size={24} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Activity</h2>
                </div>
                {showStats ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {showStats && (
                <div className="p-4 pt-0 grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-white/40 dark:bg-gray-700/40 rounded-lg">
                    <Heart className="mx-auto mb-1 text-pink-500" size={24} />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.total_likes_given || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Likes Given</div>
                  </div>
                  <div className="text-center p-3 bg-white/40 dark:bg-gray-700/40 rounded-lg">
                    <Heart className="mx-auto mb-1 text-red-500" size={24} fill="currentColor" />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.total_likes_received || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Likes Received</div>
                  </div>
                  <div className="text-center p-3 bg-white/40 dark:bg-gray-700/40 rounded-lg">
                    <MessageCircle className="mx-auto mb-1 text-blue-500" size={24} />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.total_messages_sent || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Messages</div>
                  </div>
                  <div className="text-center p-3 bg-white/40 dark:bg-gray-700/40 rounded-lg">
                    <Eye className="mx-auto mb-1 text-purple-500" size={24} />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.total_profile_views || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Profile Views</div>
                  </div>
                  <div className="text-center p-3 bg-white/40 dark:bg-gray-700/40 rounded-lg">
                    <Heart className="mx-auto mb-1 text-yellow-500" size={24} />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.total_matches || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Matches</div>
                  </div>
                  <div className="text-center p-3 bg-white/40 dark:bg-gray-700/40 rounded-lg">
                    <MapPin className="mx-auto mb-1 text-green-500" size={24} />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{stats?.total_dates || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Dates</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

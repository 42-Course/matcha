import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@api/axios';
import { useUserMe } from '@/hooks/useUserMe';
import { PublicUser } from '@/types/user';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Heart, Eye, MessageCircle, Calendar, Ban } from 'lucide-react';

interface UserDetails {
  user: any;
  blocked_users: PublicUser[];
  liked_users: PublicUser[];
  liked_by_users: PublicUser[];
  viewed_profiles: PublicUser[];
  profile_viewers: PublicUser[];
  matches: PublicUser[];
  total_messages: number;
  total_dates: number;
}

export function UserAdminPage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useUserMe();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.username === 'pulgamecanica';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchUserDetails = async () => {
      try {
        const data = await axiosInstance.get(`/admin/users/${username}/details`) as unknown as UserDetails;
        setUserDetails(data);
      } catch (err) {
        toast.error(`Failed to fetch user details: ${err}`);
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [username, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  const { user, blocked_users, liked_users, liked_by_users, viewed_profiles, profile_viewers, matches, total_messages, total_dates } = userDetails;

  return (
    <div className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900">
      <button
        onClick={() => navigate('/admin')}
        className="mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
      >
        <ArrowLeft size={20} />
        Back to Admin Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Manage User: <a href={`/profile/${user.username}`} className="text-blue-600 dark:text-blue-400 hover:underline">{user.username}</a>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <MessageCircle className="text-green-500" size={32} />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{total_messages}</div>
              <div className="text-gray-600 dark:text-gray-400">Messages Sent</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Calendar className="text-purple-500" size={32} />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{total_dates}</div>
              <div className="text-gray-600 dark:text-gray-400">Dates Initiated</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Heart className="text-pink-500" size={32} />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{matches.length}</div>
              <div className="text-gray-600 dark:text-gray-400">Matches</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Ban className="text-red-500" size={32} />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{blocked_users.length}</div>
              <div className="text-gray-600 dark:text-gray-400">Blocked Users</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">User Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{user.email}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Name:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{user.first_name} {user.last_name}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Gender:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{user.gender}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Birth Year:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{user.birth_year}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Fame Rating:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{user.fame_rating}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Location:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">{user.city}, {user.country}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Email Verified:</span>
            <span className={`ml-2 ${user.is_email_verified === 't' ? 'text-green-600' : 'text-red-600'}`}>
              {user.is_email_verified === 't' ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Banned:</span>
            <span className={`ml-2 ${user.is_banned === 't' ? 'text-red-600' : 'text-green-600'}`}>
              {user.is_banned === 't' ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="text-pink-500" size={24} />
            Liked Users ({liked_users.length})
          </h2>
          <div className="space-y-2">
            {liked_users.length > 0 ? (
              liked_users.map((u) => (
                <div key={u.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <a href={`/profile/${u.username}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {u.username}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No users liked</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="text-green-500" size={24} />
            Liked By ({liked_by_users.length})
          </h2>
          <div className="space-y-2">
            {liked_by_users.length > 0 ? (
              liked_by_users.map((u) => (
                <div key={u.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <a href={`/profile/${u.username}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {u.username}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Not liked by anyone</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="text-blue-500" size={24} />
            Viewed Profiles ({viewed_profiles.length})
          </h2>
          <div className="space-y-2">
            {viewed_profiles.length > 0 ? (
              viewed_profiles.map((u) => (
                <div key={u.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <a href={`/profile/${u.username}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {u.username}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No profiles viewed</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="text-purple-500" size={24} />
            Profile Viewers ({profile_viewers.length})
          </h2>
          <div className="space-y-2">
            {profile_viewers.length > 0 ? (
              profile_viewers.map((u) => (
                <div key={u.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <a href={`/profile/${u.username}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {u.username}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No profile viewers</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Ban className="text-red-500" size={24} />
            Blocked Users ({blocked_users.length})
          </h2>
          <div className="space-y-2">
            {blocked_users.length > 0 ? (
              blocked_users.map((u) => (
                <div key={u.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <a href={`/profile/${u.username}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {u.username}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No users blocked</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="text-orange-500" size={24} />
            Matches ({matches.length})
          </h2>
          <div className="space-y-2">
            {matches.length > 0 ? (
              matches.map((u) => (
                <div key={u.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <a href={`/profile/${u.username}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {u.username}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No matches</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

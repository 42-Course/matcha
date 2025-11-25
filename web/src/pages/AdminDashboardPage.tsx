import { useState, useEffect } from 'react';
import axiosInstance from '@api/axios';
import { useUserMe } from '@/hooks/useUserMe';
import { User } from '@/types/user';
import { Users, Activity, List, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';

interface Visit {
  id: number;
  user_id: number;
  username: string;
  visited_at: string;
  ip_address: string;
  user_agent: string;
}

interface VisitStats {
  id: number;
  username: string;
  visit_count: string;
}

interface RecentLogin {
  username: string;
  visited_at: string;
  city: string;
  country: string;
}

interface WebsiteStats {
  total_users: number;
  total_messages: number;
  total_dates: number;
  total_matches: number;
  recent_logins: RecentLogin[];
}

interface TimeSeriesData {
  date: string;
  count: string;
}

type ViewMode = 'list' | 'card';

export function AdminDashboardPage() {
  const { user } = useUserMe();
  const [users, setUsers] = useState<User[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitStats, setVisitStats] = useState<VisitStats[]>([]);
  const [websiteStats, setWebsiteStats] = useState<WebsiteStats | null>(null);
  const [visitsOverTime, setVisitsOverTime] = useState<TimeSeriesData[]>([]);
  const [messagesOverTime, setMessagesOverTime] = useState<TimeSeriesData[]>([]);
  const [profileViewsOverTime, setProfileViewsOverTime] = useState<TimeSeriesData[]>([]);
  const [datesOverTime, setDatesOverTime] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const isAdmin = user?.username === 'pulgamecanica';

  useEffect(() => {
    const savedViewMode = localStorage.getItem('admin_view_mode') as ViewMode;
    const savedUsersPerPage = localStorage.getItem('admin_users_per_page');

    if (savedViewMode) setViewMode(savedViewMode);
    if (savedUsersPerPage) setUsersPerPage(parseInt(savedUsersPerPage));
  }, []);

  useEffect(() => {
    localStorage.setItem('admin_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('admin_users_per_page', usersPerPage.toString());
  }, [usersPerPage]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [
          statsRes,
          visitsTimeRes,
          messagesTimeRes,
          profileViewsTimeRes,
          datesTimeRes
        ] = await Promise.all([
          axiosInstance.get('/admin/stats') as unknown as WebsiteStats,
          axiosInstance.get('/admin/stats/visits-over-time?days=30') as unknown as TimeSeriesData[],
          axiosInstance.get('/admin/stats/messages-over-time?days=30') as unknown as TimeSeriesData[],
          axiosInstance.get('/admin/stats/profile-views-over-time?days=30') as unknown as TimeSeriesData[],
          axiosInstance.get('/admin/stats/dates-over-time?days=30') as unknown as TimeSeriesData[],
        ]);

        setWebsiteStats(statsRes || null);
        setVisitsOverTime(visitsTimeRes || []);
        setMessagesOverTime(messagesTimeRes || []);
        setProfileViewsOverTime(profileViewsTimeRes || []);
        setDatesOverTime(datesTimeRes || []);

        if (isAdmin) {
          const [usersRes, visitsRes, userVisitStatsRes] = await Promise.all([
            axiosInstance.get('/admin/users') as unknown as User[],
            axiosInstance.get('/admin/visits') as unknown as Visit[],
            axiosInstance.get('/admin/visits/stats') as unknown as VisitStats[],
          ]);

          setUsers(usersRes || []);
          setVisits(visitsRes || []);
          setVisitStats(userVisitStatsRes || []);
        }
      } catch (err) {
        toast.error(`Failed to fetch admin data: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isAdmin]);

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${username}?`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      toast.success(`User ${username} deleted successfully`);
    } catch (err) {
      toast.error(`Failed to delete user: ${err}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  const totalPages = Math.ceil(users.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);

  return (
    <div className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Admin Dashboard</h1>

      {!isAdmin && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded mb-6">
          This view is publicly accessible but you are not admin, you can't do anything :)
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Users className="text-blue-500" size={32} />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{websiteStats?.total_users || 0}</div>
              <div className="text-gray-600 dark:text-gray-400">Total Users</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Activity className="text-green-500" size={32} />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{websiteStats?.total_messages || 0}</div>
              <div className="text-gray-600 dark:text-gray-400">Total Messages</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Activity className="text-purple-500" size={32} />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{websiteStats?.total_dates || 0}</div>
              <div className="text-gray-600 dark:text-gray-400">Total Dates</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <Activity className="text-pink-500" size={32} />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{websiteStats?.total_matches || 0}</div>
              <div className="text-gray-600 dark:text-gray-400">Total Matches</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TimeSeriesChart
          title="Site Visits Over Time"
          data={visitsOverTime}
          color="#3b82f6"
        />
        <TimeSeriesChart
          title="Messages Over Time"
          data={messagesOverTime}
          color="#10b981"
        />
        <TimeSeriesChart
          title="Profile Views Over Time"
          data={profileViewsOverTime}
          color="#8b5cf6"
        />
        <TimeSeriesChart
          title="Dates Scheduled Over Time"
          data={datesOverTime}
          color="#ec4899"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Recent Logins (Top 5)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {websiteStats?.recent_logins.map((login, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{login.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(login.visited_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {login.city}, {login.country}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isAdmin && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Additional admin features are restricted to administrators.</p>
        </div>
      )}

      {isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Users className="text-blue-500" size={32} />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</div>
                  <div className="text-gray-600 dark:text-gray-400">Total Users</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Activity className="text-green-500" size={32} />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{visits.length}</div>
                  <div className="text-gray-600 dark:text-gray-400">Recent Visits</div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center gap-3">
                <Activity className="text-purple-500" size={32} />
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {visitStats.reduce((sum, stat) => sum + parseInt(stat.visit_count), 0)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Total Visits</div>
                </div>
              </div>
            </div>
          </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h2>
          <div className="flex gap-4 items-center">
            <select
              value={usersPerPage}
              onChange={(e) => {
                setUsersPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{u.first_name} {u.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.is_banned === 't' ? 'bg-red-100 text-red-800' :
                        u.is_email_verified === 't' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {u.is_banned === 't' ? 'Banned' : u.is_email_verified === 't' ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {u.username !== 'pulgamecanica' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedUsers.map((u) => (
              <div key={u.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{u.username}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{u.email}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    u.is_banned === 't' ? 'bg-red-100 text-red-800' :
                    u.is_email_verified === 't' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {u.is_banned === 't' ? 'Banned' : u.is_email_verified === 't' ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {u.first_name} {u.last_name}
                </div>
                {u.username !== 'pulgamecanica' && (
                  <button
                    onClick={() => handleDeleteUser(u.id, u.username)}
                    className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete User
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-900 dark:text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Visit Statistics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Visit Count</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {visitStats.slice(0, 10).map((stat) => (
                    <tr key={stat.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{stat.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{stat.visit_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

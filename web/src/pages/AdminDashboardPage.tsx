import { useState, useEffect } from 'react';
import axiosInstance from '@api/axios';
import { useUserMe } from '@/hooks/useUserMe';
import {
  Users, Activity, List, LayoutGrid, Megaphone, Globe2, TrendingUp,
  Settings, Grid3x3, Maximize2, GripVertical, Menu, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { UserGlobe } from '@/components/UserGlobe';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_banned: 't' | 'f';
  is_email_verified: 't' | 'f';
  updated_at?: string;
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

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_by: number;
  created_by_username: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface TimeSeriesData {
  date: string;
  count: string;
}

type ViewMode = 'list' | 'card';
type SortField = 'id' | 'username' | 'email' | 'updated_at';
type SortOrder = 'asc' | 'desc';
type LoginSortField = 'username' | 'visited_at' | 'location';
type SettingsLayoutMode = 'list' | 'grid';

interface DashboardSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  adminOnly: boolean;
}

function SortableSettingsCard({
  section,
  layoutMode
}: {
  section: DashboardSection;
  layoutMode: SettingsLayoutMode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-grab active:cursor-grabbing ${
        layoutMode === 'grid' ? '' : 'mb-4'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="text-gray-400" size={20} />
        {section.icon}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{section.title}</h3>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const { user } = useUserMe();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [visitStats, setVisitStats] = useState<VisitStats[]>([]);
  const [websiteStats, setWebsiteStats] = useState<WebsiteStats | null>(null);
  const [visitsOverTime, setVisitsOverTime] = useState<TimeSeriesData[]>([]);
  const [messagesOverTime, setMessagesOverTime] = useState<TimeSeriesData[]>([]);
  const [profileViewsOverTime, setProfileViewsOverTime] = useState<TimeSeriesData[]>([]);
  const [datesOverTime, setDatesOverTime] = useState<TimeSeriesData[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementExpires, setAnnouncementExpires] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [loginSortField, setLoginSortField] = useState<LoginSortField>('visited_at');
  const [loginSortOrder, setLoginSortOrder] = useState<SortOrder>('desc');
  const [loginsToShow, setLoginsToShow] = useState(5);
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [settingsLayoutMode, setSettingsLayoutMode] = useState<SettingsLayoutMode>(() => {
    return (localStorage.getItem('admin_settings_layout') as SettingsLayoutMode) || 'list';
  });
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [sections, setSections] = useState<DashboardSection[]>(() => {
    const defaultSections = [
      { id: 'total-stats', title: 'Total Statistics', icon: <TrendingUp className="text-blue-500" size={24} />, adminOnly: false },
      { id: '3d-map', title: 'User Globe', icon: <Globe2 className="text-green-500" size={24} />, adminOnly: false },
      { id: 'graphs', title: 'Activity Graphs', icon: <Activity className="text-purple-500" size={24} />, adminOnly: false },
      { id: 'users', title: 'Users Management', icon: <Users className="text-blue-500" size={24} />, adminOnly: true },
      { id: 'recent-logins', title: 'Recent Logins', icon: <Activity className="text-green-500" size={24} />, adminOnly: true },
      { id: 'announcements', title: 'Announcements', icon: <Megaphone className="text-orange-500" size={24} />, adminOnly: true },
      { id: 'visit-stats', title: 'Visit Statistics', icon: <Activity className="text-purple-500" size={24} />, adminOnly: true },
    ];

    const savedOrder = localStorage.getItem('admin_sections_order');
    if (savedOrder) {
      const parsed = JSON.parse(savedOrder);
      return parsed.map((savedSection: Omit<DashboardSection, 'icon'>) => {
        const defaultSection = defaultSections.find(s => s.id === savedSection.id);
        return {
          ...savedSection,
          icon: defaultSection?.icon || <Activity className="text-gray-500" size={24} />,
        };
      });
    }
    return defaultSections;
  });

  const isAdmin = user?.username === 'pulgamecanica';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    localStorage.setItem('admin_settings_layout', settingsLayoutMode);
  }, [settingsLayoutMode]);

  useEffect(() => {
    const sectionsToSave = sections.map(({ id, title, adminOnly }) => ({
      id,
      title,
      adminOnly,
    }));
    localStorage.setItem('admin_sections_order', JSON.stringify(sectionsToSave));
  }, [sections]);

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
          const [usersRes, userVisitStatsRes, announcementsRes] = await Promise.all([
            axiosInstance.get('/admin/users') as unknown as AdminUser[],
            axiosInstance.get('/admin/visits/stats') as unknown as VisitStats[],
            axiosInstance.get('/admin/announcements') as unknown as Announcement[],
          ]);

          setUsers(usersRes || []);
          setVisitStats(userVisitStatsRes || []);
          setAnnouncements(announcementsRes || []);
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

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const payload: { title: string; content: string; expires_at?: string } = {
        title: announcementTitle,
        content: announcementContent,
      };

      if (announcementExpires) {
        payload.expires_at = announcementExpires;
      }

      const newAnnouncement = await axiosInstance.post('/admin/announcements', payload) as unknown as Announcement;
      setAnnouncements([newAnnouncement, ...announcements]);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementExpires('');
      toast.success('Announcement created and all users notified!');
    } catch (err) {
      toast.error(`Failed to create announcement: ${err}`);
    }
  };

  const handleDeactivateAnnouncement = async (id: number) => {
    try {
      await axiosInstance.patch(`/admin/announcements/${id}/deactivate`);
      setAnnouncements(announcements.map(a =>
        a.id === id ? { ...a, is_active: false } : a
      ));
      toast.success('Announcement deactivated');
    } catch (err) {
      toast.error(`Failed to deactivate announcement: ${err}`);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/admin/announcements/${id}`);
      setAnnouncements(announcements.filter(a => a.id !== id));
      toast.success('Announcement deleted');
    } catch (err) {
      toast.error(`Failed to delete announcement: ${err}`);
    }
  };

  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
  };

  const sortedUsers = [...users].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'id':
        comparison = a.id - b.id;
        break;
      case 'username':
        comparison = a.username.localeCompare(b.username);
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'updated_at':
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        comparison = dateA - dateB;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const LoginSortIcon = ({ field }: { field: LoginSortField }) => {
    if (loginSortField !== field) return null;
    return (
      <span className="ml-1">
        {loginSortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const handleLoginSort = (field: LoginSortField) => {
    const newOrder = loginSortField === field && loginSortOrder === 'asc' ? 'desc' : 'asc';
    setLoginSortField(field);
    setLoginSortOrder(newOrder);
  };

  const sortedLogins = [...(websiteStats?.recent_logins || [])].sort((a, b) => {
    let comparison = 0;

    switch (loginSortField) {
      case 'username':
        comparison = a.username.localeCompare(b.username);
        break;
      case 'visited_at':
        const dateA = new Date(a.visited_at).getTime();
        const dateB = new Date(b.visited_at).getTime();
        comparison = dateA - dateB;
        break;
      case 'location':
        const locA = `${a.city}, ${a.country}`;
        const locB = `${b.city}, ${b.country}`;
        comparison = locA.localeCompare(locB);
        break;
    }

    return loginSortOrder === 'asc' ? comparison : -comparison;
  });

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowNavMenu(false);
    }
  };

  const visibleSections = sections.filter(section => !section.adminOnly || isAdmin);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-900 dark:text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  // Settings Mode View
  if (isSettingsMode) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Settings
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setSettingsLayoutMode(settingsLayoutMode === 'grid' ? 'list' : 'grid')}
                className={`p-2 rounded ${settingsLayoutMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                title={settingsLayoutMode === 'grid' ? 'Switch to list' : 'Switch to grid'}
              >
                {settingsLayoutMode === 'grid' ? <Grid3x3 size={20} /> : <Maximize2 size={20} />}
              </button>
              <button
                onClick={() => setIsSettingsMode(false)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition"
              >
                Exit Settings
              </button>
            </div>
          </div>

          <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <p className="text-blue-900 dark:text-blue-100">
              <strong>Drag and drop</strong> the sections below to reorder them on your dashboard.
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleSections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={settingsLayoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}>
                {visibleSections.map((section) => (
                  <SortableSettingsCard
                    key={section.id}
                    section={section}
                    layoutMode={settingsLayoutMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    );
  }

  // Normal Mode View
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-100 dark:bg-gray-900 z-20 py-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              title="Navigation menu"
            >
              {showNavMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button
              onClick={() => setIsSettingsMode(true)}
              className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              title="Dashboard settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        {showNavMenu && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Jump to Section</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {visibleSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm text-gray-900 dark:text-white transition"
                >
                  {section.icon}
                  <span>{section.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Sections */}
        <div className="space-y-8">
          {visibleSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  {section.icon}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
                </div>

                {section.id === 'total-stats' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                      <div className="flex items-center gap-3">
                        <Users className="text-blue-500" size={32} />
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{websiteStats?.total_users || 0}</div>
                          <div className="text-gray-600 dark:text-gray-400">Total Users</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                      <div className="flex items-center gap-3">
                        <Activity className="text-green-500" size={32} />
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{websiteStats?.total_messages || 0}</div>
                          <div className="text-gray-600 dark:text-gray-400">Messages</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                      <div className="flex items-center gap-3">
                        <Activity className="text-purple-500" size={32} />
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{websiteStats?.total_dates || 0}</div>
                          <div className="text-gray-600 dark:text-gray-400">Dates</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                      <div className="flex items-center gap-3">
                        <Activity className="text-pink-500" size={32} />
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{websiteStats?.total_matches || 0}</div>
                          <div className="text-gray-600 dark:text-gray-400">Matches</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {section.id === '3d-map' && (
                  <div className="-m-6">
                    <UserGlobe />
                  </div>
                )}

                {section.id === 'graphs' && (
                  <div className="space-y-6">
                    <TimeSeriesChart title="API Activity" data={visitsOverTime} color="#3b82f6" />
                    <TimeSeriesChart title="Messages" data={messagesOverTime} color="#10b981" />
                    <TimeSeriesChart title="Profile Views" data={profileViewsOverTime} color="#8b5cf6" />
                    <TimeSeriesChart title="Dates" data={datesOverTime} color="#ec4899" />
                  </div>
                )}

                {section.id === 'users' && isAdmin && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
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
                              <th
                                onClick={() => handleSort('id')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                ID<SortIcon field="id" />
                              </th>
                              <th
                                onClick={() => handleSort('username')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                Username<SortIcon field="username" />
                              </th>
                              <th
                                onClick={() => handleSort('email')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                Email<SortIcon field="email" />
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedUsers.map((u) => (
                              <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{u.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <a
                                    href={`/profile/${u.username}`}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    {u.username}
                                  </a>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {u.first_name} {u.last_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    u.is_banned === 't'
                                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                      : u.is_email_verified === 't'
                                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                  }`}>
                                    {u.is_banned === 't' ? 'Banned' : u.is_email_verified === 't' ? 'Verified' : 'Unverified'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex gap-2">
                                    <a
                                      href={`/admin/users/${u.username}`}
                                      className="text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      View
                                    </a>
                                    <button
                                      onClick={() => handleDeleteUser(u.id, u.username)}
                                      className="text-red-600 dark:text-red-400 hover:underline"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedUsers.map((u) => (
                          <div key={u.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <a
                                href={`/profile/${u.username}`}
                                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {u.username}
                              </a>
                              <span className={`px-2 py-1 rounded text-xs ${
                                u.is_banned === 't'
                                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                  : u.is_email_verified === 't'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              }`}>
                                {u.is_banned === 't' ? 'Banned' : u.is_email_verified === 't' ? 'Verified' : 'Unverified'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <div>{u.email}</div>
                              <div>{u.first_name} {u.last_name}</div>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={`/admin/users/${u.username}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                              >
                                View Details
                              </a>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="text-red-600 dark:text-red-400 hover:underline text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-4">
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
                )}

                {section.id === 'recent-logins' && isAdmin && (
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</label>
                      <select
                        value={loginsToShow}
                        onChange={(e) => setLoginsToShow(parseInt(e.target.value))}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th
                              onClick={() => handleLoginSort('username')}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              Username<LoginSortIcon field="username" />
                            </th>
                            <th
                              onClick={() => handleLoginSort('visited_at')}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              Last Login<LoginSortIcon field="visited_at" />
                            </th>
                            <th
                              onClick={() => handleLoginSort('location')}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              Location<LoginSortIcon field="location" />
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {sortedLogins.slice(0, loginsToShow).map((login, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <a
                                  href={`/profile/${login.username}`}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {login.username}
                                </a>
                              </td>
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
                )}

                {section.id === 'announcements' && isAdmin && (
                  <div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New Announcement</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={announcementTitle}
                            onChange={(e) => setAnnouncementTitle(e.target.value)}
                            placeholder="Enter announcement title"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Content (Markdown supported)
                          </label>
                          <textarea
                            value={announcementContent}
                            onChange={(e) => setAnnouncementContent(e.target.value)}
                            placeholder="Enter announcement content"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Expires At (Optional)
                          </label>
                          <input
                            type="datetime-local"
                            value={announcementExpires}
                            onChange={(e) => setAnnouncementExpires(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <button
                          onClick={handleCreateAnnouncement}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition"
                        >
                          Create Announcement
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Existing Announcements ({announcements.length})
                      </h3>
                      {announcements.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No announcements yet</p>
                      ) : (
                        <div className="space-y-3">
                          {announcements.map((announcement) => (
                            <div
                              key={announcement.id}
                              className="border border-gray-300 dark:border-gray-600 rounded-lg p-4"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{announcement.title}</h4>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    By {announcement.created_by_username} • {new Date(announcement.created_at).toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  {announcement.is_active ? (
                                    <>
                                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                                        Active
                                      </span>
                                      <button
                                        onClick={() => handleDeactivateAnnouncement(announcement.id)}
                                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded transition"
                                      >
                                        Deactivate
                                      </button>
                                    </>
                                  ) : (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded">
                                      Inactive
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                {announcement.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {section.id === 'visit-stats' && isAdmin && (
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <a
                                href={`/profile/${stat.username}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {stat.username}
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{stat.visit_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

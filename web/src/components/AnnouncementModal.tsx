import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axiosInstance from '@api/axios';
import { X } from 'lucide-react';

interface AnnouncementModalProps {
  announcementId: number;
  onClose: () => void;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by_username: string;
  created_at: string;
  expires_at: string | null;
}

export function AnnouncementModal({ announcementId, onClose }: AnnouncementModalProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const data = await axiosInstance.get(`/announcements/${announcementId}`) as unknown as Announcement;
        setAnnouncement(data);
      } catch (err) {
        console.error('Failed to fetch announcement:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [announcementId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="text-gray-900 dark:text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{announcement.title}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              By {announcement.created_by_username} • {new Date(announcement.created_at).toLocaleString()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{announcement.content}</ReactMarkdown>
          </div>
        </div>

        {announcement.expires_at && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Expires: {new Date(announcement.expires_at).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

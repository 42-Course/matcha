import { ConversationItem } from '@/components/chat/ConversationItem';
import { useMessages } from '@/hooks/useMessages';
import { useUserMe } from '@/hooks/useUserMe';
import { LucideSearch } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function ConversationPanel({
  onSelectUser,
  activeUsername,
}: {
  onSelectUser: (username: string) => void;
  activeUsername: string | null;
}) {
  const [search, setSearch] = useState('');
  const { conversations, isUserTyping } = useMessages();
  const { user, profilePicture } = useUserMe();
  const navigate = useNavigate();

  const filteredConversations = conversations.filter((conv) =>
    conv.user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <Link to="/profile" className="flex items-center gap-3 hover:opacity-90 transition hover:bg-gray-100 hover:dark:bg-gray-700 p-4">
          <img
            src={profilePicture?.url || '/default.png'}
            alt="Profile"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {user?.username}
          </div>
        </Link>
      </div>

      <div className="px-3 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <LucideSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {filteredConversations.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No conversations found
          </div>
        )}
        {filteredConversations.map((conv) => (
          <ConversationItem
            key={conv.user.username}
            user={conv.user}
            lastMessage={conv.messages[conv.messages.length - 1]}
            isActive={conv.user.username === activeUsername}
            isTyping={isUserTyping(conv.user.id)}
            onClick={() => {
              onSelectUser(conv.user.username);
              navigate(`?user=${conv.user.username}`, { replace: true });
            }}
          />
        ))}
      </div>
    </>
  );
}

import { Message } from "@/types/message";
import { PublicUser } from "@/types/user";

export function ConversationItem({
  user,
  lastMessage,
  isActive,
  isTyping,
  onClick
}: {
  user: PublicUser;
  lastMessage: Message;
  isActive: boolean;
  isTyping: boolean;
  onClick: () => void;
}) {
  if (!user) return;

  const profilePic = (user.pictures || []).find((p) => p.is_profile === "t")?.url;
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
        isActive ? 'bg-gray-100 dark:bg-gray-700' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <img src={profilePic || '/default.png'} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
          <div className="truncate text-xs text-gray-500 dark:text-gray-400">
            {isTyping ? 'Typing...' : lastMessage?.content || 'No messages yet'}
          </div>
        </div>
      </div>
    </div>
  );
}

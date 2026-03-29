import { useMessages } from '@/hooks/useMessages';
import { useUserMe } from '@/hooks/useUserMe';
import { useEffect, useState } from 'react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ConversationPanel } from '@/components/chat/ConversationPanel';
import { Conversation } from '@/types/conversation';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export function ConversationsPage() {
  const { user } = useUserMe();
  const { conversations, isUserTyping, appendMessageToConversation } = useMessages();
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [searchParams] = useSearchParams();
  const initialUsername = searchParams.get('user');

  useEffect(() => {
    if (initialUsername) {
      setSelectedUsername(initialUsername);
    }
  }, [initialUsername]);

  useEffect(() => {
    setActiveConversation(conversations.find((c) => c.user.username === selectedUsername) || null);
  }, [conversations, selectedUsername]);

  const handleSendLocalMessage = (content: string) => {
    if (!activeConversation || !user) return;

    appendMessageToConversation(activeConversation.user.username, {
      id: Date.now(),
      connection_id: activeConversation.messages[activeConversation.messages.length - 1]?.connection_id ?? -1,
      sender_id: user.id,
      sender_username: user.username,
      content,
      created_at: new Date().toISOString(),
    });
  };

  const handleBack = () => {
    setSelectedUsername(null);
    window.history.replaceState(null, '', '/conversations');
  };

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] w-full items-center justify-center">
        "Fetching all messages..."
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - full width on mobile when no chat selected, fixed width on desktop */}
      <div
        className={`
          ${selectedUsername ? 'hidden md:flex' : 'flex'}
          w-full md:w-80 lg:w-96 flex-shrink-0 flex-col
          border-r border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800
        `}
      >
        <ConversationPanel
          onSelectUser={setSelectedUsername}
          activeUsername={selectedUsername}
        />
      </div>

      {/* Chat area - full width on mobile when chat selected, flex-1 on desktop */}
      <div
        className={`
          ${selectedUsername ? 'flex' : 'hidden md:flex'}
          flex-1 flex-col min-w-0
          bg-white dark:bg-gray-900
        `}
      >
        {activeConversation ? (
          <>
            {/* Mobile back button */}
            <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Back</span>
            </div>
            <ChatWindow
              conversation={activeConversation}
              currentUser={user}
              isTyping={isUserTyping(activeConversation.user.id)}
              onSendLocalMessage={handleSendLocalMessage}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <MessageCircle size={48} strokeWidth={1.5} />
            <p className="text-lg">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}

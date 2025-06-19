import { useState, useEffect } from 'react';
import axios from 'axios';
import { resolveProxyUrl } from '@/utils/resolveProxyUrl';

const ChatRoomList = ({ currentUser, onSelectRoom }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'owned', 'member'

  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetchChatRooms();
    } else {
      console.warn('currentUser or currentUser.id is missing:', currentUser);
      setChatRooms([]);
      setLoading(false);
      setError('User information not available');
    }
  }, [currentUser]);

  const fetchChatRooms = async () => {
    console.log("Fetching chat rooms for user:", currentUser?.id);
    try {
      setLoading(true);
      setError(null);

      const endpoints = [
        `/api/chat/rooms/owner/${currentUser.id}`,
        `/api/chat/rooms/member/${currentUser.id}`,
        `/api/chat/rooms/user/${currentUser.id}`,
        `/api/chat/rooms`
      ];

      const results = await Promise.allSettled(
        endpoints.map(endpoint =>
          axios.get(resolveProxyUrl(endpoint))
        )
      );

      let allRooms = [];
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value.data)) {
          allRooms = allRooms.concat(result.value.data);
        }
      });

      if (allRooms.length === 0) {
        throw new Error('No rooms fetched from any endpoint');
      }

      const uniqueRooms = allRooms.filter(
        (room, index, self) =>
          index === self.findIndex(r => r._id === room._id)
      );

      const userRooms = uniqueRooms.filter(room =>
        room.ownerId === currentUser.id ||
        (room.members && room.members.some(member =>
          member.userId === currentUser.id || member._id === currentUser.id
        ))
      );

      console.log(`Fetched and combined rooms: ${userRooms.length}`);
      setChatRooms(userRooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setError(`Failed to load chat rooms: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRooms = () => {
    switch (activeTab) {
      case 'owned':
        return chatRooms.filter(room => room.ownerId === currentUser?.id);
      case 'member':
        return chatRooms.filter(room => room.ownerId !== currentUser?.id);
      default:
        return chatRooms;
    }
  };

  const formatLastActivity = (date) => {
    if (!date) return 'No activity';
    const now = new Date();
    const lastActivity = new Date(date);
    const diffInMinutes = Math.floor((now - lastActivity) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleRoomClick = (room) => {
    if (!room._id && !room.postId) {
      console.error('Room missing required ID:', room);
      alert('Invalid room data');
      return;
    }

    const standardizedRoom = {
      ...room,
      postId: room.postId || room._id,
      title: room.title || room.name || 'Untitled Room'
    };

    onSelectRoom(standardizedRoom);
  };

  const filteredRooms = getFilteredRooms();
  const ownedRoomsCount = chatRooms.filter(room => room.ownerId === currentUser?.id).length;
  const memberRoomsCount = chatRooms.filter(room => room.ownerId !== currentUser?.id).length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Chat Rooms ({chatRooms.length})</h2>
        <button
          onClick={fetchChatRooms}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          All Rooms ({chatRooms.length})
        </button>
        <button
          onClick={() => setActiveTab('owned')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'owned'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          My Rooms ({ownedRoomsCount})
        </button>
        <button
          onClick={() => setActiveTab('member')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'member'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Joined Rooms ({memberRoomsCount})
        </button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
        <p className="text-blue-800">
          <strong>Debug:</strong> User ID: {currentUser?.id} | 
          Total Rooms: {chatRooms.length} | 
          Filtered: {filteredRooms.length} | 
          Active Tab: {activeTab}
        </p>
      </div>

      {filteredRooms.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {activeTab === 'owned' 
              ? 'No rooms created yet' 
              : activeTab === 'member'
              ? 'No rooms joined yet'
              : 'No chat rooms available'
            }
          </h3>
          <p className="text-gray-500 mb-4">
            {activeTab === 'owned'
              ? 'Create a project post to start your first chat room.'
              : activeTab === 'member'
              ? 'Join a project to start chatting with team members.'
              : 'Create or join a project to start chatting.'
            }
          </p>
          <button
            onClick={fetchChatRooms}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Reload Rooms
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRooms.map((room) => (
            <div
              key={room._id || room.postId}
              onClick={() => handleRoomClick(room)}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {room.title || room.name || 'Untitled Room'}
                    </h3>
                    {room.ownerId === currentUser?.id && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Owner
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{room.members?.length || 0} members</span>
                    <span>•</span>
                    <span>{formatLastActivity(room.lastActivity || room.updatedAt)}</span>
                    <span>•</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      ID: {room._id || room.postId}
                    </span>
                  </div>

                  {room.lastMessage && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium text-gray-700">
                        {room.lastMessage.senderUsername}:
                      </span>
                      <span className="text-gray-600 ml-1">
                        {room.lastMessage.message?.length > 50
                          ? room.lastMessage.message.substring(0, 50) + '...'
                          : room.lastMessage.message || 'No message content'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {room.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {room.unreadCount}
                    </span>
                  )}
                  <div className="flex -space-x-2">
                    {(room.members || []).slice(0, 3).map((member, index) => (
                      <img
                        key={member.userId || member._id || index}
                        src={member.pic || member.profilePic || '/default-avatar.png'}
                        alt={member.username || 'User'}
                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                        title={member.username || 'Unknown User'}
                      />
                    ))}
                    {(room.members?.length || 0) > 3 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                        +{(room.members?.length || 0) - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatRoomList;

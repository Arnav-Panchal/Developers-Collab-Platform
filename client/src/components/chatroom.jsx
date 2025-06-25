// ChatRoom.js - Enhanced Chat Room Component
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import io from 'socket.io-client';
import  {resolveProxyUrl} from '../utils/resolveProxyUrl';



const ChatRoom = ({ room, currentUser, onBack }) => {
  const token = import.meta.env.VITE_JWT_TOKEN;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState([]);
  const [typing, setTyping] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    console.log('ChatRoom initialized with room:', room);
    console.log('Current user:', currentUser);

    if (room && (room.postId || room._id) && currentUser?.id) {
      initializeChat();
      setupSocket();
    } else {
      console.error('Missing required data:', { room, currentUser });
      setError('Invalid room data or user not authenticated');
      setLoading(false);
    }

    return () => {
      if (socketRef.current) {
        console.log('Disconnecting socket');
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [room, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    const roomId = room.postId || room._id;
    console.log('Initializing chat for room:', roomId);

    try {
      setError(null);

      
      const apiUrl = resolveProxyUrl(`/api/chat/access/${roomId}/${currentUser.id}`);
      const apiUrl1 = resolveProxyUrl(`/api/chat/messages/${roomId}`);
      const apiUrl2 = resolveProxyUrl(`/api/chat/members/${roomId}`);
      


      // Check access to the chat room
      try {
        const accessResponse = await axios.get(apiUrl);
        console.log('Access check response:', accessResponse.data);
        
        if (!accessResponse.data.hasAccess) {
          throw new Error('You do not have access to this chat room');
        }
      } catch (accessError) {
        console.log('Access check failed, proceeding anyway:', accessError.message);
        // Continue even if access check fails - some APIs might not have this endpoint
      }

      // Fetch messages
      try {
        const messagesResponse = await axios.get(apiUrl1);
        console.log('Messages fetched:', messagesResponse.data.length);
        setMessages(Array.isArray(messagesResponse.data) ? messagesResponse.data : []);
      } catch (msgError) {
        console.error('Failed to fetch messages:', msgError);
        setMessages([]);
      }

      // Fetch members
      try {
        const membersResponse = await axios.get(apiUrl2);
        console.log('Members fetched:', membersResponse.data.length);
        setMembers(Array.isArray(membersResponse.data) ? membersResponse.data : []);
      } catch (memberError) {
        console.error('Failed to fetch members:', memberError);
        // Use room members if available
        setMembers(room.members || []);
      }

    } catch (error) {
      console.error('Error initializing chat:', error);
      setError(error.message || 'Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const roomId = room.postId || room._id;
    console.log('Setting up socket for room:', roomId);

    try {
      // Use environment variable for socket URL or default to localhost
      const socketUrl =  'https://developers-collab-platform-1.onrender.com';
      socketRef.current = io(socketUrl);

      socketRef.current.emit('join_room', roomId);
      console.log('Joined socket room:', roomId);

      socketRef.current.on('new_message', (message) => {
        console.log('New message received:', message);
        setMessages((prev) => [...prev, message]);
      });

      socketRef.current.on('user_joined', ({ user }) => {
        console.log('User joined:', user);
        setMembers((prev) => {
          const exists = prev.some(m => (m.userId || m._id) === (user.userId || user._id));
          return exists ? prev : [...prev, user];
        });
      });

      socketRef.current.on('user_typing', ({ username }) => {
        if (username !== currentUser.username) {
          setTyping((prev) => (prev.includes(username) ? prev : [...prev, username]));
        }
      });

      socketRef.current.on('user_stopped_typing', ({ username }) => {
        setTyping((prev) => prev.filter((user) => user !== username));
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

    } catch (error) {
      console.error('Error setting up socket:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const roomId = room.postId || room._id;
    console.log('Sending message to room:', roomId);

    setSending(true);
    try {
      const messageData = {
        postId: roomId,
        senderId: currentUser.id,
        senderUsername: currentUser.username,
        senderPic: currentUser.profilePic,
        message: newMessage.trim(),
      };

      console.log('Message data:', messageData);


      const apiUrl3 = resolveProxyUrl('/api/chat/send');

      const response = await axios.post(apiUrl3, messageData);
      console.log('Message sent response:', response.data);

      const newMsg = response.data.data || response.data;

      // Emit to socket
      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          room: roomId,
          message: newMsg,
        });

        socketRef.current.emit('stop_typing', {
          room: roomId,
          username: currentUser.username,
        });
      }

      // Add message to local state
      setMessages((prev) => [...prev, newMsg]);
      setNewMessage('');

     }catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send message';
      alert(`Failed to send message: ${errorMsg}`);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socketRef.current) {
      const roomId = room.postId || room._id;
      
      socketRef.current.emit('typing', {
        room: roomId,
        username: currentUser.username,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('stop_typing', {
          room: roomId,
          username: currentUser.username,
        });
      }, 1000);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();

    if (messageDate.toDateString() === today.toDateString()) return 'Today';

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return messageDate.toLocaleDateString();
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((message) => {
      const date = formatDate(message.timestamp || message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {room.title || room.name || 'Chat Room'}
              </h2>
              <p className="text-sm text-gray-500">{members.length} members</p>
            </div>
          </div>

          <button
            onClick={() => setShowMembers(!showMembers)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <span>Members</span>
            <div className="flex -space-x-1">
              {members.slice(0, 3).map((member, index) => (
                <img
                  key={member.userId || member._id || index}
                  src={member.pic || member.profilePic || '/default-avatar.png'}
                  alt={member.username || 'User'}
                  className="w-6 h-6 rounded-full border border-white object-cover"
                />
              ))}
            </div>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {Object.keys(messageGroups).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No messages yet</h3>
                <p className="text-gray-500">Start the conversation!</p>
              </div>
            ) : (
              Object.entries(messageGroups).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {date}
                    </div>
                  </div>

                  {dateMessages.map((message, index) => {
                    const isOwn = (message.senderId || message.userId) === currentUser._id;
                    const showAvatar =
                      index === 0 || 
                      (dateMessages[index - 1].senderId || dateMessages[index - 1].userId) !== 
                      (message.senderId || message.userId);

                    return (
                      <div
                        key={message._id || index}
                        className={`flex items-end space-x-2 mb-4 ${
                          isOwn ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div className="w-8 h-8">
                          {showAvatar && !isOwn && (
                            <img
                              src={message.senderPic || message.profilePic || '/default-avatar.png'}
                              alt={message.senderUsername || 'User'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                        </div>

                        <div
                          className={`max-w-xs lg:max-w-md ${
                            isOwn ? 'items-end' : 'items-start'
                          }`}
                        >
                          {showAvatar && !isOwn && (
                            <p className="text-xs text-gray-500 mb-1 px-3">
                              {message.senderUsername || 'Unknown User'}
                            </p>
                          )}
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm">{message.message || 'No content'}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? 'text-blue-100' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.timestamp || message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}

            {/* Typing indicator */}
            {typing.length > 0 && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8"></div>
                <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg rounded-bl-none">
                  <p className="text-sm">
                    {typing.length === 1
                      ? `${typing[0]} is typing...`
                      : `${typing.join(', ')} are typing...`}
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        {/* Members Sidebar */}
        {showMembers && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Members</h3>
                <button
                  onClick={() => setShowMembers(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {members.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">👥</div>
                  <p className="text-gray-500">No members found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div
                      key={member.userId || member._id || index}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={member.pic || member.profilePic || '/default-avatar.png'}
                        alt={member.username || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {member.username || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.email || 'No email'}
                        </p>
                      </div>
                      {(member.userId || member._id) === currentUser._id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ChatRoom.propTypes = {
  room: PropTypes.shape({
    _id: PropTypes.string,
    postId: PropTypes.string,
    title: PropTypes.string,
    name: PropTypes.string,
    members: PropTypes.array,
  }).isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    profilePic: PropTypes.string,
  }).isRequired,
  onBack: PropTypes.func.isRequired,
};

export default ChatRoom;
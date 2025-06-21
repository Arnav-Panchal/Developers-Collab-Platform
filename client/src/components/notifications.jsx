import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Avatar } from 'flowbite-react';
import { Check, X, Clock, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import  {resolveProxyUrl} from '../utils/resolveProxyUrl';

export default function NotificationComponent() {
  const { currentUser } = useSelector((state) => state.user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser.id]);

  
  const apiUrl = resolveProxyUrl(`/api/notifications/${currentUser.id}`);
  const apiUrl2 = resolveProxyUrl(`/api/notifications/accept/${notification._id}`);
  const apiUrl3 = resolveProxyUrl(`/api/notifications/reject/${notification._id}`);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(apiUrl);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (notification) => {
    try {
      // Accept the join request
      await axios.put(apiUrl2, {
        postId: notification.postId,
        userId: notification.senderId
      });

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notification._id 
            ? { ...notif, status: 'accepted' }
            : notif
        )
      );

      toast.success(`${notification.senderUsername} has been added to the project!`);
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (notification) => {
    try {
      await axios.put(apiUrl3);

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notification._id 
            ? { ...notif, status: 'rejected' }
            : notif
        )
      );

      toast.success('Request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700';
      case 'rejected':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700';
      default:
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No notifications yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Join requests and updates will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-lg border ${getStatusColor(notification.status)} transition-all duration-200`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar
                    img={notification.senderPic}
                    alt={notification.senderUsername}
                    size="sm"
                    rounded
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {notification.senderUsername}
                      </span>
                      {getStatusIcon(notification.status)}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {notification.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleAcceptRequest(notification)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      <Check className="h-3 w-3" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(notification)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </button>
                  </div>
                )}

                {notification.status === 'accepted' && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                    Accepted
                  </span>
                )}

                {notification.status === 'rejected' && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-sm font-medium">
                    Rejected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
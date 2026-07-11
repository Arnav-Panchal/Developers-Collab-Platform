"use client";

import { useState, useEffect } from "react";
import { timeAgo } from "@/lib/utils";
import { CheckCheck, MessageSquare, PlusCircle, Check, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Notification = {
  id: string;
  type: "join_request" | "request_accepted" | "request_rejected" | "new_message" | "project_update";
  message: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    profilePicture: string;
  };
  project: {
    id: string;
    title: string;
    slug: string;
  } | null;
};

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async (): Promise<void> => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) {
        throw new Error("Failed to load notifications");
      }
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!ignore) {
        await fetchNotifications();
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 flex items-start gap-4">
            <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-4/5" />
              <div className="skeleton h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl p-6 text-center text-red-400 border border-red-500/20">
        {error}
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "join_request":
        return <PlusCircle className="h-5 w-5 text-indigo-400" />;
      case "request_accepted":
        return <Check className="h-5 w-5 text-green-400" />;
      case "request_rejected":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case "new_message":
        return <MessageSquare className="h-5 w-5 text-cyan-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* List Header */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            You have <span className="text-white font-semibold">{unreadCount}</span> unread notifications
          </p>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
            >
              {markingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark all as read
            </button>
          )}
        </div>
      )}

      {/* Notifications Items */}
      {notifications.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                className={`glass rounded-xl p-4 flex items-start gap-4 transition-all duration-300 ${
                  !n.isRead
                    ? "border-l-4 border-l-indigo-500 cursor-pointer bg-indigo-500/[0.02]"
                    : "opacity-60"
                }`}
              >
                {/* Sender Avatar & Type Icon overlay */}
                <div className="relative flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={n.sender.profilePicture}
                    alt={n.sender.username}
                    className="w-10 h-10 rounded-full border border-white/10 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-slate-950 p-0.5 rounded-full border border-white/10">
                    {getIcon(n.type)}
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <p className="text-sm text-gray-200 font-medium leading-snug">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{timeAgo(n.createdAt)}</span>
                    {n.project && (
                      <>
                        <span>&bull;</span>
                        <a
                          href={`/projects/${n.project.slug}`}
                          className="text-indigo-400 hover:underline font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Project
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {!n.isRead && (
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0 self-center mt-1" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

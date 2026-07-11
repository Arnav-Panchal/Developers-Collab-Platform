"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, ArrowLeft, Users, MessageSquare } from "lucide-react";
import Link from "next/link";

type Sender = {
  id: string;
  username: string;
  profilePicture: string;
};

type Message = {
  id: string;
  content: string;
  messageType: string;
  createdAt: string;
  sender: Sender;
};

type ProjectChatProps = {
  projectSlug: string;
  projectTitle: string;
  currentUserId: string;
};

export default function ProjectChat({
  projectSlug,
  projectTitle,
  currentUserId,
}: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (silent = false): Promise<void> => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/messages`);
      if (!res.ok) {
        throw new Error("Failed to load project chat history");
      }
      const data = await res.json();

      // Determine if we need to auto-scroll (e.g., if there are new messages)
      const hasNewMessages = data.length > messages.length;

      setMessages(data);

      if (hasNewMessages || !silent) {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load chat.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!ignore) {
        await fetchMessages();
      }
    })();

    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSlug]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    const messageToSend = content;
    setContent("");

    try {
      const res = await fetch(`/api/projects/${projectSlug}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageToSend }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Loading chat workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col h-[78vh]">
      {/* Chat header */}
      <div className="glass rounded-t-2xl p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectSlug}`}
            className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-bold text-white text-base sm:text-lg truncate max-w-[200px] sm:max-w-sm">
              {projectTitle}
            </h1>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <Users className="h-3 w-3" />
              Team Chatroom
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto glass p-6 space-y-4 min-h-0 custom-scrollbar">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-center text-xs">
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
            <MessageSquare className="h-10 w-10 opacity-30" />
            <p className="text-xs">No messages yet. Send a greeting to start the collaboration!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.sender.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${
                  isSelf ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {!isSelf && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={msg.sender.profilePicture}
                    alt={msg.sender.username}
                    className="w-8 h-8 rounded-full border border-white/10 object-cover mt-1 shrink-0"
                  />
                )}
                <div>
                  {!isSelf && (
                    <span className="text-[10px] text-gray-500 pl-1 block mb-0.5">
                      @{msg.sender.username}
                    </span>
                  )}
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isSelf
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white/5 text-gray-200 border border-white/5 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span
                    className={`text-[9px] text-gray-500 mt-1 block px-1 ${
                      isSelf ? "text-right" : "text-left"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="glass rounded-b-2xl p-4 border-t border-white/5 flex gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-5 py-3 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}

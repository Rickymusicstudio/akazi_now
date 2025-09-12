 
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Messages.css";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function MessagesThread() {
  const q = useQuery();
  const otherUserId = q.get("with");

  const [me, setMe] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    let channel;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !otherUserId) return;
      setMe(user);

      const { data: rows } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),
           and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      setMessages(rows || []);

      if (rows?.length) {
        const unreadIds = rows
          .filter(r => r.read === false && r.receiver_id === user.id)
          .map(r => r.id);
        if (unreadIds.length) {
          await supabase.from("messages").update({ read: true }).in("id", unreadIds);
        }
      }

      channel = supabase
        .channel(`messages-${user.id}-${otherUserId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const m = payload.new;
            if (
              (m.sender_id === user.id && m.receiver_id === otherUserId) ||
              (m.sender_id === otherUserId && m.receiver_id === user.id)
            ) {
              setMessages(prev => [...prev, m]);
            }
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [otherUserId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || !me || !otherUserId) return;

    const { error } = await supabase.from("messages").insert([{
      sender_id: me.id,
      receiver_id: otherUserId,
      message: text
    }]);
    if (error) { console.error(error); return; }

    setInput("");

    await supabase.from("notifications").insert([{
      recipient_id: otherUserId,
      sender_id: me.id,
      message: text,
      status: "unread"
    }]);
  };

  return (
    <div className="msg-page">
      <div className="msg-container">
        <div className="msg-thread" ref={listRef}>
          {messages.map(m => (
            <div
              key={m.id}
              className={`msg-bubble ${m.sender_id === me?.id ? "me" : "them"}`}
              title={new Date(m.created_at || m.sent_at).toLocaleString()}
            >
              {m.message}
            </div>
          ))}
        </div>

        <div className="msg-inputbar">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message…"
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}

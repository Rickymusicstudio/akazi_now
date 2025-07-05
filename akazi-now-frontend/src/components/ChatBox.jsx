import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function ChatBox({ receiverId, jobId = null, carpoolId = null, context = "job" }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [senderId, setSenderId] = useState(null);

  // Load sender ID from Supabase Auth
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("❌ User not authenticated");
        return;
      }
      setSenderId(user.id);
    };
    getUserId();
  }, []);

  // Fetch messages when both IDs are ready
  useEffect(() => {
    if (senderId && receiverId) {
      fetchMessages();
    }
  }, [senderId, receiverId, jobId, carpoolId]);

  const fetchMessages = async () => {
    if (!senderId || !receiverId) {
      console.warn("⛔ senderId or receiverId is undefined", { senderId, receiverId });
      return;
    }

    try {
      let query = supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
        )
        .order("created_at", { ascending: true });

      if (context === "job") query = query.eq("job_id", jobId);
      if (context === "carpool") query = query.eq("carpool_id", carpoolId);

      const { data, error } = await query;

      if (error) {
        console.error("❌ Failed to fetch messages:", error.message);
      } else {
        setMessages(data);
      }
    } catch (err) {
      console.error("❌ Exception while fetching messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!senderId || !receiverId) {
      alert("❌ Cannot send message without sender and receiver");
      return;
    }

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        message: newMessage, // ✅ Use correct column
        job_id: context === "job" ? jobId : null,
        carpool_id: context === "carpool" ? carpoolId : null,
        topic: "chat",
        private: true,
      },
    ]);

    if (error) {
      alert("❌ Failed to send message: " + error.message);
    } else {
      setNewMessage("");
      fetchMessages();
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "1rem", marginTop: "2rem" }}>
      <h4>💬 Chat</h4>
      <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "1rem" }}>
        {messages.length === 0 ? (
          <p style={{ color: "#777" }}>No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ textAlign: msg.sender_id === senderId ? "right" : "left" }}>
              <div
                style={{
                  display: "inline-block",
                  background: msg.sender_id === senderId ? "#6a00ff" : "#f1f1f1",
                  color: msg.sender_id === senderId ? "white" : "#333",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  marginBottom: "6px",
                }}
              >
                {msg.message}
              </div>
              <div style={{ fontSize: "12px", color: "#999" }}>
                {new Date(msg.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <button
          onClick={sendMessage}
          style={{ background: "#6a00ff", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "6px" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatBox;

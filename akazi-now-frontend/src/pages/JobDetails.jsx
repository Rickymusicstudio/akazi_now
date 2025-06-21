import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import defaultAvatar from "../assets/avatar.png";

function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchJob();
    fetchMessages();
  }, []);

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(`*, user_id(full_name, image_url, phone, id)`)
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Failed to fetch job:", error.message);
    } else {
      setJob(data);
    }

    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("gig_id", id)
      .order("sent_at", { ascending: true });

    if (error) {
      console.error("❌ Failed to fetch messages:", error.message);
    } else {
      setMessages(data || []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Please login to send messages.");
      return;
    }

    const { error } = await supabase.from("messages").insert([
      {
        gig_id: job.id,
        sender_id: user.id,
        receiver_id: job.user_id?.id,
        topic: "job_chat",
        extension: "text",
        message: newMessage,
        private: true,
      },
    ]);

    if (error) {
      console.error("❌ Failed to send message:", error.message);
      alert("❌ Failed to send message");
    } else {
      setNewMessage("");
      fetchMessages();
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;
  if (!job) return <div style={{ padding: "2rem", color: "red" }}>Job not found</div>;

  return (
    <div style={{ padding: "2rem", fontFamily: "Segoe UI, sans-serif", maxWidth: "800px", margin: "auto" }}>
      <button onClick={() => navigate("/")} style={{ marginBottom: "1rem", background: "none", border: "none", color: "#6a00ff", cursor: "pointer" }}>
        ← Back to Home
      </button>

      <h2>{job.title}</h2>
      <p><strong>Description:</strong> {job.job_description}</p>
      <p><strong>Requirements:</strong> {job.requirement}</p>
      <p><strong>Address:</strong> {job.address}</p>
      {job.price && <p><strong>Price:</strong> {job.price} RWF</p>}
      <p><strong>Posted:</strong> {new Date(job.created_at).toLocaleString()}</p>

      <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <img
          src={job.user_id?.image_url || defaultAvatar}
          alt="Poster"
          style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }}
        />
        <div>
          <p><strong>Posted by:</strong> {job.user_id?.full_name || "Unknown"}</p>
          <p><strong>Contact:</strong> {job.user_id?.phone || "N/A"}</p>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>💬 Chat</h3>
        <div style={{ maxHeight: "300px", overflowY: "auto", background: "#f9f9f9", padding: "1rem", borderRadius: "10px", border: "1px solid #ddd" }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: "0.75rem" }}>
              <p style={{ margin: 0, fontWeight: "bold" }}>{msg.sender_id === job.user_id?.id ? "Poster" : "You"}</p>
              <p style={{ margin: 0 }}>{msg.message}</p>
              <p style={{ fontSize: "10px", color: "#888" }}>{new Date(msg.sent_at).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", marginTop: "1rem", gap: "0.5rem" }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            style={{ flex: 1, padding: "0.5rem", borderRadius: "8px", border: "1px solid #ccc" }}
          />
          <button onClick={sendMessage} style={{ background: "#6a00ff", color: "white", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer" }}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;

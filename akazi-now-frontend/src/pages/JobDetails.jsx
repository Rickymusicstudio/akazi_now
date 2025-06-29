import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell";
import "./Inbox.css";

function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJob();
    fetchMessages();
    getUser();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(`*, user_id(full_name, image_url, phone, id)`)
      .eq("id", id)
      .single();
    if (!error) setJob(data);
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("job_id", id)
      .order("sent_at", { ascending: true });
    if (!error) setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please login to send messages.");
      return;
    }

    const { error } = await supabase.from("messages").insert([{
      job_id: job.id,
      sender_id: user.id,
      receiver_id: job.user_id?.id,
      topic: "job_chat",
      extension: "text",
      message: newMessage,
      private: true,
    }]);

    if (!error) {
      setNewMessage("");
      fetchMessages();
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!job) return <div className="error">Job not found</div>;

  return (
    <div className="job-container">
      <div className="job-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/gigs")}>Gigs</button>
          <button onClick={() => navigate("/myapplications")}>My Applications</button>
          <button onClick={() => navigate("/notifications")}>Notifications</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
        </div>
        <h2 className="page-title">Job Details</h2>
        <NotificationBell />
      </div>

      <div className="job-right">
        <button className="back-btn" onClick={() => navigate("/")}>← Back to Home</button>
        <h2>{job.title}</h2>
        <p><strong>Description:</strong> {job.job_description}</p>
        <p><strong>Requirements:</strong> {job.requirement}</p>
        <p><strong>Address:</strong> {job.address}</p>
        {job.price && <p><strong>Price:</strong> {job.price} RWF</p>}
        <p><strong>Posted:</strong> {new Date(job.created_at).toLocaleString()}</p>

        <div className="poster-info">
          <img src={job.user_id?.image_url || defaultAvatar} alt="Poster" />
          <div>
            <p><strong>Posted by:</strong> {job.user_id?.full_name || "Unknown"}</p>
            <p><strong>Contact:</strong> {job.user_id?.phone || "N/A"}</p>
          </div>
        </div>

        <div className="chat-section">
          <h3>💬 Chat</h3>
          <div className="chat-box">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${msg.sender_id === userId ? "you" : "them"}`}
              >
                <p className="chat-text">{msg.message}</p>
                <span className="chat-time">{new Date(msg.sent_at).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;

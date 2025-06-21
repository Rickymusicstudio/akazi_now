import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx"; // ✅ Import bell
import "./Signup.css";

function ApplicationsInbox() {
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isPoster, setIsPoster] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data: appsData } = await supabase
      .from("applications")
      .select(`id, message, status, applied_at, worker_id, gig_id, jobs(title, user_id)`)
      .order("applied_at", { ascending: false });

    const myPostedApps = appsData.filter(app => app.jobs?.user_id === user.id);
    setIsPoster(myPostedApps.length > 0);

    if (myPostedApps.length > 0) {
      const enrichedApps = await Promise.all(
        myPostedApps.map(async (app) => {
          const { data: workerData } = await supabase
            .from("users")
            .select(`full_name, phone, image_url, cell, village, district:districts(name), sector:sectors(name)`)
            .eq("auth_user_id", app.worker_id)
            .single();
          return { ...app, worker: workerData || {} };
        })
      );
      setApplications(enrichedApps);
    } else {
      const { data: notes } = await supabase
        .from("notifications")
        .select("id, message, application_id, created_at")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });
      setNotifications(notes || []);
    }

    setLoading(false);
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", applicationId);

    if (updateError) return;

    const { data: appData } = await supabase
      .from("applications")
      .select("worker_id, gig_id")
      .eq("id", applicationId)
      .single();

    if (newStatus === "accepted") {
      await supabase
        .from("jobs")
        .update({ status: "closed" })
        .eq("id", appData.gig_id);
    }

    const { data: jobData } = await supabase
      .from("jobs")
      .select("title")
      .eq("id", appData.gig_id)
      .single();

    const jobTitle = jobData?.title || "a job";

    await supabase.from("notifications").insert([
      {
        recipient_id: appData.worker_id,
        application_id: applicationId,
        message:
          newStatus === "accepted"
            ? `🎉 Your application for ${jobTitle} has been accepted!`
            : `❌ Your application for ${jobTitle} has been rejected.`,
      },
    ]);

    fetchInbox();
  };

  return (
    <div className="signup-container">
      {/* LEFT PANEL */}
      <div
        className="signup-left"
        style={{
          background: "linear-gradient(135deg, #6a00ff, #ff007a)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "1.5rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          <button onClick={() => navigate("/")} style={navStyle}>Home</button>
          <button onClick={() => navigate("/post-job")} style={navStyle}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")} style={navStyle}>My Jobs</button>
          <button onClick={() => navigate("/profile")} style={navStyle}>Profile</button>
          <button onClick={() => navigate("/inbox")} style={navStyle}>Inbox</button>
          <button onClick={() => navigate("/carpool")} style={navStyle}>Car Pooling</button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}
            style={{ ...navStyle, color: "#ffcccc" }}
          >
            Logout
          </button>
        </div>

        <h2 style={{ marginTop: "4rem", color: "white" }}>Inbox</h2>
        <NotificationBell /> {/* ✅ Bell positioned right below the title like UserProfile */}
      </div>

      {/* RIGHT PANEL */}
      <div className="signup-right" style={containerRightStyle}>
        {loading ? (
          <p>Loading...</p>
        ) : isPoster ? (
          applications.length === 0 ? (
            <p>No one has applied yet.</p>
          ) : (
            applications.map((app) => {
              const user = app.worker || {};
              return (
                <div key={app.id} style={cardStyle}>
                  <img
                    src={user.image_url || defaultAvatar}
                    alt="Profile"
                    style={avatarStyle}
                  />
                  <div style={{ flex: 1 }}>
                    <h3>{user.full_name}</h3>
                    <p><strong>Phone:</strong> {user.phone}</p>
                    <p><strong>District:</strong> {user.district?.name}</p>
                    <p><strong>Sector:</strong> {user.sector?.name}</p>
                    <p><strong>Cell:</strong> {user.cell}</p>
                    <p><strong>Village:</strong> {user.village}</p>
                    <p><strong>Message:</strong> {app.message}</p>
                    <p><strong>Status:</strong> {app.status}</p>
                    <p style={{ fontSize: "12px", color: "#999" }}>
                      Submitted: {new Date(app.applied_at).toLocaleString()}
                    </p>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                      <button onClick={() => handleUpdateStatus(app.id, "accepted")} style={buttonStyle}>Accept</button>
                      <button onClick={() => handleUpdateStatus(app.id, "rejected")} style={buttonStyle}>Reject</button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          notifications.length > 0 ? (
            notifications.map((note) => {
              const color = note.message.includes("accepted") ? "green" : note.message.includes("rejected") ? "red" : "#333";
              return (
                <div key={note.id} style={{ ...cardStyle, borderLeft: `6px solid ${color}`, flexDirection: "column", alignItems: "flex-start" }}>
                  <p style={{ fontWeight: "bold", color }}>{note.message}</p>
                  <p style={{ fontSize: "12px", color: "#888" }}>
                    Received: {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              );
            })
          ) : (
            <p>You have no notifications yet.</p>
          )
        )}
      </div>
    </div>
  );
}

const navStyle = {
  background: "none",
  border: "none",
  color: "white",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
};

const buttonStyle = {
  background: "linear-gradient(to right, #6a00ff, #ff007a)",
  color: "white",
  border: "none",
  borderRadius: "999px",
  padding: "0.5rem 1.5rem",
  fontWeight: "bold",
  cursor: "pointer",
};

const avatarStyle = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  objectFit: "cover",
  marginRight: "1.5rem",
};

const cardStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  background: "#fff",
  padding: "1.5rem",
  borderRadius: "16px",
  boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
  marginBottom: "1.5rem",
  width: "100%",
  maxWidth: "700px",
  marginInline: "auto",
};

const containerRightStyle = {
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  alignItems: "center",
};

export default ApplicationsInbox;

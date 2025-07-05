import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import "./Inbox.css";

function ApplicationsInbox() {
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isPoster, setIsPoster] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInbox();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();

    setUserProfile(data);
  };

  const fetchInbox = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

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
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    await supabase.from("applications").update({ status: newStatus }).eq("id", applicationId);

    const { data: appData } = await supabase
      .from("applications")
      .select("worker_id, gig_id")
      .eq("id", applicationId)
      .single();

    if (newStatus === "accepted") {
      await supabase.from("jobs").update({ status: "closed" }).eq("id", appData.gig_id);
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
    <div className="inbox-container">
      {/* ✅ MOBILE TOP NAV WITH PROFILE PIC */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            className="mobile-profile-pic"
          />
          <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        </div>
        <h2 className="mobile-title">Inbox</h2>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/") }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/post-job") }}>Post a Job</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/my-jobs") }}>My Jobs</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/profile") }}>Profile</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/inbox") }}>Inbox</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpools") }}>Car Pooling</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* ✅ DESKTOP LEFT NAV */}
      <div className="inbox-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpools")}>Car Pooling</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>
            Logout
          </button>
        </div>
        <h2>Inbox</h2>
        <NotificationBell />
      </div>

      <div className="inbox-right">
        {isPoster ? (
          applications.length === 0 ? (
            <p>No one has applied yet.</p>
          ) : (
            applications.map((app) => {
              const user = app.worker || {};
              return (
                <div key={app.id} className="inbox-card">
                  <img src={user.image_url || defaultAvatar} alt="Profile" className="inbox-avatar" />
                  <div className="inbox-card-details">
                    <h3>{user.full_name}</h3>
                    <p><strong>Phone:</strong> {user.phone}</p>
                    <p><strong>District:</strong> {user.district?.name}</p>
                    <p><strong>Sector:</strong> {user.sector?.name}</p>
                    <p><strong>Cell:</strong> {user.cell}</p>
                    <p><strong>Village:</strong> {user.village}</p>
                    <p><strong>Message:</strong> {app.message}</p>
                    <p><strong>Status:</strong> {app.status}</p>
                    <p className="timestamp">Submitted: {new Date(app.applied_at).toLocaleString()}</p>
                    <div className="inbox-actions">
                      <button onClick={() => handleUpdateStatus(app.id, "accepted")}>Accept</button>
                      <button onClick={() => handleUpdateStatus(app.id, "rejected")}>Reject</button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : notifications.length > 0 ? (
          notifications.map((note) => {
            const color = note.message.includes("accepted") ? "green" : note.message.includes("rejected") ? "red" : "#333";
            return (
              <div key={note.id} className="inbox-card" style={{ borderLeft: `6px solid ${color}`, flexDirection: "column" }}>
                <p style={{ fontWeight: "bold", color }}>{note.message}</p>
                <p className="timestamp">Received: {new Date(note.created_at).toLocaleString()}</p>
              </div>
            );
          })
        ) : (
          <p>You have no notifications yet.</p>
        )}
      </div>
    </div>
  );
}

export default ApplicationsInbox;

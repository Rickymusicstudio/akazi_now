import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa"; // ✅ Use icon for white bars
import "./MyJobs.css";

function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Failed to fetch jobs:", error.message);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this job?");
    if (!confirmed) return;

    const { error: appDeleteError } = await supabase
      .from("applications")
      .delete()
      .eq("gig_id", id);

    if (appDeleteError) {
      alert("❌ Failed to delete related applications: " + appDeleteError.message);
      return;
    }

    const { error: jobDeleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id);

    if (jobDeleteError) {
      alert("❌ Failed to delete job: " + jobDeleteError.message);
    } else {
      alert("✅ Job deleted");
      fetchMyJobs();
    }
  };

  return (
    <div className="myjobs-container">
      {/* MOBILE NAV HEADER */}
      <div className="mobile-top-bar">
        <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="mobile-title">My Jobs</h2>
        <NotificationBell />
      </div>

      {/* MOBILE FULLSCREEN NAV */}
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

      {/* DESKTOP LEFT NAV */}
      <div className="myjobs-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpools")}>Car Pooling</button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}
            style={{ color: "#ffcccc" }}
          >
            Logout
          </button>
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: "bold", marginTop: "3rem" }}>My Jobs</h2>
        <NotificationBell />
      </div>

      {/* RIGHT CONTENT */}
      <div className="myjobs-right">
        {loading ? null : jobs.length === 0 ? (
          <p className="empty-message">You haven't posted any jobs yet.</p>
        ) : (
          <div className="job-list">
            {jobs.map((job) => (
              <div key={job.id} className="job-card">
                <h3 style={{ fontWeight: "bold", fontSize: "22px" }}>{job.title}</h3>
                <p><strong>Posted by:</strong> {job.employer_name}</p>
                <p><strong>Address:</strong> {job.address}</p>
                <p><strong>Description:</strong> {job.job_description}</p>
                <p><strong>Requirement:</strong> {job.requirement || "-"}</p>
                {job.price && <p><strong>Price:</strong> {job.price} Frw</p>}
                <p><strong>Contact:</strong> {job.contact_info}</p>
                <p className={job.status === "closed" ? "job-status closed" : "job-status open"}>
                  <strong>Status:</strong> {job.status === "closed" ? "❌ Closed" : "✅ Open"}
                </p>
                <button className="delete-btn" onClick={() => handleDelete(job.id)}>Delete Job</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyJobs;

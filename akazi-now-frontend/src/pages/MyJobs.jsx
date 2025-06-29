import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import "./MyJobs.css";

function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
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
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to fetch jobs:", error.message);
    } else {
      setJobs(data);
    }
  };

  const handleDelete = async (jobId) => {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) {
      alert("❌ Failed to delete job");
    } else {
      fetchJobs();
    }
  };

  const handleHamburgerClick = () => {
    if (!mobileNavOpen) {
      setSlideDirection("slide-down");
      setMobileNavOpen(true);
    } else {
      setSlideDirection("slide-up");
      setTimeout(() => setMobileNavOpen(false), 300);
    }
  };

  return (
    <div className="myjobs-container">
      {/* ✅ Mobile Header */}
      <div className="mobile-top-bar" style={{ background: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)" }}>
        <FaBars className="mobile-hamburger" onClick={handleHamburgerClick} />
        <h2 className="mobile-title">My Jobs</h2>
        <NotificationBell />
      </div>

      {/* ✅ Mobile Nav Overlay */}
      {mobileNavOpen && (
        <div
          ref={mobileNavRef}
          className={`mobile-nav-overlay ${slideDirection}`}
          style={{ background: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)" }}
        >
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

      {/* ✅ Desktop Left Panel */}
      <div className="gigs-left" style={{ background: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)" }}>
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

      {/* ✅ Job Cards Area */}
      <div className="gigs-right">
        {jobs.length === 0 ? (
          <p style={{ textAlign: "center", color: "#555" }}>No jobs posted yet.</p>
        ) : (
          <div className="job-list">
            {jobs.map((job) => (
              <div className="job-card" key={job.id}>
                <h3 style={{ marginBottom: "0.5rem" }}>{job.title}</h3>
                <p><strong>Posted by:</strong> {job.employer_name}</p>
                <p><strong>Address:</strong> {job.address}</p>
                <p><strong>Description:</strong> {job.job_description}</p>
                <p><strong>Requirement:</strong> {job.requirement}</p>
                <p><strong>Price:</strong> {job.price} Frw</p>
                <p><strong>Contact:</strong> {job.contact_info}</p>
                <p style={{ fontWeight: "bold", color: job.status === "open" ? "green" : "red" }}>
                  Status: {job.status === "open" ? "✅ Open" : "❌ Closed"}
                </p>
                <button onClick={() => handleDelete(job.id)} className="delete-button">
                  Delete Job
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyJobs;

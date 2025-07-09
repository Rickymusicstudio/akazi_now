import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import "./MyJobs.css";

function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const lastScrollY = useRef(0);

  useEffect(() => {
    fetchMyJobs();
    fetchUserProfile();

    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < lastScrollY.current - 10 && mobileNavVisible) {
        setSlideDirection("slide-up");
        setTimeout(() => {
          setMobileNavVisible(false);
        }, 300);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileNavVisible]);

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

  const fetchMyJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("❌ Failed to fetch jobs:", error.message);
    else setJobs(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this job?");
    if (!confirmed) return;

    const { error: appDeleteError } = await supabase
      .from("applications")
      .delete()
      .eq("gig_id", id);

    if (appDeleteError) return alert("❌ Failed to delete related applications: " + appDeleteError.message);

    const { error: jobDeleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id);

    if (jobDeleteError) alert("❌ Failed to delete job: " + jobDeleteError.message);
    else {
      alert("✅ Job deleted");
      fetchMyJobs();
    }
  };

  const handleToggleNav = () => {
    if (mobileNavVisible) {
      setSlideDirection("slide-up");
      setTimeout(() => setMobileNavVisible(false), 300);
    } else {
      setSlideDirection("slide-down");
      setMobileNavVisible(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="myjobs-container">
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            className="mobile-profile-pic"
          />
          <FaBars className="mobile-hamburger" onClick={handleToggleNav} />
        </div>
        <h2 className="mobile-title">My Jobs</h2>
        <NotificationBell />
      </div>

      {mobileNavVisible && (
        <div className={`mobile-nav-overlay ${slideDirection}`}>
          <ul>
            <li onClick={() => { handleToggleNav(); navigate("/") }}>Home</li>
            <li onClick={() => { handleToggleNav(); navigate("/post-job") }}>Post a Job</li>
            <li onClick={() => { handleToggleNav(); navigate("/my-jobs") }}>My Jobs</li>
            <li onClick={() => { handleToggleNav(); navigate("/profile") }}>Profile</li>
            <li onClick={() => { handleToggleNav(); navigate("/inbox") }}>Inbox</li>
            <li onClick={() => { handleToggleNav(); navigate("/carpools") }}>Car Pooling</li>
            <li onClick={async () => {
              await supabase.auth.signOut();
              handleToggleNav();
              navigate("/login");
            }}>Logout</li>
          </ul>
        </div>
      )}

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

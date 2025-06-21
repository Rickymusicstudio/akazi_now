import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaPhone } from "react-icons/fa";
import NotificationBell from "../components/NotificationBell.jsx"; // ✅ Add bell

function MyJobs() {
  const [jobs, setJobs] = useState([]);
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
    <div className="signup-container">
      {/* LEFT PANEL */}
      <div
        className="signup-left"
        style={{
          background: "linear-gradient(135deg, #6a00ff, #ff007a)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
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
            color: "white",
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

        <h2 style={{ color: "white", fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>
          My Jobs
        </h2>
        <NotificationBell /> {/* ✅ Bell added */}
      </div>

      {/* RIGHT PANEL */}
      <div className="signup-right" style={{ padding: "2rem" }}>
        {jobs.length === 0 ? (
          <p style={{ color: "#444" }}>You haven't posted any jobs yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: "#fff",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 6px 12px rgba(0,0,0,0.06)",
                }}
              >
                <h3 style={{ margin: 0, color: "#333", fontWeight: "bold" }}>{job.title}</h3>
                <p style={{ margin: "2px 0", color: "#555", fontStyle: "italic" }}>{job.employer_name}</p>
                <p style={{ margin: "4px 0", color: "#444" }}>{job.job_description}</p>
                <p style={{ margin: "4px 0", color: "#888" }}>
                  <strong>Requirement:</strong> {job.requirement || "-"}
                </p>
                <p style={{ display: "flex", alignItems: "center", color: "#6a00ff" }}>
                  <FaPhone style={{ marginRight: "0.5rem" }} />
                  {job.contact_info}
                </p>
                <p style={{ marginTop: "0.5rem", fontWeight: "bold", color: job.status === "closed" ? "red" : "green" }}>
                  Status: {job.status === "closed" ? "❌ Closed" : "✅ Open"}
                </p>
                <button
                  onClick={() => handleDelete(job.id)}
                  style={deleteButtonStyle}
                >
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

const navStyle = {
  background: "none",
  border: "none",
  color: "white",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
};

const deleteButtonStyle = {
  marginTop: "1rem",
  background: "linear-gradient(to right, #6a00ff, #ff007a)",
  color: "white",
  border: "none",
  borderRadius: "24px",
  padding: "0.5rem 1.5rem",
  fontWeight: "bold",
  cursor: "pointer",
};

export default MyJobs;

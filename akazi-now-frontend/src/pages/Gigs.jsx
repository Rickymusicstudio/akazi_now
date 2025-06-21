import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FaPhone } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";

function Gigs() {
  const [jobs, setJobs] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase.from("jobs").select("*");
    if (error) {
      console.error("❌ Failed to fetch jobs:", error.message);
    } else {
      setJobs(data || []);
    }
  };

  const handleImageClick = (url) => {
    setSelectedImage(url);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  const handleApply = async (jobId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("❗Please login to apply.");
      navigate("/login");
      return;
    }

    if (!applicationMessage.trim()) {
      alert("✍️ Please enter a message before submitting.");
      return;
    }

    const { error } = await supabase.from("applications").insert([
      {
        gig_id: jobId,
        worker_id: user.id,
        message: applicationMessage,
        status: "pending",
      },
    ]);

    if (error) {
      if (error.message.includes("unique_applicant_per_gig")) {
        alert("⚠️ You have already applied for this job. Check your Inbox for updates.");
      } else {
        alert("❌ Failed to apply: " + error.message);
      }
    } else {
      alert("✅ Application submitted!");
      setApplyingJobId(null);
      setApplicationMessage("");
    }
  };

  const copyJobLink = (jobId) => {
    const jobUrl = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(jobUrl).then(() => {
      alert("🔗 Link copied!");
    });
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", fontFamily: "Segoe UI, sans-serif" }}>
      {/* LEFT PANEL */}
      <div style={{ width: "50%", background: "linear-gradient(135deg, #6a00ff, #ff007a)", color: "white", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: "1rem", left: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", fontWeight: "bold", fontSize: "14px" }}>
          <button onClick={() => navigate("/")} style={navButtonStyle}>Home</button>
          <button onClick={() => navigate("/post-job")} style={navButtonStyle}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")} style={navButtonStyle}>My Jobs</button>
          <button onClick={() => navigate("/profile")} style={navButtonStyle}>Profile</button>
          <button onClick={() => navigate("/inbox")} style={navButtonStyle}>Inbox</button>
          <button onClick={() => navigate("/carpools")} style={navButtonStyle}>Car Pooling</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ ...navButtonStyle, color: "#ffcccc" }}>Logout</button>
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: "bold", marginTop: "3rem" }}>Available Jobs</h2>
        <NotificationBell />
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width: "50%", height: "100vh", overflowY: "auto", padding: "1rem 2rem 2rem", backgroundColor: "#fff", boxSizing: "border-box" }}>
        {jobs.length === 0 ? (
          <p style={{ textAlign: "center", color: "#555" }}>No jobs available right now.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {jobs.map((job) => (
              <div key={job.id} style={{ background: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 6px 12px rgba(0,0,0,0.06)", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-start" }}>
                <img src={job.poster_image || defaultAvatar} alt="Poster" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }} />

                <div style={{ flex: 1, minWidth: "220px" }}>
                  <h3 style={{ margin: 0, fontWeight: "bold", color: "#222" }}>{job.title}</h3>
                  <p style={{ color: "#666", fontStyle: "italic" }}>Posted by: {job.employer_name || "Unknown"}</p>
                  <p style={{ color: "#555" }}>{job.address}</p>
                  <p>{job.job_description}</p>
                  <p style={{ color: "#888" }}><strong>Requirement:</strong> {job.requirement}</p>
                  <p style={{ fontWeight: "bold", color: "#6a00ff" }}>
                    Price: {job.price && Number(job.price) > 0 ? `${Number(job.price).toLocaleString()} Frw` : "Not specified"}
                  </p>
                  <p style={{ display: "flex", alignItems: "center", color: "#6a00ff" }}>
                    <FaPhone style={{ marginRight: "0.5rem" }} /> {job.contact_info}
                  </p>
                  <p style={{ fontWeight: "bold", color: job.status === "open" ? "green" : "red" }}>
                    {job.status === "open" ? "✅ Job is open" : "❌ Job is closed"}
                  </p>

                  <button
                    onClick={() => copyJobLink(job.id)}
                    style={{ marginTop: "0.5rem", fontSize: "20px", background: "none", border: "none", cursor: "pointer" }}
                    title="Copy Share Link"
                  >
                    🔄
                  </button>

                  {job.status === "open" && (applyingJobId === job.id ? (
                    <div style={{ marginTop: "1rem" }}>
                      <textarea
                        placeholder="Why are you a good fit?"
                        rows={3}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "0.5rem" }}
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                      />
                      <button style={btnStyle} onClick={() => handleApply(job.id)}>
                        Submit Application
                      </button>
                    </div>
                  ) : (
                    <button style={btnStyle} onClick={() => setApplyingJobId(job.id)}>
                      Apply
                    </button>
                  ))}
                </div>

                {job.image_url && (
                  <img
                    src={job.image_url}
                    alt="Job"
                    onClick={() => handleImageClick(job.image_url)}
                    style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL VIEWER */}
      {showModal && selectedImage && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <img
            src={selectedImage}
            alt="Full View"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: "12px",
              boxShadow: "0 0 20px rgba(255,255,255,0.3)",
            }}
          />
        </div>
      )}
    </div>
  );
}

const navButtonStyle = {
  background: "none",
  border: "none",
  color: "white",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
};

const btnStyle = {
  background: "linear-gradient(to right, #6a00ff, #ff007a)",
  color: "white",
  padding: "10px 20px",
  border: "none",
  borderRadius: "999px",
  cursor: "pointer",
  marginTop: "0.5rem",
};

export default Gigs;

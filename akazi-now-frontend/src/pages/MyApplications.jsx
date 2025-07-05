// CONTINUING: Add 'My Applications' page for job seekers to track their submitted applications

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("applications")
      .select(`*, jobs(*)`)
      .eq("applicant_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching applications:", error.message);
    } else {
      setApplications(data || []);
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
          color: "white",
          fontWeight: "bold",
        }}
      >
        <div style={{ position: "absolute", top: "1rem", left: "1.5rem", display: "flex", gap: "1rem" }}>
          <button onClick={() => navigate("/")} style={navStyle}>Home</button>
          <button onClick={() => navigate("/post-job")} style={navStyle}>Post a Job</button>
          <button onClick={() => navigate("/profile")} style={navStyle}>Profile</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ ...navStyle, color: "#ffcccc" }}>Logout</button>
        </div>
        <h2 style={{ marginTop: "4rem" }}>My Applications</h2>
      </div>

      {/* RIGHT PANEL */}
      <div className="signup-right" style={{ padding: "2rem" }}>
        {applications.length === 0 ? (
          <p>No applications submitted yet.</p>
        ) : (
          applications.map((app, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                padding: "1.5rem",
                borderRadius: "12px",
                marginBottom: "1.5rem",
                boxShadow: "0 6px 12px rgba(0,0,0,0.06)",
              }}
            >
              <h3>{app.jobs?.employer_name || "Unknown Employer"}</h3>
              <p><strong>Status:</strong> {app.status}</p>
              <p><strong>Job:</strong> {app.jobs?.job_description}</p>
              <p><strong>Your Message:</strong> {app.message || "-"}</p>
              <p style={{ fontSize: "12px", color: "#999" }}>Submitted: {new Date(app.created_at).toLocaleString()}</p>
            </div>
          ))
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
  cursor: "pointer",
};

export default MyApplications;
 

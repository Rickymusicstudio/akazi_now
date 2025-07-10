import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FaSearch } from "react-icons/fa";
import NotificationBell from "../components/NotificationBell.jsx";
import "./Gigs.css";
import kccBackground from "../assets/kcc_bg_clean.png";

function Gigs() {
  const [jobs, setJobs] = useState([]);
  const [jobsFetched, setJobsFetched] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchJobs = async () => {
    const { data, error } = await supabase.from("jobs").select("*");
    setJobsFetched(true);
    if (!error) setJobs(data || []);
  };

  const handleApply = async (jobId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("Please log in to apply.");

    if (!applicationMessage.trim()) {
      alert("Please write a message.");
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
      alert("Error: " + error.message);
    } else {
      alert("✅ Application submitted!");
      setApplicationMessage("");
      setApplyingJobId(null);
    }
  };

  const copyJobLink = (jobId) => {
    const jobUrl = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(jobUrl);
    alert("🔗 Link copied!");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  return (
    <div
      className="gigs-index-container"
      style={{ backgroundImage: `url(${kccBackground})` }}
    >
      <div className="gigs-overlay">
        <div className="gigs-white-box">
          <div className="gigs-header">
            <h2>🛠️ Browse Available Gigs</h2>
            <NotificationBell />
          </div>

          {!jobsFetched && (
            <div className="gigs-welcome">
              <p>
                🚀 AkaziNow makes it easy to find freelance gigs quickly.
                Whether you're a task poster or job seeker, we connect you fast.
              </p>
              <button className="gigs-btn" onClick={fetchJobs}>
                <FaSearch style={{ marginRight: "0.5rem" }} />
                Show Gigs
              </button>
            </div>
          )}

          {jobsFetched && jobs.length === 0 && (
            <p className="gigs-empty">No gigs available at the moment.</p>
          )}

          {jobs.length > 0 && (
            <div className="gigs-list">
              {jobs.map((job) => (
                <div key={job.id} className="gigs-card">
                  <h3>{job.title}</h3>
                  <p>
                    <strong>By:</strong> {job.employer_name}
                  </p>
                  <p>
                    <strong>Address:</strong> {job.address}
                  </p>
                  <p>
                    <strong>Desc:</strong> {job.job_description}
                  </p>
                  <p>
                    <strong>Price:</strong>{" "}
                    {job.price
                      ? `${Number(job.price).toLocaleString()} Frw`
                      : "Not specified"}
                  </p>

                  <div className="gigs-actions">
                    <button onClick={() => copyJobLink(job.id)}>🔗 Copy Link</button>
                    {applyingJobId === job.id ? (
                      <>
                        <textarea
                          rows={2}
                          value={applicationMessage}
                          onChange={(e) => setApplicationMessage(e.target.value)}
                          placeholder="Write your message"
                        />
                        <button onClick={() => handleApply(job.id)}>
                          Submit
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setApplyingJobId(job.id)}>
                        Apply
                      </button>
                    )}
                  </div>

                  {job.image_url && (
                    <img
                      src={job.image_url}
                      alt="Preview"
                      className="gigs-preview-img"
                      onClick={() => {
                        setSelectedImage(job.image_url);
                        setShowModal(true);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && selectedImage && (
        <div className="gigs-modal" onClick={closeModal}>
          <img src={selectedImage} alt="Preview" />
        </div>
      )}
    </div>
  );
}

export default Gigs;

import "./index.css";
import "./Gigs.css";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import { FaBars, FaSearch, FaPhone } from "react-icons/fa";
import NotificationBell from "../components/NotificationBell";
import backgroundImage from "../assets/kcc_bg_clean.png";

function Gigs() {
  const [jobs, setJobs] = useState([]);
  const [jobsFetched, setJobsFetched] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase.from("jobs").select("*");
    setJobsFetched(true);
    if (!error) setJobs(data || []);
  };

  const fetchUserProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();
    setUserProfile(data);
  };

  const handleHamburgerClick = () => {
    if (!mobileNavVisible) {
      setSlideDirection("slide-down");
      setMobileNavVisible(true);
    } else {
      setSlideDirection("slide-up");
      setTimeout(() => setMobileNavVisible(false), 300);
    }
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

  const closeModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  return (
    <div className="public-container">
      {/* ✅ Top Mobile Nav from OG */}
      <div
        className="mobile-top-bar"
        style={{ background: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)" }}
      >
        <div className="mobile-left-group">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            className="mobile-profile-pic"
          />
          <FaBars className="mobile-hamburger" onClick={handleHamburgerClick} />
        </div>
        <h2 className="mobile-title">Available Gigs</h2>
        <NotificationBell />
      </div>

      {/* ✅ Slide-up/down mobile nav */}
      {mobileNavVisible && (
        <div
          ref={mobileNavRef}
          className={`mobile-nav-overlay ${slideDirection}`}
          style={{ background: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)" }}
        >
          <ul>
            <li onClick={() => navigate("/")}>Home</li>
            <li onClick={() => navigate("/post-job")}>Post a Job</li>
            <li onClick={() => navigate("/my-jobs")}>My Jobs</li>
            <li onClick={() => navigate("/profile")}>Profile</li>
            <li onClick={() => navigate("/inbox")}>Inbox</li>
            <li onClick={() => navigate("/carpools")}>Car Pooling</li>
            <li
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/login");
              }}
            >
              Logout
            </li>
          </ul>
        </div>
      )}

      {/* ✅ Background Hero */}
      <div
        className="public-hero"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="public-hero-content">
          <h1 className="public-heading">🛠️ Find Freelance Gigs Fast</h1>
          <p className="public-subheading">
            Browse job opportunities and apply instantly with AkaziNow.
          </p>
        </div>
      </div>

      {/* ✅ Gigs White Panel */}
      <section className="public-search-section">
        <h2 className="public-search-title">Available Gigs</h2>

        {!jobsFetched && (
          <div style={{ textAlign: "center" }}>
            <p>
              👋 Welcome! Click below to browse gigs near you and start earning fast.
            </p>
            <button className="search-button" onClick={fetchJobs}>
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
                <p><strong>By:</strong> {job.employer_name}</p>
                <p><strong>Address:</strong> {job.address}</p>
                <p><strong>Description:</strong> {job.job_description}</p>
                <p><strong>Requirement:</strong> {job.requirement || "-"}</p>
                <p><strong>Price:</strong> {job.price ? `${Number(job.price).toLocaleString()} Frw` : "Not specified"}</p>
                <p style={{ display: "flex", alignItems: "center", color: "#6a00ff" }}>
                  <FaPhone style={{ marginRight: "0.5rem" }} /> {job.contact_info}
                </p>
                <p><strong>Status:</strong> <span style={{ color: job.status === "open" ? "green" : "red" }}>{job.status}</span></p>

                <div className="gigs-actions">
                  <button onClick={() => copyJobLink(job.id)}>🔗 Copy Link</button>
                  {job.status === "open" && (applyingJobId === job.id ? (
                    <>
                      <textarea
                        rows={2}
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                        placeholder="Write your message"
                      />
                      <button onClick={() => handleApply(job.id)}>Submit</button>
                    </>
                  ) : (
                    <button onClick={() => setApplyingJobId(job.id)}>Apply</button>
                  ))}
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
      </section>

      {/* ✅ Modal */}
      {showModal && selectedImage && (
        <div className="gigs-modal" onClick={closeModal}>
          <img src={selectedImage} alt="Preview" />
        </div>
      )}

      {/* ✅ Footer */}
      <footer className="public-footer">
        <p>&copy; {new Date().getFullYear()} AkaziNow. All rights reserved.</p>
        <div className="footer-links">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/help")}>Help</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
        </div>
      </footer>
    </div>
  );
}

export default Gigs;

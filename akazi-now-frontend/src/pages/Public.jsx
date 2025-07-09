import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Public.css";

function Public() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (!error) {
      setJobs(data || []);
    }
  };

  const handleApply = () => {
    alert("Please sign in or sign up to apply for this job.");
    navigate("/login");
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="public-container">
      {/* Hero Section */}
      <section className="public-hero">
        <h1>👋 Welcome to AkaziNow</h1>
        <p>Your Smart Way to Find Quick Gigs Across Rwanda</p>
        <div className="public-hero-buttons">
          <button onClick={() => navigate("/login")}>Sign In</button>
          <button onClick={() => navigate("/signup")}>Sign Up</button>
        </div>
      </section>

      {/* Search Filter */}
      <div className="public-search">
        <input
          type="text"
          placeholder="Search by title or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Job Cards */}
      <div className="public-jobs">
        {filteredJobs.length === 0 ? (
          <p className="loading">No gigs found.</p>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="public-job-card">
              {job.image_url && <img src={job.image_url} alt="gig" />}
              <h2>{job.title}</h2>
              <p><strong>Location:</strong> {job.address}</p>
              <p><strong>Description:</strong> {job.job_description.slice(0, 100)}...</p>
              <p><strong>Price:</strong> {job.price} Frw</p>
              <button onClick={handleApply}>Apply</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Public;
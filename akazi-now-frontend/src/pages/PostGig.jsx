import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import "./PostGig.css";

function PostGig() {
  const [form, setForm] = useState({
    title: "",
    job_description: "",
    requirement: "",
    address: "",
    price: "",
    poster_image: null,
  });
  const [userProfile, setUserProfile] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
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

  const toggleMobileNav = () => {
    setMobileNavOpen((prev) => !prev);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    setForm((prev) => ({
      ...prev,
      poster_image: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      title, job_description, requirement, address, price, poster_image
    } = form;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to post a job.");
      return;
    }

    let imageUrl = null;
    if (poster_image) {
      const fileName = `${Date.now()}-${poster_image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("job_images")
        .upload(fileName, poster_image);

      if (!uploadError) {
        const { data } = supabase.storage.from("job_images").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("jobs").insert([
      {
        user_id: user.id,
        title,
        job_description,
        requirement,
        address,
        price,
        poster_image: imageUrl,
        contact_info: user.email,
        employer_name: userProfile?.full_name || "",
        status: "open",
      },
    ]);

    if (error) {
      alert("Failed to post job.");
    } else {
      alert("Job posted successfully!");
      navigate("/my-jobs");
    }
  };

  return (
    <div className="postgig-container">
      {/* ✅ Mobile Top Bar */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            className="mobile-profile-pic"
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: "pointer" }}
          />
          <FaBars className="mobile-hamburger" onClick={toggleMobileNav} />
        </div>
        <div className="mobile-title">Post a Job</div>
        <NotificationBell />
      </div>

      {/* ✅ Mobile Full Nav */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={toggleMobileNav}>
          <ul onClick={(e) => e.stopPropagation()}>
            <li onClick={() => { toggleMobileNav(); navigate("/") }}>Home</li>
            <li onClick={() => { toggleMobileNav(); navigate("/post-job") }}>Post a Job</li>
            <li onClick={() => { toggleMobileNav(); navigate("/my-jobs") }}>My Jobs</li>
            <li onClick={() => { toggleMobileNav(); navigate("/profile") }}>Profile</li>
            <li onClick={() => { toggleMobileNav(); navigate("/inbox") }}>Inbox</li>
            <li onClick={() => { toggleMobileNav(); navigate("/carpool") }}>Car Pooling</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* ✅ Desktop Sidebar */}
      <div className="gigs-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpool")}>Car Pooling</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
        </div>

        {/* ✅ Avatar Card */}
        <div className="profile-card">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: "pointer" }}
          />
          <label className="btn">
            Change Picture
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
          </label>
        </div>
      </div>

      {/* ✅ Right Form */}
      <div className="gigs-right">
        <form className="signup-form" onSubmit={handleSubmit}>
          <label>Title</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} required />

          <label>Job Description</label>
          <textarea name="job_description" value={form.job_description} onChange={handleChange} required />

          <label>Requirement</label>
          <textarea name="requirement" value={form.requirement} onChange={handleChange} />

          <label>Address</label>
          <input type="text" name="address" value={form.address} onChange={handleChange} required />

          <label>Price (Frw)</label>
          <input type="number" name="price" value={form.price} onChange={handleChange} />

          <label>Upload Job Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />

          <button type="submit" className="btn">Post Job</button>
        </form>
      </div>
    </div>
  );
}

export default PostGig;

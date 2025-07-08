import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import "./PostGig.css";
import { FaBars } from "react-icons/fa";

function PostGig() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    price: "",
    image: null,
  });

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profilePic, setProfilePic] = useState(defaultAvatar);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadProfilePicture();
  }, []);

  const loadProfilePicture = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("users").select("image_url").eq("auth_user_id", user.id).single();
    if (data?.image_url) setProfilePic(data.image_url);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((prev) => ({ ...prev, image: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleMobileNav = () => setMobileNavOpen((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("❌ You must be logged in to post a job.");
      return;
    }

    let imageUrl = null;
    if (form.image) {
      const fileExt = form.image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("gig_images").upload(fileName, form.image);
      if (uploadError) {
        console.error("Image upload failed", uploadError);
        setMessage("❌ Failed to upload image");
        return;
      }
      const { data } = supabase.storage.from("gig_images").getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("jobs").insert([
      {
        user_id: user.id,
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        price: form.price,
        image_url: imageUrl,
      },
    ]);

    if (error) {
      console.error("Insert error", error);
      setMessage("❌ Failed to post job");
    } else {
      setMessage("✅ Job posted successfully");
      setForm({ title: "", description: "", requirements: "", price: "", image: null });
    }
  };

  return (
    <div className="postgig-container">
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img
            src={profilePic}
            alt="profile"
            className="mobile-profile-pic"
          />
          <FaBars className="mobile-hamburger" onClick={toggleMobileNav} />
        </div>
        <div className="mobile-title">Post a Job</div>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={toggleMobileNav}>
          <ul onClick={(e) => e.stopPropagation()}>
            <li onClick={() => { toggleMobileNav(); navigate("/"); }}>Home</li>
            <li onClick={() => { toggleMobileNav(); navigate("/post-job"); }}>Post a Job</li>
            <li onClick={() => { toggleMobileNav(); navigate("/my-jobs"); }}>My Jobs</li>
            <li onClick={() => { toggleMobileNav(); navigate("/profile"); }}>Profile</li>
            <li onClick={() => { toggleMobileNav(); navigate("/inbox"); }}>Inbox</li>
            <li onClick={() => { toggleMobileNav(); navigate("/carpool"); }}>Car Pooling</li>
            <li onClick={() => supabase.auth.signOut().then(() => navigate("/login"))}>Logout</li>
          </ul>
        </div>
      )}

      {/* Left Panel */}
      <div className="postgig-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")} style={{ color: "#ffcccc" }}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpool")}>Car Pooling</button>
          <button onClick={() => supabase.auth.signOut().then(() => navigate("/login"))}>Logout</button>
        </div>

        <div className="profile-card">
          <img
            src={profilePic}
            alt="avatar"
          />
          <h2>Post a Job</h2>
        </div>
      </div>

      {/* Right Panel */}
      <div className="postgig-right">
        <form className="signup-form" onSubmit={handleSubmit}>
          {message && <p className="message">{message}</p>}
          <label>Job Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <label>Job Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="5"
            className="application-textarea"
            required
          ></textarea>

          <label>Requirements</label>
          <textarea
            name="requirements"
            value={form.requirements}
            onChange={handleChange}
            rows="5"
            className="application-textarea"
            required
          ></textarea>

          <label>Price (Frw)</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
          />

          <label>Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />

          <button type="submit" className="btn">Post Job</button>
        </form>
      </div>
    </div>
  );
}

export default PostGig;

import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import "./PostGig.css";

function PostGig() {
  const [form, setForm] = useState({
    title: "",
    address: "",
    job_description: "",
    requirement: "",
    price: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage("❌ Not authenticated");
      return;
    }

    let imageUrl = null;
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("job-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        setMessage("❌ Failed to upload image: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("job-images")
        .getPublicUrl(filePath);

      imageUrl = data.publicUrl;
    }

    const { data: userProfile } = await supabase
      .from("users")
      .select("image_url, full_name, phone")
      .eq("auth_user_id", user.id)
      .single();

    const posterImage = userProfile?.image_url || null;
    const employerName = userProfile?.full_name || "Unknown";
    const contactInfo = userProfile?.phone || "N/A";

    const { error } = await supabase.from("jobs").insert([{
      user_id: user.id,
      ...form,
      status: "open",
      image_url: imageUrl,
      poster_image: posterImage,
      employer_name: employerName,
      contact_info: contactInfo,
    }]);

    if (error) {
      setMessage("❌ Failed to post job: " + error.message);
    } else {
      setMessage("✅ Job posted successfully!");
      setForm({
        title: "",
        address: "",
        job_description: "",
        requirement: "",
        price: "",
      });
      setImageFile(null);
    }
  };

  return (
    <div className="postgig-container">
      {/* ✅ MOBILE TOP BAR */}
      <div className="mobile-top-bar">
        <div className="mobile-hamburger" style={{ color: 'white' }} onClick={() => setMobileNavOpen(true)}>☰</div>
        <div className="mobile-title">Post a Job</div>
        <NotificationBell />
      </div>

      {/* ✅ MOBILE FULLSCREEN NAV */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
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

      {/* ✅ DESKTOP LEFT PANEL */}
      <div className="gigs-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpools")}>Car Pooling</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: "bold", marginTop: "3rem" }}>Post a Job</h2>
        <NotificationBell />
      </div>

      {/* ✅ FORM PANEL */}
      <div className="gigs-right">
        <form className="signup-form" onSubmit={handleSubmit}>
          {message && (
            <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>
          )}

          <label>Job Title</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} required />

          <label>Address</label>
          <input type="text" name="address" value={form.address} onChange={handleChange} required />

          <label>Job Description</label>
          <textarea name="job_description" value={form.job_description} onChange={handleChange} required />

          <label>Requirement</label>
          <textarea name="requirement" value={form.requirement} onChange={handleChange} placeholder="E.g. must have a driving license" />

          <label>Price (Frw)</label>
          <input type="number" name="price" value={form.price} onChange={handleChange} />

          <label>Upload Job Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />

          <button type="submit" className="btn">Submit Job</button>
        </form>
      </div>
    </div>
  );
}

export default PostGig;

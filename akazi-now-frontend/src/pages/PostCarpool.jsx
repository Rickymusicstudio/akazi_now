import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import defaultAvatar from "../assets/avatar.png";
import { FaBars } from "react-icons/fa";
import "./PostRide.css";

function PostCarpool() {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    available_seats: "",
    datetime: "",
    price: "",
    notes: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profilePic, setProfilePic] = useState(defaultAvatar);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfilePicture();
  }, []);

  const loadProfilePicture = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("users")
        .select("image_url")
        .eq("auth_user_id", user.id)
        .single();
      if (data?.image_url) {
        setProfilePic(data.image_url);
      }
    }
  };

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
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("car-images")
        .upload(fileName, imageFile, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        setMessage("❌ Image upload failed: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("car-images").getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("carpools").insert([{
      ...form,
      user_id: user.id,
      driver_name: user.user_metadata.full_name || "",
      car_image: imageUrl
    }]);

    if (error) {
      setMessage("❌ Failed to post ride: " + error.message);
    } else {
      setMessage("✅ Ride posted!");
      setForm({
        origin: "",
        destination: "",
        available_seats: "",
        datetime: "",
        price: "",
        notes: "",
      });
      setImageFile(null);
    }
  };

  return (
    <div className="postride-container">
      {/* ✅ Mobile Top Bar */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <div className="mobile-profile-pic-wrapper">
            <img src={profilePic} alt="Profile" className="mobile-profile-pic" />
          </div>
          <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        </div>
        <h2 className="mobile-title">Post Ride</h2>
      </div>

      {/* ✅ Mobile Nav */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/") }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpools") }}>Browse Rides</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/post-ride") }}>Post Ride</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool-inbox") }}>Carpool Inbox</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/abasare") }}>Abasare</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* ✅ Desktop Left Panel */}
      <div className="postride-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/carpools")}>Browse Rides</button>
          <button onClick={() => navigate("/post-ride")}>Post Ride</button>
          <button onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>Post Carpool Offer</h2>
        <NotificationBell />
      </div>

      {/* ✅ Form Panel */}
      <div className="postride-right">
        <form className="postride-form" onSubmit={handleSubmit}>
          {message && <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>}

          <label>Origin</label>
          <input type="text" name="origin" value={form.origin} onChange={handleChange} required />

          <label>Destination</label>
          <input type="text" name="destination" value={form.destination} onChange={handleChange} required />

          <label>Available Seats</label>
          <input type="number" name="available_seats" value={form.available_seats} onChange={handleChange} required />

          <label>Date & Time</label>
          <input
            type="datetime-local"
            name="datetime"
            value={form.datetime}
            onChange={(e) => {
              handleChange(e);
              e.target.blur(); // Android auto-close
            }}
            required
          />

          <label>Price (Frw)</label>
          <input type="number" name="price" value={form.price} onChange={handleChange} />

          <label>Extra Message (Optional)</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} />

          <label>Upload Car Picture</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />

          <button type="submit" className="btn">Post Ride</button>
        </form>
      </div>
    </div>
  );
}

export default PostCarpool;

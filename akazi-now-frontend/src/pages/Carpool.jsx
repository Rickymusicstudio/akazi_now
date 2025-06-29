import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import defaultAvatar from "../assets/avatar.png";
import { FaBars } from "react-icons/fa";
import "./Carpool.css";

function Carpool() {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    available_seats: "",
    datetime: "",
    price: "",
    notes: "",
  });

  const [carImageFile, setCarImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [userProfile, setUserProfile] = useState({ full_name: "", contact_info: "" });
  const [profilePic, setProfilePic] = useState(defaultAvatar);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("users")
      .select("full_name, contact_info, image_url")
      .eq("auth_user_id", user.id)
      .single();

    if (!error && data) {
      setUserProfile(data);
      if (data.image_url) setProfilePic(data.image_url);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("❌ Please login first.");

    let carImageUrl = null;
    if (carImageFile) {
      const ext = carImageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `carpool-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("carpool-images")
        .upload(filePath, carImageFile);

      if (uploadError) {
        return setMessage("❌ Failed to upload car image.");
      }

      const { data } = supabase.storage.from("carpool-images").getPublicUrl(filePath);
      carImageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("carpools").insert([{
      user_id: user.id,
      ...form,
      car_image: carImageUrl,
      contact_info: userProfile.contact_info,
      driver_name: userProfile.full_name,
    }]);

    if (error) {
      setMessage("❌ Failed to post carpool: " + error.message);
    } else {
      setMessage("✅ Carpool offer posted!");
      setForm({
        origin: "",
        destination: "",
        available_seats: "",
        datetime: "",
        price: "",
        notes: "",
      });
      setCarImageFile(null);
    }
  };

  return (
    <div className="carpool-container">
      {/* ✅ MOBILE HEADER */}
      <div className="mobile-top-bar">
        <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="mobile-title">Post Carpool</h2>
        <div className="mobile-profile-pic-wrapper">
          <img src={profilePic} alt="Profile" className="mobile-profile-pic" />
        </div>
      </div>

      {/* ✅ MOBILE NAVIGATION */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/") }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpools") }}>Browse Rides</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool") }}>Post Ride</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool-inbox") }}>Carpool Inbox</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/abasare") }}>Abasare</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* ✅ DESKTOP LEFT PANEL */}
      <div className="carpool-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/carpools")}>Browse Rides</button>
          <button onClick={() => navigate("/carpool")}>Post Ride</button>
          <button onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>Post Carpool Offer</h2>
        <NotificationBell />
      </div>

      {/* ✅ RIGHT PANEL FORM */}
      <div className="carpool-right">
        <form onSubmit={handleSubmit} className="carpool-form">
          {message && <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>}

          <input type="text" name="origin" placeholder="Origin (e.g. Kigali)" value={form.origin} onChange={handleChange} required className="input" />
          <input type="text" name="destination" placeholder="Destination (e.g. Huye)" value={form.destination} onChange={handleChange} required className="input" />
          <input type="number" name="available_seats" placeholder="Available Seats" value={form.available_seats} onChange={handleChange} required className="input" />
          <input
            type="datetime-local"
            name="datetime"
            value={form.datetime}
            onChange={(e) => {
              handleChange(e);
              e.target.blur(); // auto-close on Android
            }}
            required
            className="input"
          />
          <input type="number" name="price" placeholder="Price (Frw)" value={form.price} onChange={handleChange} className="input" />
          <textarea name="notes" placeholder="Extra Message (Optional)" value={form.notes} onChange={handleChange} rows={4} className="input" />
          <label>Upload Car Picture</label>
          <input type="file" accept="image/*" onChange={(e) => setCarImageFile(e.target.files[0])} />
          <button type="submit" style={btnStyle}>Post Ride</button>
        </form>
      </div>
    </div>
  );
}

const btnStyle = {
  background: "linear-gradient(to right, #0f2027, #203a43, #2c5364)",
  color: "white",
  padding: "12px 24px",
  border: "none",
  borderRadius: "999px",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "1rem",
};

export default Carpool;

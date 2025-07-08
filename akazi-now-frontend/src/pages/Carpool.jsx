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
      <div className="mobile-top-bar carpool-top-bar">
        <div className="mobile-left-group">
          <div className="mobile-profile-pic-wrapper">
            <img src={profilePic} alt="Profile" className="mobile-profile-pic" />
          </div>
          <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        </div>
        <h2 className="mobile-title">Post Carpool</h2>
        <div className="mobile-bell-wrapper">
          <NotificationBell />
        </div>
      </div>

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

      <div className="carpool-right">
        <form onSubmit={handleSubmit} className="carpool-form">
          {message && <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>}

          <label>Origin</label>
          <input type="text" name="origin" className="carpool-input" placeholder="Origin (e.g. Kigali)" value={form.origin} onChange={handleChange} required />

          <label>Destination</label>
          <input type="text" name="destination" className="carpool-input" placeholder="Destination (e.g. Huye)" value={form.destination} onChange={handleChange} required />

          <label>Available Seats</label>
          <input type="number" name="available_seats" className="carpool-input" placeholder="Available Seats" value={form.available_seats} onChange={handleChange} required />

          <label>Date and Time</label>
          <input type="datetime-local" name="datetime" className="carpool-input" value={form.datetime} onChange={(e) => { handleChange(e); e.target.blur(); }} required />

          <label>Price (Frw)</label>
          <input type="number" name="price" className="carpool-input" placeholder="Price (Frw)" value={form.price} onChange={handleChange} />

          <label>Extra Message</label>
          <textarea name="notes" className="carpool-textarea" placeholder="Extra Message (Optional)" value={form.notes} onChange={handleChange} rows={4} />

          <label>Upload Car Picture</label>
          <input type="file" accept="image/*" onChange={(e) => setCarImageFile(e.target.files[0])} />

          <button type="submit" className="submit-btn">Post Ride</button>
        </form>
      </div>
    </div>
  );
}

export default Carpool;

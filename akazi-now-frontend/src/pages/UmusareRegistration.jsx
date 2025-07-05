import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { FaBars } from "react-icons/fa";
import "./UmusareRegistration.css";

function UmusareRegistration() {
  const [form, setForm] = useState({
    current_location: "",
    is_available: true,
  });
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Check if already registered
        const { data } = await supabase
          .from("abasare")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setForm({
            current_location: data.current_location,
            is_available: data.is_available,
          });
        }
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!userId) {
      return setMessage("❌ Please log in first.");
    }

    const { data: existing } = await supabase
      .from("abasare")
      .select("id")
      .eq("user_id", userId)
      .single();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("abasare")
        .update({
          current_location: form.current_location,
          is_available: form.is_available,
        })
        .eq("user_id", userId));
    } else {
      ({ error } = await supabase
        .from("abasare")
        .insert([{
          user_id: userId,
          current_location: form.current_location,
          is_available: form.is_available,
        }]));
    }

    if (error) {
      setMessage("❌ Error: " + error.message);
    } else {
      setMessage("✅ Successfully updated Umusare status.");
    }
  };

  return (
    <div className="umusare-container">
      {/* ✅ Mobile Nav */}
      <div className="mobile-top-bar">
        <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="mobile-title">Umusare Registration</h2>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/") }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/abasare") }}>View Drivers</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* ✅ Desktop Navigation */}
      <div className="umusare-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/abasare")}>View Drivers</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>Umusare Registration</h2>
        <NotificationBell />
      </div>

      {/* ✅ Form */}
      <div className="umusare-right">
        <form className="umusare-form" onSubmit={handleSubmit}>
          {message && <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>}
          <input
            type="text"
            name="current_location"
            placeholder="Current Location (e.g. Kimironko)"
            value={form.current_location}
            onChange={handleChange}
            required
            className="input"
          />
          <label style={{ marginTop: "1rem" }}>
            <input
              type="checkbox"
              name="is_available"
              checked={form.is_available}
              onChange={handleChange}
            />
            &nbsp; I am currently available
          </label>
          <button type="submit" style={btnStyle}>Save Status</button>
        </form>
      </div>
    </div>
  );
}

const btnStyle = {
  background: "linear-gradient(to right, #6a00ff, #ff007a)",
  color: "white",
  padding: "12px 24px",
  border: "none",
  borderRadius: "999px",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "1rem",
};

export default UmusareRegistration;
 

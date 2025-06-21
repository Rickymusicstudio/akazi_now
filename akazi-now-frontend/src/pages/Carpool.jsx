import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell"; // ✅ Bell imported

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

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select("full_name, contact_info")
        .eq("auth_user_id", user.id)
        .single();

      if (error) {
        console.error("❌ Failed to fetch profile:", error.message);
      } else {
        setUserProfile(data);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("❌ Please login first.");
      return;
    }

    let carImageUrl = null;
    if (carImageFile) {
      const ext = carImageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`; // ✅ fileName only, not full path

      const { error: uploadError } = await supabase.storage
        .from("carpool-images")
        .upload(fileName, carImageFile);

      if (uploadError) {
        setMessage("❌ Failed to upload car image.");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("carpool-images")
        .getPublicUrl(fileName); // ✅ Only the file name

      carImageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("carpools").insert([
      {
        driver_id: user.id,
        ...form,
        car_image: carImageUrl,
        contact_info: userProfile.contact_info,
        driver_name: userProfile.full_name,
      },
    ]);

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
    <div style={{ display: "flex", height: "100vh", width: "100vw", fontFamily: "Segoe UI, sans-serif" }}>
      {/* LEFT PANEL NAV */}
      <div style={{ width: "50%", background: "linear-gradient(135deg, #6a00ff, #ff007a)", color: "white", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: "1rem", left: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", fontWeight: "bold", fontSize: "14px" }}>
          <button onClick={() => navigate("/")} style={navStyle}>Home</button>
          <button onClick={() => navigate("/carpools")} style={navStyle}>Browse Rides</button>
          <button onClick={() => navigate("/carpool")} style={navStyle}>Post Ride</button>
          <button onClick={() => navigate("/carpool-inbox")} style={navStyle}>Carpool Inbox</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ ...navStyle, color: "#ffcccc" }}>Logout</button>
        </div>

        <h2 style={{ fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>Post Carpool Offer</h2>
        <NotificationBell />
      </div>

      {/* RIGHT FORM PANEL */}
      <div style={{ width: "50%", padding: "2rem", backgroundColor: "#fff" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {message && <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>}

          <input
            type="text"
            name="origin"
            placeholder="Origin (e.g. Kigali)"
            value={form.origin}
            onChange={handleChange}
            required
            className="input"
          />

          <input
            type="text"
            name="destination"
            placeholder="Destination (e.g. Huye)"
            value={form.destination}
            onChange={handleChange}
            required
            className="input"
          />

          <input
            type="number"
            name="available_seats"
            placeholder="Available Seats"
            value={form.available_seats}
            onChange={handleChange}
            required
            className="input"
          />

          <input
            type="datetime-local"
            name="datetime"
            value={form.datetime}
            onChange={handleChange}
            required
            className="input"
          />

          <input
            type="number"
            name="price"
            placeholder="Price (Frw)"
            value={form.price}
            onChange={handleChange}
            className="input"
          />

          <textarea
            name="notes"
            placeholder="Extra Message (Optional)"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            className="input"
          />

          <label>Upload Car Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCarImageFile(e.target.files[0])}
          />

          <button type="submit" style={btnStyle}>Post Ride</button>
        </form>
      </div>
    </div>
  );
}

const navStyle = {
  background: "none",
  border: "none",
  color: "white",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
};

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

export default Carpool;

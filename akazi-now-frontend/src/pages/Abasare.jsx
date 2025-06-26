import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { FaBars } from "react-icons/fa";
import "./Abasare.css";

function Abasare() {
  const [form, setForm] = useState({ current_location: "", is_available: true });
  const [userId, setUserId] = useState(null);
  const [abasareList, setAbasareList] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    fetchAbasare();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
    } else {
      setUserId(user.id);
    }
  };

  const fetchAbasare = async () => {
    const { data, error } = await supabase
      .from("abasare")
      .select(`
        id,
        current_location,
        is_available,
        average_rating,
        user_id,
        users:users!abasare_user_id_fkey(full_name, phone)
      `)
      .order("created_at", { ascending: false });

    if (!error) setAbasareList(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !form.current_location.trim()) return alert("Please fill in your current location.");

    const { error } = await supabase.from("abasare").upsert([
      {
        user_id: userId,
        current_location: form.current_location.trim(),
        is_available: form.is_available,
      },
    ]);

    if (error) {
      alert("❌ Failed to register: " + error.message);
    } else {
      alert("✅ Registered/Updated as Umusare");
      setForm({ current_location: "", is_available: true });
      fetchAbasare();
    }
  };

  return (
    <>
      {/* 🔝 Mobile Top Bar */}
      <div className="mobile-top-bar">
        <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="mobile-title">Abasare</h2>
        <NotificationBell />
      </div>

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

      <div className="abasare-container">
        <div className="abasare-left">
          <div className="nav-buttons">
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/carpools")}>Browse Rides</button>
            <button onClick={() => navigate("/post-ride")}>Post Ride</button>
            <button onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</button>
            <button onClick={() => navigate("/abasare")}>Abasare</button>
            <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>Umusare Registration</h2>
          <NotificationBell />
        </div>

        <div className="abasare-right">
          <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
            <h3>Register as Umusare</h3>
            <input
              type="text"
              placeholder="Your Current Location (e.g Kacyiru)"
              value={form.current_location}
              onChange={(e) => setForm({ ...form, current_location: e.target.value })}
              required
            />
            <div style={{ marginTop: "0.5rem" }}>
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
              />
              <label style={{ marginLeft: "0.5rem" }}>Available now</label>
            </div>
            <button type="submit" style={{ marginTop: "1rem", ...submitBtnStyle }}>Submit</button>
          </form>

          <table className="abasare-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Status</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {abasareList.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <Link to={`/abasare/${item.user_id}`} style={{ fontWeight: "bold", textDecoration: "none", color: "#000" }}>
                      {item.users?.full_name || "N/A"}
                    </Link>
                  </td>
                  <td>{item.users?.phone || "N/A"}</td>
                  <td>{item.current_location || "N/A"}</td>
                  <td style={{ color: item.is_available ? "green" : "red", fontWeight: "bold" }}>
                    {item.is_available ? "Available" : "Unavailable"}
                  </td>
                  <td>
                    {item.average_rating ? (
                      Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={i < Math.round(item.average_rating)
                            ? (i < 3 ? "star-green" : "star-yellow")
                            : "star-inactive"}
                        >
                          ★
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "#888" }}>(N/A)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const submitBtnStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  background: "linear-gradient(to right, #6a00ff, #ff007a)",
  color: "white",
  border: "none",
  cursor: "pointer",
};

export default Abasare;

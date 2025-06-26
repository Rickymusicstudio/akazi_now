import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell";
import { useNavigate } from "react-router-dom";
import "./BrowseRides.css";

function Abasare() {
  const [abasare, setAbasare] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    current_location: "",
    is_available: true,
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchAbasare();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user || null);
  };

  const fetchAbasare = async () => {
    const { data, error } = await supabase
      .from("abasare")
      .select(`
        *,
        users(full_name, phone)
      `)
      .order("created_at", { ascending: false });

    if (!error) {
      setAbasare(data || []);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("❌ Please login first.");

    const { data: existing } = await supabase
      .from("abasare")
      .select("id")
      .eq("user_id", currentUser.id)
      .single();

    let error;

    if (existing) {
      ({ error } = await supabase
        .from("abasare")
        .update({
          current_location: form.current_location,
          is_available: form.is_available,
        })
        .eq("user_id", currentUser.id));
    } else {
      ({ error } = await supabase
        .from("abasare")
        .insert([{
          user_id: currentUser.id,
          current_location: form.current_location,
          is_available: form.is_available,
        }]));
    }

    if (error) {
      alert("❌ Failed to update status: " + error.message);
    } else {
      alert("✅ Status updated!");
      fetchAbasare();
    }
  };

  return (
    <>
      {/* Mobile Nav */}
      <div className="mobile-top-bar">
        <div className="mobile-hamburger" onClick={() => setMobileNavOpen(true)}>☰</div>
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

      <div className="browse-container">
        <div className="browse-left">
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

        <div className="browse-right">
          {/* Registration Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
            <h3>Register as Umusare</h3>
            <input
              type="text"
              name="current_location"
              placeholder="Your Current Location (e.g. Nyamirambo)"
              value={form.current_location}
              onChange={handleFormChange}
              required
              className="input"
              style={{ marginBottom: "1rem" }}
            />
            <label style={{ display: "block", marginBottom: "1rem" }}>
              <input
                type="checkbox"
                name="is_available"
                checked={form.is_available}
                onChange={handleFormChange}
              />
              {' '}Available now
            </label>
            <button type="submit" style={btnStyle}>Submit</button>
          </form>

          {/* Driver Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {abasare.map((d) => (
                  <tr key={d.id}>
                    <td>{d.users?.full_name || "Unknown"}</td>
                    <td>{d.users?.phone || "N/A"}</td>
                    <td>{d.current_location}</td>
                    <td style={{ color: d.is_available ? "green" : "gray" }}>
                      {d.is_available ? "Available" : "Not Available"}
                    </td>
                    <td>{d.average_rating ? d.average_rating.toFixed(1) : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

const btnStyle = {
  padding: "10px 20px",
  background: "linear-gradient(to right, #6a00ff, #ff007a)",
  color: "#fff",
  border: "none",
  borderRadius: "20px",
  cursor: "pointer",
  fontWeight: "bold",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "1rem",
};

export default Abasare;

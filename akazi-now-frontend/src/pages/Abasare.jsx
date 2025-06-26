// pages/Abasare.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell";
import { FaBars, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Abasare.css";

function Abasare() {
  const [abasare, setAbasare] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ current_location: "", is_available: true });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [ratings, setRatings] = useState({});
  const [submittedRatings, setSubmittedRatings] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    setCurrentUser(user);
    const { data: profile } = await supabase
      .from("users")
      .select("phone")
      .eq("auth_user_id", user.id)
      .single();

    const { data: existing } = await supabase
      .from("abasare")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      setForm({ current_location: existing.current_location, is_available: existing.is_available });
    } else {
      setForm({ current_location: "", is_available: true });
    }

    fetchAbasare();
  };

  const fetchAbasare = async () => {
    const { data, error } = await supabase
      .from("abasare")
      .select("*, users(full_name, phone)");

    if (!error) {
      setAbasare(data);
      fetchRatings(data.map((a) => a.user_id));
    }
  };

  const fetchRatings = async (userIds) => {
    const { data } = await supabase
      .from("abasare_ratings")
      .select("rated_user_id, rating");

    const ratingMap = {};
    userIds.forEach((id) => {
      const userRatings = data.filter((r) => r.rated_user_id === id);
      const avg =
        userRatings.length > 0
          ? userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length
          : 0;
      ratingMap[id] = Math.round(avg * 10) / 10;
    });

    setRatings(ratingMap);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("abasare").upsert({
      user_id: currentUser.id,
      current_location: form.current_location,
      is_available: form.is_available,
    });

    if (error) {
      alert("❌ Failed to register: " + error.message);
    } else {
      alert("✅ Umusare status updated.");
      fetchAbasare();
    }
  };

  const handleRating = async (ratedUserId, score) => {
    if (!currentUser || currentUser.id === ratedUserId || submittedRatings[ratedUserId]) return;

    const { error } = await supabase.from("abasare_ratings").insert({
      rated_user_id: ratedUserId,
      rater_user_id: currentUser.id,
      rating: score,
    });

    if (!error) {
      setSubmittedRatings((prev) => ({ ...prev, [ratedUserId]: true }));
      fetchAbasare();
    }
  };

  return (
    <>
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
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      <div className="abasare-container">
        <div className="abasare-left">
          <div className="nav-buttons">
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/carpools")}>Browse Rides</button>
            <button onClick={() => navigate("/abasare")}>Abasare</button>
            <button onClick={() => navigate("/profile")}>Profile</button>
          </div>
          <h2>Umusare Registration</h2>
          <form onSubmit={handleSubmit}>
            <label>Current Location:</label>
            <input
              type="text"
              value={form.current_location}
              onChange={(e) => setForm({ ...form, current_location: e.target.value })}
              required
            />
            <label>Status:</label>
            <select
              value={form.is_available}
              onChange={(e) => setForm({ ...form, is_available: e.target.value === "true" })}
            >
              <option value="true">Available</option>
              <option value="false">Not Available</option>
            </select>
            <button type="submit">Update</button>
          </form>
        </div>

        <div className="abasare-right">
          <h2>Available Drivers</h2>
          <table className="abasare-table">
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
              {abasare.map((driver) => (
                <tr key={driver.user_id}>
                  <td>{driver.users?.full_name || "Unknown"}</td>
                  <td>{driver.users?.phone || "N/A"}</td>
                  <td>{driver.current_location}</td>
                  <td style={{ color: driver.is_available ? "green" : "gray" }}>
                    {driver.is_available ? "Available" : "Not Available"}
                  </td>
                  <td>
                    <span style={{ marginRight: "8px" }}>
                      ⭐ {ratings[driver.user_id] || "N/A"}
                    </span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        style={{
                          color:
                            submittedRatings[driver.user_id] || currentUser?.id === driver.user_id
                              ? "#ccc"
                              : "#ffcc00",
                          cursor:
                            submittedRatings[driver.user_id] || currentUser?.id === driver.user_id
                              ? "default"
                              : "pointer",
                        }}
                        onClick={() => handleRating(driver.user_id, star)}
                      />
                    ))}
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

export default Abasare;

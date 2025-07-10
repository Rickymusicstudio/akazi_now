import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { FaBars, FaSearch } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import "./Abasare.css";

function Abasare() {
  const [form, setForm] = useState({ current_location: "", is_available: true });
  const [userId, setUserId] = useState(null);
  const [abasareList, setAbasareList] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    fetchAbasare();
    fetchProfileImage();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id); // ✅ No redirect
  };

  const fetchAbasare = async () => {
    const { data, error } = await supabase
      .from("abasare")
      .select(`id, current_location, is_available, average_rating, user_id, users:users!abasare_user_id_fkey(full_name, phone)`)
      .order("created_at", { ascending: false });

    if (!error) setAbasareList(data || []);
  };

  const fetchProfileImage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();
    setUserProfile(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return alert("Please log in to register as a driver.");
    if (!form.current_location.trim()) return alert("Please fill in your current location.");

    const { error } = await supabase.from("abasare").upsert([{
      user_id: userId,
      current_location: form.current_location.trim(),
      is_available: form.is_available,
    }]);

    if (error) alert("❌ Failed to register: " + error.message);
    else {
      alert("✅ Registered/Updated as Umusare");
      setForm({ current_location: "", is_available: true });
      fetchAbasare();
    }
  };

  const handleRating = async (umusareId, stars) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please log in to rate.");
    if (user.id === umusareId) return alert("You cannot rate yourself.");

    const { error: insertError } = await supabase
      .from("ratings")
      .insert([{ umusare_id: umusareId, rated_by: user.id, rating: stars }]);

    if (insertError) return alert("Failed to rate.");

    const { data: ratings } = await supabase
      .from("ratings")
      .select("rating")
      .eq("umusare_id", umusareId);

    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await supabase
      .from("abasare")
      .update({ average_rating: avg })
      .eq("user_id", umusareId);

    fetchAbasare();
  };

  const toggleStatus = async (umusareId, currentStatus) => {
    if (!userId) return;
    const { error } = await supabase
      .from("abasare")
      .update({ is_available: !currentStatus })
      .eq("user_id", umusareId);

    if (!error) fetchAbasare();
  };

  const leaveTable = async (umusareId) => {
    if (!userId) return;
    const { error } = await supabase.from("abasare").delete().eq("user_id", umusareId);
    if (!error) fetchAbasare();
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar" style={{ background: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)" }}>
        <div className="mobile-left-group">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            className="mobile-profile-pic"
          />
          <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        </div>
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
        <div className="abasare-left" style={{ background: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)" }}>
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
              placeholder="Your Current Location"
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
            <button type="submit" style={submitBtnStyle}>Submit</button>
          </form>

          {abasareList.some((a) => a.user_id === userId) && (
            <div className="umusare-actions">
              <button onClick={() => {
                const myEntry = abasareList.find(a => a.user_id === userId);
                if (myEntry) toggleStatus(myEntry.user_id, myEntry.is_available);
              }}>Change Status</button>
              <button className="exit-btn" onClick={() => {
                const myEntry = abasareList.find(a => a.user_id === userId);
                if (myEntry) leaveTable(myEntry.user_id);
              }}>Exit Table</button>
            </div>
          )}

          <div className="search-bar">
            {!showSearch && (
              <FaSearch className="search-icon" onClick={() => setShowSearch(true)} />
            )}
            {showSearch && (
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, phone, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            )}
          </div>

          <div className="table-wrapper">
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
                {abasareList
                  .filter((item) => {
                    const term = searchTerm.toLowerCase();
                    return (
                      item.users?.full_name?.toLowerCase().includes(term) ||
                      item.users?.phone?.toLowerCase().includes(term) ||
                      item.current_location?.toLowerCase().includes(term)
                    );
                  })
                  .map((item, index) => (
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
                        {userId === item.user_id ? (
                          <span style={{ color: "gray", fontStyle: "italic", fontSize: "13px" }}>
                            (self)
                          </span>
                        ) : (
                          Array.from({ length: 5 }, (_, i) => (
                            <span
                              key={i}
                              onClick={() => handleRating(item.user_id, i + 1)}
                              className={
                                item.average_rating && i < Math.round(item.average_rating)
                                  ? "star-green"
                                  : "star-yellow"
                              }
                              style={{ cursor: "pointer" }}
                            >
                              ★
                            </span>
                          ))
                        )}
                      </td>
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

const submitBtnStyle = {
  padding: "12px 24px",
  borderRadius: "999px",
  background: "linear-gradient(to right, #0f2027, #203a43, #2c5364)",
  color: "white",
  border: "none",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "1rem",
  WebkitAppearance: "none",
  appearance: "none",
};

export default Abasare;

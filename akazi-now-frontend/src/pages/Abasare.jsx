import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { FaBars } from "react-icons/fa";
import "./Abasare.css";
import defaultAvatar from "../assets/avatar.png";

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
    const { data } = await supabase
      .from("abasare")
      .select("*, users(full_name, phone_number, profile_picture_url)")
      .order("created_at", { ascending: true });
    setAbasareList(data || []);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async () => {
    const { error } = await supabase.from("abasare").upsert([
      {
        user_id: userId,
        current_location: form.current_location,
        is_available: form.is_available,
      },
    ]);
    if (!error) fetchAbasare();
  };

  const handleToggleStatus = async () => {
    const entry = abasareList.find((a) => a.user_id === userId);
    if (!entry) return;
    await supabase
      .from("abasare")
      .update({ is_available: !entry.is_available })
      .eq("user_id", userId);
    fetchAbasare();
  };

  const handleExit = async () => {
    await supabase.from("abasare").delete().eq("user_id", userId);
    fetchAbasare();
  };

  const handleRate = async (targetUserId, ratingValue) => {
    const { data: existing } = await supabase
      .from("ratings")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("rater_id", userId);

    if (existing.length) {
      await supabase
        .from("ratings")
        .update({ rating: ratingValue })
        .eq("user_id", targetUserId)
        .eq("rater_id", userId);
    } else {
      await supabase
        .from("ratings")
        .insert({ user_id: targetUserId, rater_id: userId, rating: ratingValue });
    }

    fetchAbasare();
  };

  const renderStars = (targetUserId, averageRating) => {
    return [1, 2, 3, 4, 5].map((value) => (
      <span
        key={value}
        className={`star ${averageRating >= value ? "green" : "yellow"}`}
        onClick={() => handleRate(targetUserId, value)}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="abasare-container">
      <div className="abasare-left">
        <div className="nav-buttons">
          <FaBars onClick={() => setMobileNavOpen(!mobileNavOpen)} className="menu-icon" />
          <NotificationBell />
        </div>
        <h2>Register as Umusare</h2>
        <input
          name="current_location"
          placeholder="Your Current Location (e.g Kacyiru)"
          value={form.current_location}
          onChange={handleChange}
          autoComplete="off"
        />
        <label>
          <input
            type="checkbox"
            name="is_available"
            checked={form.is_available}
            onChange={handleChange}
          />
          Available now
        </label>
        <button onClick={handleSubmit} className="submit-btn">Submit</button>
        <div className="status-buttons">
          <button onClick={handleToggleStatus}>Change Status</button>
          <button className="exit-btn" onClick={handleExit}>Exit Table</button>
        </div>
      </div>

      <div className="abasare-right">
        <table>
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
            {abasareList.map((a, i) => (
              <tr key={a.id}>
                <td>{i + 1}</td>
                <td>
                  <strong>{a.users?.full_name?.split(" ")[0]}</strong><br />
                  {a.users?.full_name?.split(" ")[1] || ""}
                </td>
                <td>{a.users?.phone_number || "N/A"}</td>
                <td>{a.current_location}</td>
                <td className={a.is_available ? "status-available" : "status-unavailable"}>
                  {a.is_available ? "Available" : "Not Available"}
                </td>
                <td>{renderStars(a.user_id, a.average_rating || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Abasare;

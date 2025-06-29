import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <div className="setting-item">
        <label>Notifications</label>
        <input type="checkbox" checked readOnly />
      </div>

      <div className="setting-item">
        <label>Dark Mode</label>
        <input type="checkbox" disabled />
      </div>

      <button className="logout-btn" onClick={handleLogout}>Log Out</button>
    </div>
  );
}

export default Settings;
 

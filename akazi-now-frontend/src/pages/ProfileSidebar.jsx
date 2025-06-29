// components/ProfileSidebar.jsx
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import defaultAvatar from "../assets/avatar.png";
import "../styles/ProfileSidebar.css"; // You can reuse or extract shared styles

function ProfileSidebar({ profile, onUpload, uploading }) {
  const navigate = useNavigate();

  return (
    <div className="profile-left">
      <div className="nav-buttons">
        <button onClick={() => navigate("/")}>Home</button>
        <button onClick={() => navigate("/post-job")}>Post a Job</button>
        <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
        <button onClick={() => navigate("/profile")}>Profile</button>
        <button onClick={() => navigate("/inbox")}>Inbox</button>
        <button onClick={() => navigate("/carpool")}>Car Pooling</button>
        <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
      </div>

      <h2 style={{ color: 'white' }}>My Profile</h2>
      <NotificationBell />
      <div className="profile-card">
        <label className="avatar-wrapper">
          <img
            src={profile.image_url || defaultAvatar}
            alt="avatar"
            className="clickable-avatar"
          />
          <input type="file" accept="image/*" onChange={onUpload} style={{ display: "none" }} />
        </label>
        <h2 style={{ marginTop: "1rem" }}>{profile.full_name}</h2>
        <label className="btn">
          {uploading ? "Uploading..." : "Change Picture"}
          <input type="file" accept="image/*" onChange={onUpload} style={{ display: "none" }} />
        </label>
      </div>
    </div>
  );
}

export default ProfileSidebar;
 

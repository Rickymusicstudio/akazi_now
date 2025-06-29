import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './UserProfile.css';
import defaultAvatar from '../assets/avatar.png';
import { useNavigate } from 'react-router-dom';
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [section, setSection] = useState(null); // 'profile', 'password', etc.
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [message, setMessage] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadDistricts();
    document.body.classList.toggle('dark-mode', darkMode);
  }, []);

  const toggleMobileNav = () => setMobileNavOpen(!mobileNavOpen);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
    setProfile(data);
    if (data?.district_id) loadSectors(data.district_id);
  };

  const loadDistricts = async () => {
    const { data } = await supabase.from('districts').select('*');
    setDistricts(data || []);
  };

  const loadSectors = async (districtId) => {
    const { data } = await supabase.from('sectors').select('*').eq('district_id', districtId);
    setSectors(data || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    if (name === 'district_id') {
      setProfile(prev => ({ ...prev, sector_id: '' }));
      loadSectors(value);
    }
  };

  const handleSave = async () => {
    const { error } = await supabase.from('users').update({
      full_name: profile.full_name,
      phone: profile.phone,
      district_id: profile.district_id,
      sector_id: profile.sector_id,
      cell: profile.cell,
      village: profile.village,
    }).eq('auth_user_id', profile.auth_user_id);

    if (!error) {
      setEditing(false);
      setMessage('✅ Profile updated');
    } else {
      setMessage('❌ Failed to update profile');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.auth_user_id}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });

    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('users').update({ image_url: publicUrl }).eq('auth_user_id', profile.auth_user_id);
      setProfile(prev => ({ ...prev, image_url: publicUrl }));
      setMessage('✅ Profile picture updated');
    } else {
      setMessage('❌ Failed to upload image');
    }
    setUploading(false);
  };

  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', newValue);
    document.body.classList.toggle('dark-mode', newValue);
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
    if (!error) {
      setMessage('✅ Password updated');
      setPasswords({ newPassword: '', confirmPassword: '' });
    } else {
      setMessage('❌ Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account?")) return;
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('users').delete().eq('auth_user_id', user.id);
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!profile) return null;

  return (
    <div className="profile-container">
      {/* Top mobile bar */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img
            src={profile.image_url || defaultAvatar}
            className="mobile-profile-pic"
            onClick={() => fileInputRef.current?.click()}
          />
          <FaBars className="mobile-hamburger" onClick={toggleMobileNav} />
        </div>
        <div className="mobile-title">Profile</div>
        <NotificationBell />
      </div>

      {/* Mobile Nav Overlay */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={toggleMobileNav}>
          <ul onClick={(e) => e.stopPropagation()}>
            <li onClick={() => navigate("/")}>Home</li>
            <li onClick={() => navigate("/post-job")}>Post a Job</li>
            <li onClick={() => navigate("/my-jobs")}>My Jobs</li>
            <li onClick={() => navigate("/inbox")}>Inbox</li>
            <li onClick={() => navigate("/carpool")}>Car Pooling</li>
            <li onClick={handleLogout}>Logout</li>
          </ul>
        </div>
      )}

      {/* Sidebar and Main */}
      <div className="profile-left">
        <h2 style={{ color: 'white' }}>Settings</h2>
        <NotificationBell />
        <div className="profile-card">
          <img
            src={profile.image_url || defaultAvatar}
            alt="avatar"
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: 'pointer' }}
          />
          <label className="btn">
            {uploading ? "Uploading..." : "Change Picture"}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
          <h3>{profile.full_name}</h3>
        </div>

        <div className="nav-buttons">
          <button onClick={() => setSection('profile')}>Edit Profile</button>
          <button onClick={handleDarkModeToggle}>
            Dark Mode: {darkMode ? "On" : "Off"}
          </button>
          <button onClick={() => setSection('password')}>Change Password</button>
          <button onClick={() => setSection('delete')}>Delete Account</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Right Panel Content */}
      <div className="profile-right">
        {message && <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>}

        {section === 'profile' && (
          <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <label>Full Name</label>
            <input type="text" name="full_name" value={profile.full_name || ''} onChange={handleChange} />

            <label>Phone</label>
            <input type="text" name="phone" value={profile.phone || ''} onChange={handleChange} />

            <label>District</label>
            <select name="district_id" value={profile.district_id || ''} onChange={handleChange}>
              <option value="">Select District</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>

            <label>Sector</label>
            <select name="sector_id" value={profile.sector_id || ''} onChange={handleChange}>
              <option value="">Select Sector</option>
              {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <label>Cell</label>
            <input type="text" name="cell" value={profile.cell || ''} onChange={handleChange} />

            <label>Village</label>
            <input type="text" name="village" value={profile.village || ''} onChange={handleChange} />

            <button className="btn" type="submit">Save Changes</button>
          </form>
        )}

        {section === 'password' && (
          <div className="profile-form">
            <label>New Password</label>
            <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />

            <label>Confirm Password</label>
            <input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} />

            <button className="btn" onClick={handlePasswordChange}>Update Password</button>
          </div>
        )}

        {section === 'delete' && (
          <div className="profile-form">
            <p style={{ color: 'red' }}><strong>Warning:</strong> This will permanently delete your account.</p>
            <button className="btn" onClick={handleDeleteAccount}>Delete My Account</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile;

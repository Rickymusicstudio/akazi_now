import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './UserProfile.css';
import defaultAvatar from '../assets/avatar.png';
import { useNavigate } from 'react-router-dom';
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [message, setMessage] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadDistricts();
  }, []);

  const toggleMobileNav = () => setMobileNavOpen(prev => !prev);

  const loadProfile = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      setMessage('❌ Not authenticated.');
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      setMessage('❌ Failed to load profile');
      return;
    }

    setProfile(profileData);
    if (profileData?.district_id) loadSectors(profileData.district_id);
  };

  const loadDistricts = async () => {
    const { data } = await supabase.from('districts').select('*');
    setDistricts(data || []);
  };

  const loadSectors = async (districtId) => {
    const { data } = await supabase
      .from('sectors')
      .select('*')
      .eq('district_id', districtId);
    setSectors(data || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));

    if (name === 'district_id') {
      setProfile((prev) => ({ ...prev, sector_id: '' }));
      loadSectors(value);
    }
  };

  const handleEditToggle = () => setEditing(!editing);

  const handleSave = async () => {
    if (!profile?.auth_user_id) {
      setMessage('❌ Missing auth_user_id. Cannot update profile.');
      return;
    }

    const updateData = {
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      district_id: profile.district_id || null,
      sector_id: profile.sector_id || null,
      cell: profile.cell || '',
      village: profile.village || '',
    };

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('auth_user_id', profile.auth_user_id);

    if (!error) {
      setEditing(false);
      setMessage('✅ Profile updated');
    } else {
      console.error('Update failed:', error);
      setMessage('❌ Failed to update profile');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.auth_user_id}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      setMessage('❌ Failed to upload image');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ image_url: publicUrl })
      .eq('auth_user_id', profile.auth_user_id);

    if (!userUpdateError) {
      setProfile((prev) => ({ ...prev, image_url: publicUrl }));
      setMessage('✅ Profile picture updated');
    }

    setUploading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!profile) return null;

  return (
    <div className="profile-container">
      {/* ✅ Mobile Top Bar */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img
            src={profile.image_url || defaultAvatar}
            alt="avatar"
            className="mobile-profile-pic"
          />
          <FaBars className="mobile-hamburger" onClick={toggleMobileNav} />
        </div>
        <div className="mobile-title">My Profile</div>
        <NotificationBell />
      </div>

      {/* ✅ Mobile Full Nav */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={toggleMobileNav}>
          <ul onClick={(e) => e.stopPropagation()}>
            <li onClick={() => { toggleMobileNav(); navigate("/") }}>Home</li>
            <li onClick={() => { toggleMobileNav(); navigate("/post-job") }}>Post a Job</li>
            <li onClick={() => { toggleMobileNav(); navigate("/my-jobs") }}>My Jobs</li>
            <li onClick={() => { toggleMobileNav(); navigate("/profile") }}>Profile</li>
            <li onClick={() => { toggleMobileNav(); navigate("/inbox") }}>Inbox</li>
            <li onClick={() => { toggleMobileNav(); navigate("/carpool") }}>Car Pooling</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* ✅ Desktop Left */}
      <div className="profile-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpool")}>Car Pooling</button>
          <button onClick={handleLogout} style={{ color: "#ffcccc" }}>Logout</button>
        </div>

        <h2 style={{ color: 'white' }}>My Profile</h2>
        <NotificationBell />
        <div className="profile-card">
          <img src={profile.image_url || defaultAvatar} alt="avatar" />
          <h2 style={{ marginTop: '1rem' }}>{profile.full_name}</h2>
          <label className="btn">
            {uploading ? 'Uploading...' : 'Change Picture'}
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* ✅ Right Form Panel */}
      <div className="profile-right">
        <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {message && <p style={{ color: message.startsWith('✅') ? 'green' : 'red' }}>{message}</p>}

          <label>Full Name</label>
          <input type="text" name="full_name" value={profile.full_name || ''} onChange={handleChange} disabled={!editing} />

          <label>Phone</label>
          <input type="text" name="phone" value={profile.phone || ''} onChange={handleChange} disabled={!editing} />

          <label>District</label>
          <select name="district_id" value={profile.district_id || ''} onChange={handleChange} disabled={!editing}>
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <label>Sector</label>
          <select name="sector_id" value={profile.sector_id || ''} onChange={handleChange} disabled={!editing}>
            <option value="">Select Sector</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <label>Cell</label>
          <input type="text" name="cell" value={profile.cell || ''} onChange={handleChange} disabled={!editing} />

          <label>Village</label>
          <input type="text" name="village" value={profile.village || ''} onChange={handleChange} disabled={!editing} />

          <button type="button" className="btn" onClick={handleEditToggle}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
          {editing && <button type="submit" className="btn">Save Changes</button>}
        </form>
      </div>
    </div>
  );
}

export default UserProfile;

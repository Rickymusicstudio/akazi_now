import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Signup.css';
import defaultAvatar from '../assets/avatar.png';
import { useNavigate } from 'react-router-dom';
import NotificationBell from "../components/NotificationBell.jsx"; // ✅ Add bell

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadDistricts();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
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

    if (profileData) {
      setProfile(profileData);
      if (profileData.district_id) loadSectors(profileData.district_id);
    }
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

  const handleEditToggle = () => setEditing(!editing);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));

    if (name === 'district_id') {
      setProfile((prev) => ({ ...prev, sector_id: '' }));
      loadSectors(value);
    }
  };

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

    const { error: insertError } = await supabase
      .from('pictures')
      .insert([{ user_id: profile.auth_user_id, image_url: publicUrl }]);

    if (userUpdateError || insertError) {
      console.error('❌ Error saving image info:', userUpdateError || insertError);
      setMessage('❌ Failed to update profile picture');
    } else {
      setProfile((prev) => ({ ...prev, image_url: publicUrl }));
      setMessage('✅ Profile picture updated');
    }

    setUploading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="signup-container">
      {/* LEFT PANEL */}
      <div
        className="signup-left"
        style={{
          background: 'linear-gradient(135deg, #6a00ff, #ff007a)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1.5rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          <button onClick={() => navigate("/")} style={navButtonStyle}>Home</button>
          <button onClick={() => navigate("/post-job")} style={navButtonStyle}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")} style={navButtonStyle}>My Jobs</button>
          <button onClick={() => navigate("/profile")} style={navButtonStyle}>Profile</button>
          <button onClick={() => navigate("/inbox")} style={navButtonStyle}>Inbox</button>
          <button onClick={() => navigate("/carpool")} style={navButtonStyle}>Car Pooling</button>
          <button onClick={handleLogout} style={{ ...navButtonStyle, color: "#ffcccc" }}>Logout</button>
        </div>

        <h2 style={{ marginTop: '3rem', color: 'white' }}>My Profile</h2>
        <NotificationBell /> {/* ✅ Bell Added Below Title */}

        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            width: '80%',
            maxWidth: '320px',
            textAlign: 'center',
            marginTop: '1rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          }}
        >
          <img
            src={profile.image_url || defaultAvatar}
            alt="avatar"
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <h2 style={{ marginTop: '1rem', color: '#333' }}>{profile.full_name}</h2>
          <label className="btn" style={{ display: 'inline-block', marginTop: '1rem', cursor: 'pointer', padding: '12px 24px' }}>
            {uploading ? 'Uploading...' : 'Change Picture'}
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="signup-right">
        <form className="signup-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
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

          <button type="button" className="btn" onClick={handleEditToggle} style={{ marginTop: '10px' }}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>

          {editing && <button type="submit" className="btn">Save Changes</button>}
        </form>
      </div>
    </div>
  );
}

const navButtonStyle = {
  background: "none",
  border: "none",
  color: "white",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
};

export default UserProfile;

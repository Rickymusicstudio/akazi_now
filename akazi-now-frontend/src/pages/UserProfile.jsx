import { useEffect, useState, useRef } from 'react';
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
  const [slideDirection, setSlideDirection] = useState('');
  const [showSettings, setShowSettings] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadDistricts();
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let touchStartY = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY && mobileNavOpen) {
        setSlideDirection('slide-up');
        setTimeout(() => {
          setMobileNavOpen(false);
          setSlideDirection('');
        }, 300);
      }
      lastScrollY = currentScrollY;
    };

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      if (touchStartY - touchEndY > 50 && mobileNavOpen) {
        setSlideDirection('slide-up');
        setTimeout(() => {
          setMobileNavOpen(false);
          setSlideDirection('');
        }, 300);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mobileNavOpen]);

  const toggleMobileNav = () => {
    if (!mobileNavOpen) {
      setSlideDirection("slide-down");
      setMobileNavOpen(true);
    } else {
      setSlideDirection("slide-up");
      setTimeout(() => {
        setMobileNavOpen(false);
        setSlideDirection('');
      }, 300);
    }
  };

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

  const handleSave = async () => {
    if (!profile?.auth_user_id) {
      setMessage('❌ Missing auth_user_id.');
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
      setShowSettings(true);
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { newPassword, confirmPassword } = passwords;

    if (newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage('❌ Failed to change password');
    } else {
      setMessage('✅ Password changed successfully');
      setPasswords({ newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
      setShowSettings(true);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.');
    if (!confirmDelete) return;

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      setMessage('❌ Failed to get user.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        let errorMessage = '❌ Failed to delete account.';
        try {
          const res = await response.json();
          errorMessage = `❌ ${res.error || errorMessage}`;
        } catch (_) {}
        setMessage(errorMessage);
        return;
      }

      alert('✅ Account deleted. Logging you out...');
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('❌ Delete error:', err);
      setMessage('❌ Failed to delete account.');
    }
  };

  if (!profile) return null;

  return (
    <div className="profile-container">
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img
            src={profile.image_url || defaultAvatar}
            alt="avatar"
            className="mobile-profile-pic"
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: 'pointer' }}
          />
          <FaBars className="mobile-hamburger" onClick={toggleMobileNav} />
        </div>
        <div className="mobile-title">Profile</div>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className={`mobile-nav-overlay ${slideDirection}`} onClick={toggleMobileNav}>
          <ul onClick={(e) => e.stopPropagation()}>
            <li onClick={() => { toggleMobileNav(); navigate("/") }}>Home</li>
            <li onClick={() => { toggleMobileNav(); navigate("/post-job") }}>Post a Job</li>
            <li onClick={() => { toggleMobileNav(); navigate("/my-jobs") }}>My Jobs</li>
            <li onClick={() => { toggleMobileNav(); navigate("/profile") }}>Profile</li>
            <li onClick={() => { toggleMobileNav(); navigate("/inbox") }}>Inbox</li>
            <li onClick={() => { toggleMobileNav(); navigate("/carpool") }}>Car Pooling</li>
            <li onClick={handleLogout}>Logout</li>
          </ul>
        </div>
      )}

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
          <img
            src={profile.image_url || defaultAvatar}
            alt="avatar"
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: 'pointer' }}
          />
          <h2>{profile.full_name}</h2>
          <label className="btn">
            {uploading ? 'Uploading...' : 'Change Picture'}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
          </label>
        </div>
      </div>

      <div className="profile-right">
        {showChangePassword ? (
          <form className="profile-form" onSubmit={handlePasswordChange}>
            <label>New Password</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            />
            <label>Confirm Password</label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
            />
            <button type="button" className="btn" onClick={() => setShowChangePassword(false)}>Cancel</button>
            <button type="submit" className="btn">Change Password</button>
          </form>
        ) : showSettings ? (
          <div className="profile-form">
            {message && <p style={{ color: message.startsWith('✅') ? 'green' : 'red' }}>{message}</p>}
            <button className="btn" onClick={() => { setShowSettings(false); setEditing(true); }}>Edit Profile</button>
            <button className="btn" onClick={() => { setShowSettings(false); setShowChangePassword(true); }}>Change Password</button>
            <button className="btn" onClick={() => alert("🌗 Dark Mode (to be implemented)")}>Toggle Dark Mode</button>
            <button className="btn" onClick={() => alert("📲 Push Notifications (to be implemented)")}>Push Notifications</button>
            <button className="btn" onClick={handleDeleteAccount}>Delete Account</button>
          </div>
        ) : (
          <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
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

            <button type="button" className="btn" onClick={() => { setEditing(false); setShowSettings(true); }}>Cancel</button>
            <button type="submit" className="btn">Save Changes</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default UserProfile;

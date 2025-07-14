import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import stickerOffice from "../assets/office.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./PostGig.css";

function PostGig() {
  const [form, setForm] = useState({
    title: "",
    address: "",
    job_description: "",
    requirement: "",
    price: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();
      if (!error) setUserProfile(data);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile) return;

    let imageUrl = null;
    if (imageFile) {
      const fileName = `${Date.now()}_${imageFile.name}`;
      const { data, error } = await supabase.storage
        .from("job_images")
        .upload(fileName, imageFile);
      if (!error) {
        const { data: urlData } = supabase.storage
          .from("job_images")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("jobs").insert([
      {
        title: form.title,
        address: form.address,
        job_description: form.job_description,
        requirement: form.requirement,
        price: form.price,
        image_url: imageUrl,
        poster_id: userProfile.auth_user_id,
        contact: userProfile.phone,
      },
    ]);

    if (!error) {
      setMessage("✅ Job posted successfully!");
      setForm({
        title: "",
        address: "",
        job_description: "",
        requirement: "",
        price: "",
      });
      setImageFile(null);
    } else {
      setMessage("❌ Error posting job.");
    }
  };

  return (
    <div className="postgig-container">
      <div
        className="postgig-hero"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="postgig-topbar">
          <div className="postgig-menu" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            <img
              src={userProfile?.avatar_url || defaultAvatar}
              alt="avatar"
              className="postgig-avatar"
            />
            <FaBars className="postgig-bars" />
          </div>
          <h1 className="postgig-title">Post a Job</h1>
          <NotificationBell />
        </div>
        <div className="postgig-hero-text">
          <h2>Post a Job. Help Someone Earn Today.</h2>
          <p>Connect with local talent by sharing your gig.</p>
        </div>
      </div>

      <div className="postgig-main">
        <div className="postgig-left">
          <form className="postgig-form" onSubmit={handleSubmit}>
            <input name="title" placeholder="Job Title" onChange={handleChange} value={form.title} />
            <input name="address" placeholder="Address" onChange={handleChange} value={form.address} />
            <textarea name="job_description" placeholder="Job Description" onChange={handleChange} value={form.job_description} />
            <textarea name="requirement" placeholder="Requirement" onChange={handleChange} value={form.requirement} />
            <input name="price" placeholder="Price (Frw)" onChange={handleChange} value={form.price} />
            <input type="file" onChange={handleFileChange} />
            <button type="submit">Post Job</button>
            {message && <p className="postgig-message">{message}</p>}
          </form>
        </div>
        <div className="postgig-right">
          <img src={stickerOffice} alt="office sticker" className="postgig-sticker" />
        </div>
      </div>
    </div>
  );
}

export default PostGig;
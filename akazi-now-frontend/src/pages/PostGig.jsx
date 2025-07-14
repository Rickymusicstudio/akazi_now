import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import defaultAvatar from "../assets/avatar.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import officeSticker from "../assets/office.png";
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
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile) {
      setMessage("User profile not found.");
      return;
    }

    let imageUrl = null;
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("job_images")
        .upload(fileName, imageFile);
      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from("job_images")
          .getPublicUrl(data.path);
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
        user_id: userProfile.auth_user_id,
      },
    ]);

    if (error) {
      setMessage("Failed to post job.");
    } else {
      setMessage("Job posted successfully!");
      navigate("/gigs");
    }
  };

  return (
    <div className="postgig-container">
      {/* HERO with KCC background */}
      <div
        className="postgig-hero"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="postgig-hero-text">
          <h1>Post a Job</h1>
          <p>Share your gig with thousands nearby</p>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="postgig-content">
        <div className="postgig-left">
          <form onSubmit={handleSubmit} className="postgig-form">
            <h2>Post a Job</h2>

            <input
              type="text"
              name="title"
              placeholder="Job Title"
              value={form.title}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              required
            />
            <textarea
              name="job_description"
              placeholder="Job Description"
              value={form.job_description}
              onChange={handleChange}
              required
            />
            <textarea
              name="requirement"
              placeholder="Requirement"
              value={form.requirement}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price (Frw)"
              value={form.price}
              onChange={handleChange}
              required
            />
            <label>Upload Job Image</label>
            <input type="file" onChange={handleFileChange} />
            <button type="submit">Post Job</button>
            {message && <p>{message}</p>}
          </form>
        </div>

        <div className="postgig-right">
          <img src={officeSticker} alt="Sticker" className="postgig-sticker" />
        </div>
      </div>
    </div>
  );
}

export default PostGig;

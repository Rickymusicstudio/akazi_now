import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import "./PostCarpool.css";

function PostGig() {
  const [formData, setFormData] = useState({
    job_description: "",
    requirement: "",
    address: "",
    price: "",
    image: null,
  });
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
      } else {
        setUserId(user.id);
      }
    };
    getUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    let imageUrl = null;
    if (formData.image) {
      const fileExt = formData.image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from("job-images")
        .upload(fileName, formData.image);

      if (uploadError) {
        alert("Image upload failed!");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("job-images")
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("jobs").insert([
      {
        user_id: userId,
        job_description: formData.job_description,
        requirement: formData.requirement,
        address: formData.address,
        price: formData.price,
        image_url: imageUrl,
        status: "open",
      },
    ]);

    if (error) {
      alert("❌ Failed to post job: " + error.message);
    } else {
      alert("✅ Job posted!");
      navigate("/my-jobs");
    }
  };

  return (
    <div className="postgig-container">
      {/* LEFT SIDE PANEL (Desktop only) */}
      <div className="gigs-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpools")}>Car Pooling</button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}
            style={{ color: "#ffcccc" }}
          >
            Logout
          </button>
        </div>

        <h2 style={{ fontSize: "32px", fontWeight: "bold", marginTop: "3rem" }}>
          Post a Job
        </h2>

        <NotificationBell />
      </div>

      {/* RIGHT PANEL */}
      <div className="gigs-right">
        <form className="signup-form" onSubmit={handleSubmit}>
          <label>Job Description</label>
          <textarea
            name="job_description"
            value={formData.job_description}
            onChange={handleChange}
            required
          ></textarea>

          <label>Requirement</label>
          <textarea
            name="requirement"
            value={formData.requirement}
            onChange={handleChange}
          ></textarea>

          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />

          <label>Price (Frw)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
          />

          <label>Upload Job Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />

          <button type="submit" className="btn">
            Post Job
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostGig;

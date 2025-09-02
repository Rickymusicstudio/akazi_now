import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!email) {
      return setMessage("⚠️ Please enter your email");
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://akazinow.com/reset-password", // ✅ Use production URL
      });

      if (error) {
        if (error.status === 429) {
          setMessage("⚠️ Too many requests. Please wait a few minutes and try again.");
        } else {
          setMessage("❌ Failed to send reset email: " + error.message);
        }
      } else {
        setMessage("✅ Check your email for the reset link");
      }
    } catch (err) {
      setMessage("❌ Unexpected error: " + err.message);
    }
  };

  return (
    <div className="forgot-container">
      <h2>Forgot Password</h2>
      {message && <p className="forgot-message">{message}</p>}

      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handleReset}>Send Reset Link</button>
      <button onClick={() => navigate("/login")}>Back to Login</button>
    </div>
  );
}

export default ForgotPassword;

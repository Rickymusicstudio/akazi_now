import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/reset-password", // ✅ Update if deploying
    });

    if (error) {
      setMessage("❌ Failed to send reset email");
    } else {
      setMessage("✅ Check your email for the reset link");
    }
  };

  return (
    <div className="forgot-container">
      <h2>Forgot Password</h2>
      {message && <p>{message}</p>}
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

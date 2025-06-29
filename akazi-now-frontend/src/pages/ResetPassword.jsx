import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./ResetPassword.css";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleUpdate = async () => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage("❌ Failed to reset password");
    } else {
      setMessage("✅ Password updated. Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="reset-container">
      <h2>Reset Password</h2>
      {message && <p>{message}</p>}
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={handleUpdate}>Update Password</button>
    </div>
  );
}

export default ResetPassword;

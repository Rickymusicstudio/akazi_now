// src/components/CarpoolNav.jsx
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function CarpoolNav() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav
      className="w-full px-6 py-4 shadow-md flex justify-between items-center bg-white"
      style={{ background: "linear-gradient(135deg, #6a00ff, #ff007a)", color: "white" }}
    >
      <h1 className="text-xl font-bold">Carpooling</h1>
      <div className="flex gap-4 font-semibold text-sm">
        <button onClick={() => navigate("/carpool")} style={navBtn}>Post Ride</button>
        <button onClick={() => navigate("/carpool-rides")} style={navBtn}>Browse Rides</button>
        <button onClick={() => navigate("/")} style={navBtn}>Back to AkaziNow</button>
        <button onClick={handleLogout} style={{ ...navBtn, color: "#ffcccc" }}>Logout</button>
      </div>
    </nav>
  );
}

const navBtn = {
  background: "none",
  border: "none",
  color: "white",
  cursor: "pointer",
};

export default CarpoolNav;

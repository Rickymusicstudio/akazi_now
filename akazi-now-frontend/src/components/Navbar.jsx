import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="w-full px-6 py-4 shadow-md flex justify-between items-center bg-white">
      <h1 className="text-xl font-bold text-purple-700">AkaziNow</h1>
      <div className="flex gap-4">
        <button onClick={() => navigate('/jobs')} className="text-sm font-medium text-gray-700 hover:text-purple-700">My Jobs</button>
        <button onClick={() => navigate('/post-job')} className="text-sm font-medium text-gray-700 hover:text-purple-700">Post a Job</button>
        <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:underline">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
 

import './Login.css';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        setError('❌ Login failed: ' + loginError.message);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/gigs'); // ✅ Redirect to gigs after successful login
      } else {
        setError('❌ Login succeeded but user not found.');
      }
    } catch (err) {
      setError('❌ Unexpected error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left"></div>

      <div className="login-right">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Login</h2>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {/* ✅ Forgot Password Link */}
          <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.9rem', color: '#6a00ff' }}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <p className="signin-link">
            Don’t have an account? <Link to="/signup">Sign up →</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;

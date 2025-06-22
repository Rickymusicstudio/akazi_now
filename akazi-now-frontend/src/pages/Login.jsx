import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize(); // run on load
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
        setSuccess('✅ Login successful!');
        setTimeout(() => {
          navigate('/gigs');
        }, 1000);
      } else {
        setError('❌ Login succeeded but user not found.');
      }
    } catch (err) {
      setError('❌ Unexpected error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 Styles
  const containerStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    height: '100vh',
    width: '100vw',
    fontFamily: 'Segoe UI, sans-serif',
    overflow: 'hidden',
  };

  const leftStyle = {
    flex: 1,
    height: isMobile ? '200px' : 'auto',
    backgroundImage: `linear-gradient(to bottom right, rgba(117, 0, 255, 0.6), rgba(255, 0, 150, 0.6)), url('../assets/signup.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: isMobile ? 'center' : 'left center',
    backgroundRepeat: 'no-repeat',
  };

  const rightStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    backgroundColor: '#fff',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '400px',
    padding: isMobile ? '1.5rem' : '2.5rem',
    backgroundColor: '#fff',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  };

  const buttonStyle = {
    background: 'linear-gradient(to right, #6e00ff, #ff007a)',
    border: 'none',
    padding: '12px',
    color: 'white',
    width: '100%',
    fontWeight: 'bold',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '16px',
  };

  return (
    <div style={containerStyle}>
      <div style={leftStyle}></div>

      <div style={rightStyle}>
        <form style={cardStyle} onSubmit={handleSubmit}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: isMobile ? '24px' : '28px' }}>
            Login
          </h2>

          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '12px', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #ccc' }}
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '12px', marginBottom: '1.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
          />

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '14px' }}>
            Don't have an account? <a href="/signup" style={{ color: '#6e00ff', fontWeight: 'bold', textDecoration: 'none' }}>Sign up →</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;

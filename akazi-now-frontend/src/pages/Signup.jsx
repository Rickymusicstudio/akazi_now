import './Signup.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    district_id: '',
    sector_id: '',
    cell: '',
    village: '',
    agree: false,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    async function fetchDistricts() {
      const { data, error } = await supabase.from('districts').select('*');
      if (!error && data) setDistricts(data);
    }
    fetchDistricts();
  }, []);

  useEffect(() => {
    async function fetchSectors() {
      if (!formData.district_id) return setSectors([]);
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .eq('district_id', formData.district_id);
      if (!error && data) setSectors(data);
    }
    fetchSectors();
  }, [formData.district_id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.agree) return setError('❗You must agree to the terms');
    if (formData.password !== formData.confirmPassword)
      return setError('❗Passwords do not match');
    if (!formData.password || formData.password.length < 6)
      return setError('❗Password must be at least 6 characters');

    setIsSubmitting(true);
    try {
      // 1) Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        if (signUpError.status === 422) {
          setError('❌ This email already has an account. Try logging in or reset your password.');
        } else {
          setError('❌ Signup failed: ' + signUpError.message);
        }
        setIsSubmitting(false);
        return;
      }

      if (!authData?.user) {
        setError('❌ Signup failed: no user returned.');
        setIsSubmitting(false);
        return;
      }

      // 2) Insert profile row only after successful auth
      const { error: insertError } = await supabase.from('users').insert([{
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        auth_user_id: authData.user.id,
        district_id: formData.district_id,
        sector_id: formData.sector_id,
        cell: formData.cell,
        village: formData.village,
      }]);

      if (insertError) {
        setError('❌ User profile creation failed: ' + insertError.message);
        setIsSubmitting(false);
        return;
      }

      setSuccess('✅ Signup successful! Please check your email to confirm.');
      setIsSubmitting(false);

      // Optional redirect after a short success toast
      setTimeout(() => navigate('/login'), 2000);

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        district_id: '',
        sector_id: '',
        cell: '',
        village: '',
        agree: false,
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('❌ Unexpected error: ' + (err?.message || 'Please try again.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-left">
        <div className="signup-heading">
          <h1>Become a Member</h1>
          <p>Sign up to join the AkaziNow community</p>
        </div>
      </div>

      <div className="signup-right">
        <form className="signup-form" onSubmit={handleSubmit}>
          <h2>Sign Up</h2>

          {error && (
            <p style={{ color: 'red' }}>
              {error}
              {error.includes('already has an account') && (
                <>
                  {' '}<a href="/login">Log in</a> or <a href="/forgot-password">reset password</a>.
                </>
              )}
            </p>
          )}
          {success && <p style={{ color: 'green' }}>{success}</p>}

          <label>Full Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />

          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />

          <label>Phone Number</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />

          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />

          <label>Repeat Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />

          <label>District</label>
          <select name="district_id" value={formData.district_id} onChange={handleChange} required>
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <label>Sector</label>
          <select name="sector_id" value={formData.sector_id} onChange={handleChange} required>
            <option value="">Select Sector</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <label>Cell</label>
          <input type="text" name="cell" value={formData.cell} onChange={handleChange} required />

          <label>Village</label>
          <input type="text" name="village" value={formData.village} onChange={handleChange} required />

          <div className="terms">
            <input
              id="agree"
              type="checkbox"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
            />
            <label htmlFor="agree">
              I agree to the <a href="#">Terms of Use</a>
            </label>
          </div>

          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Sign Up'}
          </button>

          <p className="signin-link">
            Already have an account? <a href="/login">Sign in →</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;

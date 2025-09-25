import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, signInWithEmailAndPassword, signInWithPopup, googleProvider} from '../firebase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard'); // Redirect after successful login
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Invalid credentials, please try again.");
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithPopup(auth, provider);
      navigate('/'); // Redirect after successful login
    } catch (error) {
      console.error("Error with social login:", error);
      alert("Something went wrong with the login.");
    }
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f4f4f9',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white'
    }}>
      <div style={{
        backgroundColor: 'white',
        color: 'black',
        padding: '2rem',
        borderRadius: '10px',
        width: '400px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Welcome back</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            name="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem',
              margin: '0.5rem 0',
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          />
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem',
              margin: '0.5rem 0',
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          />
          <a
            href="/forgot-password"
            style={{
              display: 'block',
              textAlign: 'right',
              marginBottom: '1rem',
              color: '#4CAF50',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            Forgot password?
          </a>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.8rem',
              backgroundColor: '#007BFF',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Login
          </button>
        </form>
        <p style={{ textAlign: 'center', margin: '1rem 0', fontSize: '0.9rem' }}>or</p>
        <button
          onClick={() => handleSocialLogin(googleProvider)}
          style={{
            width: '100%',
            padding: '0.8rem',
            marginBottom: '0.5rem',
            backgroundColor: '#E0F7FA',
            border: '1px solid #007BFF',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#007BFF'
          }}
        >
          <span>Continue with Google</span>
        </button>
        <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>
          New to Zenith Learning?{' '}
          <a
            href="/signup"
            style={{
              textDecoration: 'none',
              color: '#007BFF',
              fontWeight: 'bold'
            }}
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, createUserWithEmailAndPassword } from '../firebase';

function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/'); // Redirect after successful signup
    } catch (error) {
      console.error("Error signing up:", error);
      alert("There was an error with your sign-up.");
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
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Create an Account</h2>
        <form onSubmit={handleSignUp}>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem',
              margin: '0.5rem 0',
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem',
              margin: '0.5rem 0',
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          />
          <input
            type="email"
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
            placeholder="Password"
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
            Sign Up
          </button>
        </form>
        <p style={{ fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem' }}>
          Already have an account?{' '}
          <a
            style={{
              textDecoration: 'none',
              color: '#007BFF',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/login')}
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default Signup;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Signup = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Guest warning booleon
  const [guestWarning, setguestWarning] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    // Check to prevent current users to set username to "guest"
    if (username==='guest') {
      setguestWarning(true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, firstName, lastName }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the JWT token in local storage

        const response2 = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if(response2.ok) {
            const data2 = await response2.json();
            console.log("Response received");

            localStorage.setItem('token', data2.token);
            localStorage.setItem('user', username)
            console.log('Signup successful!');
            onAuthSuccess(); 
            navigate('/'); 
        } else {
          setError(data.message);
        }

      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <>
        <div className='signup'>
          <div className='signup-border'>
            <h1>Sign Up</h1>
            <div className='signup-container'>
              <form onSubmit={handleSignup}>
                <div className='signup-box'>

                  <div>
                    <label>Username:</label>
                    <input
                      type='text'
                      placeholder='Enter your username'
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setguestWarning(false)
                      }}
                      required
                      // Dynamically applies style when invalid username was attempted
                      style={ guestWarning ? {border:'2px solid red'} : {}}
                    />
                    {/* Dynamically applies warning message if user attempts to set invalid username */}  
                    {guestWarning ? 
                      <>
                      <center>
                        <p className='signUpWarning'>Sorry that username is reserved.</p>
                        <p className='signUpWarning'>Please enter a new username.</p>
                      </center>
                      </> 
                    : 
                    <></>}

                  </div>
              
                  <div>
                      <label>Password:</label>
                      <input
                        type='text'
                        placeholder='Enter your password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                  </div>
                  
                  <div>
                      <label>First Name:</label>
                      <input
                        type='text'
                        placeholder='Enter your First Name'
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                  </div>
                  
                  <div>
                      <label>Last Name:</label>
                      <input
                        type='text'
                        placeholder='Enter your Last Name'
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                  </div>

                  <div>
                      <label>Email:</label>
                      <input
                        type='email'
                        placeholder='Enter your email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                  </div>

                </div>

                <center><button type='submit'>Sign up</button></center>
                {error && <p className='error'>{error}</p>}
              </form>
            </div>
            <div className='loginLink'>
              <p>
                Already have an account?{' '}
                <Link to='/'>Log in</Link>
              </p>
             </div>
          </div>
        </div>
    
    </>
  );
};

export default Signup;

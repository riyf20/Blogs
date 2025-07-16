import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const debug = false;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Login = ({onAuthSuccess}) => {
    // States for input fields
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate(); 
    const [showPassword, setShowPassword] = useState(false);


    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            {debug && console.log("Attempting database login")};

            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            {debug && console.log("Response received")};

            if (response.ok) {
                // Store the JWT token and username in local storage
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('user', JSON.stringify(data.user));
                {debug && console.log('Login successful!')};
                onAuthSuccess();
                navigate('/'); 
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error logging in:', error);
            setError('An error occurred. Please try again.');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Creates new token for guest allowing them access
    const guestMode = async (e) => {

        const res = await fetch(`${API_BASE_URL}/api/login/guest-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('username', 'guest');
        onAuthSuccess();
        navigate('/');

    }

    return (
        <>
        <div className='login'>
            <div className='border'>
                <h1>Login</h1>
                <div className='container'>
                    <form onSubmit={handleLogin}> 
                        <div className='box'>
                            <input
                                type='text'
                                placeholder='Enter your username'
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <div className='password-container-login'>
                                <input
                                    type={showPassword ? 'text' : 'password'} 
                                    placeholder='Enter your password'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button onClick={togglePasswordVisibility} type='button'>
                                    <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                </button>
                            </div>
                            <button type='submit'>Log in</button> 
                            {error && <p className='error'>{error}</p>}
                        </div>
                    </form>
                </div>
                <div className='signuplink'>
                    <p>
                        Don't have an account?{' '}
                        <Link to='/signup'>Sign up</Link>
                    </p>
                </div>
            </div>

            {/* New Guest mode block */}
            <center>
                <div>
                    <div id='guest'>
                        <h4>Don't want to make an account yet?</h4> 
                        <b>Try the new <span>Guest Mode!</span> </b>
                        <br />
                        <button id='guestButton' onClick={guestMode}> <b>View as Guest</b> </button>
                    </div>
                </div>
            </center>
        </div>
        </>
    );
}

export default Login;

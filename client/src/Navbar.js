import { json, Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


const Navbar = ({ onAuthSuccess }) => {
    // Hamburger menu state for mobile view
    const [isMenuOpen, setIsMenuOpen] = useState(false); 
    const navigate = useNavigate();
    const location = useLocation(); 
    const token = localStorage.getItem('token');
    const refresh = localStorage.getItem('refreshtoken')
    const userObject = localStorage.getItem('user')
    const user = JSON.parse(userObject)

    
    useEffect(() => {
        const checkTokenExpiration = async () => {  
            
            if (token && user) {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                const {id, username} = user
                if (decodedToken.exp < currentTime) {
                    try {

                        const response = await fetch(`${API_BASE_URL}/api/refreshtoken`, {
                            method: 'POST',
                            headers: {
                            "Content-Type": "application/json",
                            },
                            body: JSON.stringify({refreshToken:refresh, userID:id, username})
                        })

                        const data = await response.json();
                        const newToken = data.newToken

                        localStorage.setItem('token', newToken)

                        if (!response.ok) throw new Error(data.message || 'Refresh Token Failed');
                        return data;
                    } catch (err) {
                        console.error(err.message)
                        handleLogout(true);
                    }
                }
            }
        };
        checkTokenExpiration(); 
    }, [location, navigate]);



    const cleanBackend = async () => {
        const refreshToken = localStorage.getItem('refreshtoken')
        const userData = localStorage.getItem('user')
        const user = JSON.parse(userData)
        const userID = user.id

        const response = await fetch(`${API_BASE_URL}/api/refreshtoken/delete`, {
            method: 'POST',
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({refreshToken, userID})
        })
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Deleting refresh Token failed');
        return data;

    }

    const handleLogout = (expToken) => {
        cleanBackend()
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('username');
        localStorage.removeItem('refreshtoken');
        if (!expToken) {
            onAuthSuccess();
        } else {
            window.location.reload();
        }
        navigate('/login');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Disables/enables scrolling if menu is open/closed
    useEffect(() => {
        if (isMenuOpen) {
            // Disable scrolling
            document.body.style.overflow = 'hidden';
        } else {
            // Enable scrolling
            document.body.style.overflow = 'auto';
        }

        // Clean up 
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMenuOpen]);

    return ( 
        <nav className="navbar">
            <Link to="/" onClick={() => (setIsMenuOpen(false))}><h1>Blogs</h1></Link> 
            
            {/* Hamburger Icons */}
            <div className={`hamburger ${isMenuOpen ? "open" : ""}`} onClick={toggleMenu}>
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
            </div>

            {/* Links */}
            <div className={`links ${isMenuOpen ? "open" : ""}`}>
                <Link className="navlinks" to="/create" onClick={() => {setIsMenuOpen(false)}}>New Blog</Link>
                <Link className="navlinks" to="/search" onClick={() => {setIsMenuOpen(false)}}>Search</Link>
                <Link className="navlinks" to="/profile" onClick={() => {setIsMenuOpen(false)}}>Profile</Link>
                <Link className="navlinks" onClick={handleLogout} >Log Out</Link>
            </div>
        </nav>
    );
};
export default Navbar;
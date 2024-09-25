import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect } from 'react';

const Navbar = ({ onAuthSuccess }) => {
    // Hamburger menu state for mobile view
    const [isMenuOpen, setIsMenuOpen] = useState(false); 
    const navigate = useNavigate();
    const location = useLocation(); 

    useEffect(() => {
        const checkTokenExpiration = () => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (decodedToken.exp < currentTime) {
                handleLogout(true);
            }
        }
        };
        checkTokenExpiration(); 
    }, [location, navigate]);

    const handleLogout = (expToken) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
            <Link to="/"><h1>Blogs</h1></Link> 
            
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
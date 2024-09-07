import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import React, { useEffect } from 'react';


const Navbar = ({ onAuthSuccess }) => {

    const navigate = useNavigate();

    // Track the current location
    const location = useLocation(); 

    useEffect(() => {
        const checkTokenExpiration = () => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (decodedToken.exp < currentTime) {
                // Token has expired
                handleLogout(true);
            }
        }
        };

        // Check token expiration whenever location changes
        checkTokenExpiration(); 

  }, [location, navigate]);

    const handleLogout = (expToken) => {
        // Remove the token from local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    
        // Redirect to the login page or homepage
        if (!expToken) {
            onAuthSuccess()
        } else {
            window.location.reload()
        }
        navigate('/login');
      };

    return ( 
        <nav className="navbar">
            <Link to="/"><h1>Blogs</h1></Link> 
            <div className="links">
                <Link className="navlinks" to="/search" style={{
                    borderRadius: "8px"
                }}>Search</Link>
                <Link className="navlinks" to="/create" style={{
                    borderRadius: "8px"
                }}>New Blog</Link>
                <Link className="navlinks" onClick={handleLogout} style={{
                    color: "white",
                    backgroundColor: "#2F4858",
                    borderRadius: "8px"
                }}>Log Out</Link>
                
            </div>
        </nav>
     );
}
 
export default Navbar;
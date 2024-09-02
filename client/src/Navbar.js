import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onAuthSuccess }) => {

    const navigate = useNavigate();

    const handleLogout = () => {
        // Remove the token from local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    
        // Redirect to the login page or homepage
        onAuthSuccess()
        navigate('/');
      };

    return ( 
        <nav className="navbar">
            <Link to="/"><h1>Blogs</h1></Link> 
            <div className="links">
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
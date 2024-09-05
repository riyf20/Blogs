import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import Home from './Home';
import Create from './Create';
import BlogDetails from './BlogDetails';
import Navbar from './Navbar';
import NotFound from './NotFound';
import { Analytics } from "@vercel/analytics/react"

// used for global debugging
const debug = false;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on initial render and set state accordingly
   const token = localStorage.getItem('token');
    useEffect(() => {
      if (token) {
        setIsAuthenticated(true);
      }
    }, [token]);

  // Function to handle successful login/signup
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    {debug && console.log("auth set to true")};
  };

  return (
    <Router>
      <div className="App">
        {/* Conditional rendering --> user not logged in */}
        {!isAuthenticated ? (
          <Routes>
            <Route path="/" element={<Login onAuthSuccess={handleAuthSuccess} />} />
            <Route path="/signup" element={<Signup onAuthSuccess={handleAuthSuccess} />} />
            {/* Redirect path from other pages */}
            <Route path="*" element={<Login onAuthSuccess={handleAuthSuccess} />} />
            <Analytics />
          </Routes>
          
        ) : (
          <>
            {/* user paths */}
            <Navbar />
            <div className="content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<Create onAuthSuccess={handleAuthSuccess}/>} />
                <Route path="/blogs/:id" element={<BlogDetails/>} />
                <Route path='*' element={<NotFound/>}></Route>
                <Analytics />
              </Routes>
            </div>
          </>
        )}
      </div>
    </Router>
    
  );
}

export default App;

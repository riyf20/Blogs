import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react"
import Login from './Login';
import Signup from './Signup';
import Home from './Home';
import Create from './Create';
import BlogDetails from './BlogDetails';
import Navbar from './Navbar';
import NotFound from './NotFound';
import Search from './Search';
import Profile from './Profile';

// Used for global debugging
const debug = false;

function App() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Checks authentication status on initial render
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setCheckingAuth(false);
  }, []);

  // Function to handle successful login/signup
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    {debug && console.log("authentication set to true")};
  };

  // Guest mode state
  const [guestMode, setGuestMode] = useState(false);

  // Checks to see if user is guest
  useEffect(() => {
    const user = localStorage.getItem('user');
    
    if (user) {
      const parsedUser = JSON.parse(user); 
      const {isGuest} = parsedUser;
      setGuestMode(isGuest);
    }
     
  }, [guestMode, isAuthenticated]);

  if (checkingAuth) {
    return <div>Loading...</div>;
  }

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
          </Routes>
          
        ) : (
          <>
            {/* user paths */}
            <Navbar />
            <div className="content">
              <Routes>
                {/* Added props to identify if guest user is enabled*/}
                <Route path="/" element={<Home guestUser={guestMode} />} />
                <Route path="/create" element={<Create onAuthSuccess={handleAuthSuccess} guestUser={guestMode}/>} />
                <Route path="/blogs/:id" element={<BlogDetails guestUser={guestMode}/>} />
                <Route path="/search" element={<Search guestUser={guestMode}/>} />
                <Route path="/profile" element={<Profile guestUser={guestMode}/>} />
                <Route path='*' element={<NotFound/>}></Route>
              </Routes>
            </div>
          </>
        )}
        <Analytics />
      </div>
    </Router>
    
  );
}

export default App;

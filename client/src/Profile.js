import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import BlogList from './BlogList';
import Guest from "./Guest";
import guestProfile from "./guestData/guestProfile";
import guestBlogs from "./guestData/guestBlogs";
import guestComments from './guestData/guestComments';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Profile = ({guestUser}) => {

    // User Details
    const user = localStorage.getItem('username'); 
    const token = localStorage.getItem('token'); 

    // Profile details 
    const [dataLoaded, setDataLoaded] = useState(false);
    const [userData, setUserData] = useState(null);
    const [editProfile, setEditProfile] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [userID, setUserID] = useState(-1)
    const [fName, setFName] = useState('');
    const [lName, setLName] = useState('');
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); 
    const [blogs, setBlogs] = useState([]);
    const [comments, setComments] = useState([]);

    // Triggers and cleanups
    const [triggerReload, setTriggerReload] = useState(false); 
    const [clean, setClean] = useState(false); 
    
    // Guest warning booleon
    const [guestWarning, setguestWarning] = useState(false);
    
    useEffect(() => {

        // Loads demo data for guest users
        if(guestUser) {
            setUserData(guestProfile[0]);
            setBlogs(guestBlogs);
            setComments(guestComments);
            setDataLoaded(true);
            return;
        } else {

            // Loads User data from database
            if (!dataLoaded) {
                fetch(`${process.env.REACT_APP_API_BASE_URL}/api/${user}/data`, {
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                })
                .then(res => res.json())
                .then(data => {
                    setUserData(data[0]);
                    setDataLoaded(true);
                })
                .catch(err => console.error('Error fetching user data:', err));
            }

            // Loads User's blogs + comments
            if (setDataLoaded) {
                try {
                    fetch(`${API_BASE_URL}/api/search?type=author&field=${encodeURIComponent(user)}`, {
                        method: 'GET',
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                    })
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error('Failed to fetch comments');
                        }
                        return res.json();
                    })
                    .then((data) => setBlogs(data))

                    fetch(`${API_BASE_URL}/api/search?type=profile&field=${encodeURIComponent(user)}`, {
                        method: 'GET',
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                    })
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error('Failed to fetch comments');
                        }
                        return res.json();
                    })
                    .then((data) => setComments(data))
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        }
    }, [ user, token, triggerReload, guestUser]);

    useEffect(() => {
        // Set user data
        if (userData) {
            setFName(userData.first_name);
            setLName(userData.last_name);
            setUserName(userData.username);
            setEmail(userData.email);
            setPassword(userData.password_txt);
            setUserID(userData.id)
        }
    }, [userData]);

    // If any changes were made to blogs/comment will trigger a reload
    useEffect(() => {
        if (clean) {
            setClean(false);
            setTriggerReload(!triggerReload);  
        }
    }, [clean]);

    const toggleEdit = () => {
        if (editProfile) {
            // Reset form fields to original data when canceling edit
            setFName(userData.first_name);
            setLName(userData.last_name);
            setUserName(userData.username);
            setEmail(userData.email);
            setPassword(userData.password_txt);
        }
        setEditProfile(!editProfile);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const saveChanges = async () => {

        // Check to prevent current users to set username to "guest"
        if (userName==='guest') {
            setguestWarning(true);
            return;
        }

        try {
            const newdata = { fName, lName, userName, email, password };
            const response = await fetch(`${API_BASE_URL}/api/profile/${user}/${userID}/update`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newdata)
            });
    
            if (!response.ok) {
                throw new Error('Failed to update user profile');
            }
    
            // Change username in case it was altered
            localStorage.setItem('username', userName);

            // Gets user object --> changes username
            const userObject = JSON.parse(localStorage.getItem('user')); 
            userObject.username = userName;

            // Sends back to local storage
            localStorage.setItem('user', JSON.stringify(userObject));
            setEditProfile(false);

        } catch (err) {
            console.error('Error updating user profile:', err.message);
        }
    };

    const cleanUp = () => {
        setClean(true)
    }

    return (
        <div className='profile'>

            {/* Conditional guest component | Informational block for guest users */}
            {guestUser && 
                <Guest parentElement={'Profile'}/>
            }

            <h2 style={{marginLeft: '10px'}}>Your Profile</h2>
            <div className='profile-container'>
                {dataLoaded && userData ? (
                    <>
                        {!editProfile ? (
                            <div className='button-fixed'>
                                <button onClick={toggleEdit}>Edit</button>
                            </div>
                        ) : null}

                        <div className='profile-items'>
                            <h3>First Name</h3>
                            <input 
                                style={editProfile ? {border: '2px solid black'} : {border: 'transparent'}}
                                type="text" 
                                value={fName} 
                                onChange={(e) => setFName(e.target.value)} 
                                disabled={!editProfile} 
                            />
                        </div>
                        
                        <div className='profile-items'>
                            <h3>Last Name</h3>
                            <input 
                                style={editProfile ? {border: '2px solid black'} : {border: 'transparent'}}
                                type="text" 
                                value={lName} 
                                onChange={(e) => setLName(e.target.value)} 
                                disabled={!editProfile} 
                            />
                        </div>

                        <div className='profile-items'>
                            <h3>Username</h3>
                            <input 
                                // Dynamically applies style when invalid username was attempted
                                style={{
                                    border: guestWarning 
                                        ? '2px solid red' 
                                        : editProfile 
                                            ? '2px solid black' 
                                            : 'transparent'
                                }}
                                type="text" 
                                value={userName} 
                                // Clears warning once users types 
                                onChange={(e) => 
                                {
                                    setUserName(e.target.value);
                                    setguestWarning(false);
                                }} 
                                disabled={!editProfile} 
                            />
                            {/* Dynamically applies warning message if user attempts to set invalid username */}
                            {guestWarning ? 
                                <>
                                <center className='profilewarningbox'>
                                    <p className='profileWarning'>Sorry that username is reserved.</p>
                                    <p className='profileWarning'>Please enter a new username.</p>
                                </center>
                                </> 
                                : 
                                <></>}
                        </div>
                        
                        <div className='profile-items password-container'
                            style={{marginTop: guestWarning && '-56px'}}
                            id='guestWarningBox'
                        >
                            <h3>Password</h3>
                            <input 
                                style={editProfile ? {border: '2px solid black'} : {border: 'transparent'}}
                                type={showPassword ? 'text' : 'password'} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                disabled={!editProfile} 
                            />
                            <button onClick={togglePasswordVisibility}>
                                <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                            </button>
                        </div>
                        
                        <div className='profile-items'>
                            <h3>Email</h3>
                            <input 
                                style={editProfile ? {border: '2px solid black'} : {border: 'transparent'}}
                                type="text" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                disabled={!editProfile} 
                            />
                        </div>
                        
                        {editProfile ? (
                            <>
                                <div className='profile-items'> 
                                </div>
                                <div className='profile-items-button'>
                                    <center><button id='profileSave' disabled={guestUser} onClick={saveChanges}>Save Changes</button></center>
                                </div>
                                <div className='profile-items-button'>
                                    <center><button id='profileCancel' 
                                    onClick={() => 
                                        {toggleEdit();
                                        setguestWarning(false);
                                        }
                                    }
                                    >Cancel</button></center>
                                </div>
                                {guestUser && 
                                <>
                                    <p className='guestAlert'>You can easily save and manage all of your account credentials!</p>
                                </> 
                                }
                                
                            </>
                        ) : null}
                        
                    </>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
            <br />
            <hr />
            <br />
            <h2 style={{marginLeft: '10px', marginBottom: '10px'}}>Your Blogs</h2>
            <div className='profile-blogs'>
                {dataLoaded && userData ? 
                (<> 
                    {blogs.length > 0 ? 
                    <BlogList blogs={blogs} profile={true} cleanFunc={cleanUp} guestUser={guestUser} /> 
                    : 
                    <><center><h3>You don't have any published post</h3> Create your first post now! <Link to={'/create'}><button id='firstPost'>Here</button></Link> </center></>} 
                
                </>) 
                : (<></>) }
            </div>

            <br />
            <hr />
            <br />
            <h2 style={{marginLeft: '10px', marginBottom: '10px'}}>Your Comments</h2>
            <div className='profile-comments'>
                {dataLoaded && userData ? 
                (<> 
                    {comments.length > 0 ? 
                    <BlogList blogs={comments} comment={true} profile={true} cleanFunc={cleanUp} guestUser={guestUser}/> 
                    : 
                    <><center><h3>You have not commented yet</h3></center></>} 
                
                </>) 
                : (<></>) }
            </div>
        </div>
    );
};

export default Profile;
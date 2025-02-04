import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import BlogList from './BlogList';



const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Profile = () => {

    // User Details
    const user = localStorage.getItem('user'); 
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

    useEffect(() => {
        // User data
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

        // User's blogs + comments
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
    }, [ user, token, triggerReload]);

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
            localStorage.setItem('user', userName);
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
                                style={editProfile ? {border: '2px solid black'} : {border: 'transparent'}}
                                type="text" 
                                value={userName} 
                                onChange={(e) => setUserName(e.target.value)} 
                                disabled={!editProfile} 
                            />
                        </div>
                        
                        <div className='profile-items password-container'>
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
                                    <center><button id='profileSave' onClick={saveChanges}>Save Changes</button></center>
                                </div>
                                <div className='profile-items-button'>
                                    <center><button id='profileCancel' onClick={toggleEdit}>Cancel</button></center>
                                </div>
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
                    <BlogList blogs={blogs} profile={true} cleanFunc={cleanUp}/> 
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
                    <BlogList blogs={comments} comment={true} profile={true} cleanFunc={cleanUp}/> 
                    : 
                    <><center><h3>You have not commented yet</h3></center></>} 
                
                </>) 
                : (<></>) }
            </div>
            
        </div>
    );
};

export default Profile;
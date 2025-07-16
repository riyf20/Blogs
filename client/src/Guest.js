import { Link, useLocation, useNavigate } from "react-router-dom";

// Clears guests' session and redirects to sign up page
export function guestSignUp(navigate) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    navigate('/signup');
    window.location.reload();
}
    
// Parent element prop allows this component to be resuable and adaptable
const Guest = ({parentElement}) => {

    const navigate = useNavigate();
    const parent = parentElement;

    return (
        <>  
            { 
                // If parent element is the Home page
                parentElement==='Home' ? 
                (<>
                    
                    <div className="guestMode">
                        <h3>Welcome Guest!</h3> 
                        <p>This is the main page where you can see all the blogs that have been posted.</p>
                        <p>You're browsing in guest mode. If you would like to post and comment sign up <a href='#' onClick={(e) => {e.preventDefault(); guestSignUp(navigate);}}>here!</a></p>
                    </div>

                </>) 

                // Else if parent element is the create page
                : parentElement === 'Create' ? 
                (<>
                    <div className="guestMode">
                        <h3>Create new blog posts!</h3> 
                        <p>You're viewing the blog creation page. Sign up to start sharing your stories, add images, and join the conversation!</p>
                    </div>

                </>) 
                
                // Else if parent element is the search page
                : parentElement === 'Search' ? 
                (<>
                    <div className="guestMode">
                    <h3>Search all blog posts, comments, and authors!</h3> 
                    <p>This page lets you explore blog posts, comments, and authors.</p></div>
                </>) 
                
                // Else if parent element is the profile page
                : parentElement === 'Profile' ? 
                (<>
                    <div className="guestMode">
                    <h3>Welcome to your personal dashboard!</h3> 
                    <p>Here you can update your profile information, manage your blog posts, and keep track of your comments.</p></div>
                </>) 

                // Else nothing 
                : (<></>)
            }
            
        </>
    )
}

export default Guest;
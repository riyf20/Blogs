import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Notification from "./Notification";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const BlogList = ({blogs, title, comment, profile, cleanFunc, guestUser}) => {

    const user = localStorage.getItem('username');  
    const token = localStorage.getItem('token'); 

    const [modalOpen, setModalOpen] = useState(false);  // Controls the visibility of a modal
    const closeModal = () => setModalOpen(false);  // Function to close the modal
    const [modalMessage, setModalMessage] = useState('');  // Message to display in the modal
    const [modalSubtitle, setModalSubtitle] = useState('');  // Message to display in the modal

    // If the data is a blog or comment
    const [isPost, setIsPost] = useState(false);
    const [isComment, setIsComment] = useState(false);

    // Blog and comment ids
    const [blogId, setBlogId] = useState(-1);
    const [commentId, setCommentId] = useState(-1);

    // Example result "2024-01-01T01:01:01.000Z";
    const [timestamp, setTimestamp] = useState([]);

    // Cut the date
    useEffect(() => {
        if(profile) {
            blogs.map((blog) => {
                const timestamp = (blog.created_at);
                const date = new Date(timestamp);
                const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                setTimestamp((current) => [...current, formattedDate])
            })
        }
    }, [profile])

    // Modal information | Delete blog (within the profile page)
    const confirmDeletePost = (blogId) => {
        setModalOpen(true);

        // Changed modal information for guest users
        if(guestUser) {
            setModalMessage("Delete post preview.")
            setModalSubtitle("This is how the delete confirmation will appear. You’ll be reminded to confirm before a post is permanently removed.")
        } else {
            setModalMessage("Would you like to delete this post?")
            setModalSubtitle("All images and comments associated will be deleted as well.")
        }
        
        setBlogId(blogId);
    }

  // Server | Deletes blog (within the profile page)
    const deletePost = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile/${user}/${blogId}/delete`, {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
    
            if (!response.ok) {
                throw new Error('Failed to delete users post');
            }
    
            // Clean up function clears the variables used by modal
            cleanUp();

        } catch (err) {
            console.error('Error deleting users post:', err.message);
        }
    }

    // Modal information | Delete comment (within the profile page)
    const confirmDeleteComment = (commentId, postid) => {
        setModalOpen(true);

        // Changed modal information for guest users
        if(guestUser) {
            setModalMessage("Delete comment preview.")
            setModalSubtitle("This is how the delete confirmation will appear. You’ll be reminded to confirm before a comment is permanently removed.")        
        } else {
            setModalMessage("Would you like to delete this comment?")
            setModalSubtitle("Your comment will be removed from the original post.") 

            setBlogId(postid);
            setCommentId(commentId);
        }

    }
    
    // Server | Deletes comment (within the profile page)
    const deleteComment = async () => {
        try {
            
            const response = await fetch(`${API_BASE_URL}/api/profile/${user}/${commentId}/${blogId}/delete`, {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
    
            if (!response.ok) {
                throw new Error('Failed to delete users comment');
            }
    
            // Clean up function clears the variables used by modal
            cleanUp();

        } catch (err) {
            console.error('Error deleting users comment:', err.message);
        }
    }

    // Clean up function to reset the variables used by modal
    const cleanUp = () => {
        setModalMessage('');
        setModalSubtitle('')
        setBlogId(-1);
        setCommentId(-1);
        setIsPost(false);
        setIsComment(false);
        cleanFunc(true);
    }
    
    return (

        <>
        <div className="blog-list">
            <h2>{title}</h2>
            
            {/* Displays comment version of results */}
            {comment ? 
                (<>
                {blogs.map((blog, index) => (
                    <div className="blog-preview" key={blog.id}>
                    <Link to={`/blogs/${blog.postid}`} >
                        {profile ? 
                        <h2
                            style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '75%', 
                                display: 'block'
                            }}
                        >{blog.body}</h2> 
                        : <><h2>{blog.body}</h2></>}
                        {/* If this is within profile page (it is your comments) otherwise returned from the search page */}
                        {profile ? <><p>Commented: {timestamp[index]}</p></> : <><p>Commented by {blog.author}</p></>}
                    </Link>
                    {profile ? 
                        <>
                            {/* Allows users to delete their comments through the profile page */}
                            <button onClick={() => (setIsComment(true) & confirmDeleteComment(blog.id, blog.postid))}>Delete</button>
                        </> 
                        : <></>}
                    </div>
                ))}
                </>)
            :
                (<>
                {/* Displays Blogs version of results */}
                {blogs.map((blog, index) => (
                    <div className="blog-preview" key={blog.id}>
                        <Link to={`/blogs/${blog.id}`} >
                        {profile ? 
                        <h2
                            style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '75%', 
                                display: 'block'
                            }}
                        >{blog.title}</h2> 
                        : <><h2>{blog.title}</h2></>}
                            {/* If this is within profile page (it is your blog) otherwise returned from the search page */}
                            {profile ? <><p>Posted: {timestamp[index]}</p></> : <><p>Written by {blog.author}</p></>}
                        </Link>
                        {profile ? 
                        <>
                            {/* Allows users to delete their blog through the profile page */}
                            <button onClick={() => (setIsPost(true) & confirmDeletePost(blog.id))}>Delete</button>
                        </> 
                        : <></>}
                    </div>
                ))}
                </>)
            }
        </div>

        <Notification isOpen={modalOpen} onClose={closeModal} message={modalMessage} subtitle={modalSubtitle} profile={true} deleteClicked={ isComment ? deleteComment : deletePost } guestUser={guestUser}/>
        </>

     );
}
 
export default BlogList;
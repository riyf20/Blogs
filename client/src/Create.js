import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "./ImageUploader";
import Guest, {guestSignUp} from "./Guest";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Create = ({ onAuthSuccess, guestUser }) => {
    // Navigation
    const navigate = useNavigate(); //Navigation

    // Blog details
    const [title, setTitle] = useState(''); // Blog => title
    const [body, setBody] = useState(''); // Blog => body
    const [images, setImages] = useState([]); //Blog => images

    // Blog logistics
    const [isPending, setIsPending] = useState(false); // Submitting to server
    const [error, setError] = useState(''); // Errors

    // Server | Submits blog entry 
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Blog details
        const author = localStorage.getItem('username');
        const token = localStorage.getItem('token');
        const blog = { title, body, author };

        // Conditional rendering 
        setIsPending(true);

        try {
            // Endpoint: Send blog post (text)
            const response = await fetch(`${API_BASE_URL}/api/blogs/post`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(blog)
            });

            const data = await response.json();

            if (response.ok) {
                // If the blog is successfully created, submit the images 
                if (images.length > 0) {
                    const uploadImages = images.map(image =>
                        fetch(`${API_BASE_URL}/api/images/upload`, {
                            method: 'POST',
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({ blogId: data.blogId, blogAuthor: author, imageBlob: image })
                        })
                    );
                    await Promise.all(uploadImages);
                }

                // Changes states and navigate to home page
                setIsPending(false);
                onAuthSuccess();
                navigate('/');
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="create">

            {/* Conditional guest component | Informational block for guest users */}
            {guestUser && 
                <Guest parentElement={'Create'}/>
            }

            <h1>Add a New Blog</h1>
            <form onSubmit={handleSubmit}>
                <label>Blog Title:</label>
                <input 
                    type="text" 
                    required
                    value={title}
                    placeholder="Title"
                    onChange={(e) => setTitle(e.target.value)}
                />
                
                <label>Blog Body:</label>
                <textarea 
                    required
                    rows={8}
                    value={body}
                    placeholder="Your amazing story here"
                    onChange={(e) => setBody(e.target.value)}
                ></textarea>

                {/* Custom image uploader | Send image array to be stored */}
                <ImageUploader setImages={setImages} />

                <br />
                <hr />
                <br />
            
                {!isPending &&
                    // Disables button and alerts guest users prior to clearing fields 
                    guestUser ? (
                        <>
                        <b>Signing up will clear your current draft</b>
                        <br />
                        <button type="button" onClick={() => guestSignUp(navigate)}>
                            Sign up to Post
                        </button>
                        </>
                    ) :
                
                    <button type="submit" disabled={guestUser} >Add Blog</button>
                }
                {isPending && <button disabled>Adding Blog...</button>}
                {error && <p className='error'>{error}</p>}
            </form>
        </div>
    );
};

export default Create;
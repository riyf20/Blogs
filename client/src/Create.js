import { useState } from "react";
import { useNavigate } from "react-router-dom";

const debug = false;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Create = ({onAuthSuccess}) => {

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit= async(e) => {
        e.preventDefault()

        const author = localStorage.getItem('user')
        const token = localStorage.getItem('token'); 
        const blog = {title, body, author}

        setIsPending(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/blogs/post`, {
                method:'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(blog)
            })
            
            const data = await response.json();

            if(response.ok) {
                {debug && console.log('new blog added')};
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
    }

    return ( 
        <div className="create">
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
            
                {!isPending && <button type="submit">Add Blog</button>}
                {isPending && <button disabled >Adding Blog...</button>}
                {error && <p className='error'>{error}</p>}

            </form>
            
        </div>
     );
}
 
export default Create;
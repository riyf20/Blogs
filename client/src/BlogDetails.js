import { useParams, useNavigate, Link } from "react-router-dom";
import useFetch from "./useFetch";
import React, { useState, useEffect } from "react";

const debug = false;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const BlogDetails = () => {
  const { id } = useParams();
  const { data: blog, error, isLoading } = useFetch(`${API_BASE_URL}/api/blogs/` + id);
  const navigate = useNavigate();
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const [body, setBody] = useState('');
  const [errorc, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsUpdated, setCommentsUpdated] = useState(false); 

  useEffect(() => {
    // Fetch existing comments for the blog
    {debug && console.log('Fetching comments for blog id = ' + id)};
  
    if (blog) {
      // Endpoint: Return all comments for specific blog
      fetch(`${API_BASE_URL}/api/blogs/${id}/comments`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch comments');
        }
        return res.json();
      })
      .then((data) => setComments(data))
      .catch((err) => console.error('Error fetching comments:', err));
    }
  }, [blog, id, token, commentsUpdated]);

// deletes blog + comments
  const handleClick = () => {
    // Endpoint: Delete blog [and its comments]
    fetch(`${API_BASE_URL}/api/blogs/delete/` + id, {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to delete the blog');
      }
      // Redirecting to home page after successful deletion
      navigate('/');
    })
    .catch((err) => {
      console.error('Error deleting the blog:', err.message);
    });
  };

  // deletes comment
  const handleDeleteComment = (id, postid) => {

    const comment = {id, postid}

    // Endpoint: Delete comment
    fetch(`${API_BASE_URL}/api/blogs/${id}/comments/delete` , {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(comment)
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to delete the comment');
      }
      // Redirecting to home page after successful deletion
      setComments([]); //clear comments --> reload
      setCommentsUpdated(prev => !prev);
    })
    .catch((err) => {
      console.error('Error deleting the comment:', err.message);
    });
  };

  // posts comment
  const handleComment = () => {

    const comment = { body, user, id };

    fetch(`${API_BASE_URL}/api/blogs/${id}/comment`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(comment)
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to delete the comment');
      }
      // Redirecting to home page after successful deletion
      setComments([]); //clear comments --> reload
      setCommentsUpdated(prev => !prev);
    })
    .catch((err) => {
      console.error('Error deleting the comment:', err.message);
    });
  };

  const formatText = (text) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {index > 0 && <br />}
        {parseHTML(line)}
      </React.Fragment>
    ));
  };

  const parseHTML = (htmlString) => {
    return <span dangerouslySetInnerHTML={{ __html: htmlString }} />;
  };

  return (
    <div className="blog-details">
      {isLoading && <div>Loading...</div>}
      {error && 
        <>
        <div>{error}</div>
        <Link to={'/'}>Return to home</Link>
        </>
      }
      {blog && (
        <article>
          <h2>{blog.title}</h2>
          <p>Written by: {blog.author}</p>
          <div className="artbody">{formatText(blog.body)}</div>
          <div className="buttonholder">
            {user === blog.author && (
              <button onClick={handleClick}>Delete</button>
            )}
          </div>

          <hr />
          {/* Display comments */}
          <div className="comments-section">
          <h3>Comments:</h3>
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <div key={index} className="comment-item">
                <p>
                  <strong>{comment.author}</strong>: {comment.body}
                </p>
                {comment.author === user && <button onClick={() => handleDeleteComment(comment.id, comment.postid)}>Delete</button> }
              </div>
            ))
          ) : (
            <p className="nocomment">No Comments</p>
          )}

          </div>
            <hr />
            <div className="comment">
              <form
                onSubmit={() => {
                  handleComment(); 
                }}
              >
                <textarea
                  required
                  rows={8}
                  value={body}
                  placeholder={comments.length > 0 ? 'Enter your comment' : 'Be the first to comment!'}
                  onChange={(e) => setBody(e.target.value)}
                ></textarea>
                <button type="submit">Comment</button>
              </form>
            </div>
          
          {errorc && <p className='error'>{errorc}</p>}

        </article>
      )}
    </div>
  );
};

export default BlogDetails;

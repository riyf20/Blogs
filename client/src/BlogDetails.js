import { useParams, useNavigate, Link } from "react-router-dom";
import useFetch from "./useFetch";
import React, { useState, useEffect } from "react";
import Notification from "./Notification";
import ImageUploader from "./ImageUploader";

const debug = false;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const BlogDetails = () => {
  // ID | Navigation
  const { id } = useParams();  // Blog ID 
  const navigate = useNavigate();  // Navigation

  // Origin Fetch
  const { data: blog, error, isLoading } = useFetch(`${API_BASE_URL}/api/blogs/` + id); 

  // User Details
  const user = localStorage.getItem('user');  
  const token = localStorage.getItem('token'); 

  // States
  const [body, setBody] = useState('');  // Blog post => Body
  const [errorc, setError] = useState('');  // Error message 
  const [comments, setComments] = useState([]);  // Blog post => Comments
  const [hasimages, setHasImages] = useState(false);  // Blog post => Images
  const [imageLoaded, setImageLoaded] = useState(false);  // Image render 
  const [images, setImages] = useState([]);  // Array of blog's images
  const [initialImages, setInitialImages] = useState([]);  // Initial set of images 
  const [deleteImages, setDeleteImages] = useState([]);  // Images marked for deletion
  const [newimages, setNewImages] = useState([]);  // New images added 
  const [commentsUpdated, setCommentsUpdated] = useState(false);  // Tracks if comments have been updated
  const [edit, setEdit] = useState(false);  // Toggle for edit mode
  const [editBody, setEditBody] = useState('');  // Content of the blog post in edit mode
  const [editComment, setEditComment] = useState(false);  // Toggle for comment edit mode
  const [editCommentIndex, setEditCommentIndex] = useState(-1);  // Index of the comment being edited
  const [editCommentBody, setCommentBody] = useState('');  // Content of the comment in edit mode
  const [modalOpen, setModalOpen] = useState(false);  // Controls the visibility of a modal
  const [modalMessage, setModalMessage] = useState('');  // Message to display in the modal
  const [pressTimer, setPressTimer] = useState(null);  // Timer for long-press actions (will be used for mobile implementation soon)
  const [currentIndex, setCurrentIndex] = useState(-1);  // Current index (For images)
  const [currentId, setCurrentId] = useState(-1);  // Current ID (For comments or images)
  const [updating, setUpdating] = useState(false);  // Tracks if the blog post is being updated (sent to server)

  // Modal
  const closeModal = () => setModalOpen(false);  // Function to close the modal

  useEffect(() => {
    if (blog) {
      // Fetch images 
      fetch(`${process.env.REACT_APP_API_BASE_URL}/api/blogs/${id}/images`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        // Will be used to display images
        setImages(data);

        // Used as backup when user makes edits
        setInitialImages(data);

        // Will be used to conditional messages (loading) if blog has images
        setHasImages(((data.length) > 0));
        setImageLoaded(hasimages);
      })


      // Fetch comments
      fetch(`${process.env.REACT_APP_API_BASE_URL}/api/blogs/${id}/comments`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => res.json())

      // set comments
      .then(data => setComments(data))
      .catch(err => console.error('Error fetching comments:', err));
    }
  }, [blog, id, token, commentsUpdated, editComment, hasimages, edit]);

  // Server | Deletes blog and assocaited comments
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
      // Redirecting to home page after deletion
      navigate('/');
    })
    .catch((err) => {
      console.error('Error deleting the blog:', err.message);
    });
  };

  // Toggles edit box
  const handleEdit = () => {
    setEditBody(blog.body);
    setEdit(!edit);
  };

  // Toggles edit box and resets images back to initial set
  const handleCancel = () => {
    setEdit(false)
    setImages(initialImages)

    // Reset array of images that was meant for deletion
    setDeleteImages([])
  };

  // Server | Deletes comment
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
      
      // Clear comments, will trigger reload
      setComments([]); 
      setCommentsUpdated(prev => !prev);
    })
    .catch((err) => {
      console.error('Error deleting the comment:', err.message);
    });
  };

  // Server | Posts comment
  const handleComment = () => {

    const comment = { body, user, id };

    // Endpoint: Post comment
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
        throw new Error('Failed to post the comment');
      }

      // Clear comments, will trigger reload
      setComments([]); 
      setCommentsUpdated(prev => !prev);
    })
    .catch((err) => {
      console.error('Error posting the comment:', err.message);
    });
  };

  // Server | Submits new edits (blog/images) to server
  const handleEditConfirm = async (e) => {
    e.preventDefault(); 

    // Attemping server connection, will be used to conditional rendering
    setUpdating(true)
  
    try {
      // Update the blog post first
      const edits = { editBody };
      const response = await fetch(`${API_BASE_URL}/api/blogs/${id}/update`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(edits)
      });
  
      if (response.ok) {
        // Will delete images if there are any within the array
        if (deleteImages.length > 0) {
          const removeimg = { images: deleteImages };
          const response2 = await fetch(`${API_BASE_URL}/api/blogs/${id}/images/delete`, {
            method: 'DELETE',
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(removeimg)
          });
  
          if (!response2.ok) {
            throw new Error('Failed to delete images');
          }
        }
  
        // Will add new images if inputted
        if (newimages.length > 0) {
          const uploadImages = newimages.map(image =>
            fetch(`${API_BASE_URL}/api/images/upload`, {
              method: 'POST',
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ blogId: id, blogAuthor: user, imageBlob: image })
            })
          );
          // Wait for all uploads to complete
          await Promise.all(uploadImages); 
        }
        
        // Update states on completion
        setUpdating(false)
        setHasImages(true); 
        setEdit(!edit)
      } else {
        // Blog post error
        throw new Error('Failed to update the blog post');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  // Server | Update comment
  const handleCommentConfirm = (id, postid) => {
    const comedits = {editCommentBody};
    fetch(`${API_BASE_URL}/api/blogs/${postid}/${id}/update`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(comedits)
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to update the comment');
      }
      // Close edit comment
      setEditComment(false);
    })
    .catch((err) => {
      console.error('Error updating the comment:', err.message);
    });
  }

  // Toggle comment edit
  const handleEditComment = (index) => {
    setEditCommentIndex(index);
    setEditComment(!editComment);
  };

  // Text formatting
  const formatText = (text) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {index > 0 && <br />}
        {parseHTML(line)}
      </React.Fragment>
    ));
  };

  // HTML parsing
  const parseHTML = (htmlString) => {
    return <span dangerouslySetInnerHTML={{ __html: htmlString }} />;
  };

  // Press timer (useful for mobile implementation later)
  const handleLongPress = (index, id) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
    }
    setPressTimer(
      setTimeout(() => {
        setCurrentIndex(index)
        setCurrentId(id)
        setModalMessage("Would you like to delete this picture?")
        setModalOpen(true)
      }, 200) 
    );
  };

  // Store index of image that will be deleted
  const deleteImageIndex = () => {
    setDeleteImages((currentImages) => [...currentImages, currentId]);
    setImages(prev => prev.filter((_, i) => i !== currentIndex));
  }

  // Mobile implementation later
  // const handlePressEnd = () => {
  //   if (pressTimer) {
  //     clearTimeout(pressTimer);
  //     setPressTimer(null);
  //   }
  // };

  return (
    <>
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
          {/* Toggles edit views */}
          <div className="editbox">
            <h2>{blog.title}</h2>
            {
              edit ? 
              <>
                {/* Textbox for editing blog body */}
                <textarea 
                  required
                  rows={8}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                >
                </textarea>
                {/* Layout for image editing */}
                <div className="editPiccontainer" style={{ position: 'relative' }}>
                  {images.length > 0 ? (
                      images.map((image, index) => (
                        // Loop through all images and map delete buttons
                          <div key={index} style={{ position: 'relative', display: 'inline-block', margin: '5px' }}>
                              <img
                                  src={`data:image/jpeg;base64,${image.image_blob}`}
                                  alt={`Blog Image ${index + 1}`}
                                  className="blog-image"
                                  style={{ width: '150px', height: 'auto', borderRadius: '8px' }}
                                  // Mobile feature later
                                  // onTouchStart={() => handleLongPress(index)}
                                  // onTouchEnd={handlePressEnd}
                                  // onMouseDown={() => handleLongPress(index)}
                                  // onMouseUp={handlePressEnd}
                              />
                              <button 
                                onClick={() => handleLongPress(index, image.id)} 
                                style={{
                                  position: 'absolute',
                                  top: '5px',
                                  right: '5px',
                                  backgroundColor: 'red',
                                  color: 'black',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '30px',
                                  height: '30px',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  zIndex: 10 
                                }}
                              >X</button>
                          </div>
                      ))
                  ) : (
                      // No images
                      <></>
                  )}
              </div>
              </>
              :
              <>
                {/* Regular view */}
                <p>Written by: {blog.author}</p>
                <div className="artbody" >{formatText(blog.body)}</div>
                <div className="piccontainer">
                    {/* Place images if present */}
                    {images.length > 0 ? 
                      (
                        imageLoaded ? 
                            (images.map((image, index) => (
                              <img
                                key={index}
                                src={`data:image/jpeg;base64,${image.image_blob}`}
                                alt={`Blog Image ${index + 1}`}
                                className="blog-image"
                              />
                            )))
                          :
                          // Will show loading if images have not rendered yet
                          (<>Images Loading...</>)
                      ) 
                    : 
                      (
                        //no images for this post
                        <></>
                      )}
                </div>
              </>
            }
          </div>

          {/* Buttons for blog editing/deleting if user is the author */}
          <div className="buttonholder">
            {user === blog.author && (
              
              // Conditional rendering: Normal edit buttons
              edit===false ? 
              (
                <>
                <button onClick={handleEdit}>Edit</button>
                <button id="deletebutton" onClick={handleClick}>Delete</button>
                </>
              ) 
              :
              (
                <>
                    {/* Conditional rendering: Will show updating if connecting to server */}
                    {updating ? 
                      <><button>Updating...</button></>
                      :
                      // Reusing imageuploader for new images + Cancel and confirm edits button
                      <> 
                        <ImageUploader setImages={setNewImages} appendingImages={true} /> {/* Pass setImages to ImageUploader */}
                        <button id="cancelbutton" onClick={handleCancel}>Cancel</button>
                        <button id="confirmbutton" onClick={handleEditConfirm}>Confirm</button>
                      </>
                    }
                </>
              )
            )}
          </div>


          <hr />
          {/* Comments Section */}
          <div className="comments-section">
          <h3>Comments:</h3>
          {comments.length > 0 ? (
            // Loop through comments
            comments.map((comment, index) => (
              <div key={index} className="comment-item">

                {editComment && index===editCommentIndex ?
                // Editor view if edit is toggled and it is for that specific comment (will only show if you are the author of that comment)
                <>
                  <textarea 
                    required
                    rows={3}
                    value={editCommentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                  >
                  </textarea>
                  <div className="comment-buttonholder">
                    {/* Cancel / Confirm edits to the comment */}
                    <button id="cancelbutton" onClick={() => handleEditComment(index)}>Cancel</button> 
                    <button id="confirmbutton" onClick={() => handleCommentConfirm(comment.id, comment.postid)}>Confirm</button> 
                  </div>
                </>
                :
                  // Display regular comments 
                  <>
                  <p>
                    <strong>{comment.author}</strong>: {comment.body}
                  </p>
                  {comment.author === user &&
                    <>
                    {/* Will show editing and deleting option if you are author */}
                    <div className="comment-buttonholder">
                      <button onClick={() => handleEditComment(index) & setCommentBody(comment.body)}>Edit</button> 
                      <button id="deletebutton" onClick={() => handleDeleteComment(comment.id, comment.postid)}>Delete</button> 
                    </div>
                    </>
                  }
                  </>
                }
              </div>
            ))
          ) : (
            // Blog does not have any comments
            <p className="nocomment">No Comments</p>
          )}

          </div>
            <hr />
            {/* Add comments section */}
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
                  // Conditional text if comments exist 
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

    {/* Modal used for image confirmation */}
    <Notification isOpen={modalOpen} onClose={closeModal} message={modalMessage} deleteClicked={deleteImageIndex}/>
    </>
  );
};

export default BlogDetails;

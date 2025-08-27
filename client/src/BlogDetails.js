import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useFetch from "./useFetch";
import Notification from "./Notification";
import ImageUploader from "./ImageUploader";

const debug = false;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const BlogDetails = ({guestUser}) => {
  // ID | Navigation
  const { id } = useParams();  // Blog ID 
  const navigate = useNavigate();  // Navigation

  // Original Fetch
  const { data: blog, error, isLoading, refetch } = useFetch(`${API_BASE_URL}/api/blogs/` + id); 

  // User Details
  const user = localStorage.getItem('username');  
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
  const [editTitle, setEditTitle] = useState('');  // Content of the blog post in edit mode
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
  const [notifType, setNotifType] = useState('images'); // Changes modal type for dynamic modal information
  const [confirmId, setConfirmId] = useState(-1) // Holds the comment's id
  const [confirmPostId, setConfirmPostId] = useState(-1) // Holds the postid of the comment (blog it was commented on)

  // Modal
  const closeModal = () => setModalOpen(false); 

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

  // Server | Deletes blog and associated comments
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
    setEditTitle(blog.title)
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
  const handleDeleteComment = () => {

    // Holds the comments id and blog id 
    const comment = {confirmId, confirmPostId}

    // Endpoint: Delete comment
    fetch(`${API_BASE_URL}/api/blogs/${confirmPostId}/comments/delete` , {
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
      
      // Clear comments and triggers reload
      setComments([]); 
      setCommentsUpdated(prev => !prev);
    })
    .catch((err) => {
      console.error('Error deleting the comment:', err.message);
    });
  };

  // Server | Posts comment
  const handleComment = () => {

    // Comment details
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

      // Clear comments and will trigger reload
      setComments([]); 
      setCommentsUpdated(prev => !prev);
    })
    .catch((err) => {
      console.error('Error posting the comment:', err.message);
    });
  };

  // Server | Submits new edits (blog/images) to server
  const handleEditConfirm = async () => {

    // Attemping server connection, will be used to conditional rendering
    setUpdating(true)
  
    try {
      // Update the blog post first
      const response = await fetch(`${API_BASE_URL}/api/blogs/${id}/update`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({editBody, editTitle})
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
        refetch()
      } else {
        // Blog post error
        throw new Error('Failed to update the blog post');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  // Store index of image that will be deleted
  const deleteImageIndex = () => {
    setDeleteImages((currentImages) => [...currentImages, currentId]);
    setImages(prev => prev.filter((_, i) => i !== currentIndex));
  }

  // Server | Update comment
  const handleCommentConfirm = () => {

    // Grab comment and blog ids
    const postid = confirmPostId;
    const id = confirmId;
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
    setNotifType('images')
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

  // Mobile implementation later
  // const handlePressEnd = () => {
  //   if (pressTimer) {
  //     clearTimeout(pressTimer);
  //     setPressTimer(null);
  //   }
  // };

  // Reuseable function for Modal
  const notifSetup = (type, id, postid) => {
    if(type===1) {
      // Type 1: Editing blog post
      setNotifType('blogEdit');
      setModalMessage("Confirm these changes to your blog post?")

    } else if(type===2) {
      // Type 2: Editing comment
      setConfirmId(id);
      setConfirmPostId(postid);
      setNotifType('commentEdit');
      setModalMessage("Confirm these changes to your comment?")

    } else if(type===3) {
      // Type 3: Deleting blog post
      setNotifType('blogDelete');
      setModalMessage("Are you sure you want to delete this post?")

    } else if(type===4) {
      // Type 4: Deleting comment
      setConfirmId(id);
      setConfirmPostId(postid);
      setNotifType('commentDelete');
      setModalMessage("Are you sure you want to delete your comment?")
    }
    setModalOpen(true);
  }

  // Changes the main confirm button function based on notification type of the modal
  const notifTypeFunction = () => {
    if(notifType === 'images') {
      deleteImageIndex();
    } else if (notifType === 'blogEdit') {
      handleEditConfirm();
    } else if(notifType === 'blogDelete') {
      handleClick();
    } else if(notifType === 'commentDelete') {
      handleDeleteComment();
    } else if (notifType === 'commentEdit') {
      handleCommentConfirm();
    }
  }

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
            {
              edit ? 
              <>
                <input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                >
                </input>
              
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
                <h2>{blog.title}</h2>
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
                                src={`data:image/jpeg;base64,${image.image_blob}`}  //{image.fileUrl?.startsWith("file://") ? image.base64 : image.fileUrl}
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
                <button id="deletebutton" onClick={() => notifSetup(3)}>Delete</button>
                {/* will reroute to the handleClick function*/}
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
                        <button id="confirmbutton" onClick={() => notifSetup(1)}>Confirm</button>
                        <button id="cancelbutton" onClick={handleCancel}>Cancel</button> 
                        {/* will reroute to the handleEditConfirm function*/}
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
                    <button id="confirmbutton" onClick={() => notifSetup(2, comment.id, comment.postid)}>Confirm</button> 
                    {/* will reroute to the handleCommentConfirm(comment.id, comment.postid) function*/}
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
                      <button id="deletebutton" onClick={() => notifSetup(4, comment.id, comment.postid) }>Delete</button> 
                      {/* will reroute to the handleDeleteComment(comment.id, comment.postid) function*/}
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
                {/* Disables button for guest users */}
                <button type="submit" disabled={guestUser}
                  style={{width: guestUser ? '300px' : ''}}
                > {guestUser ? 'Sign up to add your own comments!' : 'Comment'}</button>
              </form>
            </div>
          
          {errorc && <p className='error'>{errorc}</p>}

        </article>
      )}
      
    </div>

    {/* Modal used for user confirmation */}
    <Notification isOpen={modalOpen} onClose={closeModal} message={modalMessage} deleteClicked={notifTypeFunction} edits={ (notifType==='blogEdit' || notifType==='commentEdit') ? true : false}/>
    </>
  );
};

export default BlogDetails;

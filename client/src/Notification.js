import React from 'react';

const Notification = ({ isOpen, onClose, message, subtitle, deleteClicked, confirm, profile, edits }) => {
  if (!isOpen) return null;
  
  const handleDeleteClick = () => {
    // Trigger the delete action
    deleteClicked();  
    
    // Close the modal
    onClose();        
  };

  const handleConfirm = () => {
    confirm();

    // Close the modal
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {profile ? 
          // Shows warning and subtitle if within profile page
          <>
          <h3>{message}</h3>
          <br />
          <h5>{subtitle}</h5>
          </>
          :
          <p>{message}</p>}
        <div className='modal-buttons'>
            <button id='modalcancel' onClick={onClose}>Cancel</button>
              {edits ?
              // If modal is being used for edits, "confirm" will be main action
              <><button id='profileSave' onClick={handleDeleteClick}>Confirm</button></>
              :
              // If modal is being used for deleting, "delete" will be main action
              <><button id='modaldelete' onClick={handleDeleteClick}>Delete</button></>
              }
        </div>
      </div>
    </div>
  );
};

export default Notification;
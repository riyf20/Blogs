import React from 'react';

const Notification = ({ isOpen, onClose, message, deleteClicked }) => {
  if (!isOpen) return null;
  
  const handleDeleteClick = () => {
    // Trigger the delete action
    deleteClicked();  
    
    // Close the modal
    onClose();        
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className='modal-buttons'>
            <button id='modalcancel' onClick={onClose}>Cancel</button>
            <button id='modaldelete' onClick={handleDeleteClick}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
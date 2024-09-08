import React, { useState } from 'react';

const ImageUploader = ({ setImages, appendingImages }) => {
    // Preview of images
    const [previewUrls, setPreviewUrls] = useState([]);

    // Image added
    const handleImageChange = async (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            const fileArray = Array.from(files);

            // Will need to use base64 to store in aws database 
            const base64Array = await Promise.all(fileArray.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    // Stores only the base64 section
                    reader.onload = () => resolve(reader.result.split(',')[1]); 
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }));

            // Append the new images to the existing ones
            setPreviewUrls(prevUrls => [...prevUrls, ...base64Array.map(base64 => `data:image/jpeg;base64,${base64}`)]);
            setImages(prevImages => [...prevImages, ...base64Array]);
        }
    };

    // Image removed
    const handleRemoveImage = (index) => {
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // Helper for custom button
    const handleButtonClick = () => {
        document.getElementById('imageUpload').click();
    };

    return (
        <div className='imguploader'>
            {/* Appending images conditional for existing blogs  */}
            {appendingImages ? 
            <>
            <div className='disclaimer'>
                <h3>Add Images:</h3>
                <p>Max Image size: 20mb</p>
            </div>
            </>
            :
            <>
            <div className='disclaimer'>
                <label htmlFor="imageUpload">Upload Images:</label>
                <p>Max Image size: 20mb</p>
            </div>
            </>
        }
            <input 
                type="file" 
                id="imageUpload" 
                accept="image/*" 
                multiple 
                onChange={handleImageChange}
                // Hides the default input, replace with custom button and helper
                style={{ display: 'none' }} 
            />

            <button 
                type="button" 
                onClick={handleButtonClick}
            >
                Choose Image
            </button>

            {/* Image previews */}
            {previewUrls.length > 0 && (
                <div className='previewcontainer'>
                    <h4>Image Previews:</h4>
                    <br />
                    {/* Map over images to preview | Conditional rendering if being display for new/existing blog */}
                    <div className='previmages' style={ appendingImages ? {display: 'flex', justifyContent:'flex-start', marginTop: '-10px', marginBottom: '-20px'}: {}}>
                        {previewUrls.map((url, index) => (
                            <div className={appendingImages ? 'editPiccontainer' : ''} key={index} style={{ position: 'relative', display: 'inline-block' }}>
                                <img 
                                    src={url} 
                                    alt={`Preview ${index}`} 
                                    style={{ width: `${appendingImages ? '150px' : '250px'}` , height: 'auto', borderRadius: '8px' }} 
                                />
                                <button 
                                    onClick={() => handleRemoveImage(index)} 
                                    style={
                                        appendingImages ? 
                                        {
                                            position: 'absolute',
                                            top: '0px',
                                            right: '0px',
                                            backgroundColor: 'red',
                                            color: 'black',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '30px',
                                            height: '30px',
                                            cursor: 'pointer'
                                        }
                                        :
                                        {
                                            position: 'absolute',
                                            top: '5px',
                                            right: '5px',
                                            backgroundColor: 'red',
                                            color: 'black',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '30px',
                                            height: '30px',
                                            cursor: 'pointer'
                                        }
                                    }
                                >
                                    X
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
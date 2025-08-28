require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');  // Will use for authentication
const bcrypt = require('bcrypt');  // Hash passwords for security
const jwt = require('jsonwebtoken');  // Generating JWT tokens

const allowedOrigins = [
  process.env.REACT_APP_API_BASE_URL,  
  process.env.REACT_APP_API_BASE_URL_PROD  
];

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {  
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
};
app.options('*', cors(corsOptions));  
app.use(cors(corsOptions)); 


const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Used for global console debugging 
const debug = false; 
let db; 

// Connection attempt
if (debug) {
  // Connects to local database for internal functions
  db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to the local database:', err);
      throw err;
    }
    console.log('Connected to Local RDS database');
  });

} else {
  // Connects to main database for public functions
  db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      throw err;
    }
  });
}



// Login user
app.post('/api/login', (req, res) => {
    // {debug && console.log("logging in")};
    const { username, password, type } = req.body;
  
    db.query('SELECT * FROM Users WHERE username = ?', [username], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching user' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const user = results[0];
  
      // Compare provided password with stored hashed password
      const match = await bcrypt.compare(password, user.password_hash);
  
      if (match) {
        // New payload object
        const tokenPayload = {
          id: user.id,
          username: user.username,
          role: 'user',
          isGuest: false,
        };

        // Generate JWT token
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(tokenPayload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

        {debug && console.log("15 minute acces to user = ", username )}

        // Store refresh token in DB
        db.query('INSERT INTO RefreshTokens (userId, token, type, expiresAt) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [user.id, refreshToken, type], (err) => {
          if (err) {
            console.error('Error storing refresh token:', err);
            return res.status(500).json({ message: 'Internal server error' });
          }

          // Send tokens to client only after successful DB insert
          res.json({ token, username: user.username, user: tokenPayload, refreshToken });
        });

      } else {
        res.status(401).json({ message: 'Incorrect password' });
      }
    });
});

app.post('/api/refreshtoken', (req, res) => {
  const { refreshToken, userID, username } = req.body;

  db.query('SELECT * FROM RefreshTokens WHERE userid = ? AND token = ?', [userID, refreshToken], (err, results) => {
    if (err) {
      console.error('Refresh token error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

   jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        console.log(refreshToken)
        console.log("Refresh token invalid or expired:", err.message);
        return res.status(403).json({ message: 'Refresh token expired or invalid' });
      }
      const tokenPayload = {
        id: userID,
        username,
        role: 'user',
        isGuest: false,
      };

      const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });

     {debug && console.log("Refresh token valid — 15min access to user = ", username)}
      res.json({ newToken });
    });
  });
})

// Logs in Guest user | Generates token
app.post('/api/login/guest-mode', (req, res) => {

    const guestUser = {
      id: `guest-${Date.now()}`,
      role: 'guest',
      isGuest: true,
    };
    
    const token = jwt.sign(guestUser, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: guestUser });
});

// Register new user
app.post('/api/register', async (req, res) => {
    {debug && console.log('register attempt')};
    const { username, password, email, firstName, lastName } = req.body;
  
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Store the user with the hashed password (and original just in case)
      db.query(
        'INSERT INTO Users (`username`, `password_hash`, `password_txt`, `email`, `first_name`, `last_name`) VALUES (?, ?, ?, ?, ?, ?)',
        [username, hashedPassword, password, email, firstName, lastName],
        (err, results) => {
          if (err) {
            return res.status(500).json({ message: 'Error registering user' });
          }
          res.status(201).json({ message: 'User registered successfully!' });
        }
      );
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
});

// Middleware function to authenticate JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      {debug && console.log("token not found")};
      return res.status(401).json({ message: 'No token provided' });
    }
  
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }
  
      req.user = user;
      next();
    });
};
  
// Endpoint: Return all blogs
app.get('/api/blogs', (req, res) => {
    db.query('SELECT * FROM Blogs', (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching blogs' });
        }
        res.json(results);
    });
});

// Endpoint: Return specific blog by ID
app.get('/api/blogs/:id', (req, res) => {
    const blogId = req.params.id;
    db.query('SELECT * FROM Blogs WHERE id = ?', [blogId], (err, results) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching blog' });
        }
        if (results.length === 0) {
          return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(results[0]);
    });
});

// Endpoint: Delete blog [and its comments]
app.delete('/api/blogs/delete/:id', authenticateToken, (req, res) => {
  const blogId = req.params.id;

  // Start full transaction
  db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error starting transaction' });
      }

      // Move comments to DeletedComments table
      db.query(
          'INSERT INTO DeletedComments (author, body, postid) SELECT author, body, postid FROM Comments WHERE postid = ?',
          [blogId],
          (err, results) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ message: 'Error moving comments to DeletedComments' });
                });
              }

              // Delete comments from Comments table
              db.query('DELETE FROM Comments WHERE postid = ?', [blogId], (err, results) => {
                  if (err) {
                      return db.rollback(() => {
                        res.status(500).json({ message: 'Error deleting comments' });
                      });
                  }

                  // Move the blog to DeletedBlogs table
                  db.query(
                      'INSERT INTO DeletedBlogs (id, title, body, author) SELECT id, title, body, author FROM Blogs WHERE id = ?',
                      [blogId],
                      (err, results) => {
                          if (err) {
                            return db.rollback(() => {
                              res.status(500).json({ message: 'Error moving blog to DeletedBlogs' });
                            });
                          }

                          // Delete the blog from Blogs table
                          db.query('DELETE FROM Blogs WHERE id = ?', [blogId], (err, results) => {
                              if (err) {
                                return db.rollback(() => {
                                  res.status(500).json({ message: 'Error deleting blog' });
                                });
                              }

                              // No isses --> Commit the transaction
                              db.commit((err) => {
                                  if (err) {
                                    return db.rollback(() => {
                                      res.status(500).json({ message: 'Error committing transaction' });
                                    });
                                  }

                                  // Successful deletion
                                  res.json({ message: 'Blog and related comments deleted successfully!' });
                              });
                          });
                      }
                  );
              });
          }
      );
  });
});

// Endpoint: Delete comment
app.delete('/api/blogs/:id/comments/delete', authenticateToken, (req, res) => {
  const {confirmId, confirmPostId} = req.body;

  // Start full transaction
  db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error starting transaction' });
      }

      // Move comments to Deletecomments table
      db.query(
        'INSERT INTO DeletedComments (author, body, postid) SELECT author, body, postid FROM Comments WHERE id = ? AND postid = ?',
        [confirmId, confirmPostId],
        (err, results) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ message: 'Error moving comment to DeletedComments' });
            });
          }

          // Delete from Comments
          db.query('DELETE FROM Comments WHERE id = ? AND postid = ?', [confirmId, confirmPostId], (err, results) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ message: 'Error deleting comment' });
                });
              }

              // No issues --> Commit the transaction
              db.commit((err) => {
                  if (err) {
                    return db.rollback(() => {
                      res.status(500).json({ message: 'Error committing transaction' });
                    });
                  }

                  // Successful deletion
                  res.json({ message: 'Comment deleted successfully!' });
              });
          });
        }
      );
  });
});

// Endpoint: Post new blog
app.post('/api/blogs/post', authenticateToken, (req, res) => {
    const { title, body, author } = req.body;

    db.query(
        'INSERT INTO `Blogs` (`title`, `body`, `author`) VALUES (?, ?, ?)', 
        [title, body, author], 
        (err, results) => {
            if (err) {
              console.error('Error inserting new blog:', err);
              return res.status(500).json({ message: 'Error inserting new blog' });
            }

            // Successful insertion
            res.status(201).json({
              message: 'New blog created successfully!',
              blogId: results.insertId,
            });
        }
    );
});

// Endpoint: Post images for blog
app.post('/api/images/upload', authenticateToken, (req, res) => {
  const { blogId, blogAuthor, imageBlob, fileUri } = req.body;

  // Uses base64 for images
  const buffer = Buffer.from(imageBlob, 'base64');

  db.query(
    'INSERT INTO `Images` (`blogid`, `author`, `image_blob`, `fileUrl`) VALUES (?, ?, ?, ?)', 
    [blogId, blogAuthor, buffer, fileUri], 
    (err, results) => {
      if (err) {
        console.error('Error inserting new image:', err);
        return res.status(500).json({ message: 'Error inserting new image' });
      }

      // Successful insertion
      res.status(201).json({
        message: 'Image uploaded successfully!',
        imageId: results.insertId,
      });
    }
  );
});

// Endpoint: Post a comment
app.post('/api/blogs/:id/comment', authenticateToken, (req, res) => {
  const blogId = req.params.id; 
  const { body, user } = req.body; 

  db.query(
      'INSERT INTO `Comments` (`author`, `body`, `postid`) VALUES (?,?,?)',
      [user, body, blogId],
      (err, results) => {
        if (err) {
          console.error('Error inserting comment:', err);
          return res.status(500).json({ message: 'Error inserting comment' });
        }

        // Successful insertion
        res.status(201).json({
          message: 'New comment entered successfully!',
        });
    }
  );
});

// Endpoint: Return all comments for specific blog
app.get('/api/blogs/:id/comments', (req, res) => {
  const id = req.params.id;

  db.query('SELECT * FROM Comments WHERE postid = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching comments' });
    }
    res.json(results);
  });
});

// Endpoint: Return all images for specific blog
app.get('/api/blogs/:id/images', (req, res) => {
  const id = req.params.id;

  db.query('SELECT * FROM Images WHERE blogid = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching images' });
    }

    // Convert buffer to base64
    const images = results.map(result => ({
      ...result,
      image_blob: result.image_blob.toString('base64')
    }));
    res.json(images);
  });
});

// Endpoint: Delete Images
app.delete('/api/blogs/:id/images/delete', authenticateToken, async (req, res) => {
  const blogId = req.params.id; 
  const { images } = req.body; 

  if (!Array.isArray(images)) {
    return res.status(400).json({ error: 'Invalid request body' });

  }
  // Can handle multiple images
  try {
    // Use helper function to delete
    await deleteImagesFromDatabase(blogId, images);
    res.status(200).send({message: 'Images deleted successfully'});
  } catch (err) {
    console.error('Error deleting images:', err);
    res.status(500).send({message: 'Failed to delete images'});
  }
});

// Endpoint [Helper]: Delete images from array
async function deleteImagesFromDatabase(blogId, imageIds) {
  const query = 
  `DELETE FROM Images
  WHERE blogid = ? AND id IN (?)`;

  return new Promise((resolve, reject) => {
    db.query(query, [blogId, imageIds], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return reject(err);
      }
      resolve(results);
    });
  });
}

// Endpoint: Updates blog details
app.post('/api/blogs/:id/update', (req, res) => {
  const id = req.params.id;
  const { editBody, editTitle } = req.body; 

    db.query('UPDATE `Blogs` set body=?, title=? where id=? ', [editBody, editTitle, id], (err, results) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      res.json(results);
    });

})

// Endpoint: Updates comments
app.post('/api/blogs/:postid/:id/update', authenticateToken, (req, res) => {
  const postid = req.params.postid
  const id = req.params.id
  const {editCommentBody} = req.body;

  db.query('UPDATE `Comments` set body=? where postid=? AND id=?', [editCommentBody, postid, id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json(results);
  });
})

// Endpoint: Returns search results
app.get('/api/search', (req, res) => {
  const type = req.query.type;
  const field = req.query.field;

  // Search in comments
  if(type === 'comments') {
    db.query(`SELECT * FROM Comments WHERE body LIKE '%${field}%'`, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error during search [comments]' });
      }
      res.json(results);
    });

  } else if (type=='profile') {
    db.query(`SELECT * FROM Comments WHERE author='${field}'`, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error during search [comments]' });
      }
      res.json(results);
    });
  } else {
    // Search by author, title, or body
    db.query(`SELECT * FROM Blogs WHERE ${type} LIKE '%${field}%'`, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error during search [blog]' });
      }
      res.json(results);
    });
  }
})

// Endpoint: Grabs user profile data
app.get('/api/:user/data', (req, res) => {
  const user = req.params.user;

  db.query(`SELECT * FROM Users WHERE username='${user}'`, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error during profile request' });
    }
    res.json(results)
  })
})

// Endpoint: Updates user profile data
app.post('/api/profile/:user/:userID/update',authenticateToken, async (req, res) => {
    const user = req.params.user;
    const userid = req.params.userID;
    const { fName, lName, userName, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            `UPDATE Users SET 
               first_name = ?, 
               last_name = ?, 
               username = ?, 
               email = ?, 
               password_txt = ?, 
               password_hash = ? 
             WHERE username = ? AND id = ?`,
            [fName, lName, userName, email, password, hashedPassword, user, userid],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'Error updating user profile' });
                }
                res.json(results);
            }
        );
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Endpoint: Delete post via profile page
app.delete('/api/profile/:user/:blogId/delete', authenticateToken, async (req, res) => {
  const blogId = req.params.blogId; 
  const user = req.params.user;

  db.query(
    'DELETE FROM Blogs WHERE author=? AND id=?', 
    [user, blogId], 
    (err, results) => {
        if (err) {
          console.error('Error deleting blog from profile page:', err);
          return res.status(500).json({ message: 'Error deleting blog from profile page' });
        }

        // Successful insertion
        res.status(201).json({
          message: 'Blog deleted from profile - success!',
        });
    }
  );

});

// Endpoint: Delete comment via profile page
app.delete('/api/profile/:user/:commentId/:postid/delete', authenticateToken, async (req, res) => {
  const commentId = req.params.commentId; 
  const postid = req.params.postid;
  const user = req.params.user;
  
  db.query(
    'DELETE FROM Comments WHERE author=? AND postid=? AND id=?', 
    [user, postid, commentId], 
    (err, results) => {
        if (err) {
          console.error('Error deleting comment from profile page:', err);
          return res.status(500).json({ message: 'Error deleting comment from profile page' });
        }

        // Successful insertion
        res.status(201).json({
          message: 'Comment deleted from profile - success!',
        });
    }
  );

});

// Endpoint: Reports a comment
app.post('/api/blogs/:postId/:commentId/report', authenticateToken, (req, res) => {
  const postId = req.params.postId; 
  const commentId = req.params.commentId; 
  const { userId, username } = req.body; 

  db.query(
    'INSERT INTO `ReportedComments` (`user_id`, `username`, `postid`, `commentid`) VALUES (?,?,?,?)',
    [userId, username, postId, commentId],
    (err, results) => {
      if (err) {
        console.error('Error reporting comment:', err);
        return res.status(500).json({ message: 'Error reporting comment' });
      }

      // Successful insertion
      res.status(201).json({
        message: 'Comment reported successfully!',
      });
    }
  );
});

// Endpoint: Reports a blog
app.post('/api/blogs/:blogId/report', authenticateToken, (req, res) => {
  const blogId = req.params.blogId; 
  const { userId, username } = req.body; 

  db.query(
    'INSERT INTO `ReportedBlogs` (`user_id`, `username`, `blogid`) VALUES (?,?,?)',
    [userId, username, blogId],
    (err, results) => {
      if (err) {
        console.error('Error reporting comment:', err);
        return res.status(500).json({ message: 'Error reporting blog' });
      }

      // Successful insertion
      res.status(201).json({
        message: 'Blog reported successfully!',
      });
    }
  );
});

app.post('/api/refreshtoken/delete', authenticateToken, (req, res) => {
  const { refreshToken, userID } = req.body;
  
  db.query('DELETE from RefreshTokens where userid=? AND token=?', [userID, refreshToken], (err, results) => {
      if (err) {
        res.status(500).json({ message: 'Error deleting refresh token' });
      }

      // Successful deletion
      res.json({ message: 'Refresh token deleted successfully!' });
  });
})

// { debug &&
//   // If debug is true will use localhost 
//   app.listen(3001, () => {
//     console.log('Server is running on port 3001')
//   });
//   // app.listen(3001, '0.0.0.0', () => {
//   //  console.log('Server is running on port 3001')
//   // });
// };

module.exports = app;

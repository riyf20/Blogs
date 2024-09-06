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
app.use(express.json());
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

const debug = false; //used for global console debugging 

// creates connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// connection attempt
db.connect((err) => {
    if (err) throw err;
    {debug && console.log('Connected to RDS database')};
});

// Login user
app.post('/api/login', (req, res) => {
    {debug && console.log("logging in")};
    const { username, password } = req.body;
  
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
        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
  
        // Send the token to the client
        res.json({ token });
      } else {
        res.status(401).json({ message: 'Incorrect password' });
      }
    });
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
  const {id, postid} = req.body;

  // Start full transaction
  db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error starting transaction' });
      }

      // Move comments to Deletecomments table
      db.query(
        'INSERT INTO DeletedComments (author, body, postid) SELECT author, body, postid FROM Comments WHERE id = ? AND postid = ?',
        [id, postid],
        (err, results) => {
          if (err) {
            return db.rollback(() => {
              res.status(500).json({ message: 'Error moving comment to DeletedComments' });
            });
          }

          // Delete from Comments
          db.query('DELETE FROM Comments WHERE id = ? AND postid = ?', [id, postid], (err, results) => {
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

app.post('/api/blogs/:id/update', (req, res) => {
  const id = req.params.id;
  const { editBody } = req.body; 

  
  // console.log(`UPDATE 'Blogs' set body=${editBody} where id=${id}`);
  db.query('UPDATE `Blogs` set body=? where id=? ', [editBody, id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching comments' });
    }
    res.json(results);
  });

})

app.get('/api/search', (req, res) => {
  const type = req.query.type;
  const field = req.query.field;

  if(type === 'comments') {
    db.query(`SELECT * FROM Comments WHERE body LIKE '%${field}%'`, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error during search [comments]' });
      }
      res.json(results);
    });

  } else {
    db.query(`SELECT * FROM Blogs WHERE ${type} LIKE '%${field}%'`, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error during search [blog]' });
      }
      res.json(results);
    });
  }

})

{ debug &&
app.listen(3001, () => {
   console.log('Server is running on port 3001')
});
};

module.exports = app;

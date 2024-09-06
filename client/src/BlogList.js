import { Link } from "react-router-dom";

const BlogList = ({blogs, title, comment}) => {

    console.log(comment)
    return (

        <div className="blog-list">
            <h2>{title}</h2>
            
            {comment ? 
                (<>
                {blogs.map((blog) => (
                    <div className="blog-preview" key={blog.id}>
                    <Link to={`/blogs/${blog.postid}`} >
                        <h2>{blog.body}</h2>
                        <p>Commented by {blog.author}</p>
                    </Link>
                    </div>
                ))}
                </>)
            :
                (<>
                {blogs.map((blog) => (
                    <div className="blog-preview" key={blog.id}>
                        <Link to={`/blogs/${blog.id}`} >
                            <h2>{blog.title}</h2>
                            <p>Written by {blog.author}</p>
                        </Link>
                    </div>
                ))}
                </>)
            }
        </div>
     );
}
 
export default BlogList;
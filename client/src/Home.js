import BlogList from "./BlogList";
import useFetch from "./useFetch";
import { Link } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Home = () => {

    const {data: blogs, isLoading, error} = useFetch(`${API_BASE_URL}/api/blogs`); 

    return ( 
    <div className="Home">
        {error && 
        <>
        <div>{error}</div>
        <Link to={'/'}>Return to home</Link>
        </>
        }
        {isLoading && <div> Loading...</div> }
        {blogs && <BlogList blogs={blogs} title="All-Blogs" />}
    </div> 
    );
}
 
export default Home;
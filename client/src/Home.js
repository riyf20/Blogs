import BlogList from "./BlogList";
import useFetch from "./useFetch";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Guest from "./Guest";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Home = ({guestUser}) => {

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

        {/* Conditional guest component | Informational block for guest users */}
        {guestUser && 
            <Guest parentElement={'Home'}/>
        }
        
        {blogs && <BlogList blogs={blogs} title="All-Blogs" />}
    </div> 
    );
}
 
export default Home;
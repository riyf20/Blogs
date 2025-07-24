import React, { useState } from 'react'
import BlogList from './BlogList'
import Guest from "./Guest";

const Search = ({guestUser}) => {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const token = localStorage.getItem('token');

    const [query, setQuery] = useState('');
    const [queryType, setQueryType] = useState('author');
    const [searchResults, setSearchResults] = useState([]);
    const [comment, setComment] = useState(false);
    const [count, setCount] = useState(0);

    const searchQuery = (e) => {
        e.preventDefault()
        setCount(+1);

        const field = query;
        if(queryType==="comments") {
            setComment(true)
        } else {
            setComment(false)
        }
                
        fetch(`${API_BASE_URL}/api/search?type=${queryType}&field=${encodeURIComponent(field)}`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        })
        .then((res) => {
            if (!res.ok) {
                throw new Error('Failed to fetch comments');
            }
            return res.json();
        })
        .then((data) => setSearchResults(data))
    }


  return (
    <>
    <div className="search">

        {/* Conditional guest component | Informational block for guest users */}
        {guestUser && 
            <Guest parentElement={'Search'}/>
        }

        <h1>Search for a Blog or Comment</h1>
        <form onSubmit={searchQuery}>
            <div>
            <label>Search</label>
            <input 
                type="text" 
                required
                value={query}
                placeholder='Search'
                onChange={(e) => setQuery(e.target.value)}
            />
            <label>Search by: </label>
            <select
                id="querytype"
                name="queryType"
                value={queryType} 
                onChange={(e) => setQueryType(e.target.value)} 
            >
                <option value="author">Author</option>
                <option value="title">Title</option>
                <option value="body">Body</option>
                <option value="comments">Comments</option>
            </select>
            </div>
            <button>Search</button>
        </form>
    </div>
    <br />
    <hr />
    <br />

    <div className='searchResults'>
        <h2>Search Results</h2>
        
        { searchResults.length > 0
        ? 
            (
                <BlogList blogs={searchResults} comment={comment} />
            ) 
        :  
            (
                <><br /> {count > 0 ? <h4>No Results Found</h4> : <h4>Enter a search query above</h4> }</>
            )
        }
    </div>
    </>
  )
}

export default Search
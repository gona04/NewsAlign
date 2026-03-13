import React, { useEffect, useState } from "react";
import './news.css';
const API_URL = process.env.REACT_APP_API_URL;

function News() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    console.log(`${API_URL}/api/news`);
    fetch(`${API_URL}/api/news`)
      .then((data) => {
        return data.json();
      })
      .then((data) => {
        console.log(data.data);
        setNews(data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return (
    <div className="app-container">
      <ul>
        {news.map((d, i) => {
          return <li className="news-item" key={i}>{d}</li>;
        })}
      </ul>
    </div>
  );
}

export default News;

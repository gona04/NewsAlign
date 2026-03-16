import React, { useEffect, useState } from 'react';
import './news.css';

const API_URL = process.env.REACT_APP_API_URL;
const NEWS_CACHE_KEY = 'fact_checker_news';
const NEWS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function News() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Check sessionStorage cache first
        const cached = sessionStorage.getItem(NEWS_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < NEWS_CACHE_TTL) {
            setNews(data);
            return;
          }
        }

        const response = await fetch(`${API_URL}/api/news`);
        const result = await response.json();
        setNews(result.data);

        // Cache the result
        sessionStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({
          data: result.data,
          timestamp: Date.now(),
        }));
      } catch (error) {
        console.error(error);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="app-container">
      <ul>
        {news.map((d, i) => (
          <li className="news-item" key={i}>{d}</li>
        ))}
      </ul>
    </div>
  );
}

export default News;
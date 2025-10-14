import { useState, useEffect } from 'react';
import CreatePost from '../components/posts/CreatePost';
import PostCard from '../components/posts/PostCard';
import {API_BASE_URL} from '../config';

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts`);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <CreatePost onPostCreated={fetchPosts} />

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse">
            <div className="h-8 w-8 bg-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading posts...</p>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post._id} post={post} onUpdate={fetchPosts} />
        ))
      )}
    </div>
  );
}
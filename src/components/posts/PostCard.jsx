import { useState } from "react";
import { Heart, MessageCircle, Edit2, Trash2, Send } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { API_BASE_URL } from "../../config";

export default function PostCard({ post, onUpdate }) {
  const { user, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const isOwner =
    user?.id === post.author?._id || user?._id === post.author?._id;
  const isLiked =
    post.likes?.includes(user?.id) || post.likes?.includes(user?._id);

  const handleLike = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/posts/${post._id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdate();
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${post._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: editText }),
      });
      if (res.ok) {
        setIsEditing(false);
        onUpdate();
      }
    } catch (err) {
      console.error("Error updating post:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await fetch(`${API_BASE_URL}/api/posts/${post._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdate();
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await fetch(`${API_BASE_URL}/api/posts/${post._id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });
      setCommentText("");
      onUpdate();
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-4">
      <div className="p-4">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {post.author?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {post.author?.name || "Unknown User"}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-gray-500 hover:text-blue-600 transition p-1"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="text-gray-500 hover:text-red-600 transition p-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Post Content */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none"
              rows="3"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditText(post.text);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mb-3 text-gray-800 whitespace-pre-wrap">{post.text}</p>
        )}

        {/* Post Media */}
               {post.media && post.media.length > 0 && (
    <div className={`mb-3 grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {post.media.map((m, i) => (
            m.type === 'image' ? (
                <img 
                    key={i} 
                    src={`${API_BASE_URL}${m.url}`} 
                    alt="Post media" 
                    className="rounded-lg w-full h-auto object-cover max-h-96" 
                /> 
            ) : ( 
                <video 
                    key={i} 
                    src={`${API_BASE_URL}${m.url}`} 
                    controls 
                    className="rounded-lg w-full" 
                />
            )
        ))}
    </div>
)}
        {/* Post Actions */}
        <div className="flex items-center gap-6 pt-3 border-t border-gray-200">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition ${
              isLiked ? "text-red-600" : "text-gray-600 hover:text-red-600"
            }`}
          >
            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            <span className="font-medium">{post.likes?.length || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
          >
            <MessageCircle size={20} />
            <span className="font-medium">{post.comments?.length || 0}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <form onSubmit={handleComment} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              className="text-blue-600 hover:text-blue-700 transition p-2"
            >
              <Send size={20} />
            </button>
          </form>

          <div className="space-y-3">
            {post.comments?.map((c, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {c.author?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 bg-white p-3 rounded-lg">
                  <p className="font-semibold text-sm text-gray-900">
                    {c.author?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

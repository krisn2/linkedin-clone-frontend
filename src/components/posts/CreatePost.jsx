import { useState } from 'react';
import { Image, Video, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {API_BASE_URL} from '../../config'

export default function CreatePost({ onPostCreated }) {
  const { token } = useAuth();
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files.slice(0, 3)); // Max 3 images
  };

  const handleVideoChange = (e) => {
    setVideo(e.target.files[0]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('text', text);
    images.forEach(img => formData.append('images', img));
    if (video) formData.append('video', video);

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        setText('');
        setImages([]);
        setVideo(null);
        onPostCreated();
      } else {
        alert('Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Error creating post');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          rows="3"
          disabled={uploading}
        />

        {/* Preview selected images */}
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Preview selected video */}
        {video && (
          <div className="mt-3 relative">
            <video
              src={URL.createObjectURL(video)}
              className="w-full h-48 object-cover rounded"
              controls
            />
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex gap-2">
            <label className="cursor-pointer text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition flex items-center gap-1">
              <Image size={20} />
              <span className="text-sm hidden sm:inline">Photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={uploading || video}
              />
            </label>

            <label className="cursor-pointer text-green-600 hover:bg-green-50 p-2 rounded-lg transition flex items-center gap-1">
              <Video size={20} />
              <span className="text-sm hidden sm:inline">Video</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
                disabled={uploading || images.length > 0}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || uploading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
          >
            {uploading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
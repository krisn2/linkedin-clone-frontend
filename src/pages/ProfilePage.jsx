import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Camera } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ProfilePage() {
  const { user, token, logout, fetchCurrentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('headline', headline);
    formData.append('bio', bio);
    if (avatar) formData.append('avatar', avatar);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        await fetchCurrentUser();
        setIsEditing(false);
        setAvatar(null);
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Error updating profile');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        logout();
      } else {
        alert('Failed to delete account');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Error deleting account');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Cover Image */}
        <div className="h-40 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"></div>

        <div className="px-6 pb-6">
          {/* Profile Picture */}
          <div className="flex items-end justify-between -mt-20 mb-6">
            <div className="relative">
        
              {user?.avatar ? (
                <img 
                  src={`${API_BASE_URL}${user.avatar}`} 
                  alt={`${user.name}'s Avatar`} 
                  className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-4 border-white flex items-center justify-center text-5xl font-bold text-white shadow-lg">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg">
                  <Camera size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatar(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              onClick={() => {
                setIsEditing(!isEditing);
                if (isEditing) {
                  // Reset form
                  setName(user?.name || '');
                  setHeadline(user?.headline || '');
                  setBio(user?.bio || '');
                  setAvatar(null);
                }
              }}
              className="mt-20 px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Profile Content */}
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g., Full Stack Developer at Tech Corp"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows="5"
                />
              </div>

              {avatar && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-sm">
                  ✓ New profile picture selected: {avatar.name}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
              >
                {uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
              
              {user?.headline && (
                <p className="text-lg text-gray-600 mt-2">{user.headline}</p>
              )}

              {user?.bio && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{user.bio}</p>
                </div>
              )}

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-red-600 mb-3">Danger Zone</h3>
            <button
              onClick={handleDeleteAccount}
              className="w-full py-2.5 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
            >
              Delete Account
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This action cannot be undone. All your posts and data will be permanently deleted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import type { UserData } from "@/hooks/useAuth";

type Props = {
  user: UserData;
  darkMode: boolean;
  onClose: () => void;
  onUpdateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<any>;
};

export default function ProfilePage({ user, darkMode, onClose, onUpdateProfile }: Props) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const bgClass = darkMode ? 'bg-[#0F1419]' : 'bg-white';
  const borderClass = darkMode ? 'border-white/10' : 'border-gray-200';
  const textMuted = darkMode ? 'text-white/60' : 'text-gray-600';
  const inputBg = darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-300';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setMessage("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update profile
      const result = await onUpdateProfile({ photoURL });
      if (result.success) {
        setMessage("Avatar updated successfully!");
      } else {
        setMessage(result.error);
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const result = await onUpdateProfile({ displayName });
    setSaving(false);

    if (result.success) {
      setMessage("Profile updated successfully!");
    } else {
      setMessage(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${bgClass} border ${borderClass} rounded-xl max-w-lg w-full shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderClass}`}>
          <div>
            <h3 className="text-xl font-bold">Edit Profile</h3>
            <p className={`text-sm ${textMuted} mt-1`}>Update your personal information</p>
          </div>
          <button
            onClick={onClose}
            className={`p-1 hover:${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-lg transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
          {message && (
            <div className={`${message.includes('success') ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'} border rounded-lg p-3 text-sm`}>
              {message}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Upload Button Overlay */}
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-center">
              <p className={`text-sm font-medium`}>{user.displayName || "No name set"}</p>
              <p className={`text-xs ${textMuted}`}>{user.email}</p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className={`block text-sm font-medium ${textMuted} mb-2`}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}
              required
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className={`block text-sm font-medium ${textMuted} mb-2`}>
              Email Address
            </label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 ${darkMode ? 'text-white/50' : 'text-gray-500'} cursor-not-allowed`}
            />
          </div>

          {/* Account Info */}
          <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-lg p-4 space-y-2`}>
            <div className="flex justify-between text-sm">
              <span className={textMuted}>Account Created</span>
              <span className="font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={textMuted}>User ID</span>
              <span className="font-mono text-xs">{user.uid.slice(0, 12)}...</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg font-medium transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaEdit, FaSave, FaCamera } from 'react-icons/fa';
import './UserProfileModal.css';

const defaultProfile = {
  name: '',
  email: '',
  photo: '',
  company: '',
  totalApis: 0,
  providerId: '',
  subscriptionPlan: '',
  totalSubscriptions: 0,
  consumerId: '',
  role: '',
};

export default function UserProfileModal({ open, onClose, userId, role }) {
  const [profile, setProfile] = useState(defaultProfile);
  const [editMode, setEditMode] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      fetch(`/api/users/${userId}`)
        .then(res => res.json())
        .then(data => {
          setProfile({ ...defaultProfile, ...data });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [open, userId]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => setEditMode(false);
  const handleChange = e => {
    const { name, value } = e.target;
    setProfile(p => ({ ...p, [name]: value }));
  };
  const handlePhotoChange = e => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setProfile(p => ({ ...p, photo: URL.createObjectURL(e.target.files[0]) }));
    }
  };
  const handleSave = async () => {
    setLoading(true);
    let photoUrl = profile.photo;
    if (photoFile) {
      // Upload photo logic here (mocked)
      photoUrl = profile.photo;
    }
    await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, photo: photoUrl }),
    });
    setEditMode(false);
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="user-profile-modal-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <div className="profile-header">
          <div className="avatar-wrapper">
            {profile.photo ? (
              <img src={profile.photo} alt="Profile" className="avatar-img" />
            ) : (
              <FaUserCircle className="avatar-placeholder" />
            )}
            {editMode && (
              <label className="avatar-upload">
                <FaCamera />
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <div className="profile-info">
            {editMode ? (
              <input name="name" value={profile.name} onChange={handleChange} className="profile-input" />
            ) : (
              <h2>{profile.name}</h2>
            )}
            <div className="profile-email">{profile.email}</div>
          </div>
        </div>
        <div className="profile-meta">
          {role === 'API_PROVIDER' ? (
            <>
              <div><b>Company:</b> {editMode ? <input name="company" value={profile.company} onChange={handleChange} className="profile-input" /> : profile.company}</div>
              <div><b>Total APIs:</b> {profile.totalApis}</div>
              <div><b>Provider ID:</b> {profile.providerId}</div>
            </>
          ) : (
            <>
              <div><b>Subscription Plan:</b> {profile.subscriptionPlan}</div>
              <div><b>Total Subscriptions:</b> {profile.totalSubscriptions}</div>
              <div><b>Consumer ID:</b> {profile.consumerId}</div>
            </>
          )}
        </div>
        <div className="profile-actions">
          {editMode ? (
            <>
              <button className="save-btn" onClick={handleSave} disabled={loading}><FaSave /> Save</button>
              <button className="cancel-btn" onClick={handleCancel} disabled={loading}>Cancel</button>
            </>
          ) : (
            <button className="edit-btn" onClick={handleEdit}><FaEdit /> Edit Profile</button>
          )}
        </div>
      </div>
    </div>
  );
}

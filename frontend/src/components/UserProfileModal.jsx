import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaEdit, FaSave, FaCamera, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import './UserProfileModal.css';

const defaultProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
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
  const navigate = useNavigate();

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      api.get(`/api/users/${userId}`)
        .then(res => {
          setProfile({ ...defaultProfile, ...res.data });
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
    await api.put(`/api/users/${userId}`, { ...profile, photo: photoUrl });
    setEditMode(false);
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        setLoading(true);
        await api.delete(`/api/users/${userId}`);
        localStorage.clear();
        sessionStorage.clear();
        navigate('/login');
      } catch (err) {
        alert("Failed to delete account");
        setLoading(false);
      }
    }
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
          <div><b>Phone:</b> {editMode ? <input name="phone" value={profile.phone} onChange={handleChange} className="profile-input" /> : profile.phone || 'N/A'}</div>
          <div><b>Location/Address:</b> {editMode ? <input name="address" value={profile.address} onChange={handleChange} className="profile-input" /> : profile.address || 'N/A'}</div>
          <div><b>Date of Birth:</b> {editMode ? <input type="date" name="dateOfBirth" value={profile.dateOfBirth} onChange={handleChange} className="profile-input" /> : profile.dateOfBirth || 'N/A'}</div>
          {role === 'API_PROVIDER' ? (
            <>
              <div><b>Company:</b> {editMode ? <input name="company" value={profile.company} onChange={handleChange} className="profile-input" /> : profile.company || 'N/A'}</div>
              <div><b>Total APIs Published:</b> {profile.totalApis}</div>
              <div><b>Provider ID:</b> {profile.providerId}</div>
            </>
          ) : (
            <>
              <div><b>Subscription Plan:</b> {profile.subscriptionPlan}</div>
              <div><b>Total APIs Subscribed:</b> {profile.totalSubscriptions}</div>
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
            <>
              <button className="edit-btn" onClick={handleEdit}><FaEdit /> Edit Profile</button>
              <button className="delete-btn" onClick={handleDeleteAccount} disabled={loading} style={{ background: '#dc2626', color: 'white', border: 'none', marginLeft: '10px' }}><FaTrash /> Delete Account</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

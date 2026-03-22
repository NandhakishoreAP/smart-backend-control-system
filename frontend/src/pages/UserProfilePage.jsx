import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaUserCircle, FaEdit, FaSave, FaCamera } from 'react-icons/fa';
import './UserProfilePage.css';

const defaultProfile = {
  name: '',
  email: '',
  phone: '',
  userId: '',
  photo: '',
  company: '',
  totalApis: 0,
  providerId: '',
  subscriptionPlan: '',
  totalSubscriptions: 0,
  consumerId: '',
  address: '',
  role: '',
};

export default function UserProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(defaultProfile);
  const [editMode, setEditMode] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetch(`/api/users/${id}`)
        .then(res => res.json())
        .then(data => {
          setProfile({ ...defaultProfile, ...data });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

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
    await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, photo: photoUrl }),
    });
    setEditMode(false);
    setLoading(false);
  };

  return (
    <div className="user-profile-page">
      <div className="profile-card">
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
            <div className="profile-userid">User ID: {profile.userId}</div>
          </div>
        </div>
        <div className="profile-meta">
          <div><b>Phone:</b> {editMode ? <input name="phone" value={profile.phone} onChange={handleChange} className="profile-input" /> : profile.phone}</div>
          <div><b>Address:</b> {editMode ? <input name="address" value={profile.address} onChange={handleChange} className="profile-input" /> : profile.address}</div>
          {profile.role === 'API_PROVIDER' ? (
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

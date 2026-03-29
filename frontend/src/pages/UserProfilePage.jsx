import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaUserCircle, FaEdit, FaSave, FaCamera, FaTrash, FaArrowLeft } from 'react-icons/fa'
import api from '../api/api'

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
}

export default function UserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(defaultProfile)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true
    if (id) {
      setLoading(true)
      api.get(`/api/users/${id}`)
        .then(res => {
          if (isMounted) {
            setProfile({ ...defaultProfile, ...res.data })
            setLoading(false)
            setError('')
          }
        })
        .catch(err => {
          if (isMounted) {
            setError(err.message || 'Failed to load profile')
            setLoading(false)
          }
        })
    }
    return () => {
      isMounted = false
    }
  }, [id])

  const handleEdit = () => {
    setEditMode(true)
    setSuccess('')
    setError('')
  }
  const handleCancel = () => setEditMode(false)
  
  const handleChange = e => {
    const { name, value } = e.target
    setProfile(p => ({ ...p, [name]: value }))
  }

  const handlePhotoChange = e => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfile(p => ({ ...p, photo: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError('')
      await api.put(`/api/users/${id}`, profile)
      setEditMode(false)
      setSuccess('Profile updated successfully!')
      // Notify AppShell to reload the image
      window.dispatchEvent(new Event('profileUpdated'))
    } catch (err) {
      setError(err?.response?.data || err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        setLoading(true)
        await api.delete(`/api/users/${id}`)
        localStorage.clear()
        sessionStorage.clear()
        navigate('/login')
      } catch (err) {
        setError('Failed to delete account')
        setLoading(false)
      }
    }
  }

  if (loading && !profile.email) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-fog-200 border-t-mint-500"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-900"
        >
          <FaArrowLeft /> Back
        </button>
        <h2 className="font-display text-2xl font-semibold text-ink-900">Account Settings</h2>
      </div>

      {error && (
        <div className="rounded-xl border border-signal-400/40 bg-signal-400/10 p-4 text-sm text-ink-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-mint-400/40 bg-mint-400/10 p-4 text-sm font-semibold text-ink-900">
          {success}
        </div>
      )}

      {/* Main Profile Card */}
      <div className="overflow-hidden rounded-3xl border border-fog-100 bg-white/80 shadow-glass backdrop-blur">
        <div className="h-32 bg-gradient-to-r from-ink-900 to-ink-700"></div>
        <div className="px-6 pb-8 md:px-10">
          <div className="relative flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8">
            {/* Avatar Section */}
            <div className="relative -mt-16 sm:-mt-20 h-32 w-32 shrink-0 rounded-full border-4 border-white bg-white shadow-md sm:h-40 sm:w-40">
              {profile.photo ? (
                <img src={profile.photo} alt="Profile" className="h-full w-full rounded-full object-cover" />
              ) : (
                <FaUserCircle className="h-full w-full rounded-full text-fog-200" />
              )}
              {editMode && (
                <label className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-ink-900 text-white shadow-lg transition hover:bg-ink-700 sm:bottom-2 sm:right-2">
                  <FaCamera size={16} />
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 pb-2">
              {editMode ? (
                <input
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="mb-2 w-full font-display text-2xl font-semibold text-ink-900 outline-none border-b border-fog-200 focus:border-mint-500 bg-transparent py-1 transition"
                />
              ) : (
                <h1 className="font-display text-3xl font-semibold text-ink-900 break-words">{profile.name || 'Anonymous User'}</h1>
              )}
              {editMode ? (
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="mt-1 w-full text-sm font-medium text-ink-500 bg-transparent outline-none border-b border-fog-200 focus:border-mint-500 py-1 transition"
                />
              ) : (
                <p className="mt-1 text-sm font-medium text-ink-500 break-all">{profile.email}</p>
              )}
              <div className="mt-2 inline-flex items-center rounded-full bg-fog-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
                {profile.role?.replace('ROLE_', '') || 'User Role'}
              </div>
            </div>

            {/* Top Actions */}
            <div className="flex gap-3 pb-2 w-full sm:w-auto mt-4 sm:mt-0">
              {editMode ? (
                <>
                  <button onClick={handleCancel} disabled={loading} className="w-full sm:w-auto rounded-xl border border-fog-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 shadow-sm transition hover:bg-fog-50">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={loading} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-fog-50 shadow-sm transition hover:bg-ink-700">
                    <FaSave /> Save
                  </button>
                </>
              ) : (
                <button onClick={handleEdit} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-fog-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 shadow-sm transition hover:bg-fog-50">
                  <FaEdit /> Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {/* Personal Details Form */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-600">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-ink-500">Phone Number</label>
                  {editMode ? (
                    <input name="phone" value={profile.phone || ''} onChange={handleChange} className="w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-mint-400" placeholder="+1 234 567 8900" />
                  ) : (
                    <p className="text-sm font-medium text-ink-900">{profile.phone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-ink-500">Address / Location</label>
                  {editMode ? (
                    <input name="address" value={profile.address || ''} onChange={handleChange} className="w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-mint-400" placeholder="City, Country" />
                  ) : (
                    <p className="text-sm font-medium text-ink-900">{profile.address || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-ink-500">Date of Birth</label>
                  {editMode ? (
                    <input type="date" name="dateOfBirth" value={profile.dateOfBirth || ''} onChange={handleChange} className="w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-mint-400" />
                  ) : (
                    <p className="text-sm font-medium text-ink-900">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wider text-ink-500">Company</label>
                  {editMode ? (
                    <input name="company" value={profile.company || ''} onChange={handleChange} className="w-full rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-mint-400" placeholder="Acme Inc." />
                  ) : (
                    <p className="text-sm font-medium text-ink-900">{profile.company || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Metrics Data */}
            <div className="space-y-5 rounded-2xl border border-fog-100 bg-fog-50/50 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-600">Platform Data</h3>
              <div className="space-y-4">
                {profile.role === 'API_PROVIDER' ? (
                  <>
                    <div className="flex justify-between items-center border-b border-fog-100 pb-2">
                      <span className="text-sm text-ink-600">Total APIs Published</span>
                      <span className="font-semibold text-ink-900">{profile.totalApis}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-fog-100 pb-2">
                      <span className="text-sm text-ink-600">Provider ID</span>
                      <span className="font-mono text-xs text-ink-800">{profile.providerId || '-'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center border-b border-fog-100 pb-2">
                      <span className="text-sm text-ink-600">Active Subscriptions</span>
                      <span className="font-semibold text-ink-900">{profile.totalSubscriptions}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-fog-100 pb-2">
                      <span className="text-sm text-ink-600">Current Plan</span>
                      <span className="font-semibold text-ink-900 capitalize">{profile.subscriptionPlan || 'Free'}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600">Account ID</span>
                  <span className="font-mono text-xs text-ink-800">{profile.userId || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="overflow-hidden rounded-3xl border border-signal-400/30 bg-white/80 shadow-glass backdrop-blur">
        <div className="px-6 py-6 md:px-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">Danger Zone</h3>
            <p className="text-sm text-ink-500">Permanently delete your account and all associated data.</p>
          </div>
          <button
            onClick={handleDeleteAccount}
            className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-signal-400/10 px-5 py-2.5 text-sm font-semibold text-signal-700 transition hover:bg-signal-400/20 hover:text-signal-800"
          >
            <FaTrash /> Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}

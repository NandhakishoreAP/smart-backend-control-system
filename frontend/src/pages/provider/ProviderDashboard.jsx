import React, { useContext, useState, useEffect } from 'react';
import { ProviderApiContext } from '../../context/ProviderApiContext';
import { PinnedApiContext } from '../../context/PinnedApiContext';
import { exportToCsv } from '../../utils/exportToCsv';
import Toast from '../../components/Toast';
import { FaChartBar, FaUserFriends, FaThumbtack, FaStickyNote, FaDownload, FaPlus, FaCopy, FaTrash, FaEdit, FaCheck, FaTimes, FaBolt } from 'react-icons/fa';
import './ProviderDashboard.css';

const ProviderDashboard = () => {
  const { apis, fetchApis, analytics, fetchAnalytics, subscribers, fetchSubscribers, mockApi, deleteApi, updateApi, createApi } = useContext(ProviderApiContext);
  const { pinnedApis, pinApi, unpinApi, notes, addNote, removeNote, updateNote } = useContext(PinnedApiContext);
  const [selectedApi, setSelectedApi] = useState(null);
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockData, setMockData] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [collabUser, setCollabUser] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchApis();
    fetchAnalytics();
    fetchSubscribers();
  }, []);

  const handlePin = (apiId) => {
    pinApi(apiId);
    setToastMsg('API pinned!');
    setShowToast(true);
  };

  const handleUnpin = (apiId) => {
    unpinApi(apiId);
    setToastMsg('API unpinned!');
    setShowToast(true);
  };

  const handleAddNote = (apiId, note) => {
    addNote(apiId, note);
    setToastMsg('Note added!');
    setShowToast(true);
  };

  const handleRemoveNote = (apiId) => {
    removeNote(apiId);
    setToastMsg('Note removed!');
    setShowToast(true);
  };

  const handleUpdateNote = (apiId, note) => {
    updateNote(apiId, note);
    setToastMsg('Note updated!');
    setShowToast(true);
  };

  const handleExport = () => {
    exportToCsv(apis);
    setToastMsg('Exported to CSV!');
    setShowToast(true);
  };

  const handleMockApi = (apiId) => {
    setSelectedApi(apiId);
    setShowMockModal(true);
  };

  const handleMockSubmit = () => {
    mockApi(selectedApi, mockData);
    setShowMockModal(false);
    setToastMsg('Mock API updated!');
    setShowToast(true);
  };

  const handleCollabAdd = () => {
    if (collabUser && !collaborators.includes(collabUser)) {
      setCollaborators([...collaborators, collabUser]);
      setToastMsg('Collaborator added!');
      setShowToast(true);
      setCollabUser('');
    }
  };

  const handleCollabRemove = (user) => {
    setCollaborators(collaborators.filter(u => u !== user));
    setToastMsg('Collaborator removed!');
    setShowToast(true);
  };

  const filteredApis = apis.filter(api => api.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="provider-dashboard">
      <h1>Provider Dashboard</h1>
      <div className="dashboard-actions">
        <button onClick={handleExport}><FaDownload /> Export APIs</button>
        <input
          type="text"
          placeholder="Search APIs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="collab-section">
          <input
            type="text"
            placeholder="Add collaborator by email"
            value={collabUser}
            onChange={e => setCollabUser(e.target.value)}
          />
          <button onClick={handleCollabAdd}><FaUserFriends /> Add</button>
          <div className="collab-list">
            {collaborators.map(user => (
              <span key={user} className="collab-user">
                {user} <FaTimes onClick={() => handleCollabRemove(user)} />
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="dashboard-analytics">
        <div className="analytics-card">
          <FaChartBar />
          <div>
            <h3>Total APIs</h3>
            <p>{apis.length}</p>
          </div>
        </div>
        <div className="analytics-card">
          <FaUserFriends />
          <div>
            <h3>Total Subscribers</h3>
            <p>{subscribers.length}</p>
          </div>
        </div>
        <div className="analytics-card">
          <FaBolt />
          <div>
            <h3>Avg. Latency</h3>
            <p>{analytics.avgLatency} ms</p>
          </div>
        </div>
        <div className="analytics-card">
          <FaChartBar />
          <div>
            <h3>Success Rate</h3>
            <p>{analytics.successRate}%</p>
          </div>
        </div>
      </div>
      {console.log('subscribers', subscribers)}
      <div className="subscriber-insights">
        <h2>Subscriber Insights</h2>
        <table className="subscriber-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>API Subscribed</th>
              <th>Calls</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map(sub => (
              <tr key={sub.subscriptionId}>
                <td>{sub.subscriberName}</td>
                <td>{sub.subscriberEmail ? sub.subscriberEmail : '-'}</td>
                <td>{sub.apiName}</td>
                <td>{sub.calls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="api-list">
        <h2>My APIs</h2>
        {filteredApis.map(api => (
          <div key={api.id} className="api-card">
            <div className="api-header">
              <h3>{api.name}</h3>
              <span className={api.active ? 'active' : 'inactive'}>{api.active ? 'Active' : 'Inactive'}</span>
              {pinnedApis.includes(api.id) ? (
                <FaThumbtack className="pinned" onClick={() => handleUnpin(api.id)} />
              ) : (
                <FaThumbtack onClick={() => handlePin(api.id)} />
              )}
            </div>
            <p>{api.description}</p>
            <div className="api-actions">
              <button onClick={() => handleMockApi(api.id)}><FaBolt /> Mock</button>
              <button onClick={() => deleteApi(api.id)}><FaTrash /> Delete</button>
              <button onClick={() => updateApi(api.id)}><FaEdit /> Edit</button>
            </div>
            <div className="api-notes">
              <FaStickyNote />
              <input
                type="text"
                placeholder="Add a note..."
                value={notes[api.id] || ''}
                onChange={e => handleUpdateNote(api.id, e.target.value)}
              />
              {notes[api.id] && (
                <button onClick={() => handleRemoveNote(api.id)}><FaTimes /></button>
              )}
            </div>
          </div>
        ))}
      </div>
      {showMockModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Quick API Mocking</h2>
            <textarea
              value={mockData}
              onChange={e => setMockData(e.target.value)}
              placeholder="Enter mock response JSON..."
            />
            <button onClick={handleMockSubmit}><FaCheck /> Save</button>
            <button onClick={() => setShowMockModal(false)}><FaTimes /> Cancel</button>
          </div>
        </div>
      )}
      <Toast show={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
    </div>
  );
};

export default ProviderDashboard;

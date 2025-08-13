import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config'; // ✅ use config file

// ---- Safe URL joiner (prevents double/missing slashes)
function joinUrl(base = '', path = '') {
  if (!base) return path || '';
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

// ✅ Build API URL from config
const API = joinUrl(config.CLASS_ROOM_ROUTE); // e.g. http://localhost:9090/api/class-room

export default function ClassroomManager() {
  const [classrooms, setClassrooms] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    classroomid: '',
    classroomcollege: '',
    classroomdept: '',
    classroomcode: '',
    classroomname: '',
    classroomtype: '',
    classroomcapacity: '',
    classroomisavailable: false,
    classroomprojector: false,
    classfloornumber: '',
    classroomlat: '',
    classroomlong: '',
    classroomloc: ''
  });

  // Fetch classrooms
  const fetchClassrooms = async () => {
    try {
      const res = await axios.get(API);
      const raw = res?.data?.classrooms ?? res?.data ?? [];
      setClassrooms(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Error fetching classrooms:', err);
      setClassrooms([]);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      classroomid: '',
      classroomcollege: '',
      classroomdept: '',
      classroomcode: '',
      classroomname: '',
      classroomtype: '',
      classroomcapacity: '',
      classroomisavailable: false,
      classroomprojector: false,
      classfloornumber: '',
      classroomlat: '',
      classroomlong: '',
      classroomloc: ''
    });
    setEditingId(null);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(joinUrl(API, String(editingId)), formData);
      } else {
        await axios.post(API, formData);
      }
      fetchClassrooms();
      handleModalClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Submission failed: ' + (error.response?.data?.details || error.message));
    }
  };

  // Edit classroom
  const handleEdit = (cls) => {
    setFormData({ ...cls });
    setEditingId(cls.classroomid);
    setModalOpen(true);
  };

  // Delete classroom
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure to delete this classroom?')) {
      try {
        await axios.delete(joinUrl(API, String(id)));
        fetchClassrooms();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Delete failed');
      }
    }
  };

  // Open Add Modal
  const handleAddClick = () => {
    resetForm();
    setModalOpen(true);
  };

  // Close Modal
  const handleModalClose = () => {
    setModalOpen(false);
    resetForm();
  };

  // Filter classrooms for search
  const filteredClassrooms = classrooms.filter((cls) =>
    Object.values(cls).join(' ').toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#d9e3fc',
      padding: 0,
      margin: 0,
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: 1250, margin: '0 auto', padding: '28px 0 0 0' }}>
        {/* Title */}
        <h1 style={{
          textAlign: 'center',
          fontSize: 44,
          fontWeight: 900,
          marginBottom: 34,
          color: '#2e2366',
          letterSpacing: 1.4,
          textShadow: '0 2px 7px #bec8f3'
        }}>
          Classroom Manager
        </h1>

        {/* Search and Add button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 35,
          gap: 20
        }}>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: 470,
              padding: '17px 28px',
              fontSize: 20,
              borderRadius: 16,
              border: 'none',
              background: '#fff',
              color: '#3c2771',
              boxShadow: '0 3px 16px #b3b6ff29',
              outline: 'none',
              marginRight: 0,
              fontWeight: 600,
              letterSpacing: 0.5
            }}
          />
          <button
            onClick={handleAddClick}
            style={{
              background: 'linear-gradient(90deg, #6A6AFE 0%, #50A6FB 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 20,
              padding: '12px 34px',
              borderRadius: 13,
              border: 'none',
              boxShadow: '0 3px 20px #5a5bd84d',
              cursor: 'pointer',
              transition: 'background 0.18s'
            }}
          >
            + Add
          </button>
        </div>

        {/* Table Card */}
        <div style={{
          background: '#fff',
          borderRadius: 26,
          boxShadow: '0 4px 32px #5660ff19',
          padding: '0 0 28px 0',
          margin: '0 auto',
          maxWidth: 1200,
          minWidth: 1100,
        }}>
          {/* All Classrooms Title Centered */}
          <div style={{
            fontWeight: 800,
            fontSize: 29,
            color: '#2c1169',
            margin: '32px 0 18px 0',
            letterSpacing: 1.1,
            textAlign: 'center',
            fontFamily: 'inherit'
          }}>All Classrooms</div>

          {/* Table with vertical scroll (fixed height), horizontal scroll for table */}
          <div
            style={{
              background: '#f5f5fd',
              borderRadius: 20,
              margin: '0 20px',
              padding: 0,
              overflowX: 'auto',
              overflowY: 'hidden',
            }}
          >
            <div
              style={{
                maxHeight: 330,
                minHeight: 80,
                overflowY: 'auto',
                borderRadius: 20,
              }}
            >
              <table style={{ width: 1550, borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(90deg, #6A6AFE 0%, #50A6FB 100%)',
                    borderRadius: 20
                  }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>College</th>
                    <th style={thStyle}>Dept</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Code</th>
                    <th style={thStyle}>Capacity</th>
                    <th style={thStyle}>Floor</th>
                    <th style={thStyle}>Available</th>
                    <th style={thStyle}>Projector</th>
                    <th style={thStyle}>Lat</th>
                    <th style={thStyle}>Long</th>
                    <th style={thStyle}>Loc</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClassrooms.map((cls, index) => (
                    <tr
                      key={cls.classroomid}
                      style={{
                        background: index % 2 === 0 ? '#f6f9fe' : '#fff',
                        borderBottom: '1.5px solid #e6eafe'
                      }}
                    >
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={tdStyle}>{cls.classroomid}</td>
                      <td style={tdStyle}>{cls.classroomname}</td>
                      <td style={tdStyle}>{cls.classroomcollege}</td>
                      <td style={tdStyle}>{cls.classroomdept}</td>
                      <td style={tdStyle}>{cls.classroomtype}</td>
                      <td style={tdStyle}>{cls.classroomcode}</td>
                      <td style={tdStyle}>{cls.classroomcapacity}</td>
                      <td style={tdStyle}>{cls.classfloornumber}</td>
                      <td style={tdStyle}>{cls.classroomisavailable ? (
                        <span style={{ color: 'green', fontWeight: 700 }}>Yes</span>
                      ) : (
                        <span style={{ color: 'brown', fontWeight: 700 }}>No</span>
                      )}</td>
                      <td style={tdStyle}>{cls.classroomprojector ? (
                        <span style={{ color: '#01bbfe', fontWeight: 700 }}>Yes</span>
                      ) : (
                        <span style={{ color: '#d4423c', fontWeight: 700 }}>No</span>
                      )}</td>
                      <td style={tdStyle}>{cls.classroomlat}</td>
                      <td style={tdStyle}>{cls.classroomlong}</td>
                      <td style={tdStyle}>{cls.classroomloc}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleEdit(cls)}
                          style={{
                            marginRight: 10,
                            padding: '8px 24px',
                            background: '#6A6AFE',
                            color: '#fff',
                            fontWeight: 700,
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 16,
                            boxShadow: '0 3px 8px #b3b6ff39'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cls.classroomid)}
                          style={{
                            padding: '8px 24px',
                            background: '#fe4141',
                            color: '#fff',
                            fontWeight: 700,
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 16,
                            boxShadow: '0 3px 8px #fbbbcb39'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredClassrooms.length === 0 && (
                    <tr>
                      <td colSpan={15} style={{
                        ...tdStyle,
                        textAlign: 'center',
                        color: '#7c7c7c',
                        fontSize: 17,
                        padding: 38
                      }}>
                        No classrooms found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(33,39,58,0.22)', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 3px 32px #454cbb33',
            width: 540, maxWidth: '95vw',
            padding: '36px 30px 24px 30px',
            position: 'relative',
            animation: 'popIn 0.19s cubic-bezier(.5,2.3,.5,1.2)'
          }}>
            {/* Close button */}
            <button
              onClick={handleModalClose}
              style={{
                position: 'absolute',
                top: 16,
                right: 18,
                background: 'none',
                border: 'none',
                fontSize: 24,
                color: '#444',
                cursor: 'pointer'
              }}
              title="Close"
            >×</button>
            <h3 style={{ fontWeight: 700, fontSize: 21, marginBottom: 22, color: '#4059ED', letterSpacing: 0.5 }}>
              {editingId ? 'Edit Classroom' : 'Add Classroom'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} style={{ width: '47%' }}>
                  {typeof value === 'boolean' ? (
                    <label style={{ fontWeight: 600, color: '#2e3552', display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                      <input
                        type="checkbox"
                        name={key}
                        checked={value}
                        onChange={handleChange}
                        style={{ marginRight: 8 }}
                      />
                      {key.replace(/classroom|class/gi, '').replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    </label>
                  ) : (
                    <input
                      type={key.includes('capacity') || key.includes('number') ? 'number' : 'text'}
                      name={key}
                      value={value}
                      onChange={handleChange}
                      placeholder={key.replace(/classroom|class/gi, '').replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                      required={key === 'classroomid' || key === 'classroomname'}
                      style={{
                        width: '100%',
                        padding: '11px 12px',
                        border: '1.5px solid #E6EAFE',
                        borderRadius: 8,
                        background: '#f6f7fb',
                        marginBottom: 6,
                        fontSize: 15,
                        color: '#2e3552',
                        outlineColor: '#4059ED'
                      }}
                    />
                  )}
                </div>
              ))}
              <button
                type="submit"
                style={{
                  width: '100%',
                  marginTop: 10,
                  background: 'linear-gradient(90deg, #4059ED 0%, #3D9DF6 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 17,
                  padding: '13px 0',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: 0.5,
                }}
              >
                {editingId ? 'Update Classroom' : 'Add Classroom'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Table header and cell styles
const thStyle = {
  padding: '18px 13px',
  border: 'none',
  textAlign: 'left',
  color: '#fff',
  fontWeight: 800,
  fontSize: 17,
  letterSpacing: 0.7,
  background: 'none'
};

const tdStyle = {
  padding: '15px 13px',
  border: 'none',
  color: '#2e2366',
  fontSize: 16,
  fontWeight: 600
};

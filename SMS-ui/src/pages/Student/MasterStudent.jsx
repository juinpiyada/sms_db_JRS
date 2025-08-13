import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';

// Safely join base + path (removes duplicate slashes)
const joinUrl = (base, path = '') =>
  path ? `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}` : String(base);

const initialState = {
  stuid: '',
  stu_enrollmentnumber: '',
  stu_rollnumber: '',
  stu_regn_number: '',
  stuname: '',
  stuemailid: '',
  stumob1: '',
  stumob2: '',
  stucaste: '',
  stugender: '',
  studob: '',
  stucategory: '',
  stuadmissiondt: '',
  stu_course_id: '',
  stu_lat_entry: false,
  stu_curr_semester: '',
  stu_section: '',
  stuvalid: true,
  stuuserid: '',
  stuparentname: '',
  stuaddress: '',
  stuparentemailid: '',
  stuprentmob1: '',
  stuprentmob2: '',
  stuparentaddress: '',
  stu_inst_id: ''
};

const StudentForm = () => {
  const [formData, setFormData] = useState(initialState);
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [status, setStatus] = useState('');
  const [courses, setCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // ---- Endpoints (via middleware_config) ----
  const COURSE_LIST_URL   = joinUrl(config.COURSE_ROUTE, 'list');                 // GET
  // 👇 Per your request: use BASE_URL + /master-college/view-colleges
  const COLLEGES_URL      = `${config.BASE_URL}/master-college/view-colleges`;    // GET
  const USERS_URL         = joinUrl(config.MASTER_USER_ROUTE, 'users');           // GET

  const STUDENT_LIST_URL  = joinUrl(config.STUDENT_ROUTE, 'list');                // GET
  const STUDENT_ADD_URL   = joinUrl(config.STUDENT_ROUTE, 'add');                 // POST
  const STUDENT_UPDATE_ID = (id) => joinUrl(config.STUDENT_ROUTE, `update/${encodeURIComponent(id)}`); // PUT
  const STUDENT_DELETE_ID = (id) => joinUrl(config.STUDENT_ROUTE, `delete/${encodeURIComponent(id)}`); // DELETE

  // Data fetching
  useEffect(() => {
    axios.get(COURSE_LIST_URL)
      .then(res => setCourses(res.data?.courses ?? res.data ?? []))
      .catch(() => setCourses([]));

    // ✅ Matches your snippet
    axios.get(COLLEGES_URL)
      .then(res => {
        const raw = res?.data?.colleges ?? res?.data;
        setColleges(raw ?? []);
      })
      .catch(() => setColleges([]));

    axios.get(USERS_URL)
      .then(res => setUsers(res.data?.users ?? res.data ?? []))
      .catch(() => setUsers([]));

    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = () => {
    axios.get(STUDENT_LIST_URL)
      .then(res => setStudents(res.data?.students ?? res.data ?? []))
      .catch(() => setStudents([]));
  };

  // Handlers
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus(editing ? 'Updating...' : 'Submitting...');

    const payload = {
      ...formData,
      studob: formData.studob ? formData.studob.slice(0, 19) : '',
      stuadmissiondt: formData.stuadmissiondt ? formData.stuadmissiondt.slice(0, 19) : '',
      stu_lat_entry: !!formData.stu_lat_entry,
      stuvalid: !!formData.stuvalid,
    };

    try {
      if (editing) {
        await axios.put(STUDENT_UPDATE_ID(editId), payload);
        setStatus('✅ Student updated!');
      } else {
        await axios.post(STUDENT_ADD_URL, payload);
        setStatus('✅ Student added!');
      }
      setFormData(initialState);
      setEditing(false);
      setEditId(null);
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      setStatus('❌ ' + (err.response?.data?.message || err.response?.data?.error || 'Failed to submit student'));
    }
  };

  // Open modal for add/edit
  const openAddModal = () => {
    setFormData(initialState);
    setEditing(false);
    setEditId(null);
    setShowModal(true);
    setStatus('');
  };
  const openEditModal = stu => {
    setFormData({
      ...stu,
      studob: stu.studob ? String(stu.studob).slice(0, 16) : '',
      stuadmissiondt: stu.stuadmissiondt ? String(stu.stuadmissiondt).slice(0, 16) : ''
    });
    setEditing(true);
    setEditId(stu.stuid);
    setShowModal(true);
    setStatus('');
  };
  const closeModal = () => {
    setShowModal(false);
    setFormData(initialState);
    setEditing(false);
    setEditId(null);
    setStatus('');
  };

  // Delete student
  const handleDelete = async id => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await axios.delete(STUDENT_DELETE_ID(id));
      setStudents(students => students.filter(s => s.stuid !== id));
    } catch {
      alert('Delete failed');
    }
  };

  // --- styling (unchanged) ---
  const formStyle = {
    maxWidth: '1050px',
    margin: '48px auto 30px',
    padding: '38px 24px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
    borderRadius: '18px',
    boxShadow: '0 6px 32px 0 rgba(80,90,180,0.11)',
    fontFamily: 'Segoe UI, sans-serif',
    overflowX: 'auto'
  };
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, minmax(110px, 1fr))',
    gap: '14px',
    alignItems: 'end'
  };
  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 700,
    color: '#23255A',
    fontSize: '0.95rem',
    letterSpacing: '.01em'
  };
  const inputStyle = {
    width: '100%',
    maxWidth: '115px',
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1.2px solid #e0e7ef',
    fontSize: '14px',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none'
  };
  const selectStyle = { ...inputStyle, background: '#fcfcff' };
  const checkboxWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    background: '#f1f5fa',
    borderRadius: '8px',
    padding: '6px 12px',
    gridColumn: 'span 5'
  };
  const buttonStyle = {
    gridColumn: 'span 10',
    padding: '10px',
    fontSize: '16px',
    background: 'linear-gradient(90deg, #6366F1 60%, #3b82f6 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '7px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '14px',
    boxShadow: '0 4px 18px 0 #6366f133',
    letterSpacing: '1.1px',
    transition: 'transform .09s'
  };
  const statusStyle = {
    marginTop: '20px',
    fontWeight: 600,
    fontSize: '1.08rem',
    color: status.startsWith('✅') ? '#22bb33' : '#dc2626',
    textAlign: 'center'
  };

  const tableContainerStyle = {
    maxWidth: '1050px',
    margin: '0px auto 60px',
    background: '#fff',
    borderRadius: '18px',
    boxShadow: '0 3px 16px 0 rgba(40,60,120,0.10)',
    padding: '30px 20px 40px 20px'
  };
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    marginTop: '10px'
  };
  const thStyle = {
    background: '#f0f4ff',
    color: '#3b3663',
    fontWeight: 700,
    padding: '9px 8px',
    borderBottom: '2px solid #e0e7ef',
    position: 'sticky',
    top: 0,
    zIndex: 1
  };
  const tdStyle = {
    padding: '7px 8px',
    borderBottom: '1px solid #e5e7eb',
    color: '#393E4F'
  };

  // --- Modal for Add/Edit ---
  const modalOverlay = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(44,47,68,0.12)',
    zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  };
  const modalContent = {
    background: '#fff',
    borderRadius: '18px',
    boxShadow: '0 6px 32px 0 rgba(80,90,180,0.18)',
    padding: '34px 32px 22px 32px',
    minWidth: 820,
    maxWidth: '98vw',
    position: 'relative'
  };

  return (
    <>
      {/* Add/Edit Button */}
      <div style={{ ...formStyle, marginBottom: 0, padding: 0, boxShadow: 'none', background: 'none' }}>
        <button
          style={{
            padding: '12px 32px',
            background: '#3730a3',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 18,
            cursor: 'pointer',
            float: 'right',
            margin: '18px 26px'
          }}
          onClick={openAddModal}
        >+ Add Student</button>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div style={modalOverlay} onClick={closeModal}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <button
              onClick={closeModal}
              style={{
                position: 'absolute', right: 18, top: 14, border: 'none', background: 'none',
                fontSize: 27, fontWeight: 800, color: '#374151', cursor: 'pointer', lineHeight: 1
              }}>×</button>
            <h2 style={{
              textAlign: 'center', marginBottom: '24px', color: '#3b3663', fontWeight: 900, fontSize: '1.3rem'
            }}>{editing ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={handleSubmit} style={gridStyle} autoComplete="off">
              {[
                ['stuid', 'Student ID'],
                ['stu_enrollmentnumber', 'Enroll No'],
                ['stu_rollnumber', 'Roll No'],
                ['stu_regn_number', 'Regn No'],
                ['stuname', 'Student Name'],
                ['stuemailid', 'Email ID'],
                ['stumob1', 'Mobile 1'],
                ['stumob2', 'Mobile 2'],
                ['stuparentname', 'Parent Name'],
                ['stuaddress', 'Address'],
                ['stuparentemailid', 'Parent Email'],
                ['stuprentmob1', 'Parent Mob1'],
                ['stuprentmob2', 'Parent Mob2'],
                ['stuparentaddress', 'Parent Addr']
              ].map(([name, label]) => (
                <div key={name}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type="text"
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    required
                    disabled={editing && name === 'stuid'}
                    style={inputStyle}
                  />
                </div>
              ))}

              <div>
                <label style={labelStyle}>User</label>
                <select
                  name="stuuserid"
                  value={formData.stuuserid}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u.userid} value={u.userid}>
                      {u.username} ({u.userid})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>DOB</label>
                <input
                  type="datetime-local"
                  name="studob"
                  value={formData.studob}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Admission Date</label>
                <input
                  type="datetime-local"
                  name="stuadmissiondt"
                  value={formData.stuadmissiondt}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Gender</label>
                <select
                  name="stugender"
                  value={formData.stugender}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Caste</label>
                <select
                  name="stucaste"
                  value={formData.stucaste}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                >
                  <option value="">Select Caste</option>
                  <option value="General">General</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="OBC">OBC</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select
                  name="stucategory"
                  value={formData.stucategory}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                >
                  <option value="">Select Category</option>
                  <option value="GEN">GEN</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Semester</label>
                <select
                  name="stu_curr_semester"
                  value={formData.stu_curr_semester}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                >
                  <option value="">Select</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Section</label>
                <select
                  name="stu_section"
                  value={formData.stu_section}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                >
                  <option value="">Select</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Course</label>
                <select
                  name="stu_course_id"
                  value={formData.stu_course_id}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.courseid} value={c.courseid}>{c.courseid}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Institute</label>
                <select
                  name="stu_inst_id"
                  value={formData.stu_inst_id}
                  onChange={handleChange}
                  required
                  style={selectStyle}
                >
                  <option value="">Select Institute</option>
                  {colleges.map(c => (
                    <option key={c.collegeid} value={c.collegeid}>{c.collegename}</option>
                  ))}
                </select>
              </div>

              <div style={checkboxWrapperStyle}>
                <input
                  type="checkbox"
                  name="stu_lat_entry"
                  checked={formData.stu_lat_entry}
                  onChange={handleChange}
                  style={{ accentColor: '#6366F1', marginRight: 10 }}
                />
                <label style={{ fontWeight: 700, color: '#23255A' }}>Lateral Entry</label>
              </div>

              <div style={checkboxWrapperStyle}>
                <input
                  type="checkbox"
                  name="stuvalid"
                  checked={formData.stuvalid}
                  onChange={handleChange}
                  style={{ accentColor: '#22bb33', marginRight: 10 }}
                />
                <label style={{ fontWeight: 700, color: '#23255A' }}>Valid</label>
              </div>

              <button
                type="submit"
                style={buttonStyle}
                onMouseDown={e => e.target.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.target.style.transform = 'scale(1)'}
              >
                {editing ? 'Update Student' : 'Add Student'}
              </button>
            </form>
            {status && <p style={statusStyle}>{status}</p>}
          </div>
        </div>
      )}

      {/* Table of students */}
      <div style={tableContainerStyle}>
        <h2 style={{ textAlign: 'center', color: '#3b3663', fontWeight: 900, marginBottom: 22 }}>
          All Students
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Enroll No</th>
                <th style={thStyle}>Roll No</th>
                <th style={thStyle}>Course</th>
                <th style={thStyle}>Semester</th>
                <th style={thStyle}>Mobile</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>DOB</th>
                <th style={thStyle}>Institute</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((stu, idx) => (
                <tr key={stu.stuid || idx}>
                  <td style={tdStyle}>{stu.stuid}</td>
                  <td style={tdStyle}>{stu.stuname}</td>
                  <td style={tdStyle}>{stu.stu_enrollmentnumber}</td>
                  <td style={tdStyle}>{stu.stu_rollnumber}</td>
                  <td style={tdStyle}>{stu.stu_course_id}</td>
                  <td style={tdStyle}>{stu.stu_curr_semester}</td>
                  <td style={tdStyle}>{stu.stumob1}</td>
                  <td style={tdStyle}>{stu.stuemailid}</td>
                  <td style={tdStyle}>{stu.studob ? String(stu.studob).slice(0, 10) : ''}</td>
                  <td style={tdStyle}>{stu.stu_inst_id}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      style={{
                        marginRight: 6, padding: '3px 13px', borderRadius: 6, border: '1px solid #a5b4fc',
                        background: '#EEF2FF', color: '#3730a3', fontWeight: 600, cursor: 'pointer'
                      }}
                      onClick={() => openEditModal(stu)}
                      title="Edit"
                    >Edit</button>
                    <button
                      style={{
                        padding: '3px 10px', borderRadius: 6, border: '1px solid #fecaca',
                        background: '#fee2e2', color: '#c0392b', fontWeight: 600, cursor: 'pointer'
                      }}
                      onClick={() => handleDelete(stu.stuid)}
                      title="Delete"
                    >Delete</button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ color: '#b0b4c3', textAlign: 'center', padding: 22 }}>
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default StudentForm;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config/middleware_config.js'; // if this file is under src/components/, this path is correct

// ---- Safe URL joiner (prevents double slashes & respects absolute paths)
function joinUrl(base = '', path = '') {
  if (!base) return path || '';
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

export default function AddCourse({ showTable = true }) {
  const [form, setForm] = useState(getInitialForm());
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);

  // Base routes from env-driven config
  const DEPT_BASE = config.MASTER_DEPTS_ROUTE; // e.g., http://localhost:9090/api/master-depts
  const COURSE_BASE = config.COURSE_ROUTE;     // e.g., http://localhost:9090/api/course

  // Derived endpoints
  const DEPT_SELECTOR_URL = joinUrl(DEPT_BASE, 'selector');
  const COURSE_ALL_URL    = joinUrl(COURSE_BASE, 'all');
  const COURSE_ADD_URL    = joinUrl(COURSE_BASE, 'add');
  const COURSE_UPDATE_URL = (id) => joinUrl(COURSE_BASE, `update/${id}`);
  const COURSE_DELETE_URL = (id) => joinUrl(COURSE_BASE, `delete/${id}`);

  // Fetch departments and courses
  useEffect(() => {
    fetchDepartments();
    if (showTable) fetchCourses();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (showSuccess && showTable) {
      fetchCourses();
    }
    // eslint-disable-next-line
  }, [showSuccess]);

  function getInitialForm() {
    return {
      courseid: '',
      coursedesc: '',
      collegedept: '',
      courseprgcod: '',
      course_level: '',
      course_totsemester: '',
      course_tot_credits: '',
      course_duration: '',
      coursestartdate: '',
      courseenddate: ''
    };
  }

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(DEPT_SELECTOR_URL);
      setDepartments(res.data || []);
    } catch {
      setDepartments([]);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(COURSE_ALL_URL);
      setCourses(res.data || []);
    } catch {
      setCourses([]);
    }
  };

  // Helpers
  const toDateOrNull = val => (val && /^\d{4}-\d{2}-\d{2}$/.test(val) ? val : null);
  const toNumOrNull = val => (val === '' ? null : Number(val));

  // Modal form change handler
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add/Edit modal handlers
  const openAddModal = () => {
    setForm(getInitialForm());
    setEditing(false);
    setShowModal(true);
    setMsg('');
  };

  const openEditModal = course => {
    setForm({
      courseid: course.courseid,
      coursedesc: course.coursedesc,
      collegedept: course.collegedept,
      courseprgcod: course.courseprgcod || '',
      course_level: course.course_level || '',
      course_totsemester: course.course_totsemester || '',
      course_tot_credits: course.course_tot_credits || '',
      course_duration: course.course_duration || '',
      coursestartdate: course.coursestartdate ? course.coursestartdate.substring(0,10) : '',
      courseenddate: course.courseenddate ? course.courseenddate.substring(0,10) : ''
    });
    setEditing(true);
    setShowModal(true);
    setMsg('');
  };

  const closeModal = () => {
    setShowModal(false);
    setMsg('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    setLoading(true);

    const payload = {
      courseid: form.courseid,
      coursedesc: form.coursedesc,
      collegedept: form.collegedept || null,
      courseprgcod: form.courseprgcod || null,
      course_level: form.course_level || null,
      course_totsemester: toNumOrNull(form.course_totsemester),
      course_tot_credits: toNumOrNull(form.course_tot_credits),
      course_duration: form.course_duration || null,
      coursestartdate: toDateOrNull(form.coursestartdate),
      courseenddate: toDateOrNull(form.courseenddate)
    };

    try {
      if (editing) {
        await axios.put(COURSE_UPDATE_URL(form.courseid), payload);
        setMsg('✅ Course updated successfully!');
      } else {
        await axios.post(COURSE_ADD_URL, payload);
        setMsg('✅ Course added successfully!');
      }
      setShowSuccess(true);
      setShowModal(false);
      setEditing(false);
      setForm(getInitialForm());
      fetchCourses();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Failed to save course'));
    }
    setLoading(false);
  };

  const handleDelete = async (courseid) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await axios.delete(COURSE_DELETE_URL(courseid));
      setCourses(courses => courses.filter(c => c.courseid !== courseid));
    } catch {
      alert('Failed to delete course');
    }
  };

  // ---- styles ----
  const containerStyle = {
    width: 700,
    maxWidth: '98vw',
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 8px 28px rgba(0,0,0,0.17)',
    padding: '38px 38px 26px 38px',
    position: 'relative',
    border: '1.5px solid #E0E7FF',
    fontFamily: 'Segoe UI, Arial, sans-serif'
  };
  const headerStyle = {
    margin: '0 0 28px 0',
    textAlign: 'center',
    fontWeight: 800,
    letterSpacing: 1,
    color: '#3730a3'
  };
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '22px 26px',
    marginBottom: 18,
  };
  const labelStyle = {
    fontWeight: 600,
    marginBottom: 4,
    color: '#312e81',
    letterSpacing: 0.5
  };
  const inputStyle = {
    padding: '11px', border: '1.2px solid #c7d2fe', borderRadius: '6px', fontSize: 16,
    outlineColor: '#6366F1', background: '#F9FAFB'
  };
  const textareaStyle = {
    ...inputStyle,
    minHeight: '42px',
    resize: 'vertical'
  };
  const buttonStyle = {
    width: '100%', padding: '15px', backgroundColor: '#4F46E5',
    color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: 17,
    letterSpacing: 1, cursor: loading ? 'default' : 'pointer', marginTop: 2, boxShadow: "0 2px 12px #e0e7ff"
  };
  const messageStyle = success => ({
    color: success ? 'green' : '#dc2626',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 500,
    fontSize: 15
  });
  const modalOverlay = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(44,47,68,0.23)',
    zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  };
  const modalContent = {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%'
  };

  // ---- Reusable field ----
  function Field({ label, name, type, value, onChange, min, required = false }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <label style={labelStyle}>{label}</label>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          required={required}
          style={inputStyle}
        />
      </div>
    );
  }

  // ---- Add/Edit Modal ----
  function CourseModal() {
    if (!showModal) return null;
    return (
      <div style={modalOverlay} onClick={closeModal}>
        <div style={{ ...containerStyle, maxWidth: 700, width: '98vw', zIndex: 9999 }} onClick={e => e.stopPropagation()}>
          <button onClick={closeModal}
            style={{
              position: 'absolute', right: 18, top: 14, border: 'none', background: 'none',
              fontSize: 25, fontWeight: 800, color: '#374151', cursor: 'pointer', lineHeight: 1
            }}>×</button>
          <h2 style={headerStyle}>{editing ? 'Edit Course' : 'Add Course'}</h2>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div style={gridStyle}>
              <Field label="Course ID" name="courseid" type="text" value={form.courseid} onChange={handleChange} required={!editing} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  name="coursedesc"
                  value={form.coursedesc}
                  onChange={handleChange}
                  required
                  style={textareaStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Department</label>
                <select
                  name="collegedept"
                  value={form.collegedept}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                >
                  <option value="">Select Dept ID</option>
                  {departments.map(dep => (
                    <option key={dep.collegedeptid} value={dep.collegedeptid}>
                      {dep.collegedeptid}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Program Code" name="courseprgcod" type="text" value={form.courseprgcod} onChange={handleChange} />
              <Field label="Level" name="course_level" type="text" value={form.course_level} onChange={handleChange} />
              <Field label="Total Semesters" name="course_totsemester" type="number" min="0" value={form.course_totsemester} onChange={handleChange} />
              <Field label="Total Credits" name="course_tot_credits" type="number" min="0" value={form.course_tot_credits} onChange={handleChange} />
              <Field label="Duration" name="course_duration" type="text" value={form.course_duration} onChange={handleChange} />
              <Field label="Start Date" name="coursestartdate" type="date" value={form.coursestartdate} onChange={handleChange} />
              <Field label="End Date" name="courseenddate" type="date" value={form.courseenddate} onChange={handleChange} />
            </div>
            {msg && (
              <div style={messageStyle(msg.startsWith('✅'))}>{msg}</div>
            )}
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? (editing ? 'Saving...' : 'Saving...') : (editing ? 'Update Course' : 'Add Course')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---- Success Modal ----
  function SuccessModal() {
    if (!showSuccess) return null;
    return (
      <div style={modalOverlay}>
        <div style={modalContent}>
          <h3>Success!</h3>
          <p>{msg}</p>
          <button
            onClick={() => setShowSuccess(false)}
            style={{
              marginTop: '20px', padding: '10px 20px', fontSize: '14px',
              backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer'
            }}
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={containerStyle}>
        <button
          onClick={openAddModal}
          style={{
            padding: '13px 26px', background: '#3730a3', color: '#fff', border: 'none', borderRadius: 8,
            fontWeight: 700, fontSize: 17, cursor: 'pointer', marginBottom: 20, float: 'right'
          }}
        >+ Add Course</button>
        <h2 style={headerStyle}>Add Course</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div style={gridStyle}>
            <Field label="Course ID" name="courseid" type="text" value={form.courseid} onChange={handleChange} required={!editing} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Description</label>
              <textarea
                name="coursedesc"
                value={form.coursedesc}
                onChange={handleChange}
                required
                style={textareaStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Department</label>
              <select
                name="collegedept"
                value={form.collegedept}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                <option value="">Select Dept ID</option>
                {departments.map(dep => (
                  <option key={dep.collegedeptid} value={dep.collegedeptid}>
                    {dep.collegedeptid}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Program Code" name="courseprgcod" type="text" value={form.courseprgcod} onChange={handleChange} />
            <Field label="Level" name="course_level" type="text" value={form.course_level} onChange={handleChange} />
            <Field label="Total Semesters" name="course_totsemester" type="number" min="0" value={form.course_totsemester} onChange={handleChange} />
            <Field label="Total Credits" name="course_tot_credits" type="number" min="0" value={form.course_tot_credits} onChange={handleChange} />
            <Field label="Duration" name="course_duration" type="text" value={form.course_duration} onChange={handleChange} />
            <Field label="Start Date" name="coursestartdate" type="date" value={form.coursestartdate} onChange={handleChange} />
            <Field label="End Date" name="courseenddate" type="date" value={form.courseenddate} onChange={handleChange} />
          </div>
          {msg && !showSuccess && (
            <div style={messageStyle(msg.startsWith('✅'))}>{msg}</div>
          )}
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? (editing ? 'Saving...' : 'Saving...') : (editing ? 'Update Course' : 'Add Course')}
          </button>
        </form>
      </div>

      {CourseModal()}

      {/* Only show table if showTable is true */}
      {showTable && (
        <div style={{
          backgroundColor: '#e3f0ff',
          padding: '40px 0 0 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: '90%',
            maxWidth: '1200px',
            background: '#fff',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.09)',
            padding: '30px 28px'
          }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#3730a3', fontWeight: 700 }}>All Courses</h2>
            <div style={{
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              overflow: 'auto'
            }}>
              <table style={{
                width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', fontSize: 16
              }}>
                <thead>
                  <tr style={{
                    background: '#EEF2FF', color: '#3730a3', fontWeight: 600
                  }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Dept</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Prg Code</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Level</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Sem</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Credits</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Duration</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Start</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>End</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, idx) => (
                    <tr key={course.courseid || idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '10px 12px' }}>{course.courseid}</td>
                      <td style={{ padding: '10px 12px' }}>{course.coursedesc}</td>
                      <td style={{ padding: '10px 12px' }}>{course.collegedept}</td>
                      <td style={{ padding: '10px 12px' }}>{course.courseprgcod}</td>
                      <td style={{ padding: '10px 12px' }}>{course.course_level}</td>
                      <td style={{ padding: '10px 12px' }}>{course.course_totsemester}</td>
                      <td style={{ padding: '10px 12px' }}>{course.course_tot_credits}</td>
                      <td style={{ padding: '10px 12px' }}>{course.course_duration}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {course.coursestartdate ? course.coursestartdate.substring(0, 10) : ''}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {course.courseenddate ? course.courseenddate.substring(0, 10) : ''}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          style={{
                            marginRight: 7, padding: '3px 13px', borderRadius: 6, border: '1px solid #a5b4fc',
                            background: '#EEF2FF', color: '#3730a3', fontWeight: 600, cursor: 'pointer'
                          }}
                          onClick={() => openEditModal(course)}
                          title="Edit"
                        >Edit</button>
                        <button
                          style={{
                            padding: '3px 10px', borderRadius: 6, border: '1px solid #fecaca',
                            background: '#fee2e2', color: '#c0392b', fontWeight: 600, cursor: 'pointer'
                          }}
                          onClick={() => handleDelete(course.courseid)}
                          title="Delete"
                        >Delete</button>
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                        No courses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {SuccessModal()}
    </>
  );
}

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';

// ---- Safe URL joiner
function joinUrl(base = '', path = '') {
  if (!base) return path || '';
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

// Build base API URLs from config
const API = joinUrl(config.COURSE_OFFERING_ROUTE);

const defaultForm = {
  offerid: '',
  offer_programid: '',
  offer_courseid: '',
  offer_term: '',
  offer_facultyid: '',
  offer_semesterno: '',
  offer_section: '',
  offerislab: false,
  offer_capacity: '',
  offeriselective: false,
  offerelectgroupid: '',
  offerroom: '',
  offerstatus: ''
};

const CollegeCourseOfferingManager = () => {
  const [formData, setFormData] = useState(defaultForm);
  const [offerings, setOfferings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [years, setYears] = useState([]);

  useEffect(() => {
    fetchDropdowns();
    fetchOfferings();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const [cr, sr, tr, yr] = await Promise.all([
        axios.get(joinUrl(config.COURSE_ROUTE, 'all')),
        axios.get(joinUrl(config.SUBJECT_ROUTE, 'list')),
        axios.get(config.TEACHER_ROUTE),
        axios.get(config.MASTER_ACADYEAR_ROUTE)
      ]);
      setCourses(cr.data);
      setSubjects(sr.data.subjects || sr.data);
      setTeachers(tr.data);
      setYears(yr.data);
    } catch (err) {
      console.error('Dropdown fetch error:', err);
    }
  };

  const fetchOfferings = async () => {
    try {
      const res = await axios.get(API);
      setOfferings(res.data.offerings || []);
    } catch (err) {
      console.error('Error fetching offerings:', err);
    }
  };

  const handleChange = ({ target: { name, value, type, checked } }) => {
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      ...formData,
      offerislab: !!formData.offerislab,
      offeriselective: !!formData.offeriselective,
      offer_semesterno: Number(formData.offer_semesterno),
      offer_capacity: Number(formData.offer_capacity),
    };

    try {
      const exists = offerings.some(o => o.offerid === formData.offerid);

      if (exists) {
        await axios.put(`${API}/${formData.offerid}`, payload);
        alert('Updated!');
      } else {
        await axios.post(API, payload);
        alert('Created!');
      }

      setFormData(defaultForm);
      fetchOfferings();
    } catch (err) {
      console.error('Submit failed:', err);
      alert(`Submit failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm(`Delete ${id}?`)) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchOfferings();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed');
    }
  };

  // Helper to get subject name
  const getSubjectDesc = (subjId) => {
    const subj = subjects.find(s =>
      String(s.subjectid) === String(subjId) ||
      String(s.subject_code) === String(subjId) ||
      String(s.subjectname) === String(subjId)
    );
    return subj
      ? (subj.subjectname || subj.subjectdesc || subj.subject_description || subj.subject_code || subjId)
      : subjId;
  };

  // ✅ Helper to get course description/name (instead of showing ID)
  const getCourseDesc = (courseId) => {
    const c = courses.find(c =>
      String(c.courseid) === String(courseId) ||
      String(c.course_code) === String(courseId) ||
      String(c.coursename) === String(courseId) ||
      String(c.coursedesc) === String(courseId)
    );
    return c
      ? (c.coursename || c.coursedesc || c.course_description || c.course_code || courseId)
      : courseId;
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: 'auto' }}>
      <h2>📘 Course Offering Manager</h2>

      <button onClick={() => setFormData(defaultForm)} style={btnAdd}>
        ➕ Add New Offering
      </button>

      <form onSubmit={handleSubmit} style={formStyle}>
        <input name="offerid" value={formData.offerid} onChange={handleChange} placeholder="Offer ID" style={input} />

        <select name="offer_programid" value={formData.offer_programid} onChange={handleChange} style={input}>
          <option value="">Select Program</option>
          {courses.map(c => (
            <option key={c.courseid} value={c.courseid}>
              {(c.coursename || c.coursedesc || c.course_description || c.course_code || c.courseid)} ({c.courseid})
            </option>
          ))}
        </select>

        <select name="offer_courseid" value={formData.offer_courseid} onChange={handleChange} style={input}>
          <option value="">Select Subject</option>
          {subjects.map(s => (
            <option key={s.subjectid} value={s.subjectid}>
              {(s.subjectname || s.subjectdesc || s.subject_description || s.subject_code || s.subjectid)} ({s.subjectid})
            </option>
          ))}
        </select>

        <select name="offer_term" value={formData.offer_term} onChange={handleChange} style={input}>
          <option value="">Select Academic Year</option>
          {years.map(y => (
            <option key={y.acad_yearid} value={y.acad_yearid}>
              {y.year} ({y.id})
            </option>
          ))}
        </select>

        <select name="offer_facultyid" value={formData.offer_facultyid} onChange={handleChange} style={input}>
          <option value="">Select Faculty</option>
          {teachers.map(t => (
            <option key={t.teacherid} value={t.teacherid}>{t.teachername}</option>
          ))}
        </select>

        <input name="offer_semesterno" type="number" value={formData.offer_semesterno} onChange={handleChange} placeholder="Semester No" style={input} />
        <input name="offer_section" value={formData.offer_section} onChange={handleChange} placeholder="Section" style={input} />
        <input name="offer_capacity" type="number" value={formData.offer_capacity} onChange={handleChange} placeholder="Capacity" style={input} />
        <input name="offerroom" value={formData.offerroom} onChange={handleChange} placeholder="Room" style={input} />
        <input name="offerstatus" value={formData.offerstatus} onChange={handleChange} placeholder="Status" style={input} />
        <input name="offerelectgroupid" value={formData.offerelectgroupid} onChange={handleChange} placeholder="Elective Group ID" style={input} />

        <label style={{ gridColumn: 'span 2' }}>
          <input type="checkbox" name="offerislab" checked={formData.offerislab} onChange={handleChange} /> Is Lab
        </label>

        <label style={{ gridColumn: 'span 2' }}>
          <input type="checkbox" name="offeriselective" checked={formData.offeriselective} onChange={handleChange} /> Is Elective
        </label>

        <button type="submit" style={submitBtn}>💾 Save Offering</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            {['Offer ID','Course','Subject','Year','Faculty','Sem','Section','Lab','Capacity','Elect','Group','Room','Status','Actions'].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {offerings.map(off => (
            <tr key={off.offerid}>
              <td style={td}>{off.offerid}</td>
              {/* ✅ Show course description/name instead of raw ID */}
              <td style={td}>{getCourseDesc(off.offer_programid)}</td>
              <td style={td}>{getSubjectDesc(off.offer_courseid)}</td>
              <td style={td}>{off.offer_term}</td>
              <td style={td}>{off.offer_facultyid}</td>
              <td style={td}>{off.offer_semesterno}</td>
              <td style={td}>{off.offer_section}</td>
              <td style={td}>{off.offerislab ? '✅' : '❌'}</td>
              <td style={td}>{off.offer_capacity}</td>
              <td style={td}>{off.offeriselective ? '✅' : '❌'}</td>
              <td style={td}>{off.offerelectgroupid}</td>
              <td style={td}>{off.offerroom}</td>
              <td style={td}>{off.offerstatus}</td>
              <td style={td}>
                <button onClick={() => setFormData(off)} style={btnEdit}>✏️</button>
                <button onClick={() => handleDelete(off.offerid)} style={btnDelete}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Styles
const input = { padding: 10, border: '1px solid #ccc', borderRadius: 4 };
const formStyle = { display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginBottom: 20 };
const submitBtn = { gridColumn: 'span 2', padding: 12, background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' };
const btnAdd = { padding: '10px 16px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginBottom: 20 };
const btnEdit = { padding: '6px 10px', marginRight: 6, background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' };
const btnDelete = { padding: '6px 10px', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer' };
const th = { padding: 8, border: '1px solid #ccc', textAlign: 'left' };
const td = { padding: 8, border: '1px solid #ddd' };

export default CollegeCourseOfferingManager;

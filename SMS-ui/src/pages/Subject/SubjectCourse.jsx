import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';

// --- helpers ---
const joinUrl = (base, path = '') =>
  path ? `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}` : String(base);

const pickArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw?.items)) return raw.items;
  if (raw && typeof raw === 'object') {
    const k = Object.keys(raw).find((x) => Array.isArray(raw[x]));
    if (k) return raw[k];
  }
  return [];
};

const initialForm = {
  sub_cou_id: '',
  sub_cou_mast_id: '',
  sub_cou_mast_sub_id: '',
  sub_cou_sem_no: '',
  sub_cou_iselective: false,
  sub_cou_electivegroupid: '',
  sub_cou_islab: false,
  sub_cou_isaactive: true,
};

export default function SubjectCourseManager() {
  // Use middleware_config routes
  const SUBJECT_COURSE_API = joinUrl(config.SUBJECT_COURSE_ROUTE); // e.g. /api/subject-course
  const COURSE_API = joinUrl(config.COURSE_ROUTE, 'all');          // e.g. /api/course/all
  const SUBJECT_API = joinUrl(config.SUBJECT_ROUTE, 'st');         // e.g. /api/subject/st

  const [form, setForm] = useState(initialForm);
  const [subjectCourses, setSubjectCourses] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSubjectCourses(), fetchCourses(), fetchSubjects()])
      .catch((err) => console.error('Error loading data:', err))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubjectCourses = async () => {
    const res = await axios.get(SUBJECT_COURSE_API);
    // Allow either direct array or {data:[...]}
    setSubjectCourses(pickArray(res.data));
  };

  const fetchCourses = async () => {
    const res = await axios.get(COURSE_API);
    setCourses(pickArray(res.data));
  };

  const fetchSubjects = async () => {
    const res = await axios.get(SUBJECT_API);
    // some backends send {subjects:[...]}—fall back to generic picker
    setSubjects(pickArray(res.data?.subjects ?? res.data));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(joinUrl(SUBJECT_COURSE_API, form.sub_cou_id), form);
      } else {
        await axios.post(SUBJECT_COURSE_API, form);
      }
      setForm(initialForm);
      setEditMode(false);
      fetchSubjectCourses();
    } catch (err) {
      console.error('Error saving subject course:', err?.response?.data || err);
      alert('Failed to save. Check console for errors.');
    }
  };

  const handleEdit = (course) => {
    setForm(course);
    setEditMode(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await axios.delete(joinUrl(SUBJECT_COURSE_API, id));
      fetchSubjectCourses();
    } catch (err) {
      console.error('Error deleting subject course:', err?.response?.data || err);
      alert('Failed to delete. Check console for errors.');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading data...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Subject Course Manager</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px', display: 'grid', gap: 8 }}>
        <input
          name="sub_cou_id"
          value={form.sub_cou_id}
          onChange={handleChange}
          placeholder="ID"
          required
        />

        {/* Course Dropdown */}
        <select
          name="sub_cou_mast_id"
          value={form.sub_cou_mast_id}
          onChange={handleChange}
          required
        >
          <option value="">-- Select Course --</option>
          {Array.isArray(courses) &&
            courses.map((course) => (
              <option key={course.courseid} value={course.courseid}>
                {course.coursename || course.courseid}
              </option>
            ))}
        </select>

        {/* Subject Dropdown */}
        <select
          name="sub_cou_mast_sub_id"
          value={form.sub_cou_mast_sub_id}
          onChange={handleChange}
          required
        >
          <option value="">-- Select Subject --</option>
          {Array.isArray(subjects) &&
            subjects.map((subject) => (
              <option key={subject.subjectid} value={subject.subjectid}>
                {subject.subjectid} — {subject.subjectname || subject.subjectcoursetype || ''}
              </option>
            ))}
        </select>

        <input
          name="sub_cou_sem_no"
          value={form.sub_cou_sem_no}
          onChange={handleChange}
          placeholder="Semester No"
        />

        <label>
          Is Elective:&nbsp;
          <input
            type="checkbox"
            name="sub_cou_iselective"
            checked={form.sub_cou_iselective}
            onChange={handleChange}
          />
        </label>

        <input
          name="sub_cou_electivegroupid"
          value={form.sub_cou_electivegroupid}
          onChange={handleChange}
          placeholder="Elective Group ID"
          disabled={!form.sub_cou_iselective}
        />

        <label>
          Is Lab:&nbsp;
          <input
            type="checkbox"
            name="sub_cou_islab"
            checked={form.sub_cou_islab}
            onChange={handleChange}
          />
        </label>

        <label>
          Is Active:&nbsp;
          <input
            type="checkbox"
            name="sub_cou_isaactive"
            checked={form.sub_cou_isaactive}
            onChange={handleChange}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="submit">{editMode ? 'Update' : 'Add'} Subject Course</button>
          {editMode && (
            <button
              type="button"
              onClick={() => {
                setEditMode(false);
                setForm(initialForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {subjectCourses.length === 0 ? (
        <div>No subject courses found.</div>
      ) : (
        <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Course ID</th>
              <th>Subject ID</th>
              <th>Semester</th>
              <th>Elective</th>
              <th>Elective Group</th>
              <th>Lab</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjectCourses.map((course) => (
              <tr key={course.sub_cou_id}>
                <td>{course.sub_cou_id}</td>
                <td>{course.sub_cou_mast_id}</td>
                <td>{course.sub_cou_mast_sub_id}</td>
                <td>{course.sub_cou_sem_no}</td>
                <td>{course.sub_cou_iselective ? 'Yes' : 'No'}</td>
                <td>{course.sub_cou_electivegroupid}</td>
                <td>{course.sub_cou_islab ? 'Yes' : 'No'}</td>
                <td>{course.sub_cou_isaactive ? 'Yes' : 'No'}</td>
                <td>
                  <button onClick={() => handleEdit(course)}>Edit</button>
                  <button onClick={() => handleDelete(course.sub_cou_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

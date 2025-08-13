// SMS-ui/src/pages/Subject/MasterSubject.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';
import '../../index.css';

/* ---------- helpers ---------- */
const joinUrl = (base, path = '') =>
  path ? `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}` : String(base);

/* ---------- Reusable Fields (use index.css classes only) ---------- */
function Field({ label, name, type = 'text', value, onChange, required = true }) {
  return (
    <div className="form-row">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="form-row">
      <label className="form-label">{label}</label>
      <select className="form-input" name={name} value={value} onChange={onChange} required>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------- Add/Edit Modal ---------- */
function SubjectFormModal({
  show,
  editing,
  form,
  setForm,
  departments,
  onClose,
  onSubmit,
  loading,
  error,
  message,
}) {
  if (!show) return null;

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <button className="modal-x" type="button" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-heading">{editing ? 'Edit Subject' : 'Add Subject'}</h2>

        <form onSubmit={onSubmit} autoComplete="off">
          <div className="form-grid form-grid--3">
            <Field label="Subject ID" name="subjectid" value={form.subjectid} onChange={handleChange} />
            <Field label="Code" name="subjectcode" value={form.subjectcode} onChange={handleChange} />
            <Field label="Description" name="subjectdesc" value={form.subjectdesc} onChange={handleChange} />

            <Field
              label="Credits"
              name="subjectcredits"
              type="number"
              value={form.subjectcredits}
              onChange={handleChange}
              required={false}
            />
            <Field
              label="Lecture Hrs"
              name="subjectlecturehrs"
              type="number"
              value={form.subjectlecturehrs}
              onChange={handleChange}
              required={false}
            />
            <Field
              label="Tutorial Hrs"
              name="subjecttutorialhrs"
              type="number"
              value={form.subjecttutorialhrs}
              onChange={handleChange}
              required={false}
            />
            <Field
              label="Practical Hrs"
              name="subjectpracticalhrs"
              type="number"
              value={form.subjectpracticalhrs}
              onChange={handleChange}
              required={false}
            />
            <Field
              label="Course Type"
              name="subjectcoursetype"
              value={form.subjectcoursetype}
              onChange={handleChange}
              required={false}
            />
            <Field
              label="Category"
              name="subjectcategory"
              value={form.subjectcategory}
              onChange={handleChange}
              required={false}
            />

            <SelectField
              label="Department"
              name="subjectdeptid"
              value={form.subjectdeptid}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Dept' },
                ...departments.map(d => ({
                  value: d.collegedeptid,
                  label: `${d.collegedeptdesc} (${d.collegedeptid})`,
                })),
              ]}
            />

            {/* Active checkbox (styled by default form grid spacing) */}
            <div className="form-row">
              <label className="form-label" htmlFor="subjectactive">
                Active
              </label>
              <input
                id="subjectactive"
                className="form-input"
                type="checkbox"
                name="subjectactive"
                checked={!!form.subjectactive}
                onChange={handleChange}
              />
            </div>
          </div>

          {!!error && <div className="modal-desc modal-desc--error">{error}</div>}
          {!!message && <div className="modal-desc modal-desc--ok">{message}</div>}

          <button type="submit" className={`btn btn--submit ${loading ? 'is-loading' : ''}`} disabled={loading}>
            {loading ? (editing ? 'Updating...' : 'Adding...') : editing ? 'Update Subject' : 'Add Subject'}
          </button>

          <button type="button" className="btn btn--close-fullwidth" onClick={onClose}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function MasterSubject() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    subjectid: '',
    subjectcode: '',
    subjectdesc: '',
    subjectcredits: '',
    subjectlecturehrs: '',
    subjecttutorialhrs: '',
    subjectpracticalhrs: '',
    subjectcoursetype: '',
    subjectcategory: '',
    subjectdeptid: '',
    subjectactive: true,
  });
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalError, setModalError] = useState('');

  // endpoints
  const SUBJECT_LIST_URL = joinUrl(config.SUBJECT_ROUTE, 'list');
  const SUBJECT_ADD_URL = joinUrl(config.SUBJECT_ROUTE, 'add');
  const SUBJECT_UPDATE_URL = id => joinUrl(config.SUBJECT_ROUTE, `update/${encodeURIComponent(id)}`);
  const SUBJECT_DELETE_URL = id => joinUrl(config.SUBJECT_ROUTE, `delete/${encodeURIComponent(id)}`);
  const DEPARTMENTS_URL = joinUrl(config.MASTER_DEPTS_ROUTE);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(SUBJECT_LIST_URL);
      setSubjects(res.data?.subjects ?? res.data ?? []);
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(DEPARTMENTS_URL);
      setDepartments(res.data ?? []);
    } catch {
      setDepartments([]);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setModalError('');
    setModalMessage('');
    setLoading(true);

    if (!form.subjectid || !form.subjectcode || !form.subjectdesc) {
      setModalError('Subject ID, Code, and Description are required.');
      setLoading(false);
      return;
    }

    try {
      if (editing) {
        await axios.put(SUBJECT_UPDATE_URL(form.subjectid), form);
        setModalMessage('Subject updated successfully!');
      } else {
        await axios.post(SUBJECT_ADD_URL, form);
        setModalMessage('Subject added successfully!');
      }

      setTimeout(() => {
        setModalMessage('');
        setShowModal(false);
        setEditing(false);
        setForm({
          subjectid: '',
          subjectcode: '',
          subjectdesc: '',
          subjectcredits: '',
          subjectlecturehrs: '',
          subjecttutorialhrs: '',
          subjectpracticalhrs: '',
          subjectcoursetype: '',
          subjectcategory: '',
          subjectdeptid: '',
          subjectactive: true,
        });
        fetchSubjects();
      }, 900);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setForm({
      subjectid: '',
      subjectcode: '',
      subjectdesc: '',
      subjectcredits: '',
      subjectlecturehrs: '',
      subjecttutorialhrs: '',
      subjectpracticalhrs: '',
      subjectcoursetype: '',
      subjectcategory: '',
      subjectdeptid: '',
      subjectactive: true,
    });
    setEditing(false);
    setShowModal(true);
    setModalError('');
    setModalMessage('');
  };

  const handleEditClick = subj => {
    setForm({
      ...subj,
      subjectactive:
        subj.subjectactive === true || subj.subjectactive === 'true' || subj.subjectactive === 1,
    });
    setEditing(true);
    setShowModal(true);
    setModalError('');
    setModalMessage('');
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await axios.delete(SUBJECT_DELETE_URL(id));
      setSubjects(ss => ss.filter(d => d.subjectid !== id));
    } catch {
      alert('Failed to delete subject');
    }
  };

  return (
    <div className="mu-page">
      {/* Page Title */}
      <h1 className="mu-title">Subjects</h1>

      {/* Toolbar (Add button to match the rest of the app) */}
      <div className="mu-toolbar">
        <div className="searchbox">
          
          <input className="searchbox__input" placeholder="Search Subject" disabled />
        </div>
        <button className="btn btn--add" onClick={handleAddClick}>
          <span className="btn-plus">+</span> Add
        </button>
      </div>

      {/* Modal */}
      <SubjectFormModal
        show={showModal}
        editing={editing}
        form={form}
        setForm={setForm}
        departments={departments}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={loading}
        error={modalError}
        message={modalMessage}
      />

      {/* Table Card */}
      <div className="mu-tablewrap-outer">
        <div className="mu-tablewrap">
          <h2 className="mu-subtitle">All Subjects</h2>
          <div className="mu-tablecard">
            <table className="mu-table">
              <thead>
                <tr className="mu-thead-row">
                  <th className="mu-th">Subject ID</th>
                  <th className="mu-th">Code</th>
                  <th className="mu-th">Description</th>
                  <th className="mu-th">Credits</th>
                  <th className="mu-th">Lecture Hrs</th>
                  <th className="mu-th">Tutorial Hrs</th>
                  <th className="mu-th">Practical Hrs</th>
                  <th className="mu-th">Course Type</th>
                  <th className="mu-th">Category</th>
                  <th className="mu-th">Dept ID</th>
                  <th className="mu-th">Active</th>
                  <th className="mu-th" style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr>
                    <td className="mu-empty" colSpan={12}>
                      {loading ? 'Loading...' : 'No subjects found'}
                    </td>
                  </tr>
                ) : (
                  subjects.map(subj => (
                    <tr key={subj.subjectid}>
                      <td className="mu-td">{subj.subjectid}</td>
                      <td className="mu-td">{subj.subjectcode}</td>
                      <td className="mu-td">{subj.subjectdesc}</td>
                      <td className="mu-td">{subj.subjectcredits}</td>
                      <td className="mu-td">{subj.subjectlecturehrs}</td>
                      <td className="mu-td">{subj.subjecttutorialhrs}</td>
                      <td className="mu-td">{subj.subjectpracticalhrs}</td>
                      <td className="mu-td">{subj.subjectcoursetype}</td>
                      <td className="mu-td">{subj.subjectcategory}</td>
                      <td className="mu-td">{subj.subjectdeptid}</td>
                      <td className="mu-td">{subj.subjectactive ? 'Yes' : 'No'}</td>
                      <td className="mu-td">
                        <button className="btn btn--primary" onClick={() => handleEditClick(subj)}>
                          Edit
                        </button>
                        <button className="btn btn--danger" onClick={() => handleDelete(subj.subjectid)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* If you add pagination later, drop it here using the existing classes:
            <div className="mu-pagination mu-pagination--chips">
              <span className="mu-pageinfo mu-pageinfo--chips">Showing page 1 of 1 pages</span>
              <div className="mu-pagebtns mu-pagebtns--chips">
                <button className="pagechip" disabled>«</button>
                <span className="pagechip pagechip--active">1</span>
                <button className="pagechip" disabled>»</button>
              </div>
            </div>
            */}
          </div>
        </div>
      </div>
    </div>
  );
}

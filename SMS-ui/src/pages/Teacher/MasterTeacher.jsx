import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config'; // make sure this path is correct

export default function MasterTeacher() {
  const [colleges, setColleges] = useState([]); // [{id,label}]
  const [users, setUsers] = useState([]);       // [{userid, username, email}]
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function getInitialForm() {
    return {
      teacherid: '', teachercode: '', teachername: '', teacheraddress: '',
      teacheremailid: '', teachermob1: '', teachermob2: '', teachergender: '',
      teachercaste: '', teacherdoj: '', teacherdesig: '', teachertype: '',
      teachermaxweekhrs: '', teacheruserid: '', teachercollegeid: '',
      teachervalid: true,
    };
  }

  // ---------- helpers ----------
  const toStringSafe = (v) => (v === undefined || v === null ? '' : String(v).trim());
  const toNumOrNull = (v) => {
    if (v === '' || v === undefined || v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const looksLikeEmail = (s) => /\S+@\S+\.\S+/.test(String(s || ''));

  function pickArray(raw) {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.rows)) return raw.rows;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.list)) return raw.list;
    if (Array.isArray(raw?.items)) return raw.items;
    if (raw && typeof raw === 'object') {
      const key = Object.keys(raw).find(k => Array.isArray(raw[k]));
      if (key) return raw[key];
    }
    return [];
  }

  // ---------- colleges ----------
  function normalizeColleges(raw) {
    const list = pickArray(raw);
    return list
      .map(c => {
        const idRaw = c.collegeid ?? c.college_id ?? c.id ?? c.ID ?? c.CollegeID;
        const nameRaw = c.collegename ?? c.college_name ?? c.name ?? c.collegeName ?? `College ${idRaw ?? ''}`;
        const id = toStringSafe(idRaw);
        return id ? { id, label: `${id} — ${toStringSafe(nameRaw)}` } : null;
      })
      .filter(Boolean);
  }

  // ---------- users ----------
  const findUser = (value, teacherCtx) => {
    const v = toStringSafe(value);
    const list = users || [];

    // by userid
    let u = list.find(x => String(x.userid) === v);
    if (u) return u;

    // by email/username
    if (looksLikeEmail(v)) {
      u = list.find(x => toStringSafe(x.email) === v || toStringSafe(x.username) === v);
      if (u) return u;
    }

    // fallback: try teacher's email
    const teeEmail = toStringSafe(teacherCtx?.teacheremailid || teacherCtx?.email || teacherCtx?.user?.email);
    if (teeEmail) {
      u = list.find(x => toStringSafe(x.email) === teeEmail || toStringSafe(x.username) === teeEmail);
      if (u) return u;
    }
    return undefined;
  };

  // ---------- teachers ----------
  const getTeacherUserRaw = (t) =>
    t.teacheruserid ??
    t.teacher_user_id ??
    t.user_id ??
    t.userid ??
    t.user?.userid ??
    t.user?.id ??
    t.user?.user_id ??
    '';

  function normalizeTeachers(raw) {
    const list = pickArray(raw);
    return list.map(t => {
      // stabilize teacheruserid to an ID string for UI
      const rawUser = getTeacherUserRaw(t);
      let teacheruserid = toStringSafe(rawUser);
      if (!teacheruserid || looksLikeEmail(teacheruserid)) {
        const u = findUser(teacheruserid, t);
        if (u?.userid != null) teacheruserid = String(u.userid);
      }

      return {
        ...t,
        teacherid: toStringSafe(t.teacherid ?? t.id ?? t.teacher_id),
        teacheruserid,
        teachercollegeid: toStringSafe(t.teachercollegeid ?? t.collegeid ?? t.college_id),
        teachername: t.teachername ?? t.name ?? '',
        teacheremailid: t.teacheremailid ?? t.email ?? '',
        teachermob1: t.teachermob1 ?? t.mobile1 ?? t.phone ?? '',
        teachergender: t.teachergender ?? t.gender ?? '',
        teachervalid: t.teachervalid ?? t.active ?? t.valid ?? true,
      };
    });
  }

  const renderUserRef = (teacher) => {
    const raw = getTeacherUserRaw(teacher) || teacher.teacheruserid || '';
    const u = findUser(raw, teacher);
    if (u) {
      const left = toStringSafe(u.userid);
      const right = toStringSafe(u.username || u.email);
      return right ? `${left} — ${right}` : left;
    }
    return toStringSafe(teacher.teacheruserid || raw);
  };

  // ---------- effects ----------
  useEffect(() => {
    const COLLEGES_URL = `${config.BASE_URL}/master-college/view-colleges`;
    axios.get(COLLEGES_URL)
      .then(res => {
        const raw = res?.data?.colleges ?? res?.data;
        setColleges(normalizeColleges(raw));
      })
      .catch(() => setColleges([]));

    axios.get(`${config.MASTER_USER_ROUTE}/users`)
      .then(res => setUsers(res.data?.users ?? res.data ?? []))
      .catch(() => setUsers([]));

    fetchTeachers();
    // eslint-disable-next-line
  }, []);

  // Once users arrive, re-normalize teachers so emails -> ids mapping applies
  useEffect(() => {
    if (teachers.length > 0 && users.length > 0) {
      setTeachers(prev => normalizeTeachers(prev));
    }
    // eslint-disable-next-line
  }, [users]);

  const fetchTeachers = () => {
    axios.get(`${config.TEACHER_ROUTE}`)
      .then(res => setTeachers(normalizeTeachers(res.data?.teachers ?? res.data ?? [])))
      .catch(() => setMessage('❌ Error fetching teacher list'));
  };

  // ---------- handlers ----------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : toStringSafe(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // must have a user id (string)
    if (!formData.teacheruserid) {
      setMessage('❌ Please select a valid User ID.');
      return;
    }

    setSubmitting(true);
    const now = new Date();

    // keep teacheruserid as STRING in payload
    const payload = {
      ...formData,
      teacheruserid: toStringSafe(formData.teacheruserid), // ✅ string
      teachercollegeid: toNumOrNull(formData.teachercollegeid), // college can stay numeric
      teachermaxweekhrs: toNumOrNull(formData.teachermaxweekhrs),
      createdat: now,
      updatedat: now,
    };

    try {
      if (editId) {
        await axios.put(`${config.TEACHER_ROUTE}/${encodeURIComponent(editId)}`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        setMessage('✅ Teacher updated successfully!');
      } else {
        await axios.post(`${config.TEACHER_ROUTE}`, payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        setMessage('✅ Teacher added successfully!');
      }
      setFormData(getInitialForm());
      setEditId(null);
      fetchTeachers();
    } catch (err) {
      console.error('Submit error:', err?.response?.data || err);
      setMessage(editId ? '❌ Error updating teacher.' : '❌ Error adding teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    setDeletingId(id);
    try {
      const res = await axios.delete(`${config.TEACHER_ROUTE}/${encodeURIComponent(id)}`);
      if (res?.data?.message || res?.status === 200) {
        setMessage('✅ Teacher deleted successfully!');
        fetchTeachers();
        if (editId === id) {
          setEditId(null);
          setFormData(getInitialForm());
        }
      } else {
        setMessage('❌ Delete failed. No success response from API.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setMessage(`❌ Error deleting teacher: ${err.response?.data?.error || err.response?.statusText || 'Unknown error'}`);
    }
    setDeletingId(null);
  };

  const handleEdit = (teacher) => {
    // ensure the select shows a proper userid (string)
    let uid = getTeacherUserRaw(teacher) || teacher.teacheruserid || '';
    const normalized = {
      ...teacher,
      teachercollegeid: toStringSafe(teacher.teachercollegeid ?? teacher.collegeid ?? teacher.college_id),
      teacheruserid: toStringSafe(uid), // ✅ keep as string
      teachermaxweekhrs: toStringSafe(teacher.teachermaxweekhrs),
    };

    setEditId(teacher.teacherid);
    setFormData(normalized);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData(getInitialForm());
    setMessage('');
  };

  // ---------- styles ----------
  const styles = {
    page: { background: '#F3F4F6', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Segoe UI, Arial, sans-serif' },
    container: { maxWidth: '1000px', margin: '0 auto 40px', background: '#FFF', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
    header: { backgroundColor: '#283e4a', color: '#fff', padding: '16px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 },
    formWrapper: { padding: '24px', background: '#fff' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
    label: { display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: 600, color: '#374151' },
    input: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' },
    select: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '0.95rem' },
    checkboxWrapper: { gridColumn: 'span 4', display: 'flex', alignItems: 'center', marginTop: '8px' },
    button: { gridColumn: 'span 4', padding: '12px', marginTop: '24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.8 : 1 },
    cancelButton: { gridColumn: 'span 2', padding: '12px', marginTop: '24px', marginLeft: '16px', backgroundColor: '#d1d5db', color: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
    message: { textAlign: 'center', marginBottom: '16px', fontSize: '1rem', color: message.startsWith('✅') ? '#16a34a' : '#dc2626' }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>Master Teachers</div>
        <div style={styles.formWrapper}>
          <h2 style={{ marginBottom: '16px', textAlign: 'center', color: '#111827' }}>
            {editId ? 'Edit Teacher' : 'Add New Teacher'}
          </h2>
          {message && <p style={styles.message}>{message}</p>}

          <form onSubmit={handleSubmit} style={styles.grid}>
            <div>
              <label style={styles.label}>Teacher ID</label>
              <input
                type="text" name="teacherid"
                value={formData.teacherid} onChange={handleChange}
                style={styles.input} required disabled={!!editId}
              />
            </div>
            <div>
              <label style={styles.label}>Code</label>
              <input type="text" name="teachercode" value={formData.teachercode} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Name</label>
              <input type="text" name="teachername" value={formData.teachername} onChange={handleChange} style={styles.input} required />
            </div>
            <div>
              <label style={styles.label}>Email</label>
              <input type="email" name="teacheremailid" value={formData.teacheremailid} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Mobile 1</label>
              <input type="text" name="teachermob1" value={formData.teachermob1} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Mobile 2</label>
              <input type="text" name="teachermob2" value={formData.teachermob2} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Gender</label>
              <select name="teachergender" value={formData.teachergender} onChange={handleChange} style={styles.select}>
                <option value="">-- Select Gender --</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Caste</label>
              <input type="text" name="teachercaste" value={formData.teachercaste} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>DOJ</label>
              <input type="date" name="teacherdoj" value={formData.teacherdoj} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Designation</label>
              <input type="text" name="teacherdesig" value={formData.teacherdesig} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Type</label>
              <select name="teachertype" value={formData.teachertype} onChange={handleChange} style={styles.select}>
                <option value="">-- Select --</option>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Max Week Hours</label>
              <input type="number" name="teachermaxweekhrs" value={formData.teachermaxweekhrs} onChange={handleChange} style={styles.input} />
            </div>

            <div>
              <label style={styles.label}>User ID</label>
              <select name="teacheruserid" value={formData.teacheruserid} onChange={handleChange} style={styles.select}>
                <option value="">Select User</option>
                {(users ?? []).map(u => (
                  <option key={u.userid} value={toStringSafe(u.userid)}>
                    {u.userid} — {u.username || u.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>College ID</label>
              <select
                name="teachercollegeid"
                value={formData.teachercollegeid}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">Select College</option>
                {(colleges ?? []).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.checkboxWrapper}>
              <input type="checkbox" name="teachervalid" checked={formData.teachervalid} onChange={handleChange} />
              <label style={{ marginLeft: '8px' }}>Active</label>
            </div>
            <button type="submit" disabled={submitting} style={styles.button}>
              {editId ? 'Update Teacher' : 'Add Teacher'}
            </button>
            {editId && (
              <button type="button" style={styles.cancelButton} onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Teacher Table */}
      <div style={styles.container}>
        <div style={{ ...styles.header, backgroundColor: '#111827' }}>All Teachers</div>
        <div style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f3f4f6' }}>
              <tr>
                <th style={cell}>ID</th>
                <th style={cell}>Name</th>
                <th style={cell}>Email</th>
                <th style={cell}>Mobile 1</th>
                <th style={cell}>Gender</th>
                <th style={cell}>College ID</th>
                <th style={cell}>User ID</th>
                <th style={cell}>Valid</th>
                <th style={cell}>Edit</th>
                <th style={cell}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center' }}>No teacher data available.</td></tr>
              ) : (
                teachers.map(t => (
                  <tr key={t.teacherid}>
                    <td style={cell}>{t.teacherid}</td>
                    <td style={cell}>{t.teachername}</td>
                    <td style={cell}>{t.teacheremailid}</td>
                    <td style={cell}>{t.teachermob1}</td>
                    <td style={cell}>{t.teachergender}</td>
                    <td style={cell}>{t.teachercollegeid}</td>
                    <td style={cell}>{renderUserRef(t)}</td>
                    <td style={cell}>{t.teachervalid ? '✅' : '❌'}</td>
                    <td style={cell}>
                      <button
                        onClick={() => handleEdit(t)}
                        style={{ background: '#60a5fa', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
                      >Edit</button>
                    </td>
                    <td style={cell}>
                      <button
                        onClick={() => handleDelete(t.teacherid)}
                        disabled={deletingId === t.teacherid}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: deletingId === t.teacherid ? 'wait' : 'pointer', opacity: deletingId === t.teacherid ? 0.7 : 1 }}
                      >{deletingId === t.teacherid ? 'Deleting...' : 'Delete'}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const cell = {
  padding: '10px',
  border: '1px solid #e5e7eb',
  textAlign: 'left',
  fontSize: '0.9rem',
};

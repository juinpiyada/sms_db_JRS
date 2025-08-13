import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config'; // Adjust path as needed

// Initial empty form state
const emptyForm = {
  teaacheravlid: '',
  teacherid: '',
  avldate: '',
  slottime: '',
  avlflafr: false
};

// ---- All your styles unchanged ----
const styles = {
  container: {
    padding: 24,
    maxWidth: 900,
    margin: '0 auto',
    fontFamily: 'Segoe UI, Arial, sans-serif'
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 2px 18px rgba(30,64,175,0.08)',
    padding: 32,
    marginBottom: 32,
    border: '1px solid #e5e7eb'
  },
  heading: {
    fontSize: 26,
    fontWeight: 800,
    color: '#183153',
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  label: {
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  input: {
    border: '1.3px solid #d1d5db',
    borderRadius: 7,
    padding: 11,
    fontSize: 16,
    width: '100%',
    marginBottom: 16,
    background: '#f9fafb'
  },
  select: {
    border: '1.3px solid #d1d5db',
    borderRadius: 7,
    padding: 11,
    fontSize: 16,
    width: '100%',
    marginBottom: 16,
    background: '#f9fafb'
  },
  checkbox: {
    width: 22,
    height: 22,
    marginRight: 7,
    accentColor: '#2563eb'
  },
  formRow: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap'
  },
  formCol: {
    flex: '1 1 250px',
    minWidth: 220
  },
  switchLabel: {
    fontWeight: 600,
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    marginTop: 3,
    marginBottom: 7
  },
  btn: {
    background: 'linear-gradient(90deg,#2563eb 60%,#60a5fa 100%)',
    color: '#fff',
    fontWeight: 700,
    border: 'none',
    borderRadius: 8,
    padding: '13px 0',
    width: '100%',
    fontSize: 17,
    boxShadow: '0 2px 12px #e0e7ff99',
    marginTop: 5,
    cursor: 'pointer',
    transition: 'background .15s'
  },
  tableCard: {
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 2px 12px #b6baff11',
    border: '1px solid #e5e7eb',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    fontSize: 16,
    borderCollapse: 'collapse',
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden'
  },
  th: {
    background: '#f1f5f9',
    color: '#172554',
    fontWeight: 700,
    padding: '11px 8px'
  },
  td: {
    padding: '10px 7px',
    borderBottom: '1.2px solid #f3f4f6',
    textAlign: 'center'
  },
  actions: {
    display: 'flex',
    gap: 7,
    justifyContent: 'center'
  },
  editBtn: {
    background: '#f59e42',
    color: '#fff',
    padding: '7px 13px',
    borderRadius: 6,
    border: 'none',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    boxShadow: '0 1px 4px #fbbf2440'
  },
  delBtn: {
    background: '#ef4444',
    color: '#fff',
    padding: '7px 13px',
    borderRadius: 6,
    border: 'none',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    boxShadow: '0 1px 4px #ef444440'
  },
  pillYes: {
    background: '#d1fae5',
    color: '#047857',
    fontWeight: 700,
    padding: '4px 16px',
    borderRadius: 14,
    fontSize: 14
  },
  pillNo: {
    background: '#fee2e2',
    color: '#b91c1c',
    fontWeight: 700,
    padding: '4px 16px',
    borderRadius: 14,
    fontSize: 14
  }
};

const icon = {
  id: <span style={{ display: 'inline-block', marginRight: 5 }}>#️⃣</span>,
  teacher: <span style={{ display: 'inline-block', marginRight: 5 }}>👨‍🏫</span>,
  date: <span style={{ display: 'inline-block', marginRight: 5 }}>📅</span>,
  slot: <span style={{ display: 'inline-block', marginRight: 5 }}>⏰</span>,
  avail: <span style={{ display: 'inline-block', marginRight: 5 }}>✅</span>
};

const TeacherAvailabilityManager = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch teachers on mount
  useEffect(() => {
    axios.get(config.TEACHER_ROUTE)
      .then(res => setTeachers(res.data.teachers || res.data))
      .catch(() => setTeachers([]));
  }, []);

  // Fetch availabilities on mount and after CRUD
  const fetchAvailabilities = async () => {
    try {
      setLoading(true);
      const res = await axios.get(config.TEACHER_AVAILABILITY_ROUTE);
      setAvailabilities(res.data.data || res.data || []);
      setLoading(false);
    } catch (err) {
      alert('Failed to fetch teacher availability!');
      setLoading(false);
      console.error(err);
    }
  };
  useEffect(() => { fetchAvailabilities(); }, []);

  // Input handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Submit handler (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${config.TEACHER_AVAILABILITY_ROUTE}/${form.teaacheravlid}`, form);
        alert('Availability updated!');
      } else {
        await axios.post(config.TEACHER_AVAILABILITY_ROUTE, form);
        alert('Availability added!');
      }
      fetchAvailabilities();
      setForm(emptyForm);
      setEditing(false);
    } catch (err) {
      alert('Failed to save availability!');
      console.error(err);
    }
  };

  // Edit handler
  const handleEdit = (entry) => {
    setForm({
      ...entry,
      avlflafr: !!entry.avlflafr
    });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete handler
  const handleDelete = async (teaacheravlid) => {
    if (!window.confirm('Delete this availability?')) return;
    try {
      await axios.delete(`${config.TEACHER_AVAILABILITY_ROUTE}/${teaacheravlid}`);
      fetchAvailabilities();
    } catch (err) {
      alert('Failed to delete!');
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.heading}>
          <span>📅</span> Teacher Availability Manager
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.formRow}>
            <div style={styles.formCol}>
              <label style={styles.label}>{icon.id} Availability ID</label>
              <input
                name="teaacheravlid"
                value={form.teaacheravlid}
                onChange={handleChange}
                placeholder="e.g. AV123"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formCol}>
              <label style={styles.label}>{icon.teacher} Teacher</label>
              <select
                name="teacherid"
                value={form.teacherid}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">-- Select Teacher --</option>
                {teachers.map(t => (
                  <option key={t.teacherid} value={t.teacherid}>
                    {t.teachername ? `${t.teachername} (${t.teacherid})` : t.teacherid}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formCol}>
              <label style={styles.label}>{icon.date} Date</label>
              <input
                name="avldate"
                value={form.avldate}
                onChange={handleChange}
                type="date"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formCol}>
              <label style={styles.label}>{icon.slot} Slot Time</label>
              <input
                name="slottime"
                value={form.slottime}
                onChange={handleChange}
                placeholder="e.g. 10:30-12:30"
                style={styles.input}
                required
              />
            </div>
          </div>
          <div style={{ ...styles.switchLabel, marginTop: 0, marginBottom: 8 }}>
            {icon.avail}
            <input
              type="checkbox"
              name="avlflafr"
              checked={form.avlflafr}
              onChange={handleChange}
              style={styles.checkbox}
              id="avlflafr"
            />
            <label htmlFor="avlflafr">Available for Faculty/Arrangement?</label>
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {editing ? 'Update' : 'Add'} Availability
          </button>
        </form>
      </div>

      <div style={styles.tableCard}>
        <div style={{ ...styles.heading, fontSize: 20, margin: '25px 0 6px 18px' }}>
          All Teacher Availabilities
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Availability ID</th>
              <th style={styles.th}>Teacher</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Slot</th>
              <th style={styles.th}>Available</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ ...styles.td, color: '#8b8b8b', padding: '34px 0' }}>Loading...</td>
              </tr>
            ) : availabilities.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...styles.td, color: '#8b8b8b', padding: '34px 0' }}>No records found</td>
              </tr>
            ) : availabilities.map((entry, idx) => {
              const teacherObj = teachers.find(t => t.teacherid === entry.teacherid);
              const rowStyle = {
                background: idx % 2 === 0 ? '#f3f4f6' : '#fff'
              };
              return (
                <tr key={entry.teaacheravlid} style={rowStyle}>
                  <td style={styles.td}>{entry.teaacheravlid}</td>
                  <td style={styles.td}>
                    {teacherObj
                      ? <span style={{ fontWeight: 600, color: '#2563eb' }}>{teacherObj.teachername}</span>
                      : <span style={{ color: '#444' }}>{entry.teacherid}</span>
                    }
                  </td>
                  <td style={styles.td}>{entry.avldate}</td>
                  <td style={styles.td}>{entry.slottime}</td>
                  <td style={styles.td}>
                    {entry.avlflafr
                      ? <span style={styles.pillYes}>Yes</span>
                      : <span style={styles.pillNo}>No</span>
                    }
                  </td>
                  <td style={{ ...styles.td, ...styles.actions }}>
                    <button
                      onClick={() => handleEdit(entry)}
                      style={styles.editBtn}
                      title="Edit"
                    >Edit</button>
                    <button
                      onClick={() => handleDelete(entry.teaacheravlid)}
                      style={styles.delBtn}
                      title="Delete"
                    >Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherAvailabilityManager;

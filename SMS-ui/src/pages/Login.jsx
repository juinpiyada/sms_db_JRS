import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import illustration from '../assets/image/education-illustration.avif';
import config from '../config/middleware_config'; // <-- correct import, nothing else!

export default function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  // 🔧 helper: first non-null/undefined
  const pick = (...vals) => vals.find(v => v !== undefined && v !== null);

  // 🔽 Helper: create & download a Notepad-friendly session .txt file
  const downloadSessionTxt = (auth) => {
    try {
      const ts = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const stamp = `${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())}_${pad(ts.getHours())}-${pad(ts.getMinutes())}-${pad(ts.getSeconds())}`;

      const lines = [
        '=== School Management System — Session Snapshot ===',
        `Generated (Local ISO): ${ts.toISOString()}`,
        '',
        `User ID: ${auth.userId || ''}`,
        `Name: ${auth.name || ''}`,
        `Role: ${auth.user_role || ''}`,
        `Role Description: ${auth.role_description || ''}`,
        `Roles: ${Array.isArray(auth.roles) ? auth.roles.join(', ') : (auth.roles || '')}`,
        '',
        '--- Student Info ---',
        `Student UserID (stuuserid): ${auth.stuuserid ?? ''}`,
        `Student Semester: ${auth.student_semester ?? ''}`,
        `Student Section: ${auth.student_section ?? ''}`,
        '',
        '--- Teacher Info ---',
        `Teacher UserID: ${auth.teacher_userid ?? ''}`,
        `Teacher ID: ${auth.teacher_id ?? ''}`,
        '',
        `Login Time: ${auth.login_time || ''}`,
      ];

      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session_${auth.userId || 'user'}_${stamp}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Could not generate session .txt:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowSuccess(false);

    if (!userId || !password) {
      setError('Both fields are required');
      return;
    }

    setLoading(true);

    try {
      const resp = await axios.post(config.LOGIN_ROUTE, {
        username: userId,
        password,
      });

      const data = resp?.data || {};

      if (!data || !data.roles?.length) {
        setError('Invalid response from server');
        setLoading(false);
        return;
      }

      // ✅ robust extraction of ids regardless of backend shape/casing/nesting
      const normalizedUserId =
        pick(data.userid, data.userId, data.user_id, data.username) ?? '';

      const teacherId =
        pick(
          data.teacher_id,
          data.teacherid,
          data.teacherId,
          data?.teacher?.teacherid,
          data?.teacher?.id,
          data?.teacher?.teacherID
        ) ?? null;

      const teacherUserid =
        pick(
          data.teacher_userid,
          data.teacherUserid,
          data.teacherUserId,
          data?.teacher?.userid,
          data?.teacher?.user_id
        ) ?? null;

      const stuUserId = pick(data.stuuserid, data.student_userid, data.studentUserId) ?? null;
      const studentSemester = pick(data.student_semester, data.stu_curr_semester, data.semester) ?? null;
      const studentSection = pick(data.student_section, data.stu_section, data.section) ?? null;

      const authPayload = {
        userId: String(normalizedUserId || ''),
        name: data.username || '',
        user_role: data.user_role || '',
        role_description: data.role_description || '',
        roles: data.roles || [],
        // Student fields
        stuuserid: stuUserId,
        student_semester: studentSemester,
        student_section: studentSection,
        // Teacher fields (stringify to avoid type mismatch later)
        teacher_userid: teacherUserid ? String(teacherUserid) : null,
        teacher_id: teacherId ? String(teacherId) : null,
        // Timestamp
        login_time: new Date().toISOString(),
      };

      // 🔐 Clear old and persist fresh auth/session (prevents stale keys)
      try {
        localStorage.removeItem('auth');
        sessionStorage.removeItem('sessionUser');
      } catch {}

      localStorage.setItem('auth', JSON.stringify(authPayload));

      sessionStorage.setItem(
        'sessionUser',
        JSON.stringify({
          userid: authPayload.userId,
          user_role: authPayload.user_role,
          role_description: authPayload.role_description,
          roles: authPayload.roles,
          stuuserid: authPayload.stuuserid,
          student_semester: authPayload.student_semester,
          student_section: authPayload.student_section,
          teacher_userid: authPayload.teacher_userid,
          teacher_id: authPayload.teacher_id,   // <-- **THIS** is what DailyRoutine reads
          login_time: authPayload.login_time,
        })
      );

      // Debug aid in dev tools (optional)
      try {
        console.debug('[sessionUser]', JSON.parse(sessionStorage.getItem('sessionUser') || '{}'));
      } catch {}

      // 🗒️ Download Notepad .txt including teacher_id
      // downloadSessionTxt(authPayload);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Keep your original navigation logic
        if (authPayload.user_role === 'admin') {
          navigate('/dashboard');
        } else if (authPayload.user_role === 'student' || authPayload.user_role === 'teacher') {
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 1200);
    } catch (err) {
      if (err.response) {
        const errorMessage = err.response?.data?.error || 'Invalid credentials or server error.';
        if (err.response.status === 403) {
          setError('Access Denied: You do not have permission to log in.');
        } else if (err.response.status === 401) {
          setError('Invalid credentials, please check your username and password.');
        } else {
          setError(errorMessage);
        }
        console.error('Login error response:', err.response);
      } else {
        setError('A network error occurred, please try again later.');
        console.error('Network error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // You must define your styles!
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 50px',
      minHeight: '100vh',
      backgroundColor: '#fff',
      fontFamily: 'Arial, sans-serif',
    },
    formWrapper: {
      width: '380px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      color: '#000',
      marginBottom: '32px',
      textAlign: 'left',
      lineHeight: 1.3,
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: 500,
      color: '#333',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '16px',
      backgroundColor: '#EBEDF8',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      color: '#111827',
      outline: 'none',
    },
    button: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: '#6366F1',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      cursor: loading ? 'default' : 'pointer',
    },
    linkContainer: {
      marginTop: '12px',
      textAlign: 'left',
    },
    link: {
      color: '#6366F1',
      textDecoration: 'underline',
      fontWeight: 500,
      fontSize: '14px',
    },
    addButton: {
      marginTop: '12px',
      padding: '10px 20px',
      backgroundColor: '#10B981',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      fontWeight: 500,
      fontSize: '14px',
      cursor: 'pointer',
    },
    imageWrapper: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '100%',
      maxWidth: '600px',
      height: 'auto',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: '#ffffff',
      padding: '1.5rem',
      borderRadius: '6px',
      textAlign: 'center',
      maxWidth: '300px',
    },
    modalMessage: {
      fontSize: '16px',
      marginBottom: '16px',
      color: '#111827',
    },
    modalButton: {
      padding: '8px 16px',
      backgroundColor: '#3b3dbbff',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
    },
  };

  // When showing success modal, parse localStorage to show correct user_role
  let userRole = '';
  try {
    userRole = JSON.parse(localStorage.getItem('auth'))?.user_role || '';
  } catch {}

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>
          Welcome To School<br />Management System
        </h1>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={styles.input}
          />
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          {error && (
            <p style={{ color: '#DC2626', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div style={styles.linkContainer}>
          <Link to="/dashboard" style={styles.link}>Go to Dashboard</Link>
        </div>
        <div style={styles.linkContainer}>
          <Link to="/manage-user">
            <button style={styles.addButton}>Add New User</button>
          </Link>
        </div>
      </div>

      <div style={styles.imageWrapper}>
        <img src={illustration} alt="Education Illustration" style={styles.image} />
      </div>

      {showSuccess && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <p style={styles.modalMessage}>
              🎉 Login successful as {userRole}!
            </p>
            <button onClick={() => setShowSuccess(false)} style={styles.modalButton}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
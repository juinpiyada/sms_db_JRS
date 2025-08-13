import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Import config from the right path!
import config from '../config/middleware_config';

// Component Imports (unchanged)
import UserRole from './User/UserRole.jsx';
import AddCollege from '../components/AddCollege.jsx';
import AddCourse from '../components/AddCourse.jsx';
import MasterSubject from './Subject/MasterSubject.jsx';
import MasterStudent from './Student/MasterStudent.jsx';
import MasterTeacher from './Teacher/MasterTeacher.jsx';
import CollegeAcadYear from './college/collegeacadyear.jsx';
import SubjectCourse from './Subject/SubjectCourse.jsx';
import SubjectElec from './Subject/SubjectElec.jsx';
import SubjectTeacher from './Subject/SubjectTeacher.jsx';
import SubjectDepartement from './Department/MasterDepts.jsx';
import CollegeGroupManager from './CollageGroup/CollegeGroupManager.jsx';
import Manageuser from './User/Manageuser.jsx';
import TeacherAvailabilityManager from './TeacherAvailabilityManager/TeacherAvailabilityManager.jsx';
import ExamRoutineManager from './ExamRoutineManager/ExamRoutineManager.jsx';
import CourseRegistrationManager from './CourseRegistrationManager/CourseRegistrationManager.jsx';
import CourseOfferingManager from './CourseOfferingManager/CourseOfferingManager.jsx';
import DailyRoutine from './DailyRoutine/DailyRoutine.jsx';
import ClassroomManager from './classroom/ClassroomManager.jsx';
import MenuManager from './menu/MenuManager.jsx';
import MasterRole from './User/MasterRole.jsx';
import CollegeAttendenceManager from './attendance/AttendanceManager.jsx';
import EmployeeAttendanceManager from './attendance/EmployeeAttendance.jsx';
import ExamResult from './result/ExamResult.jsx';

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function getLoggedInUser() {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('auth') || '{}');
  } catch {
    user = {};
  }
  return user;
}

// ---------- Role helpers: normalize assorted shapes into a lowercase set ----------
function normalizeRoles(user) {
  const pool = [];
  if (user?.user_role) pool.push(String(user.user_role));
  if (user?.role) pool.push(String(user.role));
  if (user?.userroledesc) pool.push(String(user.userroledesc));
  if (user?.userrolesid) pool.push(String(user.userrolesid));
  if (user?.userroles) {
    if (Array.isArray(user.userroles)) pool.push(...user.userroles.map(String));
    else pool.push(String(user.userroles));
  }
  if (Array.isArray(user?.roles)) pool.push(...user.roles.map(String));

  return new Set(
    pool.flatMap(r => String(r).split(/[,\s]+/))
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)
  );
}
const hasAny = (set, ...keys) => keys.some(k => set.has(k.toLowerCase()));
function friendlyRoleLabel(set) {
  if (hasAny(set, 'sms_superadm', 'super_user', 'superadmin', 'super_admin')) return 'super_user';
  if (hasAny(set, 'admin', 'grp_adm', 'group_admin')) return 'admin';
  if (hasAny(set, 'teacher', 'usr_tchr', 'instructor', 'professor')) return 'teacher';
  if (hasAny(set, 'student', 'stu_curr', 'stu_onboard', 'stu_passed')) return 'student';
  return Array.from(set)[0] || 'user';
}

const MENU_ICONS = {
  home: '🏠', menu: '📂', manageUser: '👤', userRole: '🛡️', MasterRole: '🎭', addCollege: '🏫',
  addGroup: '👥', department: '🏛️', subjects: '📘', addCourse: '📚', masterStudent: '🧑‍🎓',
  masterTeacher: '👨‍🏫', collegeAcadYear: '📅', subjectCourse: '🔁', subjectElec: '⚡',
  subjectTeacher: '🤝', dailyRoutine: '📆', classroomManager: '🏢',
  teacherAvailability: '📌', examRoutine: '📝', CollegeAttendenceManager: '📋',
  EmployeeAttendanceManager: '🧑‍💼', courseRegistration: '🖊️',
  courseOffering: '🎓', examResult: '🏆', logout: '🚪'
};

const styles = {
  layout: { display: 'flex', height: '100vh', fontFamily: 'sans-serif' },
  sidebar: { width: '260px', background: '#1e293b', color: '#fff', padding: '20px', overflowY: 'auto' },
  sidebarTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  menuList: { listStyle: 'none', padding: 0 },
  menuItem: { marginBottom: 12 },
  menuButton: (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: isActive ? '#475569' : 'transparent',
    color: '#fff', padding: '10px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontSize: 16
  }),
  menuIcon: { fontSize: 18 },
  main: { flex: 1, background: '#f8fafc', padding: '20px', overflowY: 'auto' },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b' },
  content: { padding: '20px', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  card: { padding: 20, background: '#f9f9ff', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' },
  alert: { padding: '10px 20px', background: '#e0f2fe', color: '#0369a1', borderRadius: 6, fontSize: 16, fontWeight: 600 }
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [user, setUser] = useState(getLoggedInUser());
  const navigate = useNavigate();

  // Robust role flags
  const roleSet = normalizeRoles(user);
  const isAdmin = hasAny(roleSet, 'admin', 'super_user', 'sms_superadm', 'grp_adm', 'superadmin', 'super_admin');
  const isTeacher = hasAny(roleSet, 'teacher', 'usr_tchr', 'instructor', 'professor');
  const isStudent = hasAny(roleSet, 'student', 'stu_curr', 'stu_onboard', 'stu_passed');
  const userName = user.name || user.userId || 'User';
  const displayRole = friendlyRoleLabel(roleSet).toUpperCase();

  // ---------- MENU RULES ----------
  let menuItems = [];

  if (isTeacher && !isAdmin) {
    // Teacher-only view: Home, Daily Routine, College Attendance, Logout
    menuItems = [
      { key: 'home', label: 'Home' },
      { key: 'dailyRoutine', label: 'Daily Routine' },
      { key: 'CollegeAttendenceManager', label: 'College Attendance' },
      { key: 'logout', label: 'Logout' }
    ];
  } else {
    // Existing menus for Admin/Student/Other
    menuItems = [
      { key: 'home', label: 'Home' },

      ...(isAdmin ? [
        { key: 'menu', label: 'Menus' },
        { key: 'manageUser', label: 'Users' },
        { key: 'userRole', label: 'User Roles' },
        { key: 'MasterRole', label: 'Master Role' },
        { key: 'addCollege', label: 'Colleges' },
        { key: 'addGroup', label: 'College Groups' },
        { key: 'department', label: 'Departments' },
        { key: 'subjects', label: 'Subjects' },
        { key: 'addCourse', label: 'Courses' },
        { key: 'masterStudent', label: 'Students' },
        { key: 'masterTeacher', label: 'Teachers' },
        { key: 'collegeAcadYear', label: 'Academic Year' },
        { key: 'subjectCourse', label: 'Subject Course' },
        { key: 'subjectElec', label: 'Electives' },
        { key: 'subjectTeacher', label: 'Subject-Teacher' },
        { key: 'teacherAvailability', label: 'Teacher Availability' },
        { key: 'courseRegistration', label: 'Course Registration' },
        { key: 'courseOffering', label: 'Course Offering' },
      ] : []),

      ...(isStudent || isAdmin ? [
        { key: 'dailyRoutine', label: 'Daily Routine' },
        { key: 'classroomManager', label: 'Classrooms' },
        { key: 'examRoutine', label: 'Exam Routine' },
      ] : []),

      ...(isStudent || isAdmin ? [
        { key: 'CollegeAttendenceManager', label: 'College Attendance' },
      ] : []),

      { key: 'examResult', label: 'Exam Results' },

      ...(isAdmin ? [
        { key: 'EmployeeAttendanceManager', label: 'Employee Attendance' }
      ] : []),

      { key: 'logout', label: 'Logout' }
    ];
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [stuRes, teachRes, userRes, roleRes] = await Promise.all([
          axios.get(config.VITE_DASHBOARD_FETCHING_ID),
          axios.get(config.TEACHER_ROUTE),
          axios.get(config.MASTER_USER_ROUTE),
          axios.get(config.USER_ROLE_ROUTE)
        ]);
        setStudents(stuRes.data?.students || []);
        setTeachers(teachRes.data || []);
        setUsers(userRes.data?.users || []);
        setUserRoles(roleRes.data?.roles || []);
      } catch (err) {
        console.error('❌ Error loading dashboard data:', err);
      }
    };
    fetchAll();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/');
  };

  const chartData = {
    labels: ['Students', 'Teachers', 'Users', 'Roles'],
    datasets: [
      {
        label: 'Counts',
        data: [students.length, teachers.length, users.length, userRoles.length],
        backgroundColor: '#4B9AFF',
        borderColor: '#007BFF',
        borderWidth: 1
      }
    ]
  };

  return (
    <div style={styles.layout}>
      <nav style={styles.sidebar}>
        <div style={styles.sidebarTitle}>Dashboard</div>
        <ul style={styles.menuList}>
          {menuItems.map(item => (
            <li style={styles.menuItem} key={item.key}>
              <button
                style={styles.menuButton(activeTab === item.key)}
                onClick={item.key === 'logout' ? handleLogout : () => setActiveTab(item.key)}
              >
                <span style={styles.menuIcon}>{MENU_ICONS[item.key]}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.title}>🎓 School Management Dashboard</h1>
          <p style={styles.subtitle}>
            Welcome back, {userName}! You are logged in as <b>{displayRole}</b>.
          </p>
        </header>

        <div style={styles.content}>
          {activeTab === 'home' && (
            <div style={styles.card}>
              <h2>📊 Overview</h2>
              <p>Students: {students.length}</p>
              <p>Teachers: {teachers.length}</p>
              <p>Users: {users.length}</p>
              <p>Roles: {userRoles.length}</p>
              <div style={{ height: '300px' }}>
                <Bar data={chartData} options={{ responsive: true }} />
              </div>
            </div>
          )}

          {/* Dynamic Content Based on Active Tab */}
          {/* Admin/Student menus remain the same */}
          {activeTab === 'menu' && <MenuManager readOnly={isStudent} />}
          {activeTab === 'manageUser' && <Manageuser readOnly={isStudent} users={users} />}
          {activeTab === 'userRole' && <UserRole readOnly={isStudent} roles={userRoles} />}
          {activeTab === 'MasterRole' && <MasterRole readOnly={isStudent} />}
          {activeTab === 'addCollege' && <AddCollege readOnly={isStudent} />}
          {activeTab === 'addGroup' && <CollegeGroupManager readOnly={isStudent} />}
          {activeTab === 'department' && <SubjectDepartement readOnly={isStudent} />}
          {activeTab === 'subjects' && <MasterSubject readOnly={isStudent} />}
          {activeTab === 'addCourse' && <AddCourse readOnly={isStudent} />}
          {activeTab === 'masterStudent' && <MasterStudent readOnly={isStudent} students={students} />}
          {activeTab === 'masterTeacher' && <MasterTeacher readOnly={isStudent} teachers={teachers} />}
          {activeTab === 'collegeAcadYear' && <CollegeAcadYear readOnly={isStudent} />}
          {activeTab === 'subjectCourse' && <SubjectCourse readOnly={isStudent} />}
          {activeTab === 'subjectElec' && <SubjectElec readOnly={isStudent} />}
          {activeTab === 'subjectTeacher' && <SubjectTeacher readOnly={isStudent} />}
          {activeTab === 'classroomManager' && <ClassroomManager readOnly={isStudent} />}
          {activeTab === 'teacherAvailability' && <TeacherAvailabilityManager readOnly={isStudent} />}
          {activeTab === 'examRoutine' && <ExamRoutineManager readOnly={isStudent} />}
          {activeTab === 'courseRegistration' && <CourseRegistrationManager readOnly={isStudent} />}
          {activeTab === 'courseOffering' && <CourseOfferingManager readOnly={isStudent} />}

          {/* Teacher & Admin can edit; Student read-only */}
          {activeTab === 'dailyRoutine' && (
            <DailyRoutine readOnly={isStudent && !isAdmin && !isTeacher} />
          )}

          {/* ✅ College Attendance visible to Teacher as well; Student read-only */}
          {activeTab === 'CollegeAttendenceManager' && (
            <CollegeAttendenceManager readOnly={isStudent && !isAdmin && !isTeacher} />
          )}

          {activeTab === 'EmployeeAttendanceManager' && isAdmin && (
            <EmployeeAttendanceManager readOnly={isStudent} />
          )}
          {activeTab === 'examResult' && <ExamResult readOnly={isStudent} />}
        </div>
      </div>
    </div>
  );
}
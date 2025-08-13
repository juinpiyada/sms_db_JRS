const express = require('express');
const cors = require('cors');
const db = require('./config/db_conn');

// All your route imports (paths should be correct and match filenames)
const loginRouter = require('./routes/user');
const collegeRoutes = require('./routes/master_college_api');
const masterUserApi = require('./routes/master_user');
const collegeGroupRoutes = require('./routes/collegeGroup');
const courseRoutes = require('./routes/master_course_api');
const subjectRoutes = require('./routes/master_subject_api');
const studentRoutes = require('./routes/master_student_api');
const teacherRoutes = require('./routes/master_teacher_api');
const masterDeptsRoutes = require('./routes/master_depts');
const collegeAcadYearRoutes = require('./routes/master_acadyear_api');
const subjectCourseRoutes = require('./routes/subject_course_api');
const mastermenuRoutes = require('./routes/menu_master_api');
const masterSubjectTeacherRoutes = require('./routes/subject_teacher_api');
const userRoleApi = require('./routes/user_role_api');
const MasterRole = require('./routes/master_role_api'); // Assuming you have this route
const DailyRoutine = require('./routes/college_daily_routine_api');
const classroomAPI = require('./routes/classroomapi');
const teacherAvailabilityRoutes = require('./routes/teacher_availbility_api');
const collegedailyroutineRoutes= require('./routes/college_daily_routine_api');
const courseofferingRoutes = require('./routes/course_offering_api'); // Assuming you have this route
const courseregistrationRoutes = require('./routes/course_registration_api'); // Assuming you have this route
const collegeexamroutineRoutes = require('./routes/college_exam_routine_api'); // Assuming you have this route
const subjectelecRoutes = require('./routes/subjectelec'); // Assuming you have this route
const examroutineRoutes = require('./routes/college_exam_routine_api'); // Assuming you have this route
const CollegeAttendenceManager = require('./routes/college_attendance_api'); // Assuming you have this route
const EmployeeAttendanceManager = require('./routes/employee_attendance_api'); // Assuming you have this route
const ExamResult = require('./routes/college_exam_result_api'); // Assuming you have this route
const app = express();

const PORT = process.env.PORT || 9090;

// Enable CORS`
app.use(cors({
  origin: 'http://localhost:5173', // Adjust to your frontend port
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies
app.use(express.json());

// ROUTES
app.use('/login', loginRouter);
app.use('/master-college', collegeRoutes);
app.use('/api', masterUserApi);
app.use('/api/college-group', collegeGroupRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/subject', subjectRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/master-depts', masterDeptsRoutes); // Use /api for consistency
app.use('/api/master-acadyear', collegeAcadYearRoutes);
app.use('/api/subject-course', subjectCourseRoutes);
app.use('/api/menu-master', mastermenuRoutes);
app.use('/api/subject-teacher', masterSubjectTeacherRoutes);
app.use('/api/user-role', userRoleApi);
app.use('/api/master-role', MasterRole); // Assuming you have this route
app.use('/api/daily-routine', DailyRoutine);
app.use('/api/class-room', classroomAPI);
app.use('/api/teacher-availability-manager', teacherAvailabilityRoutes);
app.use('/api/college-daily-routine', collegedailyroutineRoutes);
app.use('/api/course-offering', courseofferingRoutes); // Assuming you have this route
app.use('/api/course-registration', courseregistrationRoutes); // Assuming you have this route
app.use('/api/college-exam-routine', collegeexamroutineRoutes); // Assuming you have this route
app.use('/api/subject-elective', subjectelecRoutes); // Assuming you have this route
app.use('/api/exam-routine-manager', examroutineRoutes); // Assuming you have this route
app.use('/api/course-registration', courseregistrationRoutes); // Assuming you have this route
app.use('/api/CollegeAttendenceManager', CollegeAttendenceManager); // Assuming you have this route
app.use('/api/employee-attendance', EmployeeAttendanceManager); // Assuming you have this route
app.use('/api/exam-result', ExamResult); // Assuming you have this route




// Health-check
app.get('/', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database check and server start
db.query('SELECT NOW()')
  .then(({ rows }) => {
    console.log('✅ Connected to Postgres at', rows[0].now);
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Could not connect to Postgres:', err);
    process.exit(1);
  });

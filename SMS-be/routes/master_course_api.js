const express = require('express');
const cors = require('cors');
const router = express.Router();
const pool = require('../config/db_conn'); // PostgreSQL Pool

router.use(cors());
router.use(express.json());

// Helper to validate and parse dates
const isValidDate = val => {
  const date = new Date(val);
  return !isNaN(date.getTime()) ? date : null;
};

/**
 * Add a new course
 */
router.post('/add', async (req, res) => {
  try {
    const {
      courseid, coursedesc, collegedept, courseprgcod,
      course_level, course_totsemester, course_tot_credits,
      course_duration, coursestartdate, courseenddate
    } = req.body;

    const now = new Date();

    const result = await pool.query(`
      INSERT INTO master_course (
        courseid, coursedesc, collegedept, courseprgcod,
        course_level, course_totsemester, course_tot_credits,
        course_duration, coursestartdate, courseenddate,
        createdat, updatedat
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10,
        $11, $12
      ) RETURNING courseid
    `, [
      courseid,
      coursedesc,
      collegedept,
      courseprgcod || null,
      course_level || null,
      course_totsemester ? Number(course_totsemester) : null,
      course_tot_credits ? Number(course_tot_credits) : null,
      course_duration || null,
      isValidDate(coursestartdate),
      isValidDate(courseenddate),
      now,
      now
    ]);

    res.status(201).json({ message: 'Course added successfully', courseid: result.rows[0].courseid });
  } catch (err) {
    console.error('Error adding course:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Update existing course
 */
router.put('/update/:courseid', async (req, res) => {
  const { courseid } = req.params;
  const {
    coursedesc,
    collegedept,
    courseprgcod,
    course_level,
    course_totsemester,
    course_tot_credits,
    course_duration,
    coursestartdate,
    courseenddate
  } = req.body;

  const updatedat = new Date();

  try {
    const result = await pool.query(
      `UPDATE public.master_course SET
        coursedesc = $1,
        collegedept = $2,
        courseprgcod = $3,
        course_level = $4,
        course_totsemester = $5,
        course_tot_credits = $6,
        course_duration = $7,
        coursestartdate = $8,
        courseenddate = $9,
        updatedat = $10
      WHERE courseid = $11 RETURNING *`,
      [
        coursedesc, collegedept, courseprgcod, course_level,
        course_totsemester ? Number(course_totsemester) : null,
        course_tot_credits ? Number(course_tot_credits) : null,
        course_duration,
        isValidDate(coursestartdate),
        isValidDate(courseenddate),
        updatedat,
        courseid
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course updated successfully', course: result.rows[0] });
  } catch (error) {
    console.error('Update Course Error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

/**
 * Delete a course
 */
router.delete('/delete/:courseid', async (req, res) => {
  const { courseid } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM public.master_course WHERE courseid = $1 RETURNING *',
      [courseid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully', course: result.rows[0] });
  } catch (error) {
    console.error('Delete Course Error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

/**
 * Get all courses (preferred)
 */
router.get('/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM public.master_course ORDER BY createdat DESC'
    );
    res.json({ courses: result.rows });
  } catch (error) {
    console.error('Fetch Courses Error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * Get all courses (legacy, returns plain array)
 */
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM public.master_course ORDER BY createdat DESC'
    );
    res.json(result.rows); // plain array for legacy frontend compatibility
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * Get course by ID
 */
router.get('/:courseid', async (req, res) => {
  const { courseid } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM public.master_course WHERE courseid = $1',
      [courseid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ course: result.rows[0] });
  } catch (error) {
    console.error('Fetch Course Error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

module.exports = router;
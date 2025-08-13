const express = require('express');
const cors = require('cors');
const router = express.Router();
const pool = require('../config/db_conn'); // Adjust path to your PostgreSQL pool

router.use(cors());
router.use(express.json());

/**
 * Add new student
 */
router.post('/add', async (req, res) => {
  const {
    stuid,
    stu_enrollmentnumber,
    stu_rollnumber,
    stu_regn_number,
    stuname,
    stuemailid,
    stumob1,
    stumob2,
    stucaste,
    stugender,
    studob,
    stucategory,
    stuadmissiondt,
    stu_course_id,
    stu_lat_entry,
    stu_curr_semester,
    stu_section,
    stuvalid,
    stuuserid,
    stuparentname,
    stuaddress,
    stuparentemailid,
    stuprentmob1,
    stuprentmob2,
    stuparentaddress,
    stu_inst_id
  } = req.body;

  const createdat = new Date();
  const updatedat = new Date();

  try {
    const result = await pool.query(
      `INSERT INTO public.student_master (
        stuid, stu_enrollmentnumber, stu_rollnumber, stu_regn_number, stuname, 
        stuemailid, stumob1, stumob2, stucaste, stugender,
        studob, stucategory, stuadmissiondt, stu_course_id, stu_lat_entry,
        stu_curr_semester, stu_section, stuvalid, stuuserid, stuparentname,
        stuaddress, stuparentemailid, stuprentmob1, stuprentmob2, stuparentaddress,
        stu_inst_id, createdat, updatedat
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25,
        $26, $27, $28
      ) RETURNING *`,
      [
        stuid, stu_enrollmentnumber, stu_rollnumber, stu_regn_number, stuname,
        stuemailid, stumob1, stumob2, stucaste, stugender,
        studob, stucategory, stuadmissiondt, stu_course_id, stu_lat_entry,
        stu_curr_semester, stu_section, stuvalid, stuuserid, stuparentname,
        stuaddress, stuparentemailid, stuprentmob1, stuprentmob2, stuparentaddress,
        stu_inst_id, createdat, updatedat
      ]
    );

    res.status(201).json({ message: 'Student added successfully', student: result.rows[0] });
  } catch (error) {
    console.error('Add Student Error:', error);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

/**
 * Update student
 */
router.put('/update/:stuid', async (req, res) => {
  const { stuid } = req.params;
  const {
    stu_enrollmentnumber,
    stu_rollnumber,
    stu_regn_number,
    stuname,
    stuemailid,
    stumob1,
    stumob2,
    stucaste,
    stugender,
    studob,
    stucategory,
    stuadmissiondt,
    stu_course_id,
    stu_lat_entry,
    stu_curr_semester,
    stu_section,
    stuvalid,
    stuuserid,
    stuparentname,
    stuaddress,
    stuparentemailid,
    stuprentmob1,
    stuprentmob2,
    stuparentaddress,
    stu_inst_id
  } = req.body;

  const updatedat = new Date();

  try {
    const result = await pool.query(
      `UPDATE public.student_master SET
        stu_enrollmentnumber = $1, stu_rollnumber = $2, stu_regn_number = $3, stuname = $4,
        stuemailid = $5, stumob1 = $6, stumob2 = $7, stucaste = $8, stugender = $9,
        studob = $10, stucategory = $11, stuadmissiondt = $12, stu_course_id = $13, stu_lat_entry = $14,
        stu_curr_semester = $15, stu_section = $16, stuvalid = $17, stuuserid = $18, stuparentname = $19,
        stuaddress = $20, stuparentemailid = $21, stuprentmob1 = $22, stuprentmob2 = $23, stuparentaddress = $24,
        stu_inst_id = $25, updatedat = $26
      WHERE stuid = $27 RETURNING *`,
      [
        stu_enrollmentnumber, stu_rollnumber, stu_regn_number, stuname,
        stuemailid, stumob1, stumob2, stucaste, stugender,
        studob, stucategory, stuadmissiondt, stu_course_id, stu_lat_entry,
        stu_curr_semester, stu_section, stuvalid, stuuserid, stuparentname,
        stuaddress, stuparentemailid, stuprentmob1, stuprentmob2, stuparentaddress,
        stu_inst_id, updatedat, stuid
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully', student: result.rows[0] });
  } catch (error) {
    console.error('Update Student Error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

/**
 * Delete student
 */
router.delete('/delete/:stuid', async (req, res) => {
  const { stuid } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM public.student_master WHERE stuid = $1 RETURNING *',
      [stuid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully', student: result.rows[0] });
  } catch (error) {
    console.error('Delete Student Error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

/**
 * Get all students
 */
router.get('/list', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM public.student_master ORDER BY createdat DESC`
    );
    res.json({ students: result.rows });
  } catch (error) {
    console.error('Fetch Students Error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

/**
 * Get student by ID
 */
router.get('/:stuid', async (req, res) => {
  const { stuid } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM public.student_master WHERE stuid = $1',
      [stuid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student: result.rows[0] });
  } catch (error) {
    console.error('Fetch Student Error:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

module.exports = router;

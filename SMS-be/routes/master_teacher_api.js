const express = require('express');
const router = express.Router();
const db = require('../config/db_conn'); // use shared db connection

// GET all teachers
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM master_teacher');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET teacher by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM master_teacher WHERE teacherid = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Teacher not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching teacher:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST new teacher
router.post('/', async (req, res) => {
  const {
    teacherid, teachercode, teachername, teacheraddress, teacheremailid,
    teachermob1, teachermob2, teachergender, teachercaste, teacherdoj,
    teacherdesig, teachertype, teachermaxweekhrs, teacheruserid,
    teachercollegeid, teachervalid, createdat, updatedat
  } = req.body;

  try {
    await db.query(`
      INSERT INTO master_teacher (
        teacherid, teachercode, teachername, teacheraddress, teacheremailid,
        teachermob1, teachermob2, teachergender, teachercaste, teacherdoj,
        teacherdesig, teachertype, teachermaxweekhrs, teacheruserid,
        teachercollegeid, teachervalid, createdat, updatedat
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18
      )`, [
      teacherid, teachercode, teachername, teacheraddress, teacheremailid,
      teachermob1, teachermob2, teachergender, teachercaste, teacherdoj,
      teacherdesig, teachertype, teachermaxweekhrs, teacheruserid,
      teachercollegeid, teachervalid, createdat, updatedat
    ]);
    res.status(201).json({ message: 'Teacher added successfully' });
  } catch (err) {
    console.error('Error adding teacher:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT update teacher
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    teachercode, teachername, teacheraddress, teacheremailid,
    teachermob1, teachermob2, teachergender, teachercaste, teacherdoj,
    teacherdesig, teachertype, teachermaxweekhrs, teacheruserid,
    teachercollegeid, teachervalid, createdat, updatedat
  } = req.body;

  try {
    await db.query(`
      UPDATE master_teacher SET
        teachercode = $1, teachername = $2, teacheraddress = $3,
        teacheremailid = $4, teachermob1 = $5, teachermob2 = $6,
        teachergender = $7, teachercaste = $8, teacherdoj = $9,
        teacherdesig = $10, teachertype = $11, teachermaxweekhrs = $12,
        teacheruserid = $13, teachercollegeid = $14, teachervalid = $15,
        createdat = $16, updatedat = $17
      WHERE teacherid = $18
    `, [
      teachercode, teachername, teacheraddress, teacheremailid,
      teachermob1, teachermob2, teachergender, teachercaste, teacherdoj,
      teacherdesig, teachertype, teachermaxweekhrs, teacheruserid,
      teachercollegeid, teachervalid, createdat, updatedat, id
    ]);
    res.json({ message: 'Teacher updated successfully' });
  } catch (err) {
    console.error('Error updating teacher:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE teacher
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM master_teacher WHERE teacherid = $1', [id]);
    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    console.error('Error deleting teacher:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// GET all teacher IDs only
router.get('/only/ids', async (req, res) => {
  try {
    const result = await db.query('SELECT teacherid FROM master_teacher');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching teacher IDs:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;

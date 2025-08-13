const express = require('express');
const cors = require('cors');
const router = express.Router();
const pool = require('../config/db_conn'); // Adjust the path as needed

router.use(cors());
router.use(express.json());

/**
 * ➕ Add New Subject
 */
router.post('/add', async (req, res) => {
  const {
    subjectid,
    subjectcode,
    subjectdesc,
    subjectcredits,
    subjectlecturehrs,
    subjecttutorialhrs,
    subjectpracticalhrs,
    subjectcoursetype,
    subjectcategory,
    subjectdeptid,
    subjectactive
  } = req.body;

  if (!subjectid || !subjectdesc) {
    return res.status(400).json({ error: 'subjectid and subjectdesc are required' });
  }

  const createdat = new Date();
  const updatedat = new Date();

  try {
    const result = await pool.query(
      `INSERT INTO public.master_subject (
        subjectid, subjectcode, subjectdesc, subjectcredits, subjectlecturehrs,
        subjecttutorialhrs, subjectpracticalhrs, subjectcoursetype, subjectcategory,
        subjectdeptid, subjectactive, createdat, updatedat
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13
      ) RETURNING *`,
      [
        subjectid, subjectcode, subjectdesc, subjectcredits, subjectlecturehrs,
        subjecttutorialhrs, subjectpracticalhrs, subjectcoursetype, subjectcategory,
        subjectdeptid, subjectactive, createdat, updatedat
      ]
    );

    res.status(201).json({ message: 'Subject added successfully', subject: result.rows[0] });
  } catch (error) {
    console.error('Add Subject Error:', error);
    res.status(500).json({ error: 'Failed to add subject' });
  }
});

/**
 * 📝 Update Subject by ID
 */
router.put('/update/:subjectid', async (req, res) => {
  const { subjectid } = req.params;
  const {
    subjectcode,
    subjectdesc,
    subjectcredits,
    subjectlecturehrs,
    subjecttutorialhrs,
    subjectpracticalhrs,
    subjectcoursetype,
    subjectcategory,
    subjectdeptid,
    subjectactive
  } = req.body;

  const updatedat = new Date();

  try {
    const result = await pool.query(
      `UPDATE public.master_subject SET
        subjectcode = $1,
        subjectdesc = $2,
        subjectcredits = $3,
        subjectlecturehrs = $4,
        subjecttutorialhrs = $5,
        subjectpracticalhrs = $6,
        subjectcoursetype = $7,
        subjectcategory = $8,
        subjectdeptid = $9,
        subjectactive = $10,
        updatedat = $11
      WHERE subjectid = $12 RETURNING *`,
      [
        subjectcode, subjectdesc, subjectcredits, subjectlecturehrs,
        subjecttutorialhrs, subjectpracticalhrs, subjectcoursetype,
        subjectcategory, subjectdeptid, subjectactive, updatedat, subjectid
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json({ message: 'Subject updated successfully', subject: result.rows[0] });
  } catch (error) {
    console.error('Update Subject Error:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

/**
 * ❌ Delete Subject by ID
 */
router.delete('/delete/:subjectid', async (req, res) => {
  const { subjectid } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM public.master_subject WHERE subjectid = $1 RETURNING *',
      [subjectid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json({ message: 'Subject deleted successfully', subject: result.rows[0] });
  } catch (error) {
    console.error('Delete Subject Error:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

/**
 * 🎯 Get Subject List for Dropdown (Only subjectid)
 * ⚠️ Must come BEFORE /:subjectid to avoid route conflict!
 */
router.get('/st', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT subjectid FROM public.master_subject ORDER BY subjectid ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch Subject ID List Error:', error);
    res.status(500).json({ error: 'Failed to fetch subject list for selector' });
  }
});

/**
 * 📄 Get All Subjects (Full list)
 */
router.get('/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM public.master_subject ORDER BY createdat DESC'
    );
    res.json({ subjects: result.rows });
  } catch (error) {
    console.error('Fetch Subjects Error:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

/**
 * 🔍 Get Single Subject by ID
 * ⚠️ Must be the last GET route to avoid capturing /st etc.
 */
router.get('/:subjectid', async (req, res) => {
  const { subjectid } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM public.master_subject WHERE subjectid = $1',
      [subjectid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json({ subject: result.rows[0] });
  } catch (error) {
    console.error('Fetch Subject Error:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

module.exports = router;

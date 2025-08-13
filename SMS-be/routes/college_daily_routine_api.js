const express = require('express');
const router = express.Router();
const db = require('../config/db_conn');

// ---- Validate integer :routineid everywhere ----
router.param('routineid', (req, res, next, val) => {
  const id = Number.parseInt(val, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: `Invalid routineid '${val}'` });
  }
  req.routineid = id;
  next();
});

// GET all daily routines
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM public.college_daily_routine ORDER BY createdat DESC'
    );
    res.status(200).json({ routines: result.rows });
  } catch (err) {
    console.error('Error fetching routines:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- Specific routes BEFORE any :routineid route ----

// GET by composite key (legacy support)
router.get('/find', async (req, res) => {
  const {
    drdayofweek,
    drslot,
    drsubjid,
    drclassroomid,
    stu_curr_semester,
    stu_section,
    acad_year,
    drdate
  } = req.query;

  try {
    const result = await db.query(
      `SELECT * FROM public.college_daily_routine
       WHERE drdayofweek = $1 AND drslot = $2 AND drsubjid = $3
         AND drclassroomid = $4 AND stu_curr_semester = $5
         AND stu_section = $6 AND acad_year = $7 AND (drdate = $8 OR ($8 IS NULL AND drdate IS NULL))
       LIMIT 1`,
      [
        drdayofweek,
        drslot,
        drsubjid,
        drclassroomid,
        stu_curr_semester,
        stu_section,
        acad_year,
        drdate || null
      ]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    res.status(200).json({ routine: result.rows[0] });
  } catch (err) {
    console.error('Error fetching routine:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST: Add a new routine
router.post('/', async (req, res) => {
  const {
    routineid, // optional for manual insert
    drdayofweek, drslot, drsubjid, drfrom, drto, drclassroomid,
    drislabsession, drroutcnt, stu_curr_semester, stu_section,
    drclassteacherid, acad_year, drdate, stuid
  } = req.body;

  if (!drsubjid || !drclassroomid || !acad_year || !drdate) {
    return res.status(400).json({
      error: 'Subject ID, Classroom ID, Academic Year, and Date are required'
    });
  }

  try {
    let query, params;
    if (routineid) {
      query = `INSERT INTO public.college_daily_routine (
        routineid, drdayofweek, drslot, drsubjid, drfrom, drto, drclassroomid,
        drislabsession, drroutcnt, createdat, updatedat,
        stu_curr_semester, stu_section, drclassteacherid, acad_year, drdate, stuid
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, NOW(), NOW(),
        $10, $11, $12, $13, $14, $15
      )`;
      params = [
        routineid, drdayofweek, drslot, drsubjid, drfrom, drto, drclassroomid,
        drislabsession, drroutcnt, stu_curr_semester, stu_section, drclassteacherid,
        acad_year, drdate, stuid
      ];
    } else {
      query = `INSERT INTO public.college_daily_routine (
        drdayofweek, drslot, drsubjid, drfrom, drto, drclassroomid,
        drislabsession, drroutcnt, createdat, updatedat,
        stu_curr_semester, stu_section, drclassteacherid, acad_year, drdate, stuid
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, NOW(), NOW(),
        $9, $10, $11, $12, $13, $14
      )`;
      params = [
        drdayofweek, drslot, drsubjid, drfrom, drto, drclassroomid,
        drislabsession, drroutcnt, stu_curr_semester, stu_section, drclassteacherid,
        acad_year, drdate, stuid
      ];
    }

    await db.query(query, params);
    res.status(201).json({ message: 'Routine added successfully' });
  } catch (err) {
    console.error('Error adding routine:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LEGACY: DELETE by composite key (keep this BEFORE :routineid)
router.delete('/delete', async (req, res) => {
  const {
    drdayofweek,
    drslot,
    drsubjid,
    drclassroomid,
    stu_curr_semester,
    stu_section,
    acad_year,
    drdate
  } = req.body;

  try {
    const result = await db.query(
      `DELETE FROM public.college_daily_routine
       WHERE drdayofweek = $1 AND drslot = $2 AND drsubjid = $3
         AND drclassroomid = $4 AND stu_curr_semester = $5
         AND stu_section = $6 AND acad_year = $7 AND (drdate = $8 OR ($8 IS NULL AND drdate IS NULL))`,
      [
        drdayofweek,
        drslot,
        drsubjid,
        drclassroomid,
        stu_curr_semester,
        stu_section,
        acad_year,
        drdate || null
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    res.status(200).json({ message: 'Routine deleted successfully' });
  } catch (err) {
    console.error('Error deleting routine:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- Numeric ID routes (no inline regex; we validate via router.param) ----

// GET by id
router.get('/:routineid', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM public.college_daily_routine WHERE routineid = $1',
      [req.routineid]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    res.status(200).json({ routine: result.rows[0] });
  } catch (err) {
    console.error('Error fetching routine:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE by id
router.put('/:routineid', async (req, res) => {
  const {
    drdayofweek, drslot, drsubjid, drfrom, drto, drclassroomid,
    drislabsession, drroutcnt, stu_curr_semester, stu_section,
    drclassteacherid, acad_year, drdate, stuid
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE public.college_daily_routine SET
        drdayofweek = $1, drslot = $2, drsubjid = $3, drfrom = $4, drto = $5,
        drclassroomid = $6, drislabsession = $7, drroutcnt = $8,
        updatedat = NOW(), stu_curr_semester = $9, stu_section = $10,
        drclassteacherid = $11, acad_year = $12, drdate = $13, stuid = $14
       WHERE routineid = $15`,
      [
        drdayofweek, drslot, drsubjid, drfrom, drto, drclassroomid,
        drislabsession, drroutcnt, stu_curr_semester, stu_section,
        drclassteacherid, acad_year, drdate, stuid, req.routineid
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    res.status(200).json({ message: 'Routine updated successfully' });
  } catch (err) {
    console.error('Error updating routine:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE by id
router.delete('/:routineid', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM public.college_daily_routine WHERE routineid = $1',
      [req.routineid]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Routine not found' });
    }
    res.status(200).json({ message: 'Routine deleted successfully' });
  } catch (err) {
    console.error('Error deleting routine:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/db_conn');

// ✅ GET all course offerings
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM public.college_course_offering ORDER BY createdat DESC');
    res.status(200).json({ offerings: result.rows });
  } catch (err) {
    console.error('Error fetching offerings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ POST create course offering
router.post('/', async (req, res) => {
  const {
    offerid,
    offer_programid,
    offer_courseid,
    offfer_term,
    offer_facultyid,
    offer_semesterno,
    offer_section,
    offerislab,
    offer_capacity,
    offeriselective,
    offerelectgroupid,
    offerroom,
    offerstatus
  } = req.body;

  if (!offerid) {
    return res.status(400).json({ error: 'offerid is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO public.college_course_offering (
        offerid, offer_programid, offer_courseid, offfer_term,
        offer_facultyid, offer_semesterno, offer_section, offerislab,
        offer_capacity, offeriselective, offerelectgroupid, offerroom,
        offerstatus, createdat, updatedat
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, NOW(), NOW()
      ) RETURNING offerid`,
      [
        offerid,
        offer_programid,
        offer_courseid,
        offfer_term,
        offer_facultyid,
        offer_semesterno,
        offer_section,
        offerislab,
        offer_capacity,
        offeriselective,
        offerelectgroupid,
        offerroom,
        offerstatus
      ]
    );

    res.status(201).json({ message: 'Course offering created', offerid: result.rows[0].offerid });
  } catch (err) {
    console.error('Error creating course offering:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ PUT update course offering
router.put('/:offerid', async (req, res) => {
  const { offerid } = req.params;
  const {
    offer_programid,
    offer_courseid,
    offfer_term,
    offer_facultyid,
    offer_semesterno,
    offer_section,
    offerislab,
    offer_capacity,
    offeriselective,
    offerelectgroupid,
    offerroom,
    offerstatus
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE public.college_course_offering SET
        offer_programid = $1,
        offer_courseid = $2,
        offfer_term = $3,
        offer_facultyid = $4,
        offer_semesterno = $5,
        offer_section = $6,
        offerislab = $7,
        offer_capacity = $8,
        offeriselective = $9,
        offerelectgroupid = $10,
        offerroom = $11,
        offerstatus = $12,
        updatedat = NOW()
      WHERE offerid = $13
      RETURNING offerid`,
      [
        offer_programid,
        offer_courseid,
        offfer_term,
        offer_facultyid,
        offer_semesterno,
        offer_section,
        offerislab,
        offer_capacity,
        offeriselective,
        offerelectgroupid,
        offerroom,
        offerstatus,
        offerid
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    res.status(200).json({ message: 'Course offering updated', offerid: result.rows[0].offerid });
  } catch (err) {
    console.error('Error updating course offering:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ DELETE course offering
router.delete('/:offerid', async (req, res) => {
  const { offerid } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM public.college_course_offering WHERE offerid = $1 RETURNING offerid',
      [offerid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    res.status(200).json({ message: 'Course offering deleted', offerid: result.rows[0].offerid });
  } catch (err) {
    console.error('Error deleting course offering:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
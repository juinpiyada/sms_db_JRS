// routes/login.js
const express = require('express');
const router = express.Router();
const db = require('../config/db_conn');

// POST /login
router.post('/', async (req, res) => {
  const { username, password } = req.body;

  // Check if both username and password are provided
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Single query: user + optional student + optional teacher
    const sql = `
      SELECT
        mu.userpwd,
        mu.userroles,
        mu.useractive,
        sm.stuuserid,
        sm.stu_curr_semester,
        sm.stu_section,
        mt.teacheruserid,
        mt.teacherid
      FROM public.master_user mu
      LEFT JOIN public.student_master sm
        ON sm.stuuserid = mu.userid          -- link via student's stuuserid
      LEFT JOIN public.master_teacher mt
        ON mt.teacheruserid = mu.userid      -- link via teacher's teacheruserid
      WHERE mu.userid = $1
      LIMIT 1;
    `;

    const result = await db.query(sql, [username]);

    // If no user found, return error
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const row = result.rows[0];

    // Account active?
    if (!row.useractive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Password check (matches your current plain-text schema)
    if (password !== row.userpwd) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Roles (normalize to UPPER like your existing code)
    const roles = (row.userroles || '')
      .split(',')
      .map(r => r.trim().toUpperCase())
      .filter(Boolean);

    // Extras to include in every success response
    const extras = {
      // student info (if present)
      stuuserid: row.stuuserid ?? null,
      student_semester: row.stu_curr_semester ?? null,
      student_section: row.stu_section ?? null,
      // teacher info (if present)
      teacher_userid: row.teacheruserid ?? null,
      teacher_id: row.teacherid ?? null,
    };

    // Helper to respond without changing your shape
    const send = (payload) =>
      res.json({
        ...payload,
        userid: username,
        roles,
        ...extras,
      });

    // === Your existing role mapping (unchanged) ===
    if (roles.includes('SMS_SUPERADM')) {
      return send({
        message: 'Admin login successful',
        user_role: 'admin',
        role_description: 'Super Admin User'
      });
    } else if (roles.includes('STU_ONBOARD')) {
      return send({
        message: 'Onboard Student login successful',
        user_role: 'student',
        role_description: 'Onboard Student User'
      });
    } else if (roles.includes('STU-CURR')) {
      return send({
        message: 'Current Student login successful',
        user_role: 'student',
        role_description: 'Current Student User'
      });
    } else if (roles.includes('STU_PASSED')) {
      return send({
        message: 'Passed Student login successful',
        user_role: 'student',
        role_description: 'Passed Student User'
      });
    } else if (roles.includes('TEACHER')) {
      return send({
        message: 'Teacher login successful',
        user_role: 'teacher',
        role_description: 'Teacher User'
      });
    } else if (roles.includes('GRP_ADM')) {
      return send({
        message: 'Group Admin login successful',
        user_role: 'group_admin',
        role_description: 'Group Admin User'
      });
    } else if (roles.includes('GRP_MGMT_USR')) {
      return send({
        message: 'Group Manager User login successful',
        user_role: 'group_manager',
        role_description: 'Group Management User'
      });
    } else if (roles.includes('GRP_ACT')) {
      return send({
        message: 'Group Active User login successful',
        user_role: 'group_active',
        role_description: 'Group Active User'
      });
    } else if (roles.includes('USR_TCHR')) {
      return send({
        message: 'User Teacher login successful',
        user_role: 'user_teacher',
        role_description: 'User Teacher Role'
      });
    } else if (roles.includes('USER')) {
      return send({
        message: 'User login successful',
        user_role: 'user',
        role_description: 'Normal User'
      });
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
  } catch (err) {
    console.error('Error during login process:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

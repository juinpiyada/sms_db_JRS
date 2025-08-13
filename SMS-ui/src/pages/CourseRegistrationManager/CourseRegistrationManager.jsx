import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';

// ---- Safe URL joiner (prevents double slashes / duplicated bases)
function joinUrl(base = '', path = '') {
  if (!base) return path || '';
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

const emptyForm = {
  course_regis_id: '',
  course_studentid: '',
  courseofferingid: '',
  courseterm: '',
  courseisterm: '',
  course_elec_groupid: '',
  courseenrollmentdt: '',
  coursefinalgrade: '',
  courseresultstatus: '',
  courseattper: '',
  coursestatus: ''
};

const CourseRegistrationManager = () => {
  const [registrations, setRegistrations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);

  // Dropdown options
  const [electives, setElectives] = useState([]);
  const [students, setStudents] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [terms, setTerms] = useState([]);

  // Build routes from config
  const ROUTES = {
    REG: config.COURSE_REGISTRATION_ROUTE,                 // e.g. http://localhost:9090/api/course-registration
    ELECTIVES: config.SUBJECT_ELECTIVE_ROUTE,              // e.g. http://localhost:9090/api/subject-elec
    STUDENTS_LIST: joinUrl(config.STUDENT_ROUTE, '/list'), // e.g. http://localhost:9090/api/student/list
    OFFERINGS: config.COURSE_OFFERING_ROUTE,               // e.g. http://localhost:9090/api/course-offering
    ACADYEAR: config.MASTER_ACADYEAR_ROUTE,                // e.g. http://localhost:9090/api/master-acadyear
  };

  // ---- Shape-agnostic parsers
  const parseRegistrations = (data) => {
    if (Array.isArray(data)) return data;
    return data?.data || data?.registrations || data || [];
  };
  const parseElectives = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.subject_elec)) return data.subject_elec;
    return [];
  };
  const parseStudents = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.students)) return data.students;
    return [];
  };
  const parseOfferings = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.offerings)) return data.offerings;
    return [];
  };
  const parseTerms = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.years)) return data.years;
    if (Array.isArray(data?.acadyears)) return data.acadyears;
    if (Array.isArray(data?.terms)) return data.terms;
    return [];
  };

  // ---- Fetchers
  const fetchRegistrations = async () => {
    try {
      const res = await axios.get(ROUTES.REG);
      setRegistrations(parseRegistrations(res.data));
    } catch (err) {
      alert('Failed to fetch registrations!');
      console.error(err);
    }
  };

  const fetchElectives = async () => {
    try {
      const res = await axios.get(ROUTES.ELECTIVES);
      setElectives(parseElectives(res.data));
    } catch (err) {
      console.error('Failed to fetch electives!', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(ROUTES.STUDENTS_LIST);
      setStudents(parseStudents(res.data));
    } catch (err) {
      console.error('Failed to fetch students!', err);
    }
  };

  const fetchOfferings = async () => {
    try {
      const res = await axios.get(ROUTES.OFFERINGS);
      setOfferings(parseOfferings(res.data));
    } catch (err) {
      console.error('Failed to fetch offerings!', err);
    }
  };

  const fetchTerms = async () => {
    try {
      const res = await axios.get(ROUTES.ACADYEAR);
      setTerms(parseTerms(res.data));
    } catch (err) {
      console.error('Failed to fetch terms!', err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchElectives();
    fetchStudents();
    fetchOfferings();
    fetchTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(joinUrl(ROUTES.REG, `/${encodeURIComponent(form.course_regis_id)}`), form);
        alert('Registration updated!');
      } else {
        await axios.post(ROUTES.REG, form);
        alert('Registration created!');
      }
      fetchRegistrations();
      setForm(emptyForm);
      setEditing(false);
    } catch (err) {
      alert('Failed to save registration!');
      console.error(err);
    }
  };

  const handleEdit = (reg) => {
    setForm(reg);
    setEditing(true);
  };

  const handleDelete = async (course_regis_id) => {
    if (!window.confirm('Delete this registration?')) return;
    try {
      await axios.delete(joinUrl(ROUTES.REG, `/${encodeURIComponent(course_regis_id)}`));
      fetchRegistrations();
    } catch (err) {
      alert('Failed to delete!');
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Course Registration Manager</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded shadow">
        <input name="course_regis_id" value={form.course_regis_id} onChange={handleChange} placeholder="Registration ID" className="border p-2 rounded" required />

        {/* Student Selector */}
        <select
          name="course_studentid"
          value={form.course_studentid}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="">Select Student</option>
          {students.map(stu => (
            <option key={stu.stuid} value={stu.stuid}>
              {stu.stuname ? `${stu.stuname} (${stu.stuid})` : stu.stuid}
            </option>
          ))}
        </select>

        {/* Offering Selector */}
        <select
          name="courseofferingid"
          value={form.courseofferingid}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="">Select Course Offering</option>
          {offerings.map(off => (
            <option key={off.offerid} value={off.offerid}>
              {off.coursename ? `${off.coursename} (${off.offerid})` : off.offerid}
            </option>
          ))}
        </select>

        {/* Term Selector */}
        <select
          name="courseterm"
          value={form.courseterm}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="">Select Academic Term</option>
          {terms.map(term => (
            <option key={term.id ?? term.acadyearid ?? term.termid ?? `${term.acadyearname || term.termname || 'term'}`}>
              {term.id ?? term.acadyearid ?? term.termid ?? ''}
              {term.acadyearname ? ` - ${term.acadyearname}` : term.termname ? ` - ${term.termname}` : ''}
            </option>
          ))}
        </select>

        <input name="courseisterm" value={form.courseisterm} onChange={handleChange} placeholder="Is Term" className="border p-2 rounded" />

        {/* Elective Group Selector */}
        <select
          name="course_elec_groupid"
          value={form.course_elec_groupid}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">Select Elective ID</option>
          {electives.map(elec => (
            <option key={elec.sub_elec_id} value={elec.sub_elec_id}>
              {elec.sub_elec_grp_name ? `${elec.sub_elec_grp_name} (${elec.sub_elec_id})` : elec.sub_elec_id}
            </option>
          ))}
        </select>

        <input name="courseenrollmentdt" value={form.courseenrollmentdt} onChange={handleChange} type="date" placeholder="Enrollment Date" className="border p-2 rounded" />
        <input name="coursefinalgrade" value={form.coursefinalgrade} onChange={handleChange} placeholder="Final Grade" className="border p-2 rounded" />
        <input name="courseresultstatus" value={form.courseresultstatus} onChange={handleChange} placeholder="Result Status" className="border p-2 rounded" />
        <input name="courseattper" value={form.courseattper} onChange={handleChange} placeholder="Attendance (%)" className="border p-2 rounded" />
        <input name="coursestatus" value={form.coursestatus} onChange={handleChange} placeholder="Status" className="border p-2 rounded" />
        <button type="submit" className="col-span-3 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          {editing ? 'Update' : 'Add'} Registration
        </button>
      </form>

      <table className="w-full border">
        <thead>
          <tr>
            {Object.keys(emptyForm).map((key) => (
              <th key={key} className="border p-1 text-xs bg-gray-100">{key}</th>
            ))}
            <th className="border p-1 text-xs bg-gray-100">Actions</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((reg) => (
            <tr key={reg.course_regis_id} className="text-xs hover:bg-gray-50">
              {Object.keys(emptyForm).map((key) => (
                <td key={key} className="border p-1">{reg[key]}</td>
              ))}
              <td className="border p-1 flex gap-2">
                <button onClick={() => handleEdit(reg)} className="bg-yellow-400 px-2 py-1 rounded text-white">Edit</button>
                <button onClick={() => handleDelete(reg.course_regis_id)} className="bg-red-500 px-2 py-1 rounded text-white">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseRegistrationManager;

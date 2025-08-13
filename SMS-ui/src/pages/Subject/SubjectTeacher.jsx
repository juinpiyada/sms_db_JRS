import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config/middleware_config"; // ✅ use your env-driven routes

// Helper to safely join URLs (avoids double slashes)
const joinUrl = (base, path = "") =>
  path ? `${String(base).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}` : base;

export default function SubjectTeacher() {
  // ===== API endpoints from config =====
  const SUBJECT_TEACHER_API = joinUrl(config.SUBJECT_TEACHER_ROUTE);         // e.g. .../api/subject-teacher
  const TEACHER_IDS_API     = joinUrl(config.TEACHER_ROUTE, "only/ids");     // e.g. .../api/teacher/only/ids
  const SUBJECT_LIST_API    = joinUrl(config.SUBJECT_ROUTE, "list");         // e.g. .../api/subject/list

  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teacherList, setTeacherList] = useState([]);
  const [formData, setFormData] = useState({
    subteaid: "",
    teacherid: "",
    subtea_masid: "",
    subcollegesubid: "",
    subtea_collegedesc: "",
    subtea_acadyear: "",
    subcoll_acad_sem: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [edit, setEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
    fetchTeacherIDs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickArray = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.rows)) return raw.rows;
    if (Array.isArray(raw?.items)) return raw.items;
    if (raw && typeof raw === "object") {
      const k = Object.keys(raw).find((x) => Array.isArray(raw[x]));
      if (k) return raw[k];
    }
    return [];
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(SUBJECT_TEACHER_API);
      // backend might return {subject_teachers:[...]} or a bare array—handle both
      const list = pickArray(res.data);
      setTeachers(list);
    } catch (err) {
      console.error("Error fetching subject-teacher records:", err);
      setMessage("Error fetching subject-teacher records");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherIDs = async () => {
    try {
      const res = await axios.get(TEACHER_IDS_API);
      setTeacherList(pickArray(res.data));
    } catch (err) {
      console.error("Error fetching teacher IDs:", err);
      setTeacherList([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(SUBJECT_LIST_API);
      const list = pickArray(res.data?.subjects ?? res.data);
      setSubjects(list);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setSubjects([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Build payload: backend expects subtea_masid as the selected teacher id
    const payload = {
      ...formData,
      subtea_masid: formData.teacherid, // ✅ assign dropdown "teacherid" to subtea_masid
    };
    delete payload.teacherid; // ✅ do not send "teacherid" (UI-only)

    try {
      if (edit) {
        await axios.put(joinUrl(SUBJECT_TEACHER_API, formData.subteaid), payload);
        setMessage("Subject Teacher updated successfully");
      } else {
        await axios.post(SUBJECT_TEACHER_API, payload);
        setMessage("Subject Teacher added successfully");
      }

      // Reset form
      setFormData({
        subteaid: "",
        teacherid: "",
        subtea_masid: "",
        subcollegesubid: "",
        subtea_collegedesc: "",
        subtea_acadyear: "",
        subcoll_acad_sem: "",
      });
      setEdit(null);
      fetchTeachers();
    } catch (err) {
      console.error("Error saving record:", err?.response?.data || err);
      setMessage("Error saving the record.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(joinUrl(SUBJECT_TEACHER_API, id));
      setMessage("Record deleted successfully.");
      fetchTeachers();
    } catch (err) {
      console.error("Delete Error:", err);
      setMessage("Error deleting the record.");
    }
  };

  const handleEdit = (row) => {
    setFormData({
      subteaid: row.subteaid || "",
      teacherid: row.subtea_masid || "",          // ✅ put the existing teacher id back into the dropdown
      subtea_masid: row.subtea_masid || "",
      subcollegesubid: row.subcollegesubid || "",
      subtea_collegedesc: row.subtea_collegedesc || "",
      subtea_acadyear: row.subtea_acadyear || "",
      subcoll_acad_sem: row.subcoll_acad_sem || "",
    });
    setEdit(row);
  };

  // pagination
  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = teachers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(teachers.length / recordsPerPage));

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Subject Teacher Management</h2>
      {message && <div style={{ color: message.startsWith("Error") ? "red" : "green", marginBottom: 10 }}>{message}</div>}

      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
        {[
          { label: "Subject Teacher ID", name: "subteaid", disabled: !!edit },
          { label: "College Description", name: "subtea_collegedesc" },
          { label: "Academic Year", name: "subtea_acadyear" },
          { label: "Semester", name: "subcoll_acad_sem" },
        ].map(({ label, name, disabled }) => (
          <div key={name} style={{ marginBottom: 10 }}>
            <label>{label}</label>
            <input
              type="text"
              name={name}
              value={formData[name]}
              onChange={handleChange}
              disabled={disabled}
              placeholder={`Enter ${label}`}
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
                width: "100%",
                marginTop: 4,
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 10 }}>
          <label>Teacher ID</label>
          <select
            name="teacherid"
            value={formData.teacherid}
            onChange={handleChange}
            required
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              width: "100%",
              marginTop: 4,
            }}
          >
            <option value="">-- Select Teacher --</option>
            {teacherList.map((t) => (
              <option key={t.teacherid} value={t.teacherid}>
                {t.teacherid} — {t.teachername}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>College Subject ID</label>
          <select
            name="subcollegesubid"
            value={formData.subcollegesubid}
            onChange={handleChange}
            required
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              width: "100%",
              marginTop: 4,
            }}
          >
            <option value="">-- Select Subject --</option>
            {subjects.map((s) => (
              <option key={s.subjectid} value={s.subjectid}>
                {s.subjectid} — {s.subjectname}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            backgroundColor: "#4f46e5",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginTop: 10,
          }}
        >
          {edit ? "Update" : "Add"} Record
        </button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Teacher ID</th>
            <th style={thStyle}>College Subject ID</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Year</th>
            <th style={thStyle}>Semester</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="7" style={{ textAlign: "center" }}>Loading...</td></tr>
          ) : currentRecords.length === 0 ? (
            <tr><td colSpan="7" style={{ textAlign: "center" }}>No Records Found</td></tr>
          ) : (
            currentRecords.map((t) => (
              <tr key={t.subteaid}>
                <td style={tdStyle}>{t.subteaid}</td>
                <td style={tdStyle}>{t.subtea_masid}</td>
                <td style={tdStyle}>{t.subcollegesubid}</td>
                <td style={tdStyle}>{t.subtea_collegedesc}</td>
                <td style={tdStyle}>{t.subtea_acadyear}</td>
                <td style={tdStyle}>{t.subcoll_acad_sem}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleEdit(t)} style={btnStyle}>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.subteaid)}
                    style={{ ...btnStyle, backgroundColor: "#dc2626" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
        <div style={{ marginRight: 15 }}>
          Page {currentPage} of {totalPages}
        </div>
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          style={paginationBtn}
        >
          ⬅️ Previous
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          style={{ ...paginationBtn, marginLeft: 10 }}
        >
          Next ➡️
        </button>
      </div>
    </div>
  );
}

// Reusable styles
const thStyle = {
  padding: 10,
  border: "1px solid #e5e7eb",
  textAlign: "left",
};
const tdStyle = {
  padding: 8,
  border: "1px solid #e5e7eb",
};
const btnStyle = {
  marginRight: 6,
  padding: "5px 10px",
  borderRadius: 4,
  backgroundColor: "#10b981",
  color: "white",
  border: "none",
  cursor: "pointer",
};
const paginationBtn = {
  padding: "6px 14px",
  backgroundColor: "#6366f1",
  color: "white",
  borderRadius: 4,
  border: "none",
  cursor: "pointer",
};

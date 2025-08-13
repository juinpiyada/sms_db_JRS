import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config/middleware_config";

// Safely join base + path (avoid double slashes)
const joinUrl = (base, path = "") =>
  path ? `${String(base).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}` : String(base);

// Tolerant array picker for various API shapes
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

export default function SubjectElective() {
  // ===== API endpoints from config =====
  const SUBJECT_ELECTIVE_API = joinUrl(config.SUBJECT_ELECTIVE_ROUTE);   // e.g. .../api/subject-elective
  const MASTER_SUBJECT_API   = joinUrl(config.SUBJECT_ROUTE, "list");    // e.g. .../api/subject/list

  const [electives, setElectives] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    sub_elec_id: "",
    sub_elec_mas_sub: "",
    sub_elec_semesterno: "",
    sub_elec_grp_code: "",
    sub_elec_grp_name: "",
    sub_elec_max_courseallowed: "",
    sub_elec_min_coursereqd: "",
    sub_elec_remarks: "",
    createdat: "",
    updatedat: "",
  });

  useEffect(() => {
    fetchElectives();
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchElectives = async () => {
    try {
      const res = await axios.get(SUBJECT_ELECTIVE_API);
      // backend might return {data:[...]} or the array directly
      setElectives(pickArray(res.data));
    } catch (err) {
      console.error("Error fetching electives:", err);
      setElectives([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(MASTER_SUBJECT_API);
      // backend might return {subjects:[...]} or the array directly
      setSubjects(pickArray(res.data?.subjects ?? res.data));
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setSubjects([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const now = new Date().toISOString();
      const dataToSend = { ...formData, updatedat: now };

      if (editing) {
        await axios.put(joinUrl(SUBJECT_ELECTIVE_API, formData.sub_elec_id), dataToSend);
        setMessage("Updated successfully.");
      } else {
        dataToSend.createdat = now;
        await axios.post(SUBJECT_ELECTIVE_API, dataToSend);
        setMessage("Subject elective group added successfully.");
      }

      fetchElectives();
      resetForm();
    } catch (err) {
      setMessage("Error saving data.");
      console.error("Save Error:", err?.response?.data || err);
    }
  };

  const handleEdit = (elec) => {
    setFormData(elec);
    setEditing(true);
    setMessage("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      await axios.delete(joinUrl(SUBJECT_ELECTIVE_API, id));
      setMessage("Deleted successfully.");
      fetchElectives();
    } catch (err) {
      setMessage("Error deleting data.");
      console.error("Delete Error:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      sub_elec_id: "",
      sub_elec_mas_sub: "",
      sub_elec_semesterno: "",
      sub_elec_grp_code: "",
      sub_elec_grp_name: "",
      sub_elec_max_courseallowed: "",
      sub_elec_min_coursereqd: "",
      sub_elec_remarks: "",
      createdat: "",
      updatedat: "",
    });
    setEditing(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2 style={{ marginBottom: "20px" }}>Subject Elective Group Entry</h2>
      {message && (
        <div style={{ marginBottom: 10, color: "green", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
        {/* Input fields */}
        {[
          { label: "Elective Group ID", name: "sub_elec_id", type: "text", placeholder: "e.g. ELC101", disabled: editing },
          { label: "Semester No", name: "sub_elec_semesterno", type: "number" },
          { label: "Group Code", name: "sub_elec_grp_code", type: "text" },
          { label: "Group Name", name: "sub_elec_grp_name", type: "text" },
          { label: "Max Courses Allowed", name: "sub_elec_max_courseallowed", type: "number" },
          { label: "Min Courses Required", name: "sub_elec_min_coursereqd", type: "number" },
          { label: "Remarks", name: "sub_elec_remarks", type: "text" },
        ].map((field) => (
          <div style={{ marginBottom: 10 }} key={field.name}>
            <label>{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              required={field.name !== "sub_elec_remarks"}
              placeholder={field.placeholder || ""}
              style={inputStyle}
              disabled={field.disabled}
            />
          </div>
        ))}

        {/* Master Subject Dropdown */}
        <div style={{ marginBottom: 10 }}>
          <label>Master Subject</label>
          <select
            name="sub_elec_mas_sub"
            value={formData.sub_elec_mas_sub}
            onChange={handleChange}
            required
            style={inputStyle}
          >
            <option value="">-- Select Master Subject --</option>
            {subjects.map((subject) => (
              <option key={subject.subjectid} value={subject.subjectid}>
                {subject.subjectid} — {subject.subjectname}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            backgroundColor: editing ? "#f59e0b" : "#2563eb",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          {editing ? "Update" : "Add"} Subject Elective
        </button>

        {editing && (
          <button
            type="button"
            onClick={resetForm}
            style={{
              marginLeft: 10,
              padding: "10px 20px",
              borderRadius: 6,
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Display Elective Groups Table */}
      <h3 style={{ marginBottom: 10 }}>Existing Subject Elective Groups</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            {["ID", "Mas Sub", "Sem", "Grp Code", "Grp Name", "Max", "Min", "Remarks", "Actions"].map((header) => (
              <th key={header} style={thStyle}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.isArray(electives) && electives.length > 0 ? (
            electives.map((elec) => (
              <tr key={elec.sub_elec_id}>
                <td style={tdStyle}>{elec.sub_elec_id}</td>
                <td style={tdStyle}>{elec.sub_elec_mas_sub}</td>
                <td style={tdStyle}>{elec.sub_elec_semesterno}</td>
                <td style={tdStyle}>{elec.sub_elec_grp_code}</td>
                <td style={tdStyle}>{elec.sub_elec_grp_name}</td>
                <td style={tdStyle}>{elec.sub_elec_max_courseallowed}</td>
                <td style={tdStyle}>{elec.sub_elec_min_coursereqd}</td>
                <td style={tdStyle}>{elec.sub_elec_remarks}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleEdit(elec)} style={actionBtn("#facc15")}>Edit</button>
                  <button onClick={() => handleDelete(elec.sub_elec_id)} style={actionBtn("#ef4444")}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} style={{ textAlign: "center", padding: 10 }}>
                No electives found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Styles
const inputStyle = {
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
  width: "100%",
  marginTop: 4,
};

const thStyle = {
  padding: 10,
  border: "1px solid #e5e7eb",
  textAlign: "left",
};

const tdStyle = {
  padding: 8,
  border: "1px solid #e5e7eb",
};

const actionBtn = (color) => ({
  marginRight: 6,
  backgroundColor: color,
  border: "none",
  color: "#fff",
  padding: "5px 10px",
  borderRadius: 4,
  cursor: "pointer",
});

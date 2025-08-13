import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import config from "../../config/middleware_config";

// ---- Safe URL joiner (prevents double slashes)
function joinUrl(base = "", path = "") {
  if (!base) return path || "";
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

// Build routes from env-driven config
const API = joinUrl(config.MASTER_ACADYEAR_ROUTE);                    // /api/master-acadyear
const COLLEGES_API = joinUrl(config.COLLEGES_ROUTE, "view-colleges"); // /api/master-college/view-colleges (kept, but we now fetch via BASE_URL effect)
const DEPTS_API = joinUrl(config.MASTER_DEPTS_ROUTE);                 // /api/master-depts

export default function CollegeAcadYear() {
  const [years, setYears] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [form, setForm] = useState({
    id: "",
    collegeid: "",
    collegedeptid: "",
    collegeacadyear: "",
    collegeacadyearsemester: "",
    collegeacadyearname: "",
    collegeacadyeartype: "",
    collegeacadyearstartdt: "",
    collegeacadyearenddt: "",
    collegeacadyeariscurrent: false,
    collegeacadyearstatus: "",
    createdat: "",
    updatedat: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchYears();
    fetchCollegesAndDepts();
  }, []);

  // ========== NEW helper you asked for ==========
  function normalizeColleges(data) {
    let arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    return arr
      .filter(c => (c.collegeid ?? c.college_id) && (c.collegename ?? c.college_name))
      .map(c => ({
        collegeid: String(c.collegeid ?? c.college_id),
        collegename: String(c.collegename ?? c.college_name),
      }));
  }

  // ========= EXISTING normalizers (kept) =========
  function extractColleges(data) {
    let arr = [];
    if (Array.isArray(data)) arr = data;
    else if (Array.isArray(data.colleges)) arr = data.colleges;
    else if (Array.isArray(data.data)) arr = data.data;
    return arr
      .filter(c => (c.collegeid ?? c.college_id) && (c.collegename ?? c.college_name))
      .map(c => ({
        collegeid: String(c.collegeid ?? c.college_id),
        collegename: String(c.collegename ?? c.college_name)
      }));
  }

  function extractDepartments(data) {
    let arr = [];
    if (Array.isArray(data)) arr = data;
    else if (Array.isArray(data.departments)) arr = data.departments;
    else if (Array.isArray(data.data)) arr = data.data;
    return arr
      .filter(d => (d.collegedeptid ?? d.dept_id ?? d.college_dept_id) && (d.collegedeptdesc ?? d.dept_desc ?? d.department_name))
      .map(d => ({
        collegedeptid: String(d.collegedeptid ?? d.dept_id ?? d.college_dept_id),
        collegedeptdesc: String(d.collegedeptdesc ?? d.dept_desc ?? d.department_name),
        collegeid: String(d.collegeid ?? d.college_id ?? d.parent_college_id ?? "")
      }));
  }

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setYears(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setMsg("Failed to fetch records. " + (e.message || ""));
    }
    setLoading(false);
  };

  // Now only fetch DEPARTMENTS here (colleges fetched by the new effect below)
  const fetchCollegesAndDepts = async () => {
    try {
      const deptsRes = await axios.get(DEPTS_API);
      setDepartments(extractDepartments(deptsRes.data));
    } catch (e) {
      setMsg("Failed to fetch department options. " + (e.message || ""));
    }
  };

  // ---------- NEW effect you asked to add ----------
  useEffect(() => {
    const COLLEGES_URL = `${config.BASE_URL}/master-college/view-colleges`;
    axios
      .get(COLLEGES_URL)
      .then(res => {
        // prefer payload.colleges; else payload
        const raw = res?.data?.colleges ?? res?.data;
        setColleges(normalizeColleges(raw));
      })
      .catch(() => setColleges([]));
  }, []);
  // -----------------------------------------------

  // Filter departments by selected college
  const filteredDepartments = useMemo(() => {
    if (!form.collegeid) return departments;
    const hasCollegeKey = departments.some(d => d.collegeid && d.collegeid !== "");
    return hasCollegeKey
      ? departments.filter(d => String(d.collegeid) === String(form.collegeid))
      : departments;
  }, [departments, form.collegeid]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "collegeid") {
      setForm(prev => ({
        ...prev,
        collegeid: value,
        collegedeptid: ""
      }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(joinUrl(API, `update/${editingId}`), form);
        setMsg("Academic year updated.");
      } else {
        await axios.post(joinUrl(API, "add"), {
          ...form,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        });
        setMsg("Academic year added.");
      }
      resetForm();
      fetchYears();
    } catch (err) {
      setMsg("Error: " + (err.response?.data?.error || "Operation failed."));
    }
    setLoading(false);
  };

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      collegeid: item.collegeid ? String(item.collegeid) : "",
      collegedeptid: item.collegedeptid ? String(item.collegedeptid) : "",
      collegeacadyear: item.collegeacadyear || "",
      collegeacadyearsemester: item.collegeacadyearsemester || "",
      collegeacadyearname: item.collegeacadyearname || "",
      collegeacadyeartype: item.collegeacadyeartype || "",
      collegeacadyearstartdt: item.collegeacadyearstartdt?.substring(0, 10) || "",
      collegeacadyearenddt: item.collegeacadyearenddt?.substring(0, 10) || "",
      collegeacadyeariscurrent: item.collegeacadyeariscurrent || false,
      collegeacadyearstatus: item.collegeacadyearstatus || "",
      createdat: item.createdat || "",
      updatedat: item.updatedat || ""
    });
    setEditingId(item.id);
    setMsg("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    setLoading(true);
    setMsg("");
    try {
      await axios.delete(joinUrl(API, `delete/${id}`));
      setMsg("Academic year deleted.");
      fetchYears();
    } catch {
      setMsg("Delete failed.");
    }
    setLoading(false);
  };

  const handleCancel = () => {
    resetForm();
    setEditingId(null);
    setMsg("");
  };

  const resetForm = () => {
    setForm({
      id: "",
      collegeid: "",
      collegedeptid: "",
      collegeacadyear: "",
      collegeacadyearsemester: "",
      collegeacadyearname: "",
      collegeacadyeartype: "",
      collegeacadyearstartdt: "",
      collegeacadyearenddt: "",
      collegeacadyeariscurrent: false,
      collegeacadyearstatus: "",
      createdat: "",
      updatedat: ""
    });
    setEditingId(null);
  };

  const formRowStyle = {
    marginBottom: 18,
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center"
  };
  const styles = {
    container: { maxWidth: 1100, margin: "32px auto", background: "#fff", borderRadius: 8, boxShadow: "0 0 16px #eee", padding: 32 },
    title: { fontSize: 22, fontWeight: 600, marginBottom: 24 },
    table: { width: "100%", borderCollapse: "collapse", marginTop: 18, fontSize: 14 },
    th: { background: "#f0f2f6", padding: 8, border: "1px solid #ddd" },
    td: { padding: 7, border: "1px solid #eee", textAlign: "center" },
    input: { padding: 6, margin: 4, width: "95%", border: "1px solid #bbb", borderRadius: 4 },
    btn: { padding: "5px 12px", margin: 3, borderRadius: 4, border: "none", cursor: "pointer" },
    editBtn: { background: "#017aff", color: "#fff" },
    delBtn: { background: "#ee4444", color: "#fff" },
    addBtn: { background: "#18bb55", color: "#fff", marginRight: 8 },
    cancelBtn: { background: "#888", color: "#fff" },
    msg: { margin: "10px 0", color: "#1976d2", fontWeight: 500 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>College Academic Years</div>
      <form onSubmit={handleSubmit} style={formRowStyle}>
        <input type="text" name="id" placeholder="ID" value={form.id} onChange={handleChange} style={styles.input} required={!editingId} disabled={!!editingId} />

        <select name="collegeid" value={form.collegeid} onChange={handleChange} style={styles.input} required>
          <option value="">Select College</option>
          {colleges.map((col) => (
            <option key={col.collegeid} value={col.collegeid}>
              {col.collegename} ({col.collegeid})
            </option>
          ))}
        </select>

        <select name="collegedeptid" value={form.collegedeptid} onChange={handleChange} style={styles.input} required>
          <option value="">
            {form.collegeid ? "Select Department" : "Select College first"}
          </option>
          {filteredDepartments.map((d) => (
            <option key={d.collegedeptid} value={d.collegedeptid}>
              {d.collegedeptdesc} ({d.collegedeptid})
            </option>
          ))}
        </select>

        <input type="text" name="collegeacadyear" placeholder="Year" value={form.collegeacadyear} onChange={handleChange} style={styles.input} required />
        <input type="text" name="collegeacadyearsemester" placeholder="Semester" value={form.collegeacadyearsemester} onChange={handleChange} style={styles.input} />
        <input type="text" name="collegeacadyearname" placeholder="Year Name" value={form.collegeacadyearname} onChange={handleChange} style={styles.input} />
        <input type="text" name="collegeacadyeartype" placeholder="Type" value={form.collegeacadyeartype} onChange={handleChange} style={styles.input} />
        <input type="date" name="collegeacadyearstartdt" placeholder="Start Date" value={form.collegeacadyearstartdt} onChange={handleChange} style={styles.input} />
        <input type="date" name="collegeacadyearenddt" placeholder="End Date" value={form.collegeacadyearenddt} onChange={handleChange} style={styles.input} />
        <label style={{ fontSize: 13, margin: "0 8px" }}>
          <input type="checkbox" name="collegeacadyeariscurrent" checked={form.collegeacadyeariscurrent} onChange={handleChange} /> Current
        </label>
        <input type="text" name="collegeacadyearstatus" placeholder="Status" value={form.collegeacadyearstatus} onChange={handleChange} style={styles.input} />
        <button type="submit" style={{ ...styles.btn, ...(editingId ? styles.editBtn : styles.addBtn) }} disabled={loading}>
          {editingId ? "Update" : "Add"}
        </button>
        {editingId && (
          <button type="button" style={{ ...styles.btn, ...styles.cancelBtn }} onClick={handleCancel} disabled={loading}>
            Cancel
          </button>
        )}
      </form>

      {msg && <div style={styles.msg}>{msg}</div>}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>CollegeID</th>
            <th style={styles.th}>DeptID</th>
            <th style={styles.th}>Year</th>
            <th style={styles.th}>Semester</th>
            <th style={styles.th}>Year Name</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Start</th>
            <th style={styles.th}>End</th>
            <th style={styles.th}>Current</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={12}>Loading...</td></tr>
          ) : years.length === 0 ? (
            <tr><td colSpan={12}>No records found.</td></tr>
          ) : years.map((item) => (
            <tr key={item.id}>
              <td style={styles.td}>{item.id}</td>
              <td style={styles.td}>{item.collegeid}</td>
              <td style={styles.td}>{item.collegedeptid}</td>
              <td style={styles.td}>{item.collegeacadyear}</td>
              <td style={styles.td}>{item.collegeacadyearsemester}</td>
              <td style={styles.td}>{item.collegeacadyearname}</td>
              <td style={styles.td}>{item.collegeacadyeartype}</td>
              <td style={styles.td}>{item.collegeacadyearstartdt?.substring(0, 10)}</td>
              <td style={styles.td}>{item.collegeacadyearenddt?.substring(0, 10)}</td>
              <td style={styles.td}>{item.collegeacadyeariscurrent ? "✅" : ""}</td>
              <td style={styles.td}>{item.collegeacadyearstatus}</td>
              <td style={styles.td}>
                <button style={{ ...styles.btn, ...styles.editBtn }} onClick={() => handleEdit(item)} disabled={loading}>Edit</button>
                <button style={{ ...styles.btn, ...styles.delBtn }} onClick={() => handleDelete(item.id)} disabled={loading}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

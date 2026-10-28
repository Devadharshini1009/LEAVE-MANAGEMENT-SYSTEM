import { useEffect, useMemo, useState } from "react";
import {
  Activity, CalendarDays, Check, CheckCircle2, ClipboardList, Clock3,
  LogOut, Plus, ShieldCheck, Stethoscope, Users, X, XCircle
} from "lucide-react";
import api from "./api";

const initialForm = { leaveType: "Casual Leave", startDate: "", endDate: "", reason: "" };
const dateLabel = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
const dayCount = (start, end) => {
  if (!start || !end || end < start) return 0;
  return Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86400000) + 1;
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("leaveflow_token"));
  const [login, setLogin] = useState({ email: "employee@demo.com", password: "Employee@123", role: "employee" });
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState({ casual: 12, medical: 10 });
  const [form, setForm] = useState(initialForm);
  const [commentById, setCommentById] = useState({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [view, setView] = useState("overview");

  useEffect(() => {
    if (token) loadSession();
  }, [token]);

  async function loadSession() {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      await refreshData(data.role);
    } catch {
      localStorage.removeItem("leaveflow_token");
      setToken(null);
      setUser(null);
    }
  }

  async function refreshData(role = user?.role) {
    try {
      if (role === "manager") {
        const { data } = await api.get("/leaves/all");
        setLeaves(data);
      } else if (role === "employee") {
        const [leaveRes, balanceRes] = await Promise.all([api.get("/leaves/mine"), api.get("/leaves/balance")]);
        setLeaves(leaveRes.data);
        setBalance(balanceRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dashboard data.");
    }
  }

  async function handleLogin(e) {
    e.preventDefault(); setError(""); setNotice(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/login", login);
      localStorage.setItem("leaveflow_token", data.token);
      setToken(data.token); setUser(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Is the backend running?");
    } finally { setLoading(false); }
  }

  function logout() {
    localStorage.removeItem("leaveflow_token");
    setToken(null); setUser(null); setLeaves([]); setView("overview");
    setNotice(""); setError("");
  }

  async function submitLeave(e) {
    e.preventDefault(); setError(""); setNotice(""); setLoading(true);
    try {
      await api.post("/leaves", form);
      setForm(initialForm);
      setNotice("Leave request submitted successfully.");
      setView("requests");
      await refreshData("employee");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit leave request.");
    } finally { setLoading(false); }
  }

  async function reviewLeave(id, status) {
    setError(""); setNotice("");
    try {
      await api.patch(`/leaves/${id}/review`, { status, managerComment: commentById[id] || "" });
      setNotice(`Leave request ${status.toLowerCase()} successfully.`);
      await refreshData("manager");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update request.");
    }
  }

  const pending = leaves.filter((l) => l.status === "Pending").length;
  const approved = leaves.filter((l) => l.status === "Approved").length;
  const rejected = leaves.filter((l) => l.status === "Rejected").length;
  const visibleLeaves = useMemo(() => {
    if (view === "pending") return leaves.filter((l) => l.status === "Pending");
    if (view === "approved") return leaves.filter((l) => l.status === "Approved");
    if (view === "rejected") return leaves.filter((l) => l.status === "Rejected");
    return leaves;
  }, [leaves, view]);

  if (!user) {
    return <div className="login-page">
      <div className="login-visual">
        <div className="brand brand-light"><span className="brand-mark"><CalendarDays size={23}/></span><span>LeaveFlow</span></div>
        <div className="visual-copy">
          <span className="eyebrow">PEOPLE FIRST. WORK SMARTER.</span>
          <h1>Time off made<br/>simple.</h1>
          <p>One calm place to request leave, manage approvals, and keep every team in sync.</p>
          <div className="visual-stat"><div className="avatar-stack"><span>AR</span><span>SK</span><span>MP</span></div><div><strong>One clear workflow</strong><small>For employees and managers</small></div></div>
        </div>
        <div className="visual-footer">LEAVE MANAGEMENT · MADE HUMAN</div>
      </div>
      <div className="login-side">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="mobile-brand brand"><span className="brand-mark"><CalendarDays size={22}/></span><span>LeaveFlow</span></div>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="muted">Choose your workspace and enter your details.</p>
          <div className="role-picker">
            <button type="button" className={login.role === "employee" ? "role-option selected" : "role-option"} onClick={() => setLogin({ ...login, role: "employee", email: "employee@demo.com", password: "Employee@123" })}><Users size={18}/><span>Employee</span></button>
            <button type="button" className={login.role === "manager" ? "role-option selected" : "role-option"} onClick={() => setLogin({ ...login, role: "manager", email: "manager@demo.com", password: "Manager@123" })}><ShieldCheck size={18}/><span>Manager</span></button>
          </div>
          <label>Email address<input type="email" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} placeholder="you@company.com"/></label>
          <label>Password<input type="password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} placeholder="Enter your password"/></label>
          {error && <div className="alert error">{error}</div>}
          <button className="primary-btn full-btn" disabled={loading}>{loading ? "Signing in..." : "Sign in"} <span>→</span></button>
          <div className="demo-hint"><strong>Demo account</strong><span>{login.role === "manager" ? "manager@demo.com / Manager@123" : "employee@demo.com / Employee@123"}</span><small>Run the backend seed command to enable these accounts.</small></div>
        </form>
        <p className="login-bottom">Secure workspace · LeaveFlow demo</p>
      </div>
    </div>;
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><CalendarDays size={22}/></span><span>LeaveFlow</span></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className={`nav-item ${view === "overview" ? "active" : ""}`} onClick={() => setView("overview")}><Activity size={18}/> Overview</button>
      {user.role === "employee" && <button className={`nav-item ${view === "apply" ? "active" : ""}`} onClick={() => setView("apply")}><Plus size={18}/> Apply for leave</button>}
      <button className={`nav-item ${["requests", "pending", "approved", "rejected"].includes(view) ? "active" : ""}`} onClick={() => setView("requests")}><ClipboardList size={18}/> {user.role === "manager" ? "Leave requests" : "My requests"}{user.role === "manager" && pending > 0 && <span className="nav-count">{pending}</span>}</button>
      <div className="sidebar-bottom">
        <div className="help-card"><div className="help-icon"><ShieldCheck size={18}/></div><strong>Need a hand?</strong><p>Contact your HR administrator for leave policy questions.</p></div>
        <div className="profile-row"><div className="profile-avatar">{user.name.split(" ").map(x => x[0]).slice(0,2).join("").toUpperCase()}</div><div className="profile-info"><strong>{user.name}</strong><span>{user.role === "manager" ? "Manager" : "Employee"}</span></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={17}/></button></div>
      </div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><div className="breadcrumb">Workspace <span>/</span> {view === "apply" ? "Apply for leave" : view === "overview" ? "Overview" : user.role === "manager" ? "Leave requests" : "My requests"}</div><h1>{view === "apply" ? "Apply for leave" : view === "overview" ? `Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}` : user.role === "manager" ? "Leave requests" : "My leave requests"}</h1></div><div className="topbar-right"><span className="date-chip"><CalendarDays size={16}/>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span><div className="top-avatar">{user.name.split(" ").map(x => x[0]).slice(0,2).join("").toUpperCase()}</div></div></header>
      <div className="content-area">
        {notice && <div className="alert success"><CheckCircle2 size={18}/>{notice}<button onClick={() => setNotice("")}><X size={15}/></button></div>}
        {error && <div className="alert error"><XCircle size={18}/>{error}<button onClick={() => setError("")}><X size={15}/></button></div>}

        {view === "overview" && <>
          <div className="welcome-banner"><div><span className="banner-tag">{user.role === "manager" ? "MANAGER WORKSPACE" : "YOUR TIME, YOUR WAY"}</span><h2>{user.role === "manager" ? "Your team, at a glance." : "Make room for what matters."}</h2><p>{user.role === "manager" ? "Review employee requests and keep the team moving." : "Plan your time off and stay updated at every step."}</p></div><div className="banner-art"><div className="art-circle"><CalendarDays size={42}/></div><span className="art-dot dot-one"></span><span className="art-dot dot-two"></span></div></div>
          <div className="section-heading"><div><h2>{user.role === "manager" ? "Request overview" : "Your leave balance"}</h2><p>{user.role === "manager" ? "A quick look at the team's requests." : "Available days for the current leave cycle."}</p></div>{user.role === "employee" && <button className="primary-btn" onClick={() => setView("apply")}><Plus size={17}/> New request</button>}</div>
          {user.role === "employee" ? <div className="balance-grid">
            <div className="balance-card"><div className="balance-top"><div className="balance-icon casual"><CalendarDays size={20}/></div><span className="balance-pill">Annual allowance: 12</span></div><p>Casual Leave</p><div className="balance-number">{balance.casual}<small> days left</small></div><div className="progress-track"><div className="progress-fill blue-fill" style={{ width: `${Math.max(0, Math.min(100, balance.casual / 12 * 100))}%` }}/></div><small className="balance-foot">For personal matters and short breaks</small></div>
            <div className="balance-card"><div className="balance-top"><div className="balance-icon medical"><Stethoscope size={20}/></div><span className="balance-pill">Annual allowance: 10</span></div><p>Medical Leave</p><div className="balance-number">{balance.medical}<small> days left</small></div><div className="progress-track"><div className="progress-fill green-fill" style={{ width: `${Math.max(0, Math.min(100, balance.medical / 10 * 100))}%` }}/></div><small className="balance-foot">For illness, recovery, or medical needs</small></div>
          </div> : <div className="stats-grid">
            <Stat icon={<ClipboardList size={20}/>} label="Total requests" value={leaves.length} tone="blue"/>
            <Stat icon={<Clock3 size={20}/>} label="Awaiting review" value={pending} tone="amber"/>
            <Stat icon={<CheckCircle2 size={20}/>} label="Approved" value={approved} tone="green"/>
            <Stat icon={<XCircle size={20}/>} label="Rejected" value={rejected} tone="red"/>
          </div>}
          <div className="section-heading recent-heading"><div><h2>{user.role === "manager" ? "Needs your attention" : "Recent requests"}</h2><p>{user.role === "manager" ? "Pending requests are shown first." : "Follow the status of your submitted leave."}</p></div><button className="text-btn" onClick={() => { setView("requests"); setError(""); }}>View all <span>→</span></button></div>
          <LeaveTable leaves={[...leaves].sort((a,b) => (a.status === "Pending" ? -1 : 0) - (b.status === "Pending" ? -1 : 0)).slice(0,5)} manager={user.role === "manager"} commentById={commentById} setCommentById={setCommentById} reviewLeave={reviewLeave} compact/>
        </>}

        {view === "apply" && user.role === "employee" && <div className="form-layout">
          <section className="panel leave-form-panel"><div className="panel-heading"><div><h2>New leave request</h2><p>Fill in the details below to send your request to your manager.</p></div><span className="form-step">01 / 01</span></div>
            <form className="leave-form" onSubmit={submitLeave}>
              <label>Leave type<select value={form.leaveType} onChange={e => setForm({...form, leaveType:e.target.value})}><option>Casual Leave</option><option>Medical Leave</option></select></label>
              <div className="field-grid"><label>Start date<input type="date" required min={new Date().toISOString().slice(0,10)} value={form.startDate} onChange={e => setForm({...form,startDate:e.target.value})}/></label><label>End date<input type="date" required min={form.startDate || new Date().toISOString().slice(0,10)} value={form.endDate} onChange={e => setForm({...form,endDate:e.target.value})}/></label></div>
              <label>Reason for leave<textarea required rows="4" maxLength="500" placeholder="Briefly explain why you need time off..." value={form.reason} onChange={e => setForm({...form,reason:e.target.value})}/><small className="field-hint">{form.reason.length}/500 characters</small></label>
              <div className="request-summary"><div className="summary-icon"><CalendarDays size={20}/></div><div className="summary-copy"><strong>Request summary</strong><span>{form.leaveType} · {dayCount(form.startDate,form.endDate)} day(s)</span><small>Available balance: {form.leaveType === "Casual Leave" ? balance.casual : balance.medical} days</small></div><span className="summary-days">{dayCount(form.startDate,form.endDate)}<small>days</small></span></div>
              <div className="form-actions"><button type="button" className="secondary-btn" onClick={() => setForm(initialForm)}>Clear form</button><button className="primary-btn" disabled={loading}>{loading ? "Submitting..." : "Submit request"} <span>→</span></button></div>
            </form>
          </section>
          <aside className="panel policy-panel"><div className="policy-icon"><ShieldCheck size={21}/></div><h3>Before you submit</h3><ul><li>Choose the correct leave category.</li><li>End date includes the final day of leave.</li><li>Your manager will review your request.</li><li>Balance is deducted only after approval.</li></ul><div className="policy-divider"></div><div className="policy-balance"><span>Casual leave</span><strong>{balance.casual} days</strong></div><div className="policy-balance"><span>Medical leave</span><strong>{balance.medical} days</strong></div></aside>
        </div>}

        {view !== "apply" && view !== "overview" && <section className="panel requests-panel">
          <div className="panel-heading"><div><h2>{user.role === "manager" ? "Team leave requests" : "Leave history"}</h2><p>{user.role === "manager" ? "Review each request and add a note if needed." : "All your submitted requests in one place."}</p></div><span className="request-count">{visibleLeaves.length} request{visibleLeaves.length !== 1 ? "s" : ""}</span></div>
          <div className="filter-tabs"><button className={view === "requests" ? "filter-active" : ""} onClick={() => setView("requests")}>All <span>{leaves.length}</span></button><button className={view === "pending" ? "filter-active" : ""} onClick={() => setView("pending")}>Pending <span>{pending}</span></button><button className={view === "approved" ? "filter-active" : ""} onClick={() => setView("approved")}>Approved <span>{approved}</span></button><button className={view === "rejected" ? "filter-active" : ""} onClick={() => setView("rejected")}>Rejected <span>{rejected}</span></button></div>
          <LeaveTable leaves={visibleLeaves} manager={user.role === "manager"} commentById={commentById} setCommentById={setCommentById} reviewLeave={reviewLeave}/>
        </section>}
        <footer className="page-footer"><span>© 2026 LeaveFlow</span><span>Built for better work-life balance</span></footer>
      </div>
    </main>
  </div>;
}

function Stat({ icon, label, value, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function LeaveTable({ leaves, manager, commentById, setCommentById, reviewLeave, compact = false }) {
  if (!leaves.length) return <div className="empty-state"><div className="empty-icon"><ClipboardList size={25}/></div><strong>No leave requests yet</strong><p>{manager ? "Employee requests will appear here when submitted." : "Your leave applications will appear here after you submit one."}</p></div>;
  return <div className="table-wrap"><table><thead><tr>{manager && <th>EMPLOYEE</th>}<th>LEAVE TYPE</th><th>DATES</th><th>DAYS</th><th>STATUS</th>{!compact && <th>MANAGER NOTE</th>}{manager && <th>ACTION</th>}</tr></thead><tbody>{leaves.map(leave => <tr key={leave._id}>
    {manager && <td><div className="employee-cell"><span className="mini-avatar">{(leave.employee?.name || "E").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}</span><div><strong>{leave.employee?.name || "Employee"}</strong><small>{leave.employee?.email || ""}</small></div></div></td>}
    <td><div className="type-cell"><span className={`type-icon ${leave.leaveType === "Medical Leave" ? "medical" : "casual"}`}>{leave.leaveType === "Medical Leave" ? <Stethoscope size={16}/> : <CalendarDays size={16}/>}</span><span>{leave.leaveType}</span></div></td>
    <td><div className="date-cell"><strong>{dateLabel(leave.startDate)}</strong><small>to {dateLabel(leave.endDate)}</small></div></td><td><strong>{leave.days}</strong></td>
    <td><span className={`status status-${leave.status.toLowerCase()}`}><span></span>{leave.status}</span></td>
    {!compact && <td><span className="manager-note">{leave.managerComment || "—"}</span></td>}
    {manager && <td>{leave.status === "Pending" ? <div className="review-actions"><input aria-label="Manager comment" placeholder="Optional note..." value={commentById[leave._id] || ""} onChange={e => setCommentById({...commentById,[leave._id]:e.target.value})}/><div><button className="approve-btn" onClick={() => reviewLeave(leave._id,"Approved")} title="Approve"><Check size={15}/> Approve</button><button className="reject-btn" onClick={() => reviewLeave(leave._id,"Rejected")} title="Reject"><X size={15}/> Reject</button></div></div> : <span className="reviewed-label">{leave.status === "Approved" ? "Reviewed" : "Closed"}</span>}</td>}
  </tr>)}</tbody></table></div>;
}

export default App;

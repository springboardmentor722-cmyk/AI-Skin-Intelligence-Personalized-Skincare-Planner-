import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";

function PendingRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const role = localStorage.getItem("role");

  const loadRequests = async () => {
    try { const response = await api.get("/consultations/pending"); setRequests(response.data); setError(""); }
    catch (err) { setError(err.response?.data?.detail || "Unable to load consultation requests."); }
  };
  useEffect(() => { loadRequests(); }, []);
  const updateRequest = async (id, action) => {
    try { await api.put(`/consultations/${action}/${id}`); setMessage(`Consultation request ${action}ed.`); await loadRequests(); }
    catch (err) { setError(err.response?.data?.detail || `Unable to ${action} this consultation request.`); }
  };

  return <DashboardLayout><div className="container py-4"><div className="d-flex justify-content-between align-items-center mb-4"><h2>Consultation Requests</h2><button className="btn btn-outline-secondary btn-sm" onClick={loadRequests}>Refresh</button></div>{message && <div className="alert alert-success">{message}</div>}{error && <div className="alert alert-danger">{error}</div>}<div className="table-responsive"><table className="table table-striped table-bordered shadow"><thead className="table-dark"><tr><th>Request ID</th><th>User ID</th><th>User</th>{role === "DERMATOLOGIST" && <th>Consultant Recommendation</th>}<th>Status</th><th width="320">Actions</th></tr></thead><tbody>{requests.length === 0 ? <tr><td colSpan={role === "DERMATOLOGIST" ? 6 : 5} className="text-center">No pending consultation requests.</td></tr> : requests.map((request) => <tr key={request.id}><td>{request.id}</td><td>{request.user_id}</td><td><strong>{request.user?.name || "Unknown"}</strong></td>{role === "DERMATOLOGIST" && <td>{request.is_consultant_referral ? <><span className="badge bg-info text-dark me-2">Consultant referral</span><span>{request.consultant_recommendation || "Dermatologist consultation recommended."}</span></> : "—"}</td>}<td><span className="badge bg-warning text-dark">{request.status}</span></td><td>{role === "DERMATOLOGIST" && <button className="btn btn-primary btn-sm me-2" onClick={() => navigate(`/case/${request.id}`)}>Open Case</button>}{role === "CONSULTANT" && <button className="btn btn-primary btn-sm me-2" onClick={() => navigate(`/consultant/case/${request.id}`)}>Open Case</button>}<button className="btn btn-success btn-sm me-2" onClick={() => updateRequest(request.id, "accept")}>Accept</button><button className="btn btn-danger btn-sm" onClick={() => updateRequest(request.id, "reject")}>Reject</button></td></tr>)}</tbody></table></div></div></DashboardLayout>;
}

export default PendingRequests;

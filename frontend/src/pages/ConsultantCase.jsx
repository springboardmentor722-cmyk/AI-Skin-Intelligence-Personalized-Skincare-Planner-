import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/reports.css";

const reportFields = [
  ["patient_summary", "Patient Summary"], ["clinical_observations", "Clinical Observations"],
  ["skin_assessment", "Professional Skin Assessment"], ["recommendations", "Recommendations"],
  ["skincare_routine", "Suggested Skincare Routine"], ["follow_up_instructions", "Follow-up Instructions"],
  ["additional_notes", "Additional Notes"],
];

export default function ConsultantCase() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [reviewForm, setReviewForm] = useState({ recommendation: "", consultant_notes: "", progress_observations: "", routine_suggestions: "", follow_up_suggestion: "", requires_dermatologist: false });
  const [report, setReport] = useState(null);
  const [reportForm, setReportForm] = useState({});
  const [showReportForm, setShowReportForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const [aiDraftGenerated, setAiDraftGenerated] = useState(false);

  useEffect(() => { (async () => {
    try {
      const response = await api.get(`/consultations/case/${id}`);
      setData(response.data);
      const consultation = response.data.consultation;
      setReviewForm({ recommendation: consultation.recommendation || "", consultant_notes: consultation.consultant_notes || "", progress_observations: consultation.progress_observations || "", routine_suggestions: consultation.routine_suggestions || "", follow_up_suggestion: consultation.follow_up_suggestion || "", requires_dermatologist: !!consultation.requires_dermatologist });
      const reports = await api.get("/reports/mine");
      const existing = reports.data.find((item) => item.consultation_id === Number(id));
      if (existing) { setReport(existing); setReportForm(existing); }
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to load case.");
    }
  })(); }, [id]);

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      const response = await api.put(`/consultations/${id}/review`, reviewForm);
      setMessage(response.data.message);
      setData((old) => ({ ...old, consultation: response.data.consultation }));
    } catch (err) {
      const detail = err.response?.data?.detail || "Unable to save review.";
      setMessage(`Unable to save review: ${detail}`);
    }
  };

  const openManualReport = () => {
    setReportError("");
    setReportSuccess("");
    setAiDraftGenerated(false);
    setShowReportForm(true);
  };

  const generateDraft = async () => {
    if (generating) return;
    setReportError("");
    setReportSuccess("");
    setShowReportForm(true);
    setGenerating(true);
    try {
      const response = await api.post(`/reports/draft/${id}`);
      const draft = response.data?.draft;
      const hasContent = draft && typeof draft === "object" && reportFields.some(([key]) => String(draft[key] || "").trim());
      if (!hasContent) throw new Error("The AI returned an empty report draft.");
      setReportForm((current) => ({ ...current, ...draft }));
      setAiDraftGenerated(true);
    } catch (err) {
      setAiDraftGenerated(false);
      setReportError(err.response?.data?.detail || err.message || "Unable to generate an AI report draft. You can still write the report manually.");
    } finally {
      setGenerating(false);
    }
  };

  const saveReport = async () => {
    if (savingReport || generating) return;
    setReportError("");
    setReportSuccess("");
    setSavingReport(true);
    try {
      const response = await api.post("/reports/", { ...reportForm, consultation_id: Number(id) });
      setReport((current) => ({ ...response.data.report, sent_to_user: current?.sent_to_user ?? false }));
      setReportForm(response.data.report);
      setAiDraftGenerated(false);
      setReportSuccess("Report saved successfully.");
    } catch (err) {
      setReportError(err.response?.data?.detail || "Unable to save report.");
    } finally {
      setSavingReport(false);
    }
  };

  const sendReportToUser = async () => {
    if (!report?.report_id || sendingReport) return;
    setReportError("");
    setReportSuccess("");
    setSendingReport(true);
    try {
      const response = await api.post(`/reports/${report.report_id}/send`);
      setReport((current) => ({ ...current, sent_to_user: true }));
      setReportSuccess(response.data.message || "Report sent successfully to the user.");
    } catch (err) {
      setReportError(err.response?.data?.detail || "Unable to send the report to the user.");
    } finally {
      setSendingReport(false);
    }
  };

  if (!data) return <DashboardLayout><div className="container py-4">{message || "Loading client case..."}</div></DashboardLayout>;
  const profile = data.skin_profile || {}; const lifestyle = data.lifestyle || {}; const assessment = data.ai_assessment;
  return <DashboardLayout><div className="container py-4"><h2>Client Case</h2>{message && <div className="alert alert-info">{message}</div>}<div className="row"><section className="col-lg-6"><div className="card p-3 mb-3"><h4>Skin Profile</h4><p><b>{data.user?.name}</b> · {data.user?.email}</p><p>Skin type: {profile.skin_type || "Not provided"}</p><p>Concerns: {profile.skin_concerns || "Not provided"}</p><p>Allergies: {profile.allergies || "Not provided"}</p><p>Sensitivities: {profile.sensitivities || "Not provided"}</p></div></section><section className="col-lg-6"><div className="card p-3 mb-3"><h4>Lifestyle</h4><p>Sleep: {lifestyle.sleep_duration ?? "Not provided"}</p><p>Water intake: {lifestyle.water_intake ?? "Not provided"}</p><p>Exercise: {lifestyle.exercise || "Not provided"}</p><p>Stress: {lifestyle.stress_level || "Not provided"}</p></div></section></div>{assessment && <section className="card p-3 mb-3"><h4>AI Assessment</h4><p>Skin health score: {assessment.final_score}/100 · Condition: {assessment.condition_score} · Lifestyle: {assessment.lifestyle_score} · Sleep: {assessment.sleep_score} · Hydration: {assessment.hydration_score} · Routine: {assessment.routine_score}</p><p>{assessment.condition_summary}</p><p className="text-muted mb-0">AI assessment is informational only, not a medical diagnosis.</p></section>}<section className="card p-3 mb-3"><h4>Progress History</h4>{data.progress?.length ? <ul>{data.progress.map((record) => <li key={record.progress_id}>{record.assessment_date}: score {record.skin_score ?? "—"}; {record.notes || "No notes"}</li>)}</ul> : <p>No progress records.</p>}</section><section className="card p-3 mb-3"><h4>Consultant Review</h4><form onSubmit={submitReview}>{[["recommendation", "General skincare guidance"], ["consultant_notes", "Review notes"], ["progress_observations", "Progress observations"], ["routine_suggestions", "Routine and product suggestions"], ["follow_up_suggestion", "Follow-up suggestion"]].map(([key, label]) => <div className="mb-3" key={key}><label className="form-label">{label}</label><textarea className="form-control" required={key === "recommendation"} value={reviewForm[key]} onChange={(event) => setReviewForm({ ...reviewForm, [key]: event.target.value })} /></div>)}<label className="form-check mb-3"><input className="form-check-input me-2" type="checkbox" checked={reviewForm.requires_dermatologist} onChange={(event) => setReviewForm({ ...reviewForm, requires_dermatologist: event.target.checked })} />Recommend dermatologist review</label><button className="btn btn-primary">Save Review</button></form></section><section className="report-detail"><h3>Professional Consultant Report</h3><p>Step 1: write manually or generate an editable AI draft. Step 2: edit. Step 3: save. Step 4: send to the user.</p><div className="d-flex flex-wrap gap-2 mb-3"><button type="button" className="btn btn-outline-secondary" onClick={openManualReport} disabled={generating || savingReport || sendingReport}>{report ? "Edit Manual Report" : "Manual Report"}</button><button type="button" className="btn btn-primary" onClick={generateDraft} disabled={generating || savingReport || sendingReport}>{generating ? "Generating AI Report..." : "Generate with AI"}</button></div>{reportError && <div className="alert alert-danger">{reportError}</div>}{reportSuccess && <div className="alert alert-success">{reportSuccess}</div>}{aiDraftGenerated && <div className="alert alert-info">AI-generated draft loaded. Review and edit every field before saving.</div>}{showReportForm && <div className="row">{reportFields.map(([key, label]) => <div className="col-12 mb-3" key={key}><label className="form-label">{label}</label><textarea className="form-control" rows="4" value={reportForm[key] || ""} onChange={(event) => setReportForm({ ...reportForm, [key]: event.target.value })} /></div>)}<div className="d-flex flex-wrap gap-2"><button type="button" className="btn btn-success" onClick={saveReport} disabled={generating || savingReport || sendingReport}>{savingReport ? "Saving Report..." : "Save Report"}</button><button type="button" className="btn btn-outline-secondary" onClick={() => setShowReportForm(false)} disabled={generating || savingReport || sendingReport}>Cancel</button></div></div>}<div className="mt-3">{report?.sent_to_user ? <button type="button" className="btn btn-success" disabled>✓ Report Already Sent</button> : <button type="button" className="btn btn-primary" onClick={sendReportToUser} disabled={!report?.report_id || sendingReport || generating || savingReport}>{sendingReport ? "Sending Report..." : "Send Report to User"}</button>}{!report?.report_id && <small className="d-block text-muted mt-2">Save the report before sending it to the user.</small>}</div></section></div></DashboardLayout>;
}

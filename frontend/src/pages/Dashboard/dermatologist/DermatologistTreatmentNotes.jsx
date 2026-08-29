import { useEffect, useState } from "react";
import { TbNotes } from "react-icons/tb";
import MainLayout from "../../../layouts/MainLayout";
import { DERM_NAV_ITEMS } from "./dermNav";
import { getDermatologistPatients, addTreatmentNote, getTreatmentNotes } from "../../../services/profile";
import { useToast } from "../../../context/ToastContext";

export default function DermatologistTreatmentNotes() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    getDermatologistPatients()
      .then((res) => {
        setPatients(res.data);
        if (res.data.length) setSelectedPatient(res.data[0].id);
      })
      .finally(() => setLoadingPatients(false));
  }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    setLoadingNotes(true);
    getTreatmentNotes(selectedPatient)
      .then((res) => setNotes(res.data))
      .catch(() => setNotes([]))
      .finally(() => setLoadingNotes(false));
  }, [selectedPatient]);

  const patient = patients.find((p) => p.id === Number(selectedPatient));

  const handleAdd = async () => {
    if (!draft.trim()) return;
    try {
      await addTreatmentNote(selectedPatient, draft.trim());
      const res = await getTreatmentNotes(selectedPatient);
      setNotes(res.data);
      setDraft("");
      showToast("Note added");
    } catch {
      showToast("Couldn't save note", "error");
    }
  };

  return (
    <MainLayout navItems={DERM_NAV_ITEMS} brandLabel="Skin AI · Dermatologist">
      <header>
        <h1 className="text-xl font-semibold">Treatment notes</h1>
        <p className="text-sm text-ink-secondary">Manual notes for a patient — now saved for real.</p>
      </header>

      <div className="glass p-5">
        {loadingPatients ? (
          <p className="text-ink-secondary">Loading patients...</p>
        ) : patients.length === 0 ? (
          <p className="text-ink-secondary text-center py-6">No patients yet.</p>
        ) : (
          <>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="field mb-4 sm:w-72"
            >
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {patient && (
              <>
                <div className="flex gap-2 mb-5">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Add a treatment note for ${patient.name}...`}
                    className="field flex-1 min-h-[80px] resize-none"
                  />
                  <button onClick={handleAdd} className="btn-primary h-fit self-end">Add note</button>
                </div>

                <div className="flex flex-col gap-3">
                  {loadingNotes ? (
                    <p className="text-sm text-ink-secondary">Loading notes...</p>
                  ) : notes.length === 0 ? (
                    <p className="text-sm text-ink-secondary text-center py-6">No notes yet for {patient.name}.</p>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="glass p-4 flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center shrink-0">
                          <TbNotes />
                        </div>
                        <div>
                          <p className="text-sm text-ink-primary">{n.text}</p>
                          <p className="text-xs text-ink-secondary mt-1 font-mono">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, updateProfile } from "../../services/profile";
import { getUsersByRole } from "../../services/auth";
import { useToast } from "../../context/ToastContext";
import MainLayout from "../../layouts/MainLayout";
import { TbUser } from "react-icons/tb";

const SKIN_CONCERNS = [
  "Acne", "Blackheads", "Whiteheads", "Pigmentation", "Dark Spots",
  "Dark Circles", "Wrinkles", "Fine Lines", "Large Pores", "Dryness",
  "Oiliness", "Redness", "Sensitive Skin", "Dullness",
];
const ALLERGY_OPTIONS = ["None", "Fragrance", "Parabens", "Sulfates", "Essential Oils", "Nuts", "Latex", "Salicylates"];
const GOAL_OPTIONS = ["Glowing Skin", "Reduce Acne", "Anti-Aging", "Even Skin Tone", "Hydration", "Oil Control", "Sensitive Skin Care", "Reduce Pores"];
const NAV_ITEMS = [{ label: "My profile", icon: <TbUser />, to: "/profile" }];

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-4 py-2 rounded-pill transition-all ${
        active ? "bg-ocean-500 text-white" : "bg-white/50 text-ink-secondary border border-white/60 hover:bg-white/70"
      }`}
    >
      {label}
    </button>
  );
}

function EditProfile() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consultants, setConsultants] = useState([]);
  const [dermatologists, setDermatologists] = useState([]);

  const [formData, setFormData] = useState(null);
  const [skinConcerns, setSkinConcerns] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    getUsersByRole("consultant").then((res) => setConsultants(res.data)).catch(() => {});
    getUsersByRole("dermatologist").then((res) => setDermatologists(res.data)).catch(() => {});

    getMyProfile()
      .then((res) => {
        const p = res.data;
        setFormData({
          age: p.age, gender: p.gender, skin_type: p.skin_type, skin_tone: p.skin_tone,
          water_intake: p.water_intake, sleep_hours: p.sleep_hours,
          exercise_frequency: p.exercise_frequency, stress_level: p.stress_level,
          sun_exposure: p.sun_exposure,
          consultant_id: p.consultant_id || "", dermatologist_id: p.dermatologist_id || "",
        });
        setSkinConcerns(p.skin_concerns ? p.skin_concerns.split(", ").filter(Boolean) : []);
        setAllergies(p.allergies ? p.allergies.split(", ").filter(Boolean) : []);
        setGoals(p.goals ? p.goals.split(", ").filter(Boolean) : []);
      })
      .catch(() => setError("Couldn't load your profile."))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      ...formData,
      age: Number(formData.age),
      water_intake: Number(formData.water_intake),
      sleep_hours: Number(formData.sleep_hours),
      consultant_id: formData.consultant_id ? Number(formData.consultant_id) : null,
      dermatologist_id: formData.dermatologist_id ? Number(formData.dermatologist_id) : null,
      skin_concerns: skinConcerns.join(", "),
      allergies: allergies.length ? allergies.join(", ") : "None",
      goals: goals.join(", "),
    };

    try {
      await updateProfile(payload);
      showToast("Profile updated!");
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't update your profile. Please try again.");
    }
  };

  if (loading || !formData) {
    return (
      <MainLayout navItems={NAV_ITEMS} brandLabel="Skin AI">
        <p className="text-ink-secondary">Loading...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout navItems={NAV_ITEMS} brandLabel="Skin AI">
      <form onSubmit={handleSubmit} className="glass p-8 space-y-6">
        <h1 className="text-2xl font-semibold">Edit profile</h1>
        {error && <p className="pill pill-flagged py-2 px-4 w-fit">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-4">
          <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} className="field" required />
          <select name="gender" value={formData.gender} onChange={handleChange} className="field" required>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <select name="skin_type" value={formData.skin_type} onChange={handleChange} className="field" required>
            <option value="Normal">Normal</option>
            <option value="Dry">Dry</option>
            <option value="Oily">Oily</option>
            <option value="Combination">Combination</option>
            <option value="Sensitive">Sensitive</option>
          </select>
          <select name="skin_tone" value={formData.skin_tone} onChange={handleChange} className="field" required>
            <option value="Very Fair">Very Fair</option>
            <option value="Fair">Fair</option>
            <option value="Light">Light</option>
            <option value="Wheatish">Wheatish</option>
            <option value="Tan">Tan</option>
            <option value="Deep">Deep</option>
          </select>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Skin concerns</p>
          <div className="flex flex-wrap gap-2">
            {SKIN_CONCERNS.map((c) => (
              <Chip key={c} label={c} active={skinConcerns.includes(c)} onClick={() => toggle(skinConcerns, setSkinConcerns, c)} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Allergies</p>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((a) => (
              <Chip key={a} label={a} active={allergies.includes(a)} onClick={() => toggle(allergies, setAllergies, a)} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Goals</p>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((g) => (
              <Chip key={g} label={g} active={goals.includes(g)} onClick={() => toggle(goals, setGoals, g)} />
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <input type="number" step="0.1" name="water_intake" value={formData.water_intake} onChange={handleChange} className="field" required />
          <input type="number" step="0.5" name="sleep_hours" value={formData.sleep_hours} onChange={handleChange} className="field" required />
          <select name="exercise_frequency" value={formData.exercise_frequency} onChange={handleChange} className="field" required>
            <option value="Never">Never</option>
            <option value="Occasionally">Occasionally</option>
            <option value="Weekly">Weekly</option>
            <option value="Daily">Daily</option>
          </select>
          <select name="stress_level" value={formData.stress_level} onChange={handleChange} className="field" required>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select name="sun_exposure" value={formData.sun_exposure} onChange={handleChange} className="field" required>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Care team</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <select name="consultant_id" value={formData.consultant_id} onChange={handleChange} className="field">
              <option value="">No consultant</option>
              {consultants.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            <select name="dermatologist_id" value={formData.dermatologist_id} onChange={handleChange} className="field">
              <option value="">No dermatologist</option>
              {dermatologists.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full">Save changes</button>
      </form>
    </MainLayout>
  );
}

export default EditProfile;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TbUser, TbDroplet, TbMoon, TbRun, TbSun, TbBolt,
  TbAlertCircle, TbTarget, TbPalette, TbId, TbEdit, TbSparkles, TbClipboardCheck,
} from "react-icons/tb";
import { getMyProfile } from "../../services/profile";
import MainLayout from "../../layouts/MainLayout";
import SkinHealthRing from "../../components/SkinHealthRing";
import { SkeletonCard } from "../../components/Skeleton";
import { USER_NAV_ITEMS } from "../shared/userNav";

function lifestyleScore(profile) {
  const waterScore = Math.min(profile.water_intake / 3, 1) * 100;
  const sleepScore = Math.min(profile.sleep_hours / 8, 1) * 100;
  const stressScore = { Low: 100, Medium: 65, High: 35 }[profile.stress_level] ?? 60;
  return Math.round((waterScore + sleepScore + stressScore) / 3);
}

function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getMyProfile();
      setProfile(res.data);
    } catch (err) {
      setError("Unable to load your profile right now.");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
        <p className="pill pill-flagged py-2 px-4 w-fit">{error}</p>
      </MainLayout>
    );
  }

  if (loading || !profile) {
    return (
      <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </MainLayout>
    );
  }

  const fields = [
    { icon: <TbId />, label: "Age", value: profile.age },
    { icon: <TbUser />, label: "Gender", value: profile.gender },
    { icon: <TbPalette />, label: "Skin type", value: profile.skin_type },
    { icon: <TbPalette />, label: "Skin tone", value: profile.skin_tone },
    { icon: <TbTarget />, label: "Goals", value: profile.goals },
    { icon: <TbAlertCircle />, label: "Allergies", value: profile.allergies },
    { icon: <TbDroplet />, label: "Water intake", value: `${profile.water_intake} L/day` },
    { icon: <TbMoon />, label: "Sleep", value: `${profile.sleep_hours} hrs` },
    { icon: <TbRun />, label: "Exercise", value: profile.exercise_frequency },
    { icon: <TbSun />, label: "Sun exposure", value: profile.sun_exposure },
    { icon: <TbBolt />, label: "Stress level", value: profile.stress_level },
  ];

  return (
    <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
      <header className="flex items-center justify-between animate-in flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">My skin profile</h1>
          <p className="text-sm text-ink-secondary">Concerns: {profile.skin_concerns}</p>
        </div>
        <div className="flex items-center gap-4">
          <SkinHealthRing value={lifestyleScore(profile)} tone="ocean" size={72} label="Lifestyle balance" />
          <Link to="/edit-profile" className="btn-outline flex items-center gap-2 h-fit">
            <TbEdit /> Edit
          </Link>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link to="/assessment" className="glass lift p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center text-lg">
            <TbSparkles />
          </div>
          <div>
            <p className="font-medium text-ink-primary">Take your skin assessment</p>
            <p className="text-xs text-ink-secondary">Get your Skin Health Score and a personalized routine</p>
          </div>
        </Link>
        <Link to="/planner" className="glass lift p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center text-lg">
            <TbClipboardCheck />
          </div>
          <div>
            <p className="font-medium text-ink-primary">View your daily planner</p>
            <p className="text-xs text-ink-secondary">Your AM/PM routine and progress</p>
          </div>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {fields.map((f, i) => (
          <div key={f.label} className={`glass lift p-4 flex items-center gap-3 animate-in delay-${Math.min((i % 5) + 1, 5)}`}>
            <div className="w-9 h-9 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center text-lg shrink-0">
              {f.icon}
            </div>
            <div className="min-w-0">
              <p className="metric-label">{f.label}</p>
              <p className="text-sm font-medium text-ink-primary truncate">{f.value || "—"}</p>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

export default Profile;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserCheck, Star, MapPin, Award, Clock, Languages,
  Video, Sparkles, ArrowRight, ShieldCheck, Search
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";

export default function ConsultantsPublic() {
  const navigate = useNavigate();
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const res = await axiosInstance.get("/public/consultants");
        setConsultants(res.data || []);
      } catch (err) {
        console.error("Error fetching public consultants", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultants();
  }, []);

  const mockConsultants = [
    {
      id: 1,
      user_id: 101,
      full_name: "Dr. Evelyn Vance",
      qualification: "B.Sc Cosmetology, Certified Skin Specialist",
      specialization: "Acne Care & Skin Barrier Repair",
      experience: 8,
      hospital: "The Derma Clinic",
      city: "New York",
      phone: "+1 555-0192",
      available_days: "Mon, Wed, Fri",
      languages: "English, Spanish",
      bio: "Dedicated to holistic skin wellness, non-invasive acne treatments, and custom barrier restoration routines.",
      clinic_address: "540 Park Ave, New York, NY",
      working_hours: "9:00 AM - 5:00 PM",
      consultation_mode: "Video Call",
      photo: "https://images.unsplash.com/photo-1594824813566-88855ce78c0b?auto=format&fit=crop&q=80&w=300",
      rating: 4.9
    },
    {
      id: 2,
      user_id: 102,
      full_name: "Marcus Thorne",
      qualification: "Certified Clinical Aesthetician",
      specialization: "Hyperpigmentation & Sensitivity",
      experience: 6,
      hospital: "Glow Skin Institute",
      city: "Los Angeles",
      phone: "+1 555-0144",
      available_days: "Tue, Thu, Sat",
      languages: "English",
      bio: "Specializing in chemical peel protocols, soothing cica routines, and melasma management.",
      clinic_address: "1200 Sunset Blvd, Los Angeles, CA",
      working_hours: "10:00 AM - 6:00 PM",
      consultation_mode: "Video Call",
      photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
      rating: 4.8
    }
  ];

  const list = consultants.length > 0 ? consultants : mockConsultants;
  const filtered = list.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.specialization.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#0a0c10", minHeight: "100vh", color: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Header */}
      <header className="glass" style={{
        position: "sticky", top: 0, zIndex: 100,
        height: 72, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        background: "rgba(10, 12, 16, 0.8)", backdropFilter: "blur(20px)"
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#14b8a6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={16} color="white" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>DERMA.AI</span>
        </Link>

        <div style={{ display: "flex", gap: 14 }}>
          <Link to="/consultant-register" className="btn btn-secondary" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700 }}>
            Apply as Consultant
          </Link>
          <button onClick={() => navigate("/login")} className="btn btn-primary" style={{ padding: "8px 18px", borderRadius: 8, fontSize: 12.5, fontWeight: 700 }}>
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: "60px 24px 40px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16,
          background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.2)",
          padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#a78bfa"
        }}>
          <UserCheck size={14} /> Certified Cosmetic Skincare Advisors
        </div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12, color: "white" }}>
          Consult With Skincare Specialists
        </h1>
        <p style={{ fontSize: 15, color: "#94a3b8", maxWidth: 600, margin: "0 auto 30px", lineHeight: 1.6 }}>
          Book personalized 1-on-1 sessions with verified cosmetic experts to review your AI analysis, active routines, and skin goals.
        </p>

        {/* Search Input */}
        <div style={{ position: "relative", maxWidth: 460, margin: "0 auto" }}>
          <Search size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by specialist name, concern, or city..."
            style={{
              width: "100%", padding: "12px 16px 12px 44px", borderRadius: 12,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              color: "white", fontSize: 13.5, outline: "none"
            }}
          />
        </div>
      </section>

      {/* Grid List */}
      <main style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {filtered.map(c => (
            <motion.div
              key={c.id}
              whileHover={{ y: -4 }}
              style={{
                background: "rgba(255, 255, 255, 0.015)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16, overflow: "hidden", flexShrink: 0,
                  background: "linear-gradient(135deg, #14b8a6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {c.photo ? (
                    <img src={c.photo} alt={c.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <UserCheck size={28} color="white" />
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "white" }}>{c.full_name}</h3>
                    <ShieldCheck size={16} color="#14b8a6" />
                  </div>
                  <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700, marginTop: 2 }}>{c.qualification}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={11} /> {c.hospital}, {c.city}
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: 12, fontSize: 12.5, color: "#94a3b8", lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: "white", marginBottom: 2 }}>Specialization:</div>
                {c.specialization}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 11.5, color: "#94a3b8" }}>
                <div><strong>Experience:</strong> {c.experience} Years</div>
                <div><strong>Mode:</strong> {c.consultation_mode || "Video Call"}</div>
                <div><strong>Languages:</strong> {c.languages}</div>
                <div><strong>Rating:</strong> ★ {c.rating} / 5.0</div>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="btn btn-primary"
                style={{
                  width: "100%", padding: "11px", borderRadius: 10, fontWeight: 700, fontSize: 13,
                  background: "linear-gradient(135deg, #14b8a6, #6366f1)", marginTop: 4
                }}
              >
                Book Consultation
              </button>
            </motion.div>
          ))}
        </div>
      </main>

    </div>
  );
}

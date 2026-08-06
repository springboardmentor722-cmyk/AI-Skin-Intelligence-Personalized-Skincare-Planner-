import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Stethoscope, Star, MapPin, Award, Clock, Languages,
  Video, Sparkles, ArrowRight, ShieldCheck, Search, DollarSign
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";

export default function DermatologistsPublic() {
  const navigate = useNavigate();
  const [dermatologists, setDermatologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axiosInstance.get("/public/dermatologists");
        setDermatologists(res.data || []);
      } catch (err) {
        console.error("Error fetching public dermatologists", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const mockDoctors = [
    {
      id: 1,
      user_id: 201,
      full_name: "Dr. Arthur Pendelton",
      qualification: "MD, Board Certified Dermatologist",
      specialization: "Clinical Dermatology & Acne Vulgaris",
      license_number: "MD-904821",
      experience: 14,
      hospital: "Metropolitan Dermatology Hospital",
      city: "Boston",
      phone: "+1 555-0188",
      available_days: "Mon, Tue, Thu",
      languages: "English, French",
      bio: "14+ years evaluating clinical acne cases, eczema, psoriasis, and custom prescription compound treatments.",
      consultation_fee: 75.0,
      photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
      rating: 4.95
    },
    {
      id: 2,
      user_id: 202,
      full_name: "Dr. Maya Lin",
      qualification: "MD, FAAD Dermatologist",
      specialization: "Pigmentation, Melasma & Retinoids",
      license_number: "MD-881204",
      experience: 11,
      hospital: "Pacific Derma Care",
      city: "San Francisco",
      phone: "+1 555-0129",
      available_days: "Wed, Fri, Sat",
      languages: "English, Mandarin",
      bio: "Board-certified FAAD physician managing persistent hyperpigmentation, anti-aging retinoids, and laser therapy.",
      consultation_fee: 90.0,
      photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
      rating: 4.9
    }
  ];

  const list = dermatologists.length > 0 ? dermatologists : mockDoctors;
  const filtered = list.filter(d => 
    d.full_name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase()) ||
    d.city.toLowerCase().includes(search.toLowerCase())
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
          <Link to="/dermatologist-register" className="btn btn-secondary" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 700 }}>
            Apply as Doctor
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
          background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)",
          padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#4ade80"
        }}>
          <Stethoscope size={14} /> Board-Certified Dermatologists
        </div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12, color: "white" }}>
          Consult Board-Certified Doctors
        </h1>
        <p style={{ fontSize: 15, color: "#94a3b8", maxWidth: 600, margin: "0 auto 30px", lineHeight: 1.6 }}>
          Receive professional medical diagnoses, active prescriptions, and updated treatment schedules directly on your user dashboard.
        </p>

        {/* Search Input */}
        <div style={{ position: "relative", maxWidth: 460, margin: "0 auto" }}>
          <Search size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by doctor name, specialization, or hospital..."
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
          {filtered.map(d => (
            <motion.div
              key={d.id}
              whileHover={{ y: -4 }}
              style={{
                background: "rgba(255, 255, 255, 0.015)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16
              }}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 16, overflow: "hidden", flexShrink: 0,
                  background: "linear-gradient(135deg, #10b981, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {d.photo ? (
                    <img src={d.photo} alt={d.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Stethoscope size={28} color="white" />
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "white" }}>{d.full_name}</h3>
                    <ShieldCheck size={16} color="#10b981" />
                  </div>
                  <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700, marginTop: 2 }}>{d.qualification}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    License: <span style={{ color: "#94a3b8" }}>{d.license_number}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: 12, fontSize: 12.5, color: "#94a3b8", lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: "white", marginBottom: 2 }}>Hospital / Clinic:</div>
                {d.hospital}, {d.city}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 11.5, color: "#94a3b8" }}>
                <div><strong>Experience:</strong> {d.experience} Years</div>
                <div><strong>Fee:</strong> ${d.consultation_fee}</div>
                <div><strong>Days:</strong> {d.available_days}</div>
                <div><strong>Rating:</strong> ★ {d.rating} / 5.0</div>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="btn btn-primary"
                style={{
                  width: "100%", padding: "11px", borderRadius: 10, fontWeight: 700, fontSize: 13,
                  background: "linear-gradient(135deg, #10b981, #059669)", marginTop: 4
                }}
              >
                Book Online Consultation
              </button>
            </motion.div>
          ))}
        </div>
      </main>

    </div>
  );
}

import { useEffect, useState } from "react";
import { TbStar, TbStarFilled } from "react-icons/tb";
import MainLayout from "../../../layouts/MainLayout";
import { CONSULTANT_NAV_ITEMS } from "./consultantNav";
import { getConsultantClients } from "../../../services/profile";
import { getClientRecommendations } from "../../../services/recommendations";
import { getCategoryImage } from "../../../utils/categoryImages";
import { getInitials } from "../../../utils/initials";
import { SkeletonCard } from "../../../components/Skeleton";

function Stars({ rating }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5 text-clay-500">
      {Array.from({ length: 5 }).map((_, i) =>
        i < full ? <TbStarFilled key={i} size={13} /> : <TbStar key={i} size={13} />
      )}
      <span className="text-xs text-ink-secondary ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ConsultantRecommendations() {
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [noAssessment, setNoAssessment] = useState(false);

  useEffect(() => {
    getConsultantClients().then((res) => {
      setClients(res.data);
      if (res.data.length > 0) setSelectedId(res.data[0].id);
    }).finally(() => setLoadingClients(false));
  }, []);

  useEffect(() => {
    if (selectedId == null) return;
    setLoadingProducts(true);
    setNoAssessment(false);
    getClientRecommendations(selectedId)
      .then((res) => setProducts(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setNoAssessment(true);
        setProducts([]);
      })
      .finally(() => setLoadingProducts(false));
  }, [selectedId]);

  return (
    <MainLayout navItems={CONSULTANT_NAV_ITEMS} brandLabel="Skin AI · Consultant">
      <header>
        <h1 className="text-xl font-semibold">Recommendations</h1>
        <p className="text-sm text-ink-secondary">
          Product matches generated from each client's latest assessment.
        </p>
      </header>

      {loadingClients ? (
        <SkeletonCard />
      ) : clients.length === 0 ? (
        <div className="glass p-8 text-center text-sm text-ink-secondary">No clients yet.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition ${
                  selectedId === c.id
                    ? "bg-ocean-500 text-white border-ocean-500"
                    : "bg-white/60 text-ink-primary border-white/60 hover:bg-white/80"
                }`}
              >
                <span className="avatar w-5 h-5 text-[10px] bg-white/30">{getInitials(c.name)}</span>
                {c.name}
              </button>
            ))}
          </div>

          {loadingProducts ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : noAssessment ? (
            <div className="glass p-8 text-center text-sm text-ink-secondary">
              This client hasn't completed an assessment yet — no recommendations to show.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="glass p-4 flex flex-col gap-2">
                  <div className="w-full h-28 rounded-lg overflow-hidden bg-white/40 -mt-1 mb-1">
                    <img
                      src={getCategoryImage(p.category)}
                      alt={p.category}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-ocean-600 font-medium">
                        {p.category}
                      </p>
                      <p className="font-medium text-ink-primary leading-snug">{p.name}</p>
                      <p className="text-xs text-ink-secondary">{p.brand}</p>
                    </div>
                    <span className="text-sm font-medium text-ink-primary whitespace-nowrap">
                      ${p.price_usd.toFixed(2)}
                    </span>
                  </div>
                  <Stars rating={p.rating} />
                  {p.matched_concerns.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.matched_concerns.map((c) => (
                        <span key={c} className="pill pill-flagged text-[11px]">Matches: {c}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}

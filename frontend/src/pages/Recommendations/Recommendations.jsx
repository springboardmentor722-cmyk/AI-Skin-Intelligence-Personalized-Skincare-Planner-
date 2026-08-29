import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TbFlask, TbStar, TbStarFilled } from "react-icons/tb";
import MainLayout from "../../layouts/MainLayout";
import { SkeletonCard } from "../../components/Skeleton";
import { USER_NAV_ITEMS } from "../shared/userNav";
import { getRecommendations } from "../../services/recommendations";
import { getCategoryImage } from "../../utils/categoryImages";

function Stars({ rating }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5 text-clay-500">
      {Array.from({ length: 5 }).map((_, i) =>
        i < full ? <TbStarFilled key={i} size={14} /> : <TbStar key={i} size={14} />
      )}
      <span className="text-xs text-ink-secondary ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div className="glass p-4 flex flex-col gap-2">
      <div className="w-full h-32 rounded-lg overflow-hidden bg-white/40 -mt-1 mb-1">
        <img
          src={getCategoryImage(product.category)}
          alt={product.category}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ocean-600 font-medium">
            {product.category}
          </p>
          <p className="font-medium text-ink-primary leading-snug">{product.name}</p>
          <p className="text-xs text-ink-secondary">{product.brand}</p>
        </div>
        <span className="text-sm font-medium text-ink-primary whitespace-nowrap">
          ${product.price_usd.toFixed(2)}
        </span>
      </div>

      <Stars rating={product.rating} />

      {product.description && (
        <p className="text-xs text-ink-secondary">{product.description}</p>
      )}

      {product.matched_concerns.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {product.matched_concerns.map((c) => (
            <span key={c} className="pill pill-flagged text-[11px]">Matches: {c}</span>
          ))}
        </div>
      )}

      {product.key_ingredients.length > 0 && (
        <p className="text-[11px] text-ink-secondary/80 pt-1 border-t border-white/60 mt-1">
          Key ingredients: {product.key_ingredients.join(", ")}
        </p>
      )}
    </div>
  );
}

export default function Recommendations() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noAssessmentYet, setNoAssessmentYet] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getRecommendations();
      setProducts(res.data);
    } catch (err) {
      if (err.response?.status === 404) setNoAssessmentYet(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </MainLayout>
    );
  }

  if (noAssessmentYet) {
    return (
      <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
        <div className="glass p-12 flex flex-col items-center text-center gap-3">
          <img src="/images/empty-state-default.png" alt="" className="w-32 h-32 object-contain" />
          <h2 className="text-base font-medium">No recommendations yet</h2>
          <p className="text-sm text-ink-secondary max-w-sm">
            Recommendations are matched to your detected concerns and skin type — complete
            the assessment first.
          </p>
          <Link to="/assessment" className="btn-primary mt-2">Take the assessment</Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
      <header className="animate-in">
        <div className="flex items-center gap-2">
          <TbFlask className="text-ocean-600" />
          <h1 className="text-xl font-semibold">Recommended for you</h1>
        </div>
        <p className="text-sm text-ink-secondary">
          Matched to your detected concerns and skin type, filtered against your reported allergies.
        </p>
      </header>

      {products.length === 0 ? (
        <div className="glass p-8 text-center text-sm text-ink-secondary">
          No matching products found right now.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </MainLayout>
  );
}

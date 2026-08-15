import "./Loading.css";

export default function Loading({ label = "Loading" }) {
  return (
    <div className="loading-screen">
      <div className="loading-orb">
        <span />
        <span />
        <span />
      </div>
      <p className="loading-label">{label}&hellip;</p>
    </div>
  );
}

import { Link } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  return (
    <div className="not-found section">
      <div className="container not-found-inner">
        <span className="eyebrow">404</span>
        <h1>This page hasn't been built yet</h1>
        <p>The page you're looking for doesn't exist, or has moved.</p>
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    </div>
  );
}

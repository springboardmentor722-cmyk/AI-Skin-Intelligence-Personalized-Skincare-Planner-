import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="navbar-brand-mark" aria-hidden="true" />
          <div>
            <p className="footer-title">Skin Intelligence</p>
            <p className="footer-tagline">Personalized skincare planning, backed by AI.</p>
          </div>
        </div>

        <div className="footer-columns">
          <div>
            <p className="footer-heading">Platform</p>
            <p>Skin Profile</p>
            <p>Lifestyle Tracking</p>
            <p>AI Modules — Coming Soon</p>
          </div>
          <div>
            <p className="footer-heading">Roles</p>
            <p>Users</p>
            <p>Skincare Consultants</p>
            <p>Dermatologists</p>
          </div>
          <div>
            <p className="footer-heading">Company</p>
            <p>About</p>
            <p>Privacy</p>
            <p>Terms</p>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>&copy; {new Date().getFullYear()} AI Skin Intelligence Platform. All rights reserved.</p>
      </div>
    </footer>
  );
}

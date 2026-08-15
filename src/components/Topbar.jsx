import { Search, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";
import "./Topbar.css";

const TODAY = new Date().toLocaleDateString(undefined, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function Topbar({ roleLabel }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} />
        <input type="text" placeholder="Search..." disabled title="Search is not wired up yet" />
      </div>

      <div className="topbar-right">
        <NotificationBell />
        <div className="topbar-date">
          <Calendar size={15} />
          <span>{TODAY}</span>
        </div>
        <div className="topbar-user">
          <Avatar name={user?.full_name} />
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.full_name}</span>
            <span className="topbar-user-role">{roleLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

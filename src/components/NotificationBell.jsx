import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "../api/axios";
import "./NotificationBell.css";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const load = () => {
    api
      .get("/v1/notifications")
      .then((res) => {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unread_count);
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Generate any contextual reminders that apply right now (routine,
    // hydration, sleep, progress, replenishment), then load the list.
    api
      .post("/v1/notifications/generate")
      .catch(() => {})
      .finally(load);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => setOpen((prev) => !prev);

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      try {
        await api.put(`/v1/notifications/${n.id}/read`);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // non-critical
      }
    }
    setOpen(false);
    if (n.link_to) navigate(n.link_to);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/v1/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // non-critical
    }
  };

  return (
    <div className="notification-bell-wrap" ref={wrapperRef}>
      <button className="topbar-icon-btn notification-bell-btn" title="Notifications" onClick={handleOpen}>
        <Bell size={18} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="link-button" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-dropdown-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className={`notification-item ${n.is_read ? "" : "notification-item-unread"}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <span className="notification-item-title">{n.title}</span>
                  <span className="notification-item-message">{n.message}</span>
                  <span className="notification-item-time">{new Date(n.created_at).toLocaleString()}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

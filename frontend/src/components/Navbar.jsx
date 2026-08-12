import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
    FaBell,
    FaSearch,
    FaChevronDown
} from "react-icons/fa";

import "../styles/navbar.css";
import api from "../services/api";

function Navbar() {

    const navigate = useNavigate();

    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const notificationRef = useRef(null);

    const loadNotifications = async () => {
        if (!localStorage.getItem("token")) return;
        try { setNotifications((await api.get("/notifications")).data); } catch { /* Navbar remains available if this fails. */ }
    };
    useEffect(() => {
        loadNotifications();
        const interval = window.setInterval(loadNotifications, 15000);
        const refreshOnFocus = () => loadNotifications();
        const close = (event) => { if (notificationRef.current && !notificationRef.current.contains(event.target)) setIsNotificationOpen(false); };
        window.addEventListener("focus", refreshOnFocus);
        document.addEventListener("mousedown", close);
        return () => { window.clearInterval(interval); window.removeEventListener("focus", refreshOnFocus); document.removeEventListener("mousedown", close); };
    }, []);
    const markRead = async (id) => { try { await api.put(`/notifications/${id}/read`); setNotifications((items) => items.map((item) => item.id === id ? { ...item, is_read: true } : item)); } catch { /* preserve UI state */ } };
    const markAllRead = async () => { try { await api.put("/notifications/read-all"); setNotifications((items) => items.map((item) => ({ ...item, is_read: true }))); } catch { /* preserve UI state */ } };
    const unreadCount = notifications.filter((item) => !item.is_read).length;

    const logout = () => {

        localStorage.clear();

        navigate("/");

    };

    return (

        <div className="top-navbar">

            {/* Left */}

            <div className="navbar-left">

                <h2>

                    Welcome back,

                    <span>

                        {" "}

                        {name}

                    </span>

                </h2>

                <p>

                    Personalized Skincare Platform

                </p>

            </div>

            {/* Right */}

            <div className="navbar-right">

                <div className="search-box">

                    <FaSearch />

                    <input
                        placeholder="Search..."
                    />

                </div>

                <div className="notification-wrapper" ref={notificationRef}>
                    <button className="notification" type="button" aria-label="Notifications" aria-expanded={isNotificationOpen} onClick={() => { if (!isNotificationOpen) loadNotifications(); setIsNotificationOpen((open) => !open); }}>
                        <FaBell />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                    </button>
                    {isNotificationOpen && <div className="notification-dropdown">
                        <div className="notification-dropdown-header"><strong>Notifications</strong>{unreadCount > 0 && <button type="button" onClick={markAllRead}>Mark all as read</button>}</div>
                        <div className="notification-list">
                            {notifications.length === 0 ? <p className="notification-empty">You’re all caught up.</p> : notifications.map((item) => <div className={`notification-item ${item.is_read ? "" : "unread"}`} key={item.id}><div><strong>{item.title}</strong><p>{item.message}</p><small>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</small></div>{!item.is_read && <button type="button" onClick={() => markRead(item.id)}>Mark as read</button>}</div>)}
                        </div>
                    </div>}
                </div>

                <div className="profile-box">

                    <div className="avatar">

                        {name?.charAt(0).toUpperCase()}

                    </div>

                    <div>

                        <h6>

                            {name}

                        </h6>

                        <small>

                            {role}

                        </small>

                    </div>

                    <FaChevronDown />

                </div>

                <button
                    className="logout-button"
                    onClick={logout}
                >

                    Logout

                </button>

            </div>

        </div>

    );

}

export default Navbar;

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoLogOutOutline, IoPersonOutline } from "react-icons/io5";
import notification from "../assets/notification.png";
import profile from "../assets/profile.png";
 
function Header({ onToggleSidebar, children }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
 
  // Sample notifications data
  const notifications = [
    {
      id: 1,
      title: "New Course Available",
      message: "Check out the latest Python Advanced course!",
      time: "2 hours ago",
      unread: true
    },
    {
      id: 2,
      title: "Assignment Due Soon",
      message: "Your Web Development assignment is due in 2 days",
      time: "5 hours ago",
      unread: true
    },
    {
      id: 3,
      title: "Achievement Unlocked",
      message: "You've completed 10 courses! Keep it up!",
      time: "1 day ago",
      unread: false
    },
    {
      id: 4,
      title: "Live Session Starting",
      message: "Your scheduled session starts in 30 minutes",
      time: "1 day ago",
      unread: false
    },
    {
      id: 5,
      title: "New Message",
      message: "Your instructor has replied to your question",
      time: "2 days ago",
      unread: false
    }
  ];
 
  // Close dropdowns if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 
  const handleLogout = () => {
    // Clear session and user role
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
   
    // Close dropdown
    setShowDropdown(false);
 
    // Redirect to login page with success message
    navigate("/", {
      replace: true,
      state: { message: "You have successfully logged out" }
    });
  };

  const goToProfile = () => {
    // Close dropdown and navigate to profile page
    setShowDropdown(false);
    navigate("/profile");
  };
 
  const unreadCount = notifications.filter(n => n.unread).length;
 
  return (
    <header className="header-wrapper" style={{ position: "relative" }}>
      <div className="header-left">
        <button className="mobile-toggle" onClick={onToggleSidebar}>☰</button>
        <div className="header-title">{children}</div>
      </div>
 
      <div className="header-right" style={{ position: "relative" }}>
        {/* Notification Icon */}
        <div ref={notificationRef} style={{ display: "inline-block", position: "relative", marginRight: "15px" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={notification}
              alt="Notification"
              className="header-notification"
              style={{ cursor: "pointer" }}
              onClick={() => setShowNotifications(!showNotifications)}
            />
            {/* Notification Badge */}
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: "-5px",
                right: "-5px",
                backgroundColor: "#EF4444",
                color: "white",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                {unreadCount}
              </span>
            )}
          </div>
 
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "50px",
                right: "0",
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                width: "350px",
                maxHeight: "400px",
                overflowY: "auto",
                zIndex: 100,
              }}
            >
              {/* Header */}
              <div style={{
                padding: "15px 20px",
                borderBottom: "1px solid #e5e5e5",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                backgroundColor: "#fff",
                zIndex: 1
              }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1A365D" }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span style={{ fontSize: "12px", color: "#2B6CB0", fontWeight: "500" }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
 
              {/* Notification List */}
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: "15px 20px",
                    borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer",
                    backgroundColor: notif.unread ? "#F0F9FF" : "white",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F0F9FF"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.unread ? "#F0F9FF" : "white"}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    {notif.unread && (
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#2B6CB0",
                        marginTop: "6px",
                        flexShrink: 0
                      }}></div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        margin: "0 0 5px 0",
                        fontSize: "14px",
                        fontWeight: notif.unread ? "600" : "500",
                        color: "#1A365D"
                      }}>
                        {notif.title}
                      </h4>
                      <p style={{
                        margin: "0 0 5px 0",
                        fontSize: "13px",
                        color: "#4A5568",
                        lineHeight: "1.4"
                      }}>
                        {notif.message}
                      </p>
                      <span style={{ fontSize: "12px", color: "#718096" }}>
                        {notif.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
 
             
            </div>
          )}
        </div>
 
        {/* Profile Avatar */}
        <div ref={dropdownRef} style={{ display: "inline-block", position: "relative" }}>
          <img
            src={profile}
            alt="Profile"
            className="header-profile"
            style={{ cursor: "pointer" }}
            onClick={() => setShowDropdown(!showDropdown)}
          />
 
          {/* Profile Dropdown */}
          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "50px",
                right: "0",
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                padding: "10px 0",
                zIndex: 100,
                minWidth: "200px",
                display: "flex",
                flexDirection: "column",
                gap: "0",
              }}
            >
              {/* Profile Button */}
              <button
                onClick={goToProfile}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  background: "transparent",
                  color: "#1A365D",
                  border: "none",
                  borderBottom: "1px solid #e2e8f0",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: "10px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <IoPersonOutline size={18} />
                Profile
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  background: "transparent",
                  color: "#EF4444",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: "10px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff5f5"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <IoLogOutOutline size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
 
export default Header;
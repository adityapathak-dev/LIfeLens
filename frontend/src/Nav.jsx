import React from "react";
import logoImg from "./assets/logo.jpg";

export default function Nav({
  theme = "dark",
  onToggle = () => {},
  user = null,
  onLogout = () => {},
  onOpenHub = () => {},
  onOpenGuidance = () => {},
  onOpenMemory = () => {},
  onOpenSessions = () => {},
  onGoHome = () => {}
}) {
  return (
    <header className="app-nav" role="banner">
      <div className="nav-inner">
        {/* Logo */}
        <div className="nav-logo" onClick={onGoHome} style={{ cursor: "pointer" }} title="Return to Dashboard">
          <div className="nav-logo-container">
            <img className="nav-logo-img" src={logoImg} alt="Life Lens Logo" />
          </div>
          <span className="nav-logo-text">
            Life <em>Lens</em>
          </span>
        </div>

        <div className="nav-right">
          {/* Session History Button */}
          {user && (
            <button
              className="nav-sessions-btn"
              onClick={onOpenSessions}
              type="button"
              title="Open Session History & Transcripts"
            >
              📜 Session History
            </button>
          )}

          {/* Decision Journeys Hub Button */}
          {user && (
            <button
              className="nav-hub-btn"
              onClick={onOpenHub}
              type="button"
              title="Open Decision Journeys Hub"
            >
              🧭 Journeys
            </button>
          )}

          {/* Decision Memory Settings Button */}
          {user && (
            <button
              className="nav-memory-btn"
              onClick={onOpenMemory}
              type="button"
              title="Open Decision Memory Settings"
            >
              🧠 Memory
            </button>
          )}

          {/* Human Guidance Directory Button */}
          {user && (
            <button
              className="nav-guidance-btn"
              onClick={onOpenGuidance}
              type="button"
              title="Open Human Guidance Directory"
            >
              🤝 Human Advisors
            </button>
          )}

          {/* User info + logout */}
          {user && (
            <div className="nav-user">
              {user.photoURL && (
                <img className="nav-user-avatar" src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" />
              )}
              <span className="nav-user-name">
                {user.displayName || user.email?.split("@")[0] || "User"}
              </span>
              <button
                className="nav-logout-btn"
                onClick={onLogout}
                type="button"
                aria-label="Log out"
              >
                Log out
              </button>
            </div>
          )}

          {/* Theme toggle */}
          <button
            id="theme-toggle"
            className="theme-toggle"
            onClick={onToggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
            <span className="theme-toggle-label">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

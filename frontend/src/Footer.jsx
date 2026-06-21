import React from "react";
import logoImg from "./assets/logo.jpg";

export default function Footer({ onReset, phase }) {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <span className="footer-logo">
            <div className="footer-logo-container">
              <img className="footer-logo-img" src={logoImg} alt="Life Lens Logo" />
            </div>
            Life <em>Lens</em>
          </span>
          <p className="footer-tagline">
            See every angle, make the right call.
          </p>
        </div>

        {/* Decisions column */}
        <div className="footer-col">
          <p className="footer-col-title">Decisions</p>
          <button onClick={() => onReset?.()}>Graduate School</button>
          <button onClick={() => onReset?.()}>Job Offer</button>
          <button onClick={() => onReset?.()}>Startup</button>
          <button onClick={() => onReset?.()}>Idea Meter</button>
        </div>

        {/* About column */}
        <div className="footer-col">
          <p className="footer-col-title">About</p>
          <a href="#" onClick={(e) => e.preventDefault()}>How it works</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Terms</a>
        </div>
      </div>

      <div className="footer-divider">
        <span className="footer-copy">© {new Date().getFullYear()} Life Lens. All rights reserved.</span>
        <span className="footer-note">The tool surfaces structure — the decision stays with you.</span>
      </div>
    </footer>
  );
}

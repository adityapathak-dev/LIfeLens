import React, { useState, useEffect } from "react";
import Nav from "./Nav.jsx";
import Footer from "./Footer.jsx";
import DecisionSelector from "./DecisionSelector.jsx";
import StartupModeSelector from "./StartupModeSelector.jsx";
import ContextIntake from "./ContextIntake.jsx";
import ChatAdvisor from "./ChatAdvisor.jsx";
import IdeaMeter from "./IdeaMeter.jsx";
import "./styles.css";

export default function App() {
  const [phase, setPhase] = useState("select");
  const [decisionType, setDecisionType] = useState(null);
  const [context, setContext] = useState(null);
  const [transitionKey, setTransitionKey] = useState(0);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("sb-theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sb-theme", theme);
  }, [theme]);

  useEffect(() => {
    function handleMouseMove(e) {
      document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function goTo(newPhase, update = () => {}) {
    update();
    setTransitionKey((k) => k + 1);
    setPhase(newPhase);
  }

  function handleSelect(type) {
    setDecisionType(type);
    if (type === "startup") goTo("startup_mode");
    else goTo("intake");
  }

  function handleStartupMode(mode) {
    if (mode === "idea_meter") goTo("idea_meter");
    else goTo("intake");
  }

  function handleIntakeSubmit(formData) {
    setContext(formData);
    goTo("chat");
  }

  function handleReset() {
    setDecisionType(null);
    setContext(null);
    goTo("select");
  }

  return (
    <>
      <Nav theme={theme} onToggle={toggleTheme} />
      <main className="app-shell">
        <div key={transitionKey} className="phase-enter" style={{ display: "contents" }}>
          {phase === "select" && (
            <DecisionSelector onSelect={handleSelect} />
          )}
          {phase === "startup_mode" && (
            <StartupModeSelector onSelect={handleStartupMode} onBack={handleReset} />
          )}
          {phase === "intake" && (
            <ContextIntake
              decisionType={decisionType}
              onSubmit={handleIntakeSubmit}
              onBack={() =>
                decisionType === "startup" ? setPhase("startup_mode") : handleReset()
              }
            />
          )}
          {phase === "chat" && (
            <ChatAdvisor
              decisionType={decisionType}
              context={context}
              onReset={handleReset}
            />
          )}
          {phase === "idea_meter" && (
            <IdeaMeter onReset={handleReset} onBack={() => setPhase("startup_mode")} />
          )}
        </div>
      </main>
      <Footer onReset={handleReset} phase={phase} />
    </>
  );
}

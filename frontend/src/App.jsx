import React, { useState, useEffect } from "react";
import Nav from "./Nav.jsx";
import Footer from "./Footer.jsx";
import DecisionSelector from "./DecisionSelector.jsx";
import StartupModeSelector from "./StartupModeSelector.jsx";
import ContextIntake from "./ContextIntake.jsx";
import ChatAdvisor from "./ChatAdvisor.jsx";
import IdeaMeter from "./IdeaMeter.jsx";
import AuthPage from "./AuthPage.jsx";
import JourneyHub from "./JourneyHub.jsx";
import HumanGuidanceModal from "./HumanGuidanceModal.jsx";
import MemoryManagerModal from "./MemoryManagerModal.jsx";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import "./styles.css";

// Inner app — only shown when user is authenticated
function AppInner() {
  const { user, logOut } = useAuth();

  // If not logged in, show auth page
  if (!user) return <AuthPage />;

  return <AppMain user={user} logOut={logOut} />;
}

function AppMain({ user, logOut }) {
  const { setActiveJourney } = useAuth();
  const [phase, setPhase] = useState("select");
  const [decisionType, setDecisionType] = useState(null);
  const [context, setContext] = useState(null);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [guidanceDomain, setGuidanceDomain] = useState("grad_school");
  const [guidanceCountry, setGuidanceCountry] = useState("");
  const [transitionKey, setTransitionKey] = useState(0);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("sb-theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sb-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase, decisionType]);

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
    setActiveJourney(null);
    goTo("select");
  }

  function handleResumeJourney(journey) {
    setActiveJourney(journey);
    setDecisionType(journey.decisionType);
    setContext(journey.context || {});
    setIsHubOpen(false);
    goTo("chat");
  }

  function handleOpenGuidance(domain = "grad_school", country = "") {
    setGuidanceDomain(domain || decisionType || "grad_school");
    setGuidanceCountry(country || context?.country || "");
    setIsGuidanceOpen(true);
  }

  return (
    <>
      <Nav
        theme={theme}
        onToggle={toggleTheme}
        user={user}
        onLogout={logOut}
        onOpenHub={() => setIsHubOpen(true)}
        onOpenGuidance={() => handleOpenGuidance(decisionType, context?.country)}
        onOpenMemory={() => setIsMemoryOpen(true)}
      />
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
              onOpenGuidance={handleOpenGuidance}
            />
          )}
          {phase === "idea_meter" && (
            <IdeaMeter onReset={handleReset} onBack={() => setPhase("startup_mode")} />
          )}
        </div>
      </main>
      <Footer onReset={handleReset} phase={phase} />

      {/* ── DECISION JOURNEYS HUB MODAL ────────────────────────────── */}
      <JourneyHub
        isOpen={isHubOpen}
        onClose={() => setIsHubOpen(false)}
        onResumeJourney={handleResumeJourney}
      />

      {/* ── HUMAN GUIDANCE DIRECTORY MODAL ─────────────────────────── */}
      <HumanGuidanceModal
        isOpen={isGuidanceOpen}
        onClose={() => setIsGuidanceOpen(false)}
        initialDomain={guidanceDomain}
        initialCountry={guidanceCountry}
      />

      {/* ── DECISION MEMORY SETTINGS MODAL ─────────────────────────── */}
      <MemoryManagerModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        initialTrack={decisionType}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import {
  createJourney,
  getJourneys,
  saveDossierToJourney,
  updateJourneySession,
  updateJourneyProgress,
  updateJourneyStatus,
  saveUserReflection,
  deleteJourney,
  getUserMemory,
  updateUserMemory,
  deleteUserMemory,
  saveAdvisorSession,
  getAdvisorSessions,
  duplicateAdvisorSession,
  deleteAdvisorSession
} from "./journeyService";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userJourneys, setUserJourneys] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [activeJourney, setActiveJourney] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [userMemory, setUserMemory] = useState(null);
  const [isJourneysLoading, setIsJourneysLoading] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);

  useEffect(() => {
    const startMs = window.__lifelens_start || performance.now();
    console.log(`[Startup] React Mounted (AuthProvider): ${(performance.now() - startMs).toFixed(1)}ms`);

    const safetyTimer = setTimeout(() => {
      console.warn(`[Startup] Safety fallback unblock triggered at ${(performance.now() - startMs).toFixed(1)}ms`);
      setLoading(false);
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(safetyTimer);
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        const uid = firebaseUser.uid;
        setIsJourneysLoading(true);
        setIsSessionsLoading(true);
        setIsMemoryLoading(true);

        (async () => {
          try {
            const journeys = await getJourneys(uid);
            setUserJourneys(journeys);
          } catch (err) {
            console.warn("[Background] Journeys fetch error:", err.message);
          } finally {
            setIsJourneysLoading(false);
          }
        })();

        (async () => {
          try {
            const sessions = await getAdvisorSessions(uid);
            setUserSessions(sessions);
          } catch (err) {
            console.warn("[Background] Sessions fetch error:", err.message);
          } finally {
            setIsSessionsLoading(false);
          }
        })();

        (async () => {
          try {
            const mem = await getUserMemory(uid);
            setUserMemory(mem);
          } catch (err) {
            console.warn("[Background] Memory fetch error:", err.message);
          } finally {
            setIsMemoryLoading(false);
          }
        })();
      } else {
        setUserJourneys([]);
        setUserSessions([]);
        setActiveJourney(null);
        setActiveSession(null);
        setUserMemory(null);
        setIsJourneysLoading(false);
        setIsSessionsLoading(false);
        setIsMemoryLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  async function fetchUserMemory() {
    if (!user) return null;
    const mem = await getUserMemory(user.uid);
    setUserMemory(mem);
    return mem;
  }

  async function saveUserMemory(memoryData) {
    if (!user) return;
    const updated = await updateUserMemory(user.uid, memoryData);
    setUserMemory(updated);
    return updated;
  }

  async function clearUserMemory() {
    if (!user) return;
    await deleteUserMemory(user.uid);
    const fresh = {
      enabled: true,
      careerInterests: [],
      degreeInterests: [],
      countryPreferences: [],
      budgetConstraints: "",
      riskTolerance: 3,
      updatedAt: Date.now()
    };
    setUserMemory(fresh);
  }

  async function toggleMemoryConsent(enabled) {
    if (!user) return;
    const updated = await updateUserMemory(user.uid, { enabled });
    setUserMemory(updated);
    return updated;
  }

  async function fetchJourneys() {
    if (!user) return [];
    const journeys = await getJourneys(user.uid);
    setUserJourneys(journeys);
    return journeys;
  }

  async function fetchSessions() {
    if (!user) return [];
    const sessions = await getAdvisorSessions(user.uid);
    setUserSessions(sessions);
    return sessions;
  }

  async function saveSession(sessionData) {
    if (!user) return null;
    const saved = await saveAdvisorSession(user.uid, sessionData);
    if (saved) {
      setUserSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== saved.id);
        return [saved, ...filtered];
      });
    }
    return saved;
  }

  async function duplicateSession(sessionId) {
    if (!user) return null;
    const duplicated = await duplicateAdvisorSession(user.uid, sessionId);
    if (duplicated) {
      setUserSessions((prev) => [duplicated, ...prev]);
    }
    return duplicated;
  }

  async function removeSession(sessionId) {
    if (!user) return;
    await deleteAdvisorSession(user.uid, sessionId);
    setUserSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }

  async function signUpEmail(email, password, name) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(result.user, { displayName: name });
    }
    return result.user;
  }

  async function signInEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async function signInGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }

  async function logOut() {
    setActiveJourney(null);
    setActiveSession(null);
    await signOut(auth);
  }

  async function createNewJourney({ title, decisionType, context, history }) {
    if (!user) throw new Error("User must be logged in to create a journey.");
    const journey = await createJourney(user.uid, { title, decisionType, context, history });
    setActiveJourney(journey);
    await fetchJourneys();
    return journey;
  }

  async function saveDossier(journeyId, { analysis, userNote }) {
    if (!user) throw new Error("User must be logged in to save dossiers.");
    let targetId = journeyId || activeJourney?.id;
    if (!targetId) {
      const newJ = await createNewJourney({
        title: `${analysis?.options?.[0]?.label || "Decision"} Exploration`,
        decisionType: "grad_school",
        context: {},
        history: []
      });
      targetId = newJ.id;
    }
    const snapshot = await saveDossierToJourney(user.uid, targetId, { analysis, userNote });
    await fetchJourneys();
    return snapshot;
  }

  const value = React.useMemo(() => ({
    user,
    loading,
    isJourneysLoading,
    isSessionsLoading,
    isMemoryLoading,
    signUpEmail,
    signInEmail,
    signInGoogle,
    logOut,
    userJourneys,
    userSessions,
    activeJourney,
    setActiveJourney,
    activeSession,
    setActiveSession,
    fetchJourneys,
    fetchSessions,
    saveSession,
    duplicateSession,
    removeSession,
    createNewJourney,
    saveDossier,
    userMemory,
    fetchUserMemory,
    saveUserMemory,
    clearUserMemory,
    toggleMemoryConsent,
    updateJourneySession: (jId, data) => updateJourneySession(user?.uid, jId, data),
    updateJourneyProgress: (jId, p) => updateJourneyProgress(user?.uid, jId, p),
    updateJourneyStatus: (jId, s) => updateJourneyStatus(user?.uid, jId, s),
    saveUserReflection: (jId, dId, r) => saveUserReflection(user?.uid, jId, dId, r),
    deleteJourney: (jId) => deleteJourney(user?.uid, jId)
  }), [user, loading, isJourneysLoading, isSessionsLoading, isMemoryLoading, userJourneys, userSessions, activeJourney, activeSession, userMemory]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg-1, #0b0f19)",
        color: "var(--text, #f3f4f6)",
        fontFamily: "var(--font-sans, sans-serif)",
        gap: "16px"
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          border: "3px solid rgba(255,255,255,0.1)",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: 500 }}>
          Loading LifeLens...
        </span>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

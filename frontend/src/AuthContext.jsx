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
  deleteUserMemory
} from "./journeyService";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userJourneys, setUserJourneys] = useState([]);
  const [activeJourney, setActiveJourney] = useState(null);
  const [userMemory, setUserMemory] = useState(null);
  const [isJourneysLoading, setIsJourneysLoading] = useState(false);
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);

  useEffect(() => {
    const startMs = window.__lifelens_start || performance.now();
    console.log(`[Startup] React Mounted (AuthProvider): ${(performance.now() - startMs).toFixed(1)}ms`);

    // Safety fallback timer ensuring app shell renders within 2s under any circumstances
    const safetyTimer = setTimeout(() => {
      console.warn(`[Startup] Safety fallback unblock triggered at ${(performance.now() - startMs).toFixed(1)}ms`);
      setLoading(false);
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const authTime = (performance.now() - startMs).toFixed(1);
      console.log(`[Startup] Auth Resolved (onAuthStateChanged): ${authTime}ms`);
      
      clearTimeout(safetyTimer);
      setUser(firebaseUser);
      // Immediately unblock startup and render App Shell!
      setLoading(false);
      console.log(`[Startup] App Shell Ready (Non-blocking): ${(performance.now() - startMs).toFixed(1)}ms`);

      if (firebaseUser) {
        const uid = firebaseUser.uid;
        setIsJourneysLoading(true);
        setIsMemoryLoading(true);

        // Background Journeys fetch (Parallel, Non-blocking)
        (async () => {
          const t0 = performance.now();
          try {
            const journeys = await getJourneys(uid);
            setUserJourneys(journeys);
            console.log(`[Background] Journeys Loaded: ${(performance.now() - t0).toFixed(1)}ms`);
          } catch (err) {
            console.warn("[Background] Journeys fetch error:", err.message);
          } finally {
            setIsJourneysLoading(false);
          }
        })();

        // Background Memory Profile fetch (Parallel, Non-blocking)
        (async () => {
          const t0 = performance.now();
          try {
            const mem = await getUserMemory(uid);
            setUserMemory(mem);
            console.log(`[Background] Memory Profile Loaded: ${(performance.now() - t0).toFixed(1)}ms`);
          } catch (err) {
            console.warn("[Background] Memory fetch error:", err.message);
          } finally {
            setIsMemoryLoading(false);
          }
        })();
      } else {
        setUserJourneys([]);
        setActiveJourney(null);
        setUserMemory(null);
        setIsJourneysLoading(false);
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
      // Auto-create journey if none active
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
    isMemoryLoading,
    signUpEmail,
    signInEmail,
    signInGoogle,
    logOut,
    userJourneys,
    activeJourney,
    setActiveJourney,
    fetchJourneys,
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
  }), [user, loading, isJourneysLoading, isMemoryLoading, userJourneys, activeJourney, userMemory]);

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

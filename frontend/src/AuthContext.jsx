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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const journeys = await getJourneys(firebaseUser.uid);
        setUserJourneys(journeys);
        const mem = await getUserMemory(firebaseUser.uid);
        setUserMemory(mem);
      } else {
        setUserJourneys([]);
        setActiveJourney(null);
        setUserMemory(null);
      }
      setLoading(false);
    });
    return unsubscribe;
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

  const value = {
    user,
    loading,
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  arrayUnion,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// Default milestone progress trackers for each decision track
export const TRACK_PROGRESS_MILESTONES = {
  grad_school: [
    { id: "exams", label: "Entrance Exams Preparation & Registration" },
    { id: "sop", label: "SOP & Recommendation Letters" },
    { id: "applications", label: "University Application Submissions" },
    { id: "financialPlanning", label: "Financial Planning & Assistantships" }
  ],
  job: [
    { id: "resumeImprovement", label: "Resume Improvement & ATS Optimization" },
    { id: "applications", label: "Targeted Job Applications" },
    { id: "interviews", label: "Technical & Behavioral Interviews" },
    { id: "offerEvaluation", label: "Offer Evaluation & Compensation Matching" }
  ],
  startup: [
    { id: "validation", label: "Problem & Idea Validation" },
    { id: "customerInterviews", label: "Customer Discovery Interviews" },
    { id: "mvp", label: "Minimum Viable Product (MVP) Build" },
    { id: "earlyUsers", label: "Early User Acquisition & Feedback" }
  ]
};

export function getDefaultProgress(decisionType) {
  const milestones = TRACK_PROGRESS_MILESTONES[decisionType] || TRACK_PROGRESS_MILESTONES.grad_school;
  const progressObj = {};
  milestones.forEach(m => {
    progressObj[m.id] = false;
  });
  return progressObj;
}

/**
 * Creates a new decision journey document scoped under users/{userId}/journeys/{journeyId}
 */
export async function createJourney(userId, { title, decisionType, context, history }) {
  if (!userId) throw new Error("User authentication required to save journeys.");
  
  const journeysRef = collection(db, "users", userId, "journeys");
  const newDocRef = doc(journeysRef); // Auto-generate ID
  const now = Date.now();

  const journeyData = {
    id: newDocRef.id,
    userId,
    title: title || `${decisionType === "grad_school" ? "Grad School" : decisionType === "job" ? "Career & Job" : "Startup"} Journey`,
    decisionType: decisionType || "grad_school",
    status: "active", // "active" | "archived" | "completed"
    createdAt: now,
    updatedAt: now,
    context: context || {},
    history: history || [],
    progress: getDefaultProgress(decisionType),
    dossiers: []
  };

  await setDoc(newDocRef, journeyData);
  return journeyData;
}

/**
 * Retrieves all decision journeys for the authenticated user
 */
export async function getJourneys(userId) {
  if (!userId) return [];
  try {
    const journeysRef = collection(db, "users", userId, "journeys");
    const q = query(journeysRef, orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);
    const journeys = [];
    snapshot.forEach(docSnap => {
      journeys.push(docSnap.data());
    });
    return journeys;
  } catch (err) {
    console.error("[journeyService] Error fetching journeys:", err.message);
    return [];
  }
}

/**
 * Saves a Decision Dossier snapshot inside a journey
 */
export async function saveDossierToJourney(userId, journeyId, { analysis, userNote = "" }) {
  if (!userId || !journeyId) throw new Error("User ID and Journey ID are required.");

  const docRef = doc(db, "users", userId, "journeys", journeyId);
  const now = Date.now();
  
  const dossierSnapshot = {
    dossierId: `dossier_${now}_${Math.random().toString(36).substring(2, 7)}`,
    savedAt: now,
    userNote: userNote || "",
    reflection: "",
    analysis: analysis || {}
  };

  await updateDoc(docRef, {
    dossiers: arrayUnion(dossierSnapshot),
    updatedAt: now
  });

  return dossierSnapshot;
}

/**
 * Updates an active journey session's context and chat history
 */
export async function updateJourneySession(userId, journeyId, { context, history }) {
  if (!userId || !journeyId) return;
  const docRef = doc(db, "users", userId, "journeys", journeyId);
  const now = Date.now();

  await updateDoc(docRef, {
    context: context || {},
    history: history || [],
    updatedAt: now
  });
}

/**
 * Updates progress milestones (checkboxes) for a journey
 */
export async function updateJourneyProgress(userId, journeyId, progressObj) {
  if (!userId || !journeyId) return;
  const docRef = doc(db, "users", userId, "journeys", journeyId);
  const now = Date.now();

  await updateDoc(docRef, {
    progress: progressObj,
    updatedAt: now
  });
}

/**
 * Updates the status of a journey ("active" | "archived" | "completed")
 */
export async function updateJourneyStatus(userId, journeyId, newStatus) {
  if (!userId || !journeyId) return;
  const docRef = doc(db, "users", userId, "journeys", journeyId);
  const now = Date.now();

  await updateDoc(docRef, {
    status: newStatus,
    updatedAt: now
  });
}

/**
 * Saves a user reflection note to a specific dossier snapshot inside a journey
 */
export async function saveUserReflection(userId, journeyId, dossierId, reflectionText) {
  if (!userId || !journeyId || !dossierId) return;
  const docRef = doc(db, "users", userId, "journeys", journeyId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const updatedDossiers = (data.dossiers || []).map(d => {
      if (d.dossierId === dossierId) {
        return { ...d, reflection: reflectionText };
      }
      return d;
    });

    await updateDoc(docRef, {
      dossiers: updatedDossiers,
      updatedAt: Date.now()
    });
  }
}

/**
 * Deletes a journey document
 */
export async function deleteJourney(userId, journeyId) {
  if (!userId || !journeyId) return;
  const docRef = doc(db, "users", userId, "journeys", journeyId);
  await deleteDoc(docRef);
}

/**
 * Memory Profile CRUD Functions
 * Document path: users/{userId}/memory/profile
 */
export async function getUserMemory(userId) {
  if (!userId) return null;
  try {
    const memRef = doc(db, "users", userId, "memory", "profile");
    const docSnap = await getDoc(memRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {
      enabled: true,
      careerInterests: [],
      degreeInterests: [],
      countryPreferences: [],
      budgetConstraints: "",
      riskTolerance: 3,
      updatedAt: Date.now()
    };
  } catch (err) {
    console.error("[journeyService] Error fetching user memory:", err.message);
    return null;
  }
}

export async function updateUserMemory(userId, memoryData) {
  if (!userId) return;
  const memRef = doc(db, "users", userId, "memory", "profile");
  const payload = {
    ...memoryData,
    updatedAt: Date.now()
  };
  await setDoc(memRef, payload, { merge: true });
  return payload;
}

export async function deleteUserMemory(userId) {
  if (!userId) return;
  const memRef = doc(db, "users", userId, "memory", "profile");
  await deleteDoc(memRef);
}

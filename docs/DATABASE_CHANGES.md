# Database Changes & Firestore Security Specification

**Database Provider:** Cloud Firestore (Firebase Data Ecosystem)  
**Target Collection Scope:** `users/{userId}/journeys/{journeyId}`  

---

## 1. Document Schema Definition

```typescript
// Path: users/{userId}/journeys/{journeyId}
interface JourneyDocument {
  id: string;                   // Auto-generated Firestore ID
  userId: string;               // Firebase Auth UID (Owner)
  title: string;                // E.g., "Grad School Selection (Fall 2027)"
  decisionType: "grad_school" | "job" | "startup";
  status: "active" | "archived" | "completed";
  createdAt: number;            // Timestamp (epoch ms)
  updatedAt: number;            // Timestamp (epoch ms)
  
  // Intake Parameters & State
  context: Record<string, any>;
  
  // Conversation Log
  history: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp?: number;
  }>;

  // Track-Specific Progress Checklists
  progress: Record<string, boolean>;

  // Saved Dossier Snapshots
  dossiers: Array<{
    dossierId: string;
    savedAt: number;
    userNote?: string;
    reflection?: string;        // Personal user reflection notes
    analysis: Record<string, any>;
  }>;
}
```

---

## 2. Cloud Firestore Security Rules

To guarantee document isolation and prevent Insecure Direct Object References (IDOR), deploy the following security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Scoped User Journeys
    match /users/{userId}/journeys/{journeyId} {
      // Allow read, write, update, delete ONLY if caller is authenticated and owns the document path
      allow read, write, update, delete: if request.auth != null && request.auth.uid == userId;
    }

    // Default deny for all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. Database Indexes
*   `users/{userId}/journeys` → `updatedAt DESC` (Single-field index auto-indexed by Firestore).

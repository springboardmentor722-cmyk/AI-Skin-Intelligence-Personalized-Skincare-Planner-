import { UserProfile, ConsultationRequest, RequestStatus } from '../types';
import { INITIAL_USERS, INITIAL_REQUESTS } from '../data/mockData';

const USERS_KEY = 'soluna_users';
const REQUESTS_KEY = 'soluna_requests';
const CURRENT_USER_KEY = 'soluna_current_user';
const LATEST_ASSESSMENT_KEY = 'soluna_latest_assessment';
const PROGRESS_HISTORY_KEY = 'soluna_progress_history';
const SCORE_HISTORY_KEY = 'soluna_score_history';

export interface ConcernItem {
  id: string;
  icon?: string;
  name: string;
  intensity: number;
  severity: 'Mild' | 'Moderate' | 'High';
}

export interface PrioritizedConcern {
  priority: number;
  name: string;
  severity: 'Mild' | 'Moderate' | 'High';
  recommendation: string;
}

export interface AssessmentRecord {
  overallScore: number;
  hydration: number;
  texture: number;
  evenTone: number;
  elasticity: number;
  oilBalance: number;
  skinType: string;
  notes: string;
  confidenceScore: string;
  concerns: ConcernItem[];
  topPrioritizedConcerns: PrioritizedConcern[];
  photoPreview?: string;
  isFaceDetected?: boolean;
  completed?: boolean;
  savedAt?: string;
}

export interface ProgressEntry {
  id: string;
  date: string;
  skinHealthScore: number;
  skinType: string;
  photo?: string;
  notes?: string;
  metrics: {
    hydration: number;
    texture: number;
    evenTone: number;
    elasticity: number;
    oilBalance: number;
  };
  concerns: { name: string; intensity: number; severity: string }[];
}

export interface ScoreHistoryEntry {
  id: string;
  dateRange: string;
  score: number;
  changeLabel?: string;
  isLatest?: boolean;
}

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

export function saveUser(user: Partial<UserProfile> & { name: string; email: string }): UserProfile {
  const users = getUsers();
  const existingIndex = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());

  let updatedUser: UserProfile;

  if (existingIndex >= 0) {
    updatedUser = {
      ...users[existingIndex],
      ...user,
      email: user.email.toLowerCase(),
    };
    users[existingIndex] = updatedUser;
  } else {
    updatedUser = {
      id: `u-${Date.now()}`,
      name: user.name,
      email: user.email.toLowerCase(),
      role: user.role || 'user',
      skinType: user.skinType || 'Combination',
      primaryConcern: user.primaryConcern || 'General Glow & Clarity',
      skinHealthScore: user.skinHealthScore || 78,
      progressPercentage: user.progressPercentage || 10,
      lastAssessment: new Date().toISOString().split('T')[0],
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'Active',
      age: user.age || 26,
    };
    users.unshift(updatedUser);
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  notifyListeners();
  return updatedUser;
}

export function getRequests(): ConsultationRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (!raw) {
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(INITIAL_REQUESTS));
      return INITIAL_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REQUESTS;
  }
}

export function addRequest(reqData: {
  userId: string;
  clientName: string;
  clientEmail: string;
  dermatologistId: string;
  dermatologistName: string;
  concern: string;
  preferredDate: string;
  preferredTime: string;
}): ConsultationRequest {
  const requests = getRequests();
  const newReq: ConsultationRequest = {
    id: `req-${Date.now()}`,
    userId: reqData.userId,
    clientName: reqData.clientName,
    clientEmail: reqData.clientEmail,
    dermatologistId: reqData.dermatologistId,
    dermatologistName: reqData.dermatologistName,
    concern: reqData.concern || 'General Consultation',
    preferredDate: reqData.preferredDate,
    preferredTime: reqData.preferredTime,
    requestedOn: new Date().toISOString().split('T')[0],
    status: 'Pending',
  };

  requests.unshift(newReq);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  notifyListeners();
  return newReq;
}

export function updateRequestStatus(requestId: string, status: RequestStatus): void {
  const requests = getRequests();
  const req = requests.find((r) => r.id === requestId);
  if (req) {
    req.status = status;
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    notifyListeners();
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
  notifyListeners();
}

// Skin Assessment, Health Score & Progress Tracking Persistence

export function getLatestAssessment(): AssessmentRecord | null {
  try {
    const raw = localStorage.getItem(LATEST_ASSESSMENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLatestAssessment(record: AssessmentRecord): void {
  localStorage.setItem(LATEST_ASSESSMENT_KEY, JSON.stringify(record));
}

export interface LifestyleTrackingData {
  dailySteps: number;
  sleepHours: number;
  waterIntakeLiters: number;
  stressLevel: 'Low' | 'Moderate' | 'High';
  sunExposure: 'Minimal' | 'Moderate' | 'High';
  routineAdherence: number;
}

const LIFESTYLE_KEY = 'soluna_lifestyle_tracking';

export function getLifestyleTracking(): LifestyleTrackingData {
  try {
    const raw = localStorage.getItem(LIFESTYLE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    dailySteps: 7200,
    sleepHours: 7.5,
    waterIntakeLiters: 1.8,
    stressLevel: 'Moderate',
    sunExposure: 'Moderate',
    routineAdherence: 88,
  };
}

export function saveLifestyleTracking(data: LifestyleTrackingData): void {
  localStorage.setItem(LIFESTYLE_KEY, JSON.stringify(data));
  notifyListeners();
}

export function getProgressHistory(): ProgressEntry[] {
  try {
    const raw = localStorage.getItem(PROGRESS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getScoreHistory(): ScoreHistoryEntry[] {
  try {
    const raw = localStorage.getItem(SCORE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAssessmentToProfileAndProgress(record: AssessmentRecord): void {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeRecord = { ...record, savedAt: formattedDate };

  // 1. Save latest assessment
  saveLatestAssessment(timeRecord);

  // 2. Sync with Current User Profile
  const currentUser = getCurrentUser();
  if (currentUser) {
    const topConcernNames = record.topPrioritizedConcerns.slice(0, 3).map(c => c.name).join(', ') || 'General Glow & Clarity';
    const updatedUser: UserProfile = {
      ...currentUser,
      skinType: record.skinType || currentUser.skinType,
      skinHealthScore: record.overallScore || currentUser.skinHealthScore,
      primaryConcern: topConcernNames || currentUser.primaryConcern,
      lastAssessment: formattedDate,
    };
    saveUser(updatedUser);
    setCurrentUser(updatedUser);
  }

  // 3. Add to Progress History
  const history = getProgressHistory();
  const newProgressEntry: ProgressEntry = {
    id: `prog-${Date.now()}`,
    date: formattedDate,
    skinHealthScore: record.overallScore,
    skinType: record.skinType,
    photo: record.photoPreview,
    notes: record.notes,
    metrics: {
      hydration: record.hydration,
      texture: record.texture,
      evenTone: record.evenTone,
      elasticity: record.elasticity,
      oilBalance: record.oilBalance,
    },
    concerns: record.concerns.map(c => ({
      name: c.name,
      intensity: c.intensity,
      severity: c.severity,
    })),
  };

  // Avoid duplicates if saved within same minute with exact same score
  const existingIdx = history.findIndex(h => h.date === formattedDate && h.skinHealthScore === record.overallScore);
  if (existingIdx >= 0) {
    history[existingIdx] = newProgressEntry;
  } else {
    history.unshift(newProgressEntry);
  }
  localStorage.setItem(PROGRESS_HISTORY_KEY, JSON.stringify(history));

  // 4. Add to Score History
  const scoreHistory = getScoreHistory();
  const dateRangeStr = `${formattedDate}`;
  const newScoreEntry: ScoreHistoryEntry = {
    id: `score-${Date.now()}`,
    dateRange: dateRangeStr,
    score: record.overallScore,
    isLatest: true,
  };
  const updatedScoreHistory = scoreHistory.map(s => ({ ...s, isLatest: false }));
  updatedScoreHistory.unshift(newScoreEntry);
  localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(updatedScoreHistory));

  notifyListeners();
}


// localStorage helpers for sessions and streak data

const SESSION_KEY = 'gaa_sessions';
const STREAK_KEY  = 'gaa_streak';

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]');
  } catch { return []; }
}

function saveSessions(sessions) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
}

function loadStreak() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
  } catch { return {}; }
}

function saveStreak(streak) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}

export function addSession(session) {
  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);

  // Update streak
  const streak = loadStreak();
  const date = session.date;
  if (!streak[date]) streak[date] = { figseq: 0, linsys: 0, latinsq: 0 };
  const type = session.type;
  streak[date][type] = (streak[date][type] || 0) + session.results.length;
  saveStreak(streak);
}

export function getAllSessions() {
  return loadSessions();
}

export function getStreakData() {
  return loadStreak();
}

export function getWrongSeeds(type) {
  return loadSessions()
    .filter(s => s.type === type)
    .flatMap(s => s.results.filter(r => !r.correct).map(r => r.seed));
}

export function clearAll() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(STREAK_KEY);
}

export function getStats() {
  const sessions = loadSessions();
  const types = ['figseq', 'linsys', 'latinsq'];
  const stats = {};
  for (const t of types) {
    const relevant = sessions.filter(s => s.type === t);
    const total   = relevant.reduce((n, s) => n + s.results.length, 0);
    const correct = relevant.reduce((n, s) => n + s.results.filter(r => r.correct).length, 0);
    stats[t] = { total, correct, sessions: relevant.length };
  }
  return stats;
}

export function getRecentAccuracy(type, last = 10) {
  return getAllSessions()
    .filter(s => s.type === type)
    .slice(-last)
    .map(s => {
      const total   = s.results.length;
      const correct = s.results.filter(r => r.correct).length;
      return total > 0 ? correct / total : 0;
    });
}

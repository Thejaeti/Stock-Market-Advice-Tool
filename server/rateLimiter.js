const MINUTE_LIMIT = 5;
const DAY_LIMIT = 25;
const ONE_MINUTE = 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

const callLog = [];
let gate = Promise.resolve();

function pruneOldEntries() {
  const cutoff = Date.now() - ONE_DAY;
  while (callLog.length > 0 && callLog[0] < cutoff) {
    callLog.shift();
  }
}

function callsInLastMinute() {
  const cutoff = Date.now() - ONE_MINUTE;
  let count = 0;
  for (let i = callLog.length - 1; i >= 0; i--) {
    if (callLog[i] >= cutoff) count++;
    else break;
  }
  return count;
}

export function acquireSlot() {
  gate = gate.then(async () => {
    pruneOldEntries();

    if (callLog.length >= DAY_LIMIT) {
      return false;
    }

    const recentCount = callsInLastMinute();
    if (recentCount >= MINUTE_LIMIT) {
      const oldestInWindow = callLog[callLog.length - MINUTE_LIMIT];
      const waitMs = oldestInWindow + ONE_MINUTE - Date.now() + 50; // 50ms buffer
      if (waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    }

    callLog.push(Date.now());
    return true;
  });
  return gate;
}

export function getRateLimitStatus() {
  pruneOldEntries();
  return {
    callsLastMinute: callsInLastMinute(),
    callsLastDay: callLog.length,
    minuteLimit: MINUTE_LIMIT,
    dayLimit: DAY_LIMIT,
  };
}

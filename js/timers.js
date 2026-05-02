// ============================
//  Timer Logic
// ============================

let timers = {};      // { partIndex: { interval, remaining, running } }
let topicTimers = {}; // { "partIndex-qIndex": { interval, remaining, running } }

// ============================
//  Time Formatting
// ============================
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatRecordingDuration(ms) {
  return formatTime(Math.max(0, Math.round(ms / 1000)));
}

// ============================
//  Clear All Timers
// ============================
function clearAllTimers() {
  for (const key in timers) {
    if (timers[key].interval) clearInterval(timers[key].interval);

    const display = document.getElementById(`timer-display-${key}`);
    const valueEl = document.getElementById(`timer-value-${key}`);
    if (display && valueEl && currentParts[key]) {
      const part = currentParts[key];
      const totalTime = part.responseTime || RESPONSE_TIMES[part.type] || 45;
      display.classList.remove('running', 'finished');
      valueEl.textContent = formatTime(totalTime);
    }
  }
  timers = {};

  for (const key in topicTimers) {
    if (topicTimers[key].interval) clearInterval(topicTimers[key].interval);
  }
  topicTimers = {};
}

// ============================
//  Response Timer (per card)
//  States: idle → running → paused → finished → reset
// ============================
window.toggleTimer = function (index, totalTime) {
  const display = document.getElementById(`timer-display-${index}`);
  const valueEl = document.getElementById(`timer-value-${index}`);

  if (!timers[index]) {
    // Start
    timers[index] = { remaining: totalTime, running: true, interval: null };
    display.classList.add('running');
    display.classList.remove('finished');
    valueEl.textContent = formatTime(totalTime);

    timers[index].interval = setInterval(() => {
      timers[index].remaining--;
      valueEl.textContent = formatTime(timers[index].remaining);
      if (timers[index].remaining <= 0) {
        clearInterval(timers[index].interval);
        timers[index].running = false;
        display.classList.remove('running');
        display.classList.add('finished');
        valueEl.textContent = '00:00';
      }
    }, 1000);

  } else if (timers[index].running) {
    // Pause
    clearInterval(timers[index].interval);
    timers[index].running = false;
    display.classList.remove('running');

  } else {
    // Reset (if was paused or finished)
    if (timers[index].interval) clearInterval(timers[index].interval);
    delete timers[index];
    display.classList.remove('running', 'finished');
    valueEl.textContent = formatTime(totalTime);
  }
};

// ============================
//  Topic Timer (Topic Prep cards)
//  Same state machine, keyed by "partIndex-questionIndex"
// ============================
window.toggleTopicTimer = function (key, responseTime) {
  const display = document.getElementById(`topic-timer-display-${key}`);
  const valueEl = document.getElementById(`topic-timer-value-${key}`);
  if (!display || !valueEl) return;

  if (!topicTimers[key]) {
    // Start
    topicTimers[key] = { remaining: responseTime, running: true, interval: null };
    display.classList.add('running');
    display.classList.remove('finished');
    valueEl.textContent = formatTime(responseTime);

    topicTimers[key].interval = setInterval(() => {
      topicTimers[key].remaining--;
      valueEl.textContent = formatTime(topicTimers[key].remaining);
      if (topicTimers[key].remaining <= 0) {
        clearInterval(topicTimers[key].interval);
        topicTimers[key].running = false;
        display.classList.remove('running');
        display.classList.add('finished');
        valueEl.textContent = '00:00';
      }
    }, 1000);

  } else if (topicTimers[key].running) {
    // Pause
    clearInterval(topicTimers[key].interval);
    topicTimers[key].running = false;
    display.classList.remove('running');

  } else {
    // Reset (if was paused or finished)
    if (topicTimers[key].interval) clearInterval(topicTimers[key].interval);
    delete topicTimers[key];
    display.classList.remove('running', 'finished');
    valueEl.textContent = formatTime(responseTime);
  }
};

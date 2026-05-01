// ============================
//  Notepad Logic
// ============================

function initNotepad() {
  const notepadOverlay = document.getElementById('notepadOverlay');
  const notepadTextarea = document.getElementById('notepadTextarea');
  const clearNotepadBtn = document.getElementById('clearNotepad');

  if (!notepadOverlay || !notepadTextarea) return;

  // 1. Load Content & Visibility
  const savedContent = localStorage.getItem('toeicNotepadContent');
  if (savedContent) {
    notepadTextarea.value = savedContent;
  }

  const isMinimized = localStorage.getItem('toeicNotepadMinimized') === 'true';
  const restoreBtn = document.getElementById('restoreNotepadBtn');
  const minimizeBtn = document.getElementById('minimizeNotepad');
  const headerIcon = document.querySelector('.notepad-minimize-icon');

  const setNotepadVisibility = (minimized) => {
    if (minimized) {
      notepadOverlay.classList.add('hidden');
      if (restoreBtn) restoreBtn.classList.add('show');

      // Auto-cancel Focus Mode if active when minimizing
      const focusBtn = document.getElementById('toggleFocusNotepad');
      if (focusBtn && focusBtn.classList.contains('active')) {
        focusBtn.click();
      }
    } else {
      notepadOverlay.classList.remove('hidden');
      if (restoreBtn) restoreBtn.classList.remove('show');
    }
    localStorage.setItem('toeicNotepadMinimized', minimized);
  };

  const updateWordCount = () => {
    const text = notepadTextarea.value.trim();
    const count = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;
    const wordCountEl = document.getElementById('notepadWordCount');
    if (wordCountEl) {
      wordCountEl.innerHTML = `<span class="notepad-count-num">${count}</span>`;
    }
  };

  const syncNotepadContent = () => {
    localStorage.setItem('toeicNotepadContent', notepadTextarea.value);
    updateWordCount();
    notepadTextarea.scrollTop = notepadTextarea.scrollHeight;
  };

  // Initial Visibility & Word Count
  setNotepadVisibility(isMinimized);
  updateWordCount();

  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => setNotepadVisibility(true));
  }
  if (headerIcon) {
    headerIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      setNotepadVisibility(true);
    });
  }
  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => setNotepadVisibility(false));
  }

  // 2. Load Dimensions & Position
  const savedWidth = localStorage.getItem('toeicNotepadWidth');
  const savedHeight = localStorage.getItem('toeicNotepadHeight');
  const savedTop = localStorage.getItem('toeicNotepadTop');
  const savedLeft = localStorage.getItem('toeicNotepadLeft');
  const savedRight = localStorage.getItem('toeicNotepadRight');

  if (savedWidth) notepadOverlay.style.width = savedWidth + 'px';
  if (savedHeight) notepadOverlay.style.height = savedHeight + 'px';

  if (savedTop) {
    notepadOverlay.style.top = savedTop;
    notepadOverlay.style.bottom = 'auto';
  }
  if (savedLeft) {
    notepadOverlay.style.left = savedLeft;
    notepadOverlay.style.right = 'auto';
  } else if (savedRight) {
    notepadOverlay.style.right = savedRight;
    notepadOverlay.style.left = 'auto';
  }

  // 3. Save Content on Input
  notepadTextarea.addEventListener('input', () => {
    syncNotepadContent();
  });

  // 4. Clear Content
  if (clearNotepadBtn) {
    clearNotepadBtn.addEventListener('click', () => {
      if (window.confirm('Erase all notes?')) {
        notepadTextarea.value = '';
        const aiInput = document.getElementById('notepadAiInput');
        if (aiInput) aiInput.value = '';
        localStorage.removeItem('toeicNotepadContent');
        updateWordCount();
      }
    });
  }


  // 5. Focus Mode Toggle
  const focusBtn = document.getElementById('toggleFocusNotepad');
  const backdrop = document.getElementById('notepadBackdrop');

  if (focusBtn && backdrop) {
    focusBtn.addEventListener('click', () => {
      const isNowActive = focusBtn.classList.toggle('active');
      backdrop.classList.toggle('show', isNowActive);

      const overlay = document.getElementById('notepadOverlay');
      if (overlay) {
        overlay.classList.toggle('focused', isNowActive);
      }
    });

    backdrop.addEventListener('click', () => {
      if (focusBtn.classList.contains('active')) {
        focusBtn.click();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && focusBtn.classList.contains('active')) {
        focusBtn.click();
      }
    });
  } else {
    console.warn('Focus Mode elements not found:', { focusBtn, backdrop });
  }

  // 5.5 (Markdown removed)

  // 6. Voice Transcription Initialization
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const toggleVoiceBtn = document.getElementById('toggleVoiceNote');
  const toggleAiBtn = document.getElementById('toggleAiAssist');
  const aiInput = document.getElementById('notepadAiInput');
  const aiSubmitBtn = document.getElementById('notepadAiSubmit');
  let isAiModeEnabled = localStorage.getItem('toeicNotepadAiMode') === 'true';
  let isAiGenerating = false;

  if (toggleVoiceBtn) {
    const showNotepadToast = (message) => {
      const toast = document.getElementById('notepadStatusToast');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      if (window.notepadToastTimeout) clearTimeout(window.notepadToastTimeout);
      window.notepadToastTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    };

    toggleVoiceBtn.addEventListener('click', () => {
      isVoiceNoteEnabled = !isVoiceNoteEnabled;
      toggleVoiceBtn.classList.toggle('active', isVoiceNoteEnabled);
      toggleVoiceBtn.title = isVoiceNoteEnabled ? "Voice-to-Text Enabled" : "Enable Voice-to-Text";

      showNotepadToast(isVoiceNoteEnabled ? "Voice-to-text enabled" : "Voice-to-text disabled");

      const recordingActive = mediaRecorder?.state === 'recording';
      if (isVoiceNoteEnabled && recordingActive && !isRecognitionActive) {
        startVoiceTranscription();
      } else if (!isVoiceNoteEnabled && isRecognitionActive) {
        stopVoiceTranscription();
      }
    });

    // Deepgram handles transcription via WebSockets
  }

  const GEMINI_API_KEY = 'AIzaSyAdBhUYRH69RryDF7HmuNJPVveYEvQiaA8';

  const getCurrentTaskSummary = () => {
    const part = currentParts[currentPart];
    if (!part) return '';

    const summaryBits = [
      part.label,
      part.questionLabel,
      part.content?.prompt,
      part.content?.question,
      part.content?.instruction
    ].filter(Boolean);

    return summaryBits.join(' | ');
  };

  const getDraftContext = () => {
    return notepadTextarea.value
      .split('\n')
      .filter(line => !/^\s*(You|AI):/.test(line))
      .join('\n')
      .trim();
  };

  const getGeminiResponse = async (question, contextText, currentTaskText) => {
    const prompt = `
      You are a professional TOEIC Speaking & Writing coach.
      
      Context:
      - Task: "${currentTaskText || 'General'}"
      - Student Draft: "${contextText || 'Empty'}"
      
      Request: "${question}"
      
      Instructions:
      1. Use clear, simple, and direct language suitable for high school students. Avoid overly complex words.
      2. If the user's request is a general greeting (e.g., "hello", "hi"), respond briefly and professionally without forcing the homework context.
      3. Only address the provided Task/Draft context if the user's request is relevant to it or asks for feedback/help.
      4. Start your response with a brief acknowledgement (e.g., "Sure, for this question..." or "Hello! How can I help you today?").
      5. Use simple bullet points (using - or *) when giving ideas or multiple suggestions.
      6. STRICT RULE: No Markdown (**bolding**, etc.). Pure plain text only.
      7. STRICT RULE: Limit your response to a maximum of 100 words.
    `.trim();

    try {
      console.log('Sending request to Gemini...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error Response:', errorData);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini Response received:', data);
      return data.candidates[0].content.parts[0].text.trim();
    } catch (err) {
      console.error('Gemini Connection Error:', err);
      return "I'm sorry, I'm having trouble connecting to my brain right now. Please check your console for details.";
    }
  };

  const typeIntoNotepad = async (text) => {
    const chunkSize = 2;
    for (let i = 0; i < text.length; i += chunkSize) {
      notepadTextarea.value += text.slice(i, i + chunkSize);
      syncNotepadContent();
      await new Promise(resolve => setTimeout(resolve, 16));
    }
  };

  const setAiModeState = (enabled) => {
    isAiModeEnabled = enabled;
    localStorage.setItem('toeicNotepadAiMode', enabled ? 'true' : 'false');
    notepadOverlay.classList.toggle('ai-mode', enabled);
    if (toggleAiBtn) toggleAiBtn.classList.toggle('active', enabled);
    if (!enabled && aiInput) {
      aiInput.value = '';
    }
    updateAiSubmitState();
    if (enabled && aiInput) {
      setTimeout(() => aiInput.focus(), 0);
    }
  };

  const setAiBusyState = (busy) => {
    isAiGenerating = busy;
    if (toggleAiBtn) toggleAiBtn.classList.toggle('generating', busy);
    if (aiSubmitBtn) aiSubmitBtn.classList.toggle('generating', busy);
    if (aiInput) aiInput.disabled = busy;
    if (aiSubmitBtn) aiSubmitBtn.disabled = busy;
  };

  const updateAiSubmitState = () => {
    if (!aiInput || !aiSubmitBtn) return;
    aiSubmitBtn.classList.toggle('has-text', aiInput.value.trim().length > 0);
  };

  const requestAiReply = async () => {
    if (!isAiModeEnabled || isAiGenerating || !aiInput) return;

    const question = aiInput.value.trim();
    if (!question) {
      const toast = document.getElementById('notepadStatusToast');
      if (toast) {
        toast.textContent = 'Type a question first';
        toast.classList.add('show');
        if (window.notepadToastTimeout) clearTimeout(window.notepadToastTimeout);
        window.notepadToastTimeout = setTimeout(() => toast.classList.remove('show'), 1600);
      }
      aiInput.focus();
      return;
    }

    setAiBusyState(true);

    // Immediately push user question to notepad and clear input
    const trimmed = notepadTextarea.value.trimEnd();
    const intro = trimmed ? `${trimmed}\n\n` : '';
    notepadTextarea.value = `${intro}You: ${question}\n\nAI: `;
    syncNotepadContent();
    aiInput.value = '';
    updateAiSubmitState();

    const contextText = getDraftContext();
    const currentTaskText = getCurrentTaskSummary();
    const reply = await getGeminiResponse(question, contextText, currentTaskText);

    await typeIntoNotepad(reply);
    notepadTextarea.value += '\n\n';
    syncNotepadContent();

    setAiBusyState(false);
    aiInput.focus();
  };

  if (toggleAiBtn) {
    toggleAiBtn.addEventListener('click', () => {
      if (isAiGenerating) return;
      setAiModeState(!isAiModeEnabled);
    });
  }

  aiInput?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await requestAiReply();
    }
  });

  aiInput?.addEventListener('input', updateAiSubmitState);

  aiSubmitBtn?.addEventListener('click', async () => {
    await requestAiReply();
  });

  setAiModeState(isAiModeEnabled);
  updateAiSubmitState();

  // 6. Copy Content
  const copyNotepadBtn = document.getElementById('copyNotepad');
  if (copyNotepadBtn) {
    copyNotepadBtn.addEventListener('click', async () => {
      const text = notepadTextarea.value;
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);

        // Visual Feedback
        const originalIcon = copyNotepadBtn.innerHTML;
        copyNotepadBtn.classList.add('success');
        copyNotepadBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;

        setTimeout(() => {
          copyNotepadBtn.classList.remove('success');
          copyNotepadBtn.innerHTML = originalIcon;
        }, 3000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    });
  }

  // 6. Save Dimensions on Resize
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const width = notepadOverlay.offsetWidth;
      const height = notepadOverlay.offsetHeight;
      if (width > 0) localStorage.setItem('toeicNotepadWidth', width);
      if (height > 0) localStorage.setItem('toeicNotepadHeight', height);
    }
  });
  resizeObserver.observe(notepadOverlay);

  // 6. Multi-directional Invisible Edge Resize
  const edges = notepadOverlay.querySelectorAll('.notepad-edge');
  edges.forEach(edge => {
    let startX, startY, startWidth, startHeight, startTop, startLeft;
    const direction = edge.getAttribute('data-edge');

    const startResizing = (e) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX || (e.touches && e.touches[0].clientX);
      startY = e.clientY || (e.touches && e.touches[0].clientY);
      startWidth = notepadOverlay.offsetWidth;
      startHeight = notepadOverlay.offsetHeight;
      const rect = notepadOverlay.getBoundingClientRect();
      startTop = rect.top;
      startLeft = rect.left;

      const onMove = (moveEvent) => {
        const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
        const currentY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY);
        const dx = currentX - startX;
        const dy = currentY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newTop = startTop;
        let newLeft = startLeft;

        if (direction.includes('e')) newWidth = startWidth + dx;
        if (direction.includes('w')) {
          newWidth = startWidth - dx;
          newLeft = startLeft + dx;
        }
        if (direction.includes('s')) newHeight = startHeight + dy;
        if (direction.includes('n')) {
          newHeight = startHeight - dy;
          newTop = startTop + dy;
        }

        // Apply constraints
        if (newWidth > 200 && newWidth < 800) {
          notepadOverlay.style.width = newWidth + 'px';
          notepadOverlay.style.left = newLeft + 'px';
        }
        if (newHeight > 150 && newHeight < 800) {
          notepadOverlay.style.height = newHeight + 'px';
          notepadOverlay.style.top = newTop + 'px';
        }

        notepadOverlay.style.right = 'auto';
        notepadOverlay.style.bottom = 'auto';
      };

      const onEnd = () => {
        document.documentElement.removeEventListener('mousemove', onMove);
        document.documentElement.removeEventListener('mouseup', onEnd);
        document.documentElement.removeEventListener('touchmove', onMove);
        document.documentElement.removeEventListener('touchend', onEnd);
        document.body.style.cursor = '';
        notepadOverlay.style.transition = '';

        // Save final state
        localStorage.setItem('toeicNotepadWidth', notepadOverlay.offsetWidth);
        localStorage.setItem('toeicNotepadHeight', notepadOverlay.offsetHeight);
        localStorage.setItem('toeicNotepadLeft', notepadOverlay.style.left);
        localStorage.setItem('toeicNotepadTop', notepadOverlay.style.top);
      };

      document.documentElement.addEventListener('mousemove', onMove);
      document.documentElement.addEventListener('mouseup', onEnd);
      document.documentElement.addEventListener('touchmove', onMove, { passive: false });
      document.documentElement.addEventListener('touchend', onEnd);

      document.body.style.cursor = getComputedStyle(edge).cursor;
      notepadOverlay.style.transition = 'none';
    };

    edge.addEventListener('mousedown', startResizing);
    edge.addEventListener('touchstart', startResizing, { passive: true });
  });

  // 7. Dragging Logic (via Header)
  const header = notepadOverlay.querySelector('.notepad-header');
  if (header) {
    let dragStartX, dragStartY, initialTop, initialLeft;

    const startDragging = (e) => {
      if (e.target.closest('.notepad-clear-btn')) return;

      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      const rect = notepadOverlay.getBoundingClientRect();
      dragStartX = clientX;
      dragStartY = clientY;
      initialTop = rect.top;
      initialLeft = rect.left;

      document.documentElement.addEventListener('mousemove', draggingMove);
      document.documentElement.addEventListener('mouseup', draggingEnd);
      document.documentElement.addEventListener('touchmove', draggingMove, { passive: false });
      document.documentElement.addEventListener('touchend', draggingEnd);

      notepadOverlay.classList.add('dragging');
      header.style.cursor = 'grabbing';
    };

    const draggingMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      const dx = clientX - dragStartX;
      const dy = clientY - dragStartY;

      let newTop = initialTop + dy;
      let newLeft = initialLeft + dx;

      newTop = Math.max(0, Math.min(window.innerHeight - 50, newTop));
      newLeft = Math.max(-100, Math.min(window.innerWidth - 50, newLeft));

      notepadOverlay.style.top = newTop + 'px';
      notepadOverlay.style.left = newLeft + 'px';
      notepadOverlay.style.right = 'auto';
      notepadOverlay.style.bottom = 'auto';
    };

    const draggingEnd = () => {
      document.documentElement.removeEventListener('mousemove', draggingMove);
      document.documentElement.removeEventListener('mouseup', draggingEnd);
      document.documentElement.removeEventListener('touchmove', draggingMove);
      document.documentElement.removeEventListener('touchend', draggingEnd);

      notepadOverlay.classList.remove('dragging');
      header.style.cursor = 'grab';

      localStorage.setItem('toeicNotepadTop', notepadOverlay.style.top);
      localStorage.setItem('toeicNotepadLeft', notepadOverlay.style.left);
      localStorage.removeItem('toeicNotepadRight');
    };

    header.addEventListener('mousedown', startDragging);
    header.addEventListener('touchstart', startDragging, { passive: true });
  }
}

// Call init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initNotepad();
});

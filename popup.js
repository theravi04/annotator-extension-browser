// popup.js
(function(){
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const sessionEl = document.getElementById('sessionId');

  // Generate or reuse session id
  const sessionKey = 'pageAnnotator.sessionId';
  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = 'sess-' + Date.now() + '-' + Math.floor(Math.random()*10000);
    localStorage.setItem(sessionKey, sessionId);
  }
  sessionEl.value = sessionId;

  async function injectAnnotator() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return alert('No active tab found');

    // Inject contentScript and give it the session id
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['contentScript.js']
      });

      // set session id on page context
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (sid) => {
          window.__annotationSessionId = sid;
        },
        args: [sessionId]
      });

      startBtn.disabled = true;
      stopBtn.disabled = false;
      window.close(); // close popup after start (optional)
    } catch (err) {
      console.error(err);
      alert('Failed to inject annotator: ' + (err.message || err));
    }
  }

  async function removeAnnotator() {
    // Tell content script to remove overlay
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    try {
      chrome.tabs.sendMessage(tab.id, { type: 'removeAnnotator' }, (res) => {
        // ignore
      });
      startBtn.disabled = false;
      stopBtn.disabled = true;
    } catch (err) {
      console.warn('Could not send remove message (maybe not injected)');
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }

  startBtn.addEventListener('click', injectAnnotator);
  stopBtn.addEventListener('click', removeAnnotator);
})();

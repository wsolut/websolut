(function () {
  'use strict';

  const exportBtn = document.getElementById('exportBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const selectionName = document.getElementById('selectionName');
  const statusBox = document.getElementById('statusBox');
  const spinner = document.getElementById('spinner');
  const statusText = document.getElementById('statusText');

  let busy = false;

  exportBtn.addEventListener('click', () => {
    if (busy) return;
    setBusy(true);
    showStatus('Starting export…', false);
    parent.postMessage({ pluginMessage: { type: 'export' } }, '*');
  });

  cancelBtn.addEventListener('click', () => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  });

  window.onmessage = (event) => {
    const msg = event.data.pluginMessage;
    if (!msg) return;

    if (msg.type === 'selectionStatus') {
      if (msg.frameName) {
        selectionName.textContent = msg.frameName;
        selectionName.classList.remove('selection-empty');
        if (!busy) exportBtn.disabled = false;
      } else {
        selectionName.textContent = 'No frame selected';
        selectionName.classList.add('selection-empty');
        exportBtn.disabled = true;
      }
    } else if (msg.type === 'progress') {
      showStatus(msg.message, false);
    } else if (msg.type === 'error') {
      showStatus(msg.message, true);
      setBusy(false);
    } else if (msg.type === 'done') {
      showStatus('Export complete! Saving file…', false);
      downloadJson(msg.json, msg.fileName);
      setTimeout(() => {
        setBusy(false);
        hideStatus();
      }, 1500);
    }
  };

  function showStatus(message, isError) {
    statusBox.style.display = 'flex';
    statusText.textContent = message;
    statusText.className = 'status-text' + (isError ? ' error' : '');
    spinner.style.display = isError ? 'none' : 'block';
  }

  function hideStatus() {
    statusBox.style.display = 'none';
  }

  function setBusy(state) {
    busy = state;
    exportBtn.disabled = state;
    cancelBtn.disabled = state;
  }

  function downloadJson(json, fileName) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
})();

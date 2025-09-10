(() => {
  if (window.__pageAnnotatorInjected) return;
  window.__pageAnnotatorInjected = true;

  // create container overlay
  const container = document.createElement('div');
  container.id = 'pa-container';
  Object.assign(container.style, {
  position: 'absolute',   // <-- use absolute, not fixed
  left: '0',
  top: '0',
  width: document.documentElement.scrollWidth + 'px',
  height: document.documentElement.scrollHeight + 'px',
  zIndex: '2147483647',
  pointerEvents: 'none'
});
  document.documentElement.appendChild(container);

  // create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'pa-canvas';
  Object.assign(canvas.style, {
  position: 'absolute',   // not fixed
  left: '0',
  top: '0',
  width: document.documentElement.scrollWidth + 'px',
  height: document.documentElement.scrollHeight + 'px',
  pointerEvents: 'auto',
  background: 'transparent'
});

  container.appendChild(canvas);

  const dpr = window.devicePixelRatio || 1;
  canvas.width = document.documentElement.scrollWidth * dpr;
  canvas.height = document.documentElement.scrollHeight * dpr;
  canvas.style.width = document.documentElement.scrollWidth + 'px';
  canvas.style.height = document.documentElement.scrollHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,0,0,0.9)';

  // toolbar
  const toolbar = document.createElement('div');
  toolbar.id = 'pa-toolbar';
  Object.assign(toolbar.style, {
    position: 'fixed',
    right: '12px',
    top: '12px',
    zIndex: '2147483650',
    background: 'rgba(255,255,255,0.95)',
    padding: '8px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    pointerEvents: 'auto',
    fontFamily: 'Arial, sans-serif'
  });
  toolbar.innerHTML = `
    <div style="display:flex;gap:6px;flex-wrap:wrap;background:#fff;">
  <button id="pa-draw" style="color:#000;font-weight:600;background:#fff;border:1px solid #ccc;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">Draw</button>
  <button id="pa-comment" style="color:#000;font-weight:600;background:#fff;border:1px solid #ccc;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">Comment</button>
  <button id="pa-undo" style="color:#000;font-weight:600;background:#fff;border:1px solid #ccc;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">Undo</button>
  <button id="pa-clear" style="color:#000;font-weight:600;background:#fff;border:1px solid #ccc;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">Clear</button>
  <button id="pa-send" style="color:#000;font-weight:600;background:#fff;border:1px solid #ccc;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">Preview</button>
  <button id="pa-close" style="color:#000;font-weight:600;background:#fff;border:1px solid #ccc;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;">Close</button>
</div>
  `;
  container.appendChild(toolbar);

  let drawEnabled = false;

  const toggleBtn = document.createElement('botton');
  toggleBtn.textContent = 'Draw: OFF';
  Object.assign(toggleBtn.style, {
    padding: '6px 10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    marginRight: '8px'
  });
  toolbar.appendChild(toggleBtn)

  toggleBtn.addEventListener('click', ()=> {
    drawEnabled = !drawEnabled;
    if(drawEnabled){
      canvas.style.pointerEvents = 'auto';
      toggleBtn.textContent = 'Draw: ON';
      toggleBtn.style.color = '#000000ff'
      toggleBtn.style.background = '#c8f7c5'
    }
    else {
      canvas.style.pointerEvents = 'none';
      toggleBtn.textContent = 'Draw: OFF';
      toggleBtn.style.color = '#000000ff'
      toggleBtn.style.background = '#fff' 
    }
  })

  const btns = toolbar.querySelectorAll('button');
  btns.forEach(b => {
    Object.assign(b.style, {
      padding: '6px 8px',
      borderRadius: '6px',
      border: '1px solid #ccc',
      background: '#f7f7f7',
      cursor: 'pointer'
    });
  });

  let mode = 'draw';
  let drawing = false;
  let currentPath = [];
  const strokes = [];
  const comments = [];

  canvas.addEventListener('pointerdown', (e) => {
    if (mode !== 'draw') return;
    drawing = true;
    currentPath = [{ x: e.pageX, y: e.pageY }];
    ctx.beginPath();
    ctx.moveTo(e.pageX, e.pageY);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    currentPath.push({ x: e.pageX, y: e.pageY });
    ctx.lineTo(e.pageX, e.pageY);
    ctx.stroke();
  });
  canvas.addEventListener('pointerup', () => {
    if (!drawing) return;
    drawing = false;
    strokes.push({ path: currentPath.slice(), width: ctx.lineWidth, color: ctx.strokeStyle });
  });

  toolbar.querySelector('#pa-draw').addEventListener('click', () => {
    mode = 'draw';
    toolbar.querySelector('#pa-draw').style.outline = '2px solid #2196F3';
    toolbar.querySelector('#pa-comment').style.outline = 'none';
  });

  toolbar.querySelector('#pa-comment').addEventListener('click', () => {
    mode = 'comment';
    toolbar.querySelector('#pa-comment').style.outline = '2px solid #2196F3';
    toolbar.querySelector('#pa-draw').style.outline = 'none';
  });

  toolbar.querySelector('#pa-clear').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.length = 0;
    document.querySelectorAll('.pa-comment-box').forEach(n => n.remove());
    comments.length = 0;
  });

  toolbar.querySelector('#pa-undo').addEventListener('click', () => {
    strokes.pop();
    redrawAll();
  });

  toolbar.querySelector('#pa-close').addEventListener('click', () => {
    removeAnnotator();
  });

  canvas.addEventListener('click', (e) => {
    if (mode !== 'comment') return;
    const x = e.pageX, y = e.pageY;
    const id = 'c' + Date.now();
    const box = document.createElement('div');
    box.className = 'pa-comment-box';
    Object.assign(box.style, {
      position: 'absolute',
      left: (x + 8) + 'px',
      top: (y + 8) + 'px',
      zIndex: '2147483655',
      pointerEvents: 'auto',
      background: '#9f9f9fff',
      color:'#000',
      border: '1px solid #ffffffff',
      padding: '6px',
      borderRadius: '6px',
      width: '220px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
    });
    const ta = document.createElement('textarea');
    ta.rows = 3;
    ta.placeholder = 'Describe change...';
    Object.assign(ta.style, { width: '100%', boxSizing: 'border-box' });

    const save = document.createElement('button');
    save.textContent = 'Save';
    save.addEventListener('click', () => {
  const text = ta.value || '';
  comments.push({ id, x, y, text, ts: Date.now() });

  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,0,0,0.9)';
  ctx.fill();

  ctx.fillStyle = '#ff0000ff';
  ctx.font = '14px Arial';
  ctx.fillText(text, x + 12, y); // text slightly offset from dot

  box.remove();
});

    // save.addEventListener('click', () => {
    //   comments.push({ id, x, y, text: ta.value || '', ts: Date.now() });
    //   ctx.beginPath();
    //   ctx.arc(x, y, 6, 0, Math.PI * 2);
    //   ctx.fillStyle = 'rgba(255,0,0,0.9)';
    //   ctx.fill();
    //   box.remove();
    // });

    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => box.remove());

    box.appendChild(ta);
    const ctl = document.createElement('div');
    ctl.style.display = 'flex';
    ctl.style.justifyContent = 'flex-end';
    ctl.appendChild(save);
    ctl.appendChild(cancel);
    box.appendChild(ctl);
    container.appendChild(box);
  });

  function redrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of strokes) {
      ctx.beginPath();
      ctx.lineWidth = s.width;
      ctx.strokeStyle = s.color;
      const pts = s.path;
      if (pts && pts.length) {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
    }
    for (const c of comments) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,0,0,0.9)';
      ctx.fill();
    }
  }

  // frontend-only "send": just preview image in new tab
  toolbar.querySelector('#pa-send').addEventListener('click', async () => {
    const capture = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'capture' }, (response) => {
        resolve(response);
      });
    });
    if (!capture || capture.error) {
      alert('Capture failed: ' + (capture && capture.error));
      return;
    }
    const screenshotDataUrl = capture.image;
    const off = document.createElement('canvas');
const pageW = document.documentElement.scrollWidth;
const pageH = document.documentElement.scrollHeight;

// Match the canvas size to CSS pixels, not multiplied by DPR
off.width = pageW;
off.height = pageH;

const offCtx = off.getContext('2d');

// No need to scale again, Chrome capture already gives a DPR-adjusted bitmap
// offCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

const img = new Image();
img.onload = () => {
  off.width = img.width;
  off.height = img.height;
  offCtx.drawImage(img, 0, 0);

  const overlayDataUrl = canvas.toDataURL("image/png");
  const overlayImg = new Image();
  overlayImg.onload = () => {
    offCtx.drawImage(overlayImg, 0, 0); // perfectly overlaps viewport
    const annotated = off.toDataURL("image/png");
    const w = window.open();
    w.document.write(`<img src="${annotated}" style="max-width:100%">`);
  };
  overlayImg.src = overlayDataUrl;
};
img.src = screenshotDataUrl;



    // const off = document.createElement('canvas');
    // const pageW = document.documentElement.scrollWidth;
    // const pageH = document.documentElement.scrollHeight;
    // off.width = pageW * (window.devicePixelRatio || 1);
    // off.height = pageH * (window.devicePixelRatio || 1);
    // const offCtx = off.getContext('2d');
    // offCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    // const img = new Image();
    // img.onload = () => {
    //   offCtx.drawImage(img, 0, 0, pageW, pageH);
    //   const overlayDataUrl = canvas.toDataURL('image/png');
    //   const overlayImg = new Image();
    //   overlayImg.onload = () => {
    //     offCtx.drawImage(overlayImg, 0, 0, pageW, pageH);
    //     const annotated = off.toDataURL('image/png');
    //     // Open preview in a new tab
    //     const w = window.open();
    //     w.document.write(`<img src="${annotated}" style="max-width:100%">`);
    //   };
    //   overlayImg.src = overlayDataUrl;
    // };
    // img.src = screenshotDataUrl;
  });

  function removeAnnotator() {
    try {
      container.remove();
      document.querySelectorAll('.pa-comment-box').forEach(n => n.remove());
      window.__pageAnnotatorInjected = false;
    } catch (err) {
      console.warn('remove failed', err);
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'removeAnnotator') {
      removeAnnotator();
    }
  });

  window.addEventListener('resize', () => {
    canvas.style.width = document.documentElement.scrollWidth + 'px';
    canvas.style.height = document.documentElement.scrollHeight + 'px';
  });

  toolbar.querySelector('#pa-draw').style.outline = '2px solid #2196F3';
})();

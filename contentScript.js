(() => {
  if (window.__pageAnnotatorInjected) return;
  window.__pageAnnotatorInjected = true;

  // create container overlay
  const container = document.createElement("div");
  container.id = "pa-container";
  Object.assign(container.style, {
    position: "absolute", // <-- use absolute, not fixed
    left: "0",
    top: "0",
    width: document.documentElement.scrollWidth + "px",
    height: document.documentElement.scrollHeight + "px",
    zIndex: "2147483647",
    pointerEvents: "none",
  });
  document.documentElement.appendChild(container);

  // create canvas
  const canvas = document.createElement("canvas");
  canvas.id = "pa-canvas";
  Object.assign(canvas.style, {
    position: "absolute", // not fixed
    left: "0",
    top: "0",
    width: document.documentElement.scrollWidth + "px",
    height: document.documentElement.scrollHeight + "px",
    pointerEvents: "auto",
    background: "transparent",
  });

  container.appendChild(canvas);

  const dpr = window.devicePixelRatio || 1;
  canvas.width = document.documentElement.scrollWidth * dpr;
  canvas.height = document.documentElement.scrollHeight * dpr;
  canvas.style.width = document.documentElement.scrollWidth + "px";
  canvas.style.height = document.documentElement.scrollHeight + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,0,0,0.9)";

  // toolbar
  const toolbar = document.createElement("div");
  toolbar.id = "pa-toolbar";
  Object.assign(toolbar.style, {
    position: "fixed",
    right: "20px",
    top: "20px",
    zIndex: "2147483650",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
    backdropFilter: "blur(10px)",
    padding: "16px",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.8)",
    pointerEvents: "auto",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: "all 0.3s ease",
  });
  toolbar.innerHTML = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <button id="pa-draw" style="color:#334155;font-weight:600;background:linear-gradient(135deg, #f1f5f9, #e2e8f0);border:1px solid #cbd5e1;border-radius:10px;padding:10px 16px;cursor:pointer;font-size:13px;transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.05);">✏️ Draw</button>
      <button id="pa-comment" style="color:#334155;font-weight:600;background:linear-gradient(135deg, #f1f5f9, #e2e8f0);border:1px solid #cbd5e1;border-radius:10px;padding:10px 16px;cursor:pointer;font-size:13px;transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.05);">💬 Comment</button>
      <button id="pa-undo" style="color:#334155;font-weight:600;background:linear-gradient(135deg, #f1f5f9, #e2e8f0);border:1px solid #cbd5e1;border-radius:10px;padding:10px 16px;cursor:pointer;font-size:13px;transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.05);">↶ Undo</button>
      <button id="pa-clear" style="color:#334155;font-weight:600;background:linear-gradient(135deg, #f1f5f9, #e2e8f0);border:1px solid #cbd5e1;border-radius:10px;padding:10px 16px;cursor:pointer;font-size:13px;transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.05);">🗑️ Clear</button>
      <button id="pa-send" style="color:#334155;font-weight:600;background:linear-gradient(135deg, #dbeafe, #bfdbfe);border:1px solid #93c5fd;border-radius:10px;padding:10px 16px;cursor:pointer;font-size:13px;transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.05);">👁️ Preview</button>
      <button id="pa-close" style="color:#ef4444;font-weight:600;background:linear-gradient(135deg, #fef2f2, #fee2e2);border:1px solid #fca5a5;border-radius:10px;padding:10px 16px;cursor:pointer;font-size:13px;transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.05);">✕ Close</button>
    </div>
  `;
  container.appendChild(toolbar);

  let drawEnabled = false;

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "🎨 Draw: OFF";
  Object.assign(toggleBtn.style, {
    padding: "10px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #f9fafb, #f3f4f6)",
    cursor: "pointer",
    marginTop: "12px",
    width: "100%",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: "600",
    color: "#6b7280",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  });
  toolbar.appendChild(toggleBtn);

  toggleBtn.addEventListener("click", () => {
    drawEnabled = !drawEnabled;
    if (drawEnabled) {
      canvas.style.pointerEvents = "auto";
      toggleBtn.textContent = "🎨 Draw: ON";
      toggleBtn.style.color = "#059669";
      toggleBtn.style.background = "linear-gradient(135deg, #d1fae5, #a7f3d0)";
      toggleBtn.style.borderColor = "#6ee7b7";
      toggleBtn.style.transform = "translateY(-1px)";
      toggleBtn.style.boxShadow = "0 4px 12px rgba(34, 197, 94, 0.2)";
    } else {
      canvas.style.pointerEvents = "none";
      toggleBtn.textContent = "🎨 Draw: OFF";
      toggleBtn.style.color = "#6b7280";
      toggleBtn.style.background = "linear-gradient(135deg, #f9fafb, #f3f4f6)";
      toggleBtn.style.borderColor = "#e5e7eb";
      toggleBtn.style.transform = "translateY(0px)";
      toggleBtn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
    }
  });

  // Add hover effects for all buttons
  const addHoverEffect = (btn, activeColor = "#3b82f6") => {
    btn.addEventListener("mouseenter", () => {
      if (!btn.style.transform.includes("translateY(-1px)")) {
        btn.style.transform = "translateY(-2px)";
        btn.style.boxShadow = "0 6px 16px rgba(0,0,0,0.15)";
      }
    });
    btn.addEventListener("mouseleave", () => {
      if (!btn.id.includes("toggle") || !drawEnabled) {
        btn.style.transform = "translateY(0px)";
        btn.style.boxShadow = btn.style.boxShadow.includes("rgba(34, 197, 94")
          ? "0 4px 12px rgba(34, 197, 94, 0.2)"
          : "0 2px 4px rgba(0,0,0,0.05)";
      }
    });
  };

  const btns = toolbar.querySelectorAll("button");
  btns.forEach((b) => {
    addHoverEffect(b);
  });

  let mode = "draw";
  let drawing = false;
  let currentPath = [];
  const strokes = [];
  const comments = [];
  const history = [];

  canvas.addEventListener("pointerdown", (e) => {
    if (mode !== "draw") return;
    drawing = true;
    currentPath = [{ x: e.pageX, y: e.pageY }];
    ctx.beginPath();
    ctx.moveTo(e.pageX, e.pageY);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    currentPath.push({ x: e.pageX, y: e.pageY });
    ctx.lineTo(e.pageX, e.pageY);
    ctx.stroke();
  });
  canvas.addEventListener("pointerup", () => {
    if (!drawing) return;
    drawing = false;
    strokes.push({
      path: currentPath.slice(),
      width: ctx.lineWidth,
      color: ctx.strokeStyle,
    });
    history.push({type: "stroke"})
    currentPath = []
  });

  toolbar.querySelector("#pa-draw").addEventListener("click", () => {
    mode = "draw";
    const drawBtn = toolbar.querySelector("#pa-draw");
    const commentBtn = toolbar.querySelector("#pa-comment");
    drawBtn.style.background = "linear-gradient(135deg, #dbeafe, #bfdbfe)";
    drawBtn.style.borderColor = "#3b82f6";
    drawBtn.style.color = "#1e40af";
    drawBtn.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
    commentBtn.style.background = "linear-gradient(135deg, #f1f5f9, #e2e8f0)";
    commentBtn.style.borderColor = "#cbd5e1";
    commentBtn.style.color = "#334155";
    commentBtn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
  });

  toolbar.querySelector("#pa-comment").addEventListener("click", () => {
    mode = "comment";
    const drawBtn = toolbar.querySelector("#pa-draw");
    const commentBtn = toolbar.querySelector("#pa-comment");
    commentBtn.style.background = "linear-gradient(135deg, #dbeafe, #bfdbfe)";
    commentBtn.style.borderColor = "#3b82f6";
    commentBtn.style.color = "#1e40af";
    commentBtn.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
    drawBtn.style.background = "linear-gradient(135deg, #f1f5f9, #e2e8f0)";
    drawBtn.style.borderColor = "#cbd5e1";
    drawBtn.style.color = "#334155";
    drawBtn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
  });

  toolbar.querySelector("#pa-clear").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.length = 0;
    document.querySelectorAll(".pa-comment-box").forEach((n) => n.remove());
    comments.length = 0;
  });

  toolbar.querySelector('#pa-undo').addEventListener('click', () => {
  const last = history.pop();
  if (!last) return;

  if (last.type === 'stroke') {
    strokes.pop();
  } else if (last.type === 'comment') {
    comments.pop();
  }

  redrawAll();
});

  toolbar.querySelector("#pa-close").addEventListener("click", () => {
    removeAnnotator();
  });

  canvas.addEventListener("click", (e) => {
    if (mode !== "comment") return;
    const x = e.pageX,
      y = e.pageY;
    const id = "c" + Date.now();
    const box = document.createElement("div");
    box.className = "pa-comment-box";
    Object.assign(box.style, {
      position: "absolute",
      left: x + 8 + "px",
      top: y + 8 + "px",
      zIndex: "2147483655",
      pointerEvents: "auto",
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
      backdropFilter: "blur(10px)",
      color: "#1f2937",
      border: "1px solid rgba(229, 231, 235, 0.8)",
      padding: "16px",
      borderRadius: "12px",
      width: "280px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1)",
      fontFamily: "inherit",
      animation: "fadeInScale 0.2s ease-out",
    });

    // Add animation keyframes
    if (!document.querySelector("#pa-animations")) {
      const style = document.createElement("style");
      style.id = "pa-animations";
      style.textContent = `
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    const ta = document.createElement("textarea");
    ta.rows = 3;
    ta.placeholder = "Describe your annotation...";
    Object.assign(ta.style, {
      width: "100%",
      boxSizing: "border-box",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      padding: "12px",
      fontSize: "14px",
      fontFamily: "inherit",
      resize: "vertical",
      minHeight: "80px",
      background: "rgba(255,255,255,0.8)",
      transition: "all 0.2s ease",
    });

    ta.addEventListener("focus", () => {
      ta.style.borderColor = "#3b82f6";
      ta.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
    });
    ta.addEventListener("blur", () => {
      ta.style.borderColor = "#d1d5db";
      ta.style.boxShadow = "none";
    });

    const save = document.createElement("button");
    save.textContent = "💾 Save";
    Object.assign(save.style, {
      background: "linear-gradient(135deg, #10b981, #059669)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      marginRight: "8px",
      transition: "all 0.2s ease",
      fontFamily: "inherit",
    });
    save.addEventListener("mouseenter", () => {
      save.style.transform = "translateY(-1px)";
      save.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
    });
    save.addEventListener("mouseleave", () => {
      save.style.transform = "translateY(0)";
      save.style.boxShadow = "none";
    });
    save.addEventListener("click", () => {
      const text = ta.value || "";
      comments.push({ id, x, y, text, ts: Date.now() });

      history.push({ type: "comment" }); // 🆕 track comment
  redrawAll();

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,0,0,0.9)";
      ctx.fill();

      ctx.fillStyle = "#ff0000ff";
      ctx.font = "14px Arial";
      ctx.fillText(text, x + 12, y); // text slightly offset from dot

      box.remove();
    });

    const cancel = document.createElement("button");
    cancel.textContent = "✕ Cancel";
    Object.assign(cancel.style, {
      background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
      color: "#6b7280",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      padding: "10px 16px",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontFamily: "inherit",
    });
    cancel.addEventListener("mouseenter", () => {
      cancel.style.transform = "translateY(-1px)";
      cancel.style.background = "linear-gradient(135deg, #fee2e2, #fecaca)";
      cancel.style.color = "#dc2626";
      cancel.style.borderColor = "#f87171";
    });
    cancel.addEventListener("mouseleave", () => {
      cancel.style.transform = "translateY(0)";
      cancel.style.background = "linear-gradient(135deg, #f3f4f6, #e5e7eb)";
      cancel.style.color = "#6b7280";
      cancel.style.borderColor = "#d1d5db";
    });
    cancel.addEventListener("click", () => box.remove());

    box.appendChild(ta);
    const ctl = document.createElement("div");
    ctl.style.display = "flex";
    ctl.style.justifyContent = "flex-end";
    ctl.style.marginTop = "12px";
    ctl.appendChild(save);
    ctl.appendChild(cancel);
    box.appendChild(ctl);
    container.appendChild(box);
  });

  function redrawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // redraw strokes
  for (const s of strokes) {
    ctx.beginPath();
    ctx.moveTo(s.path[0].x, s.path[0].y);
    for (let i = 1; i < s.path.length; i++) {
      ctx.lineTo(s.path[i].x, s.path[i].y);
    }
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.stroke();
  }

  // redraw comments
  for (const c of comments) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,0,0,0.9)';
    ctx.fill();
    ctx.fillStyle = '#ff0000';
    ctx.font = '14px Arial';
    ctx.fillText(c.text, c.x + 12, c.y);
  }
}

  // frontend-only "send": just preview image in new tab
  toolbar.querySelector("#pa-send").addEventListener("click", async () => {
    const capture = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "capture" }, (response) => {
        resolve(response);
      });
    });
    if (!capture || capture.error) {
      alert("Capture failed: " + (capture && capture.error));
      return;
    }
    const screenshotDataUrl = capture.image;
    const off = document.createElement("canvas");
    const pageW = document.documentElement.scrollWidth;
    const pageH = document.documentElement.scrollHeight;

    // Match the canvas size to CSS pixels, not multiplied by DPR
    off.width = pageW;
    off.height = pageH;

    const offCtx = off.getContext("2d");

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
  });

  function removeAnnotator() {
    try {
      container.remove();
      document.querySelectorAll(".pa-comment-box").forEach((n) => n.remove());
      const styleEl = document.querySelector("#pa-animations");
      if (styleEl) styleEl.remove();
      window.__pageAnnotatorInjected = false;
    } catch (err) {
      console.warn("remove failed", err);
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "removeAnnotator") {
      removeAnnotator();
    }
  });

  window.addEventListener("resize", () => {
    canvas.style.width = document.documentElement.scrollWidth + "px";
    canvas.style.height = document.documentElement.scrollHeight + "px";
  });

  // Set initial active state for draw button
  const drawBtn = toolbar.querySelector("#pa-draw");
  drawBtn.style.background = "linear-gradient(135deg, #dbeafe, #bfdbfe)";
  drawBtn.style.borderColor = "#3b82f6";
  drawBtn.style.color = "#1e40af";
  drawBtn.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
})();

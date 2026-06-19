const ShareCard = (() => {

  const SIZE = 1080;

  // ── Colour helpers ───────────────────────────────────────
  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function darken(rgb, f) {
    return rgb.map(c => Math.round(c * f));
  }

  // Sample the average colour of a region of an image via a small scratch canvas
  function extractPalette(img) {
    const W = 80, H = 80;
    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = H;
    const tctx = tmp.getContext('2d', { willReadFrequently: true });
    tctx.drawImage(img, 0, 0, W, H);
    const d = tctx.getImageData(0, 0, W, H).data;

    function avg(x0, y0, x1, y1) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * W + x) * 4;
          r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
        }
      }
      return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
    }

    return {
      tl: avg(0,    0,    W / 2, H / 2),
      tr: avg(W/2,  0,    W,     H / 2),
      bl: avg(0,    H/2,  W / 2, H),
      br: avg(W/2,  H/2,  W,     H),
    };
  }

  function buildPalette(img, catColor) {
    if (img) {
      const { tl, tr, bl, br } = extractPalette(img);
      return {
        bg_tl: darken(tl, 0.17),
        bg_tr: darken(tr, 0.17),
        bg_bl: darken(bl, 0.17),
        bg_br: darken(br, 0.17),
        glow_a: tl,
        glow_b: br,
        accent:  tr,
      };
    }
    // Fall back to category colour + a complementary shift
    const base = hexToRgb(catColor);
    const comp = [base[2], base[0], base[1]];
    return {
      bg_tl: darken(base, 0.15),
      bg_tr: darken(comp, 0.15),
      bg_bl: darken(comp, 0.12),
      bg_br: darken(base, 0.12),
      glow_a: base,
      glow_b: comp,
      accent:  comp,
    };
  }

  // ── Canvas helpers ───────────────────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, startY, maxWidth, lineHeight) {
    const words = (text || '').split(' ');
    const lines = [];
    let line = '', y = startY;
    words.forEach(word => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push({ text: line, y });
        y += lineHeight;
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push({ text: line, y });
    return lines;
  }

  function rgb(arr, a) {
    return a != null
      ? `rgba(${arr[0]},${arr[1]},${arr[2]},${a})`
      : `rgb(${arr[0]},${arr[1]},${arr[2]})`;
  }

  function mixRgb(a, b) {
    return a.map((v, i) => Math.round((v + b[i]) / 2));
  }

  // ── Background: mesh gradient + glow orbs ────────────────
  function drawBackground(ctx, p) {
    // Vertical pass
    const gv = ctx.createLinearGradient(0, 0, 0, SIZE);
    gv.addColorStop(0, rgb(mixRgb(p.bg_tl, p.bg_tr)));
    gv.addColorStop(1, rgb(mixRgb(p.bg_bl, p.bg_br)));
    ctx.fillStyle = gv;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Horizontal pass (blended on top)
    const gh = ctx.createLinearGradient(0, 0, SIZE, 0);
    gh.addColorStop(0, rgb(mixRgb(p.bg_tl, p.bg_bl), 0.55));
    gh.addColorStop(1, rgb(mixRgb(p.bg_tr, p.bg_br), 0.55));
    ctx.fillStyle = gh;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Darken overlay so text is always legible
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Glow orb — top left, colour A
    const g1 = ctx.createRadialGradient(SIZE * 0.18, SIZE * 0.16, 0, SIZE * 0.18, SIZE * 0.16, SIZE * 0.58);
    g1.addColorStop(0, rgb(p.glow_a, 0.30));
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Glow orb — bottom right, colour B
    const g2 = ctx.createRadialGradient(SIZE * 0.84, SIZE * 0.80, 0, SIZE * 0.84, SIZE * 0.80, SIZE * 0.52);
    g2.addColorStop(0, rgb(p.glow_b, 0.24));
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Small accent orb — top right
    const g3 = ctx.createRadialGradient(SIZE * 0.9, SIZE * 0.05, 0, SIZE * 0.9, SIZE * 0.05, SIZE * 0.28);
    g3.addColorStop(0, rgb(p.accent, 0.18));
    g3.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  // ── 3-D floating photo card ──────────────────────────────
  const CARD_W = 960;
  const CARD_H = 510;
  const CARD_R = 28;
  const CARD_TOP = 52;
  const TILT = -3 * Math.PI / 180;

  function drawPhotoCard(ctx, img, cat, p) {
    const cx = SIZE / 2;
    const cy = CARD_TOP + CARD_H / 2;

    // --- Shadow layer 1: deep ambient ---
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(TILT);
    ctx.shadowColor = 'rgba(0,0,0,0.70)';
    ctx.shadowBlur   = 90;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 55;
    ctx.beginPath();
    roundRect(ctx, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    ctx.fill();
    ctx.restore();

    // --- Shadow layer 2: tight contact shadow ---
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(TILT);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur   = 30;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 22;
    ctx.beginPath();
    roundRect(ctx, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    ctx.fill();
    ctx.restore();

    // --- Photo / no-photo fill (clipped to card shape) ---
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(TILT);
    ctx.beginPath();
    roundRect(ctx, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
    ctx.clip();

    if (img) {
      const scale = Math.max(CARD_W / img.width, CARD_H / img.height);
      const dw = img.width  * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    } else {
      // Vivid gradient fill from palette when no photo
      const fill = ctx.createLinearGradient(-CARD_W / 2, -CARD_H / 2, CARD_W / 2, CARD_H / 2);
      fill.addColorStop(0, rgb(p.glow_a));
      fill.addColorStop(1, rgb(p.glow_b));
      ctx.fillStyle = fill;
      ctx.fillRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);

      // Large emoji centred in card
      ctx.font = `${CARD_H * 0.45}px serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 24;
      ctx.fillText(cat.emoji, 0, CARD_H * 0.14);
      ctx.shadowColor = 'transparent';
      ctx.textAlign = 'left';
    }

    // Bottom-fade so text below isn't competed with photo content
    const bfade = ctx.createLinearGradient(0, CARD_H / 2 - 140, 0, CARD_H / 2);
    bfade.addColorStop(0, 'rgba(0,0,0,0)');
    bfade.addColorStop(1, 'rgba(0,0,0,0.50)');
    ctx.fillStyle = bfade;
    ctx.fillRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);

    // Glossy glare strip (top-left → centre diagonal)
    const glare = ctx.createLinearGradient(-CARD_W / 2, -CARD_H / 2, CARD_W * 0.38, CARD_H * 0.38);
    glare.addColorStop(0,   'rgba(255,255,255,0.22)');
    glare.addColorStop(0.45,'rgba(255,255,255,0.06)');
    glare.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = glare;
    ctx.fillRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);

    ctx.restore();

    // --- Card border: gradient highlight (bright top-left edge) ---
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(TILT);
    ctx.beginPath();
    roundRect(ctx, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R);
    const border = ctx.createLinearGradient(-CARD_W / 2, -CARD_H / 2, CARD_W / 2, CARD_H / 2);
    border.addColorStop(0,   'rgba(255,255,255,0.55)');
    border.addColorStop(0.35,'rgba(255,255,255,0.15)');
    border.addColorStop(1,   'rgba(255,255,255,0.03)');
    ctx.strokeStyle = border;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  // ── Main generate ────────────────────────────────────────
  function generate(loc) {
    const canvas = document.createElement('canvas');
    canvas.width  = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const cat     = Utils.category(loc.category);
    const dateStr = Utils.formatDate(loc.date || loc.createdAt);

    function render(img) {
      const p = buildPalette(img, cat.color);

      // 1. Background
      drawBackground(ctx, p);

      // 2. Photo card
      drawPhotoCard(ctx, img, cat, p);

      // 3. Text section — starts below card
      let y = CARD_TOP + CARD_H + 50;

      // Place name (max 2 lines)
      ctx.font = 'bold 70px Inter, sans-serif';
      ctx.fillStyle = '#F0F2FA';
      const nameLines = wrapText(ctx, loc.name || '', y, SIZE - 120, 82).slice(0, 2);
      nameLines.forEach(l => ctx.fillText(l.text, 60, l.y));
      y = (nameLines[nameLines.length - 1]?.y ?? y) + 58;

      // Country · date
      const sub = [loc.country, dateStr].filter(Boolean).join('  ·  ');
      if (sub) {
        ctx.font = '34px Inter, sans-serif';
        ctx.fillStyle = 'rgba(240,242,250,0.55)';
        ctx.fillText(sub, 60, y);
        y += 50;
      }

      // Star rating
      if (loc.rating) {
        ctx.font = '44px serif';
        ctx.fillText('⭐'.repeat(loc.rating), 60, y);
        y += 54;
      }

      y += 16;

      // Divider — gradient tinted from photo palette
      const divGrad = ctx.createLinearGradient(60, y, SIZE - 60, y);
      divGrad.addColorStop(0,   rgb(p.glow_a, 0.75));
      divGrad.addColorStop(0.5, rgb(p.glow_b, 0.35));
      divGrad.addColorStop(1,   'rgba(255,255,255,0.04)');
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(SIZE - 60, y);
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      y += 32;

      // Branding row
      ctx.font = 'bold 32px Inter, sans-serif';
      ctx.fillStyle = '#A78BFA';
      ctx.textAlign = 'left';
      ctx.fillText('📍 Placebook', 60, y);
      ctx.font = '24px Inter, sans-serif';
      ctx.fillStyle = 'rgba(240,242,250,0.28)';
      ctx.textAlign = 'right';
      ctx.fillText('Your personal travel scrapbook', SIZE - 60, y);
      ctx.textAlign = 'left';

      showShareOverlay(canvas);
    }

    if (loc.photos && loc.photos[0]) {
      const img = new Image();
      img.onload  = () => render(img);
      img.onerror = () => render(null);
      img.src = loc.photos[0];
    } else {
      render(null);
    }
  }

  // ── Share overlay ────────────────────────────────────────
  function showShareOverlay(canvas) {
    document.querySelector('.share-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'share-overlay';
    const imgSrc = canvas.toDataURL('image/jpeg', 0.92);
    overlay.innerHTML = `
      <div class="share-backdrop"></div>
      <div class="share-modal">
        <img class="share-preview-img" src="${imgSrc}" alt="Share card">
        <div class="share-actions">
          <button class="btn-primary" id="share-download">⬇ Save Image</button>
          ${navigator.share ? `<button class="btn-secondary" id="share-native">↗ Share</button>` : ''}
          <button class="btn-secondary" id="share-close">✕</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.share-backdrop').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#share-close').addEventListener('click',   () => overlay.remove());

    overlay.querySelector('#share-download').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href     = imgSrc;
      a.download = 'placebook-share.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });

    const shareBtn = overlay.querySelector('#share-native');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        canvas.toBlob(blob => {
          if (!blob) return;
          const file = new File([blob], 'placebook-share.jpg', { type: 'image/jpeg' });
          navigator.share({ files: [file], title: 'Placebook' }).catch(() => {});
        }, 'image/jpeg', 0.92);
      });
    }
  }

  return { generate };
})();

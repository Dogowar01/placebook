const ShareCard = (() => {

  function generate(loc) {
    const SIZE = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    const cat = Utils.category(loc.category);
    const dateStr = Utils.formatDate(loc.date || loc.createdAt);

    function drawCard() {
      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, SIZE);
      bg.addColorStop(0, '#0D0F18');
      bg.addColorStop(1, '#13161F');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Radial purple glow
      const glow = ctx.createRadialGradient(SIZE/2, SIZE/2, 0, SIZE/2, SIZE/2, SIZE*0.6);
      glow.addColorStop(0, 'rgba(139,92,246,0.15)');
      glow.addColorStop(1, 'rgba(139,92,246,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // If photo: draw in top 52%
      const photoY = Math.round(SIZE * 0.52);

      // Category badge
      const badgePad = 22;
      const badgeY = photoY + 54;

      // Place name
      ctx.font = 'bold 72px Inter, sans-serif';
      ctx.fillStyle = '#F0F2FA';
      const nameLines = wrapText(ctx, loc.name || 'Place', 60, 0, SIZE - 120, 80);
      const nameY = badgeY + 60;

      // Country · date
      const subY = nameY + nameLines.length * 84 + 16;

      // Rating
      const ratingY = subY + 50;

      // Divider
      const dividerY = ratingY + (loc.rating ? 64 : 20);

      // Branding
      const brandY = SIZE - 60;

      // Now draw in order:

      // 1. Draw photo or emoji background
      if (loc.photos && loc.photos[0]) {
        const img = new Image();
        img.onload = () => {
          // Draw photo
          const ph = photoY + 20;
          const scale = Math.max(SIZE / img.width, ph / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          const dx = (SIZE - dw) / 2;
          const dy = 0;
          ctx.drawImage(img, dx, dy, dw, dh);

          // Fade-to-dark gradient over photo bottom
          const fade = ctx.createLinearGradient(0, photoY - 200, 0, photoY + 40);
          fade.addColorStop(0, 'rgba(13,15,24,0)');
          fade.addColorStop(1, 'rgba(13,15,24,1)');
          ctx.fillStyle = fade;
          ctx.fillRect(0, photoY - 200, SIZE, 240);

          finishCard();
        };
        img.onerror = finishCard;
        img.src = loc.photos[0];
      } else {
        // Draw large category emoji centered in photo area
        ctx.font = `${SIZE * 0.22}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(cat.emoji, SIZE/2, photoY * 0.55);
        finishCard();
      }

      function finishCard() {
        ctx.textAlign = 'left';

        // Category badge pill
        const badgeText = `${cat.emoji}  ${cat.label}`;
        ctx.font = 'bold 32px Inter, sans-serif';
        const bw = ctx.measureText(badgeText).width + 40;
        const bh = 54;
        const bx = 60;
        const by = badgeY - bh + 10;
        ctx.beginPath();
        roundRect(ctx, bx, by, bw, bh, 27);
        ctx.fillStyle = cat.color + 'CC';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(badgeText, bx + 20, by + 37);

        // Place name
        ctx.font = 'bold 72px Inter, sans-serif';
        ctx.fillStyle = '#F0F2FA';
        let ny = nameY;
        const wrappedName = wrapText(ctx, loc.name || '', 60, nameY, SIZE - 120, 80);
        wrappedName.forEach(line => {
          ctx.fillText(line.text, 60, line.y);
        });
        const lastNameLine = wrappedName[wrappedName.length - 1];
        const actualSubY = lastNameLine ? lastNameLine.y + 60 : nameY + 80;

        // Country · date
        ctx.font = '38px Inter, sans-serif';
        ctx.fillStyle = 'rgba(240,242,250,0.55)';
        const sub = [loc.country, dateStr].filter(Boolean).join('  ·  ');
        ctx.fillText(sub, 60, actualSubY);

        // Star rating
        let actualRatingY = actualSubY + 56;
        if (loc.rating) {
          ctx.font = '48px serif';
          ctx.fillText('⭐'.repeat(loc.rating), 60, actualRatingY);
          actualRatingY += 60;
        }

        // Purple divider
        ctx.strokeStyle = 'rgba(139,92,246,0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, actualRatingY + 20);
        ctx.lineTo(SIZE - 60, actualRatingY + 20);
        ctx.stroke();

        // Branding
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.fillStyle = '#A78BFA';
        ctx.fillText('📍 Placebook', 60, SIZE - 60);
        ctx.font = '28px Inter, sans-serif';
        ctx.fillStyle = 'rgba(240,242,250,0.35)';
        ctx.textAlign = 'right';
        ctx.fillText('Your personal travel scrapbook', SIZE - 60, SIZE - 60);
        ctx.textAlign = 'left';

        showShareOverlay(canvas);
      }
    }

    drawCard();
  }

  // ── Text wrap helper ─────────────────────────────────────
  function wrapText(ctx, text, x, startY, maxWidth, lineHeight) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    let y = startY;
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

  // ── Rounded rect helper ──────────────────────────────────
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
    overlay.querySelector('#share-close').addEventListener('click', () => overlay.remove());

    overlay.querySelector('#share-download').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = imgSrc;
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

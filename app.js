(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Animated background (hex/assembly flow) =====
  const canvas = document.getElementById('bg');
  const ctx = canvas?.getContext && canvas.getContext('2d');

  function resize() {
    if (!canvas || !ctx) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const LINES = [
    'mov rax, [rbx+0x08]',
    'cmp eax, 0x41414141',
    'xor ecx, ecx',
    'lea rdi, [rip+0x1337]',
    'callq 0x401000',
    'test byte ptr [rsi], 0x01',
    'add rsp, 0x20',
    'sub rdx, 0x10',
  ];

  const HEX_CHARS = '0123456789abcdef';

  const state = {
    t: 0,
    glyphs: [],
  };

  function randHex(len) {
    let out = '';
    for (let i = 0; i < len; i++) out += HEX_CHARS[(Math.random() * 16) | 0];
    return out;
  }

  function makeGlyph(w, h) {
    const col = Math.random() * w;
    const row = Math.random() * h;
    const density = 0.65 + Math.random() * 0.6;
    const speed = (12 + Math.random() * 22) * density;
    const size = 12 + Math.random() * 18;
    const isHex = Math.random() > 0.45;
    const variant = Math.random();

    const text = isHex ? randHex(12 + ((Math.random() * 10) | 0)) : LINES[(Math.random() * LINES.length) | 0];
    const hue = variant < 0.55 ? 196 : variant < 0.82 ? 274 : 343;

    return {
      x: col,
      y: row,
      speed,
      size,
      text,
      hue,
      alpha: 0.25 + Math.random() * 0.35,
      wobble: (Math.random() * 2 - 1) * 0.8,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function seed() {
    if (!canvas || !ctx || prefersReduced) return;
    state.glyphs = [];
    const w = window.innerWidth;
    const h = window.innerHeight;
    const count = Math.round((w * h) / 42000); // density scaling
    for (let i = 0; i < count; i++) state.glyphs.push(makeGlyph(w, h));
  }

  function draw() {
    if (!canvas || !ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    state.t += 1;

    // Clear with slight alpha for trailing effect
    ctx.fillStyle = 'rgba(3,4,14,0.18)';
    ctx.fillRect(0, 0, w, h);

    for (const g of state.glyphs) {
      // Motion
      g.y += g.speed * 0.018;
      g.x += Math.sin((state.t * 0.01) + g.phase) * g.wobble;

      if (g.y - 30 > h) {
        // Respawn
        const ng = makeGlyph(w, h);
        g.x = ng.x;
        g.y = -20 - Math.random() * 60;
        g.speed = ng.speed;
        g.size = ng.size;
        g.text = ng.text;
        g.hue = ng.hue;
        g.alpha = ng.alpha;
        g.wobble = ng.wobble;
        g.phase = ng.phase;
      }

      // Glow
      ctx.save();
      ctx.globalAlpha = g.alpha;
      ctx.font = `600 ${g.size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.fillStyle = `hsla(${g.hue}, 95%, 70%, 0.95)`;
      ctx.shadowColor = `hsla(${g.hue}, 95%, 60%, 0.55)`;
      ctx.shadowBlur = 18;
      ctx.fillText(g.text, g.x, g.y);
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  // ===== Skills terminal previews =====
  function initSkills() {
    const cards = document.querySelectorAll('.skillCard');
    cards.forEach((card) => {
      const open = () => {
        card.dataset.open = 'true';
      };
      const close = () => {
        card.dataset.open = 'false';
      };

      card.addEventListener('mouseenter', open);
      card.addEventListener('mouseleave', close);
      card.addEventListener('focus', open);
      card.addEventListener('blur', close);

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const isOpen = card.dataset.open === 'true';
          card.dataset.open = isOpen ? 'false' : 'true';
        }
      });

      // Default closed
      card.dataset.open = 'false';
    });
  }

  // ===== Project notes toggle =====
  function initProjects() {
    const btns = document.querySelectorAll('[data-toggle]');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle');
        const note = document.querySelector(`[data-note-${id.split('-')[1]}]`);
        // note selector depends on our markup: data-note-1, data-note-2, etc.
        // We'll map robustly:
        let idx = id.split('-')[1];
        const target = document.querySelector(`[data-note-${idx}]`);
        if (!target) return;
        const hidden = target.hasAttribute('hidden');
        if (hidden) target.removeAttribute('hidden');
        else target.setAttribute('hidden', '');
      });
    });
  }

  // ===== Contact form (mailto simulation) =====
  function initContact() {
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    const copyBtn = document.getElementById('copyMail');
    const mailtoLink = document.getElementById('mailtoLink');

    const to = 'mystique@example.com';

    function buildMailto(email, message) {
      const subject = encodeURIComponent('Portfolio signal — Mystique');
      const body = encodeURIComponent(`From: ${email}\n\n${message}\n`);
      return `mailto:${to}?subject=${subject}&body=${body}`;
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        const href = buildMailto(email, message);

        // If user agent supports it, navigate to mailto
        window.location.href = href;
        if (status) status.textContent = 'Transmitting via mailto://';
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value.trim() || 'you@domain.com';
        const message = document.getElementById('message').value.trim() || 'state your intent; keep it precise…';
        const href = buildMailto(email, message);
        try {
          await navigator.clipboard.writeText(href);
          if (status) status.textContent = 'Copied mailto link to clipboard.';
        } catch {
          // Fallback: prompt
          if (status) status.textContent = 'Clipboard blocked. Copy manually from the address bar after opening mailto.';
        }
      });
    }

    if (mailtoLink && !mailtoLink.getAttribute('href')) {
      mailtoLink.setAttribute('href', `mailto:${to}`);
    }
  }

  // ===== Header year =====
  function initYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  // ===== Tiny tilt effect (no heavy dependencies) =====
  function initTilt() {
    const cards = document.querySelectorAll('[data-tilt]');
    if (!cards.length) return;

    if (prefersReduced) {
      cards.forEach((c) => (c.style.transform = 'none'));
      return;
    }

    const onMove = (e) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * -8;
      const ry = (px - 0.5) * 10;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    };

    const onLeave = (e) => {
      const card = e.currentTarget;
      card.style.transform = '';
    };

    cards.forEach((card) => {
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }

  // ===== Init =====
  function init() {
    initYear();
    initSkills();
    initProjects();
    initContact();
    initTilt();

    resize();
    seed();

    window.addEventListener('resize', () => {
      resize();
      seed();
    });

    if (!prefersReduced && canvas && ctx) {
      // Prime background
      ctx.fillStyle = 'rgba(3,4,14,0.9)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      requestAnimationFrame(draw);
    }
  }

  init();
})();


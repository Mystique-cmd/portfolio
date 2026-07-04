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
      alpha: 0.12 + Math.random() * 0.20,
      wobble: (Math.random() * 2 - 1) * 0.75,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function seed() {
    if (!canvas || !ctx || prefersReduced) return;
    state.glyphs = [];
    const w = window.innerWidth;
    const h = window.innerHeight;
    const count = Math.round((w * h) / 65000); // density scaling (reduced for less visual noise)
    for (let i = 0; i < count; i++) state.glyphs.push(makeGlyph(w, h));
  }

  function draw() {
    if (!canvas || !ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    state.t += 1;

    // Clear with heavier alpha so the trail doesn't overpower content
    ctx.fillStyle = 'rgba(3,4,14,0.32)';
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
      ctx.shadowColor = `hsla(${g.hue}, 95%, 60%, 0.28)`;

      ctx.shadowBlur = 12;
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

  // ===== Project notes toggle (delegated, works with dynamic cards) =====
  function initProjects() {
    document.addEventListener('click', (e) => {
      const btn = e.target?.closest?.('[data-toggle]');
      if (!btn) return;
      const id = btn.getAttribute('data-toggle');
      if (!id) return;
      const idx = id.split('-')[1];
      const target = document.querySelector(`[data-note-${idx}]`);
      if (!target) return;
      const hidden = target.hasAttribute('hidden');
      if (hidden) target.removeAttribute('hidden');
      else target.setAttribute('hidden', '');
    });
  }

  // ===== Intent/sub-category layered navigation =====
  const PROJECT_CATALOG = [
    {
      id: 'snapshot-01',

      intent: 'Academic',
      subCategory: 'Algorithms',
      title: 'Kernel boundary desync (write-what-where)',
      severity: { kind: 'critical', className: '' },
      snapshotRows: [
        ['Context', 'State transitions across a privileged interface'],
        ['Attack surface', 'user-controlled buffers + insufficient validation'],
        ['Method', 'trace → reconstruct control-flow → craft primitives'],
        ['Payload', 'iterative overwrite with guard condition mapping'],
        ['Findings', 'primitive reliability depends on layout determinism'],
        ['Mitigation', 'strict size/offset checks + hardened parsing'],
      ],
      notes: 'notes: validate assumptions at each boundary; keep an evidence ledger.',
      outcomeTags: ['Research Prototype'],
    },
    {
      id: 'snapshot-02',
      intent: 'Professional',
      subCategory: 'Vulnerability Research',
      title: 'Heap shape manipulation (use-after-free)',
      severity: { kind: 'high', className: 'project__severity--alt' },
      snapshotRows: [
        ['Context', 'Lifetime mismatch inside a request handling path'],
        ['Attack surface', 'concurrent triggers + predictable allocator behavior'],
        ['Method', 'instrument → observe allocator states → synchronize triggers'],
        ['Payload', 'object reclaim with controlled metadata overwrite'],
        ['Findings', 'exploitability depends on precise timing windows'],
        ['Mitigation', 'ownership enforcement + safe reference patterns'],
      ],
      notes: 'notes: model allocator behavior; treat timing as an engineering constraint.',
      outcomeTags: ['Production-ready'],
    },
    {
      id: 'snapshot-03',
      intent: 'Teaching & Narrative',
      subCategory: 'Write-ups',
      title: 'Firmware parser confusion (logic flaw chain)',
      severity: { kind: 'medium', className: 'project__severity--red' },
      snapshotRows: [
        ['Context', 'Chained parsing across layers of validation'],
        ['Attack surface', 'crafted inputs reaching inconsistent state machines'],
        ['Method', 'reverse state transitions → constrain grammar → prove reachability'],
        ['Payload', 'grammar-compliant confusion driving unsafe branch selection'],
        ['Findings', 'defense-in-depth fails when assumptions diverge'],
        ['Mitigation', 'unify validation logic + strengthen state invariants'],
      ],
      notes: 'notes: align invariants across layers; if states disagree, the system is at risk.',
      outcomeTags: ['Learning Exercise'],
    },
  ];

  const INTENTS = [
    'Academic',
    'Professional',
    'Personal',
    'Experimental',
    'Teaching & Narrative',
  ];

  const SUB_CATEGORIES_BY_INTENT = {
    Academic: ['Algorithms', 'Distributed Systems', 'Database Design', 'Formal Language Theory'],
    Professional: ['Vulnerability Research', 'Exploit Development', 'Recon Tooling', 'Security Automation'],
    Personal: ['Portfolio & Branding', 'Finance/Trading Systems', 'Utility Scripts'],
    Experimental: ['Reverse Engineering Experiments', 'Grammar/Parser Prototypes', 'System Internals Exploration'],
    'Teaching & Narrative': ['Write-ups', 'Demo Exploits', 'Educational Scripts'],
  };

  function outcomeTagClass(tag) {
    const t = String(tag).toLowerCase();
    if (t.includes('prototype') || t.includes('research')) return 'outcomeTag--proto';
    if (t.includes('production')) return 'outcomeTag--prod';
    if (t.includes('learn') || t.includes('exercise')) return 'outcomeTag--learn';
    return '';
  }

  // ===== Gallery (deployed + GitHub) view =====
  const PROJECT_GALLERY_CATALOG = [
    {
      id: 'gallery-01',
      intent: 'Academic',
      subCategory: 'Algorithms',
      title: 'Low-level Systems Profiler',
      description:
        'A local-first profiler that traces hot paths and dataflow boundaries with minimal overhead.',
      deployedUrl: 'https://example.com/deployed/systems-profiler',
      githubUrl: 'https://github.com/mystique/systems-profiler',
      techTags: ['Tracing', 'Dataflow', 'Performance'],
    },
    {
      id: 'gallery-02',
      intent: 'Professional',
      subCategory: 'Vulnerability Research',
      title: 'Exploit Evidence Ledger',
      description:
        'Workflow for keeping a reproducible evidence chain: inputs → states → observed behavior → mitigations.',
      deployedUrl: 'https://example.com/deployed/evidence-ledger',
      githubUrl: 'https://github.com/mystique/evidence-ledger',
      techTags: ['RE', 'Reproducibility', 'Reporting'],
    },
    {
      id: 'gallery-03',
      intent: 'Teaching & Narrative',
      subCategory: 'Write-ups',
      title: 'Firmware Parser Playground',
      description:
        'Interactive write-up companion that visualizes state machines and invariant checks for parser logic flaws.',
      deployedUrl: 'https://example.com/deployed/parser-playground',
      githubUrl: 'https://github.com/mystique/parser-playground',
      techTags: ['State Machines', 'Invariants', 'Visualization'],
    },
    {
      id: 'gallery-04',
      intent: 'Experimental',
      subCategory: 'Grammar/Parser Prototypes',
      title: 'Grammar Fuzzer Harness',
      description:
        'Small harness that mutates grammars and reports divergence between expected and observed parse states.',
      deployedUrl: 'https://example.com/deployed/grammar-fuzzer',
      githubUrl: 'https://github.com/mystique/grammar-fuzzer',
      techTags: ['Fuzzing', 'Parsing', 'Differential'],
    },
    {
      id: 'gallery-05',
      intent: 'Personal',
      subCategory: 'Utility Scripts',
      title: 'Recon Batch Toolkit',
      description:
        'Opinionated shell toolkit for structuring reconnaissance runs and output archives.',
      deployedUrl: 'https://example.com/deployed/recon-toolkit',
      githubUrl: 'https://github.com/mystique/recon-toolkit',
      techTags: ['Automation', 'CLI', 'Archiving'],
    },
  ];

  function setView({ view, transition }) {
    const projectsSection = document.getElementById('projects');
    const gallerySection = document.getElementById('projectsGallery');

    if (!projectsSection || !gallerySection) return;

    const goingOut = transition === 'out' && view === 'gallery';
    const goingIn = transition === 'in' && view === 'gallery';

    if (goingOut) {
      projectsSection.classList.add('pageView');
      projectsSection.dataset.transition = 'out';
    }

    if (view === 'gallery') {
      // Hide projects, show gallery
      gallerySection.hidden = false;
      requestAnimationFrame(() => {
        gallerySection.classList.add('pageView--active');
        gallerySection.classList.remove('pageView--inactive');
        gallerySection.dataset.transition = 'in';
        projectsSection.hidden = true;
      });
    } else {
      // Show projects, hide gallery
      gallerySection.dataset.transition = 'out';
      gallerySection.classList.remove('pageView--active');
      gallerySection.hidden = true;
      projectsSection.hidden = false;
    }
  }

  function openGallery({ intent, subCategory }) {
    const projectsSection = document.getElementById('projects');
    const gallerySection = document.getElementById('projectsGallery');
    const grid = document.getElementById('galleryGrid');
    const filter = document.getElementById('galleryFilter');
    const desc = document.getElementById('gallery-desc');

    if (!projectsSection || !gallerySection || !grid || !filter) return;

    // Update header
    const hasSub = Boolean(subCategory);
    filter.textContent = hasSub ? `${intent} / ${subCategory}` : `${intent}`;
    if (desc) {
      desc.textContent = hasSub
        ? 'Deployed links and GitHub captures for the selected intent + sub-category.'
        : 'Deployed links and GitHub captures for the selected intent.';
    }

    // Render cards
    grid.innerHTML = '';
    const items = PROJECT_GALLERY_CATALOG.filter((p) => p.intent === intent && (!subCategory || p.subCategory === subCategory));

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.innerHTML = `
        <h3 class="card__title mono" style="margin-bottom:6px">no captures</h3>
        <p class="card__body">No deployed/GitHub projects mapped into this sub-category yet.</p>
      `;
      grid.appendChild(empty);
    } else {
      items.forEach((p) => {
        const el = document.createElement('article');
        el.className = 'projectLinkCard';
        el.setAttribute('data-gallery-item', '');

        const tagsHtml = (p.techTags || [])
          .map((t) => `<span class="outcomeTag ${outcomeTagClass(t)}">${escapeHtml(t)}</span>`)
          .join('');

        el.innerHTML = `
          <h3 class="projectLinkCard__title">${escapeHtml(p.title)}</h3>
          <p class="projectLinkCard__desc">${escapeHtml(p.description)}</p>

          <div class="projectMetaRow" aria-label="Gallery metadata">
            <span class="metaBadge metaBadge--intent">${escapeHtml(p.intent)}</span>
            <span class="metaBadge metaBadge--sub">${escapeHtml(p.subCategory)}</span>
          </div>

          <div class="outcomeTags" aria-label="Tech tags">${tagsHtml}</div>

          <div class="projectLinkRow">
            <a class="projectLink" href="${escapeHtml(p.deployedUrl)}" target="_blank" rel="noreferrer">
              <span class="projectLink__icon">↗</span>
              Deployed
            </a>
            <a class="projectLink" href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noreferrer">
              <span class="projectLink__icon">⌁</span>
              GitHub
            </a>
          </div>
        `;

        grid.appendChild(el);
      });
    }

    // View switch
    projectsSection.hidden = true;
    gallerySection.hidden = false;
    // Ensure animation triggers
    gallerySection.classList.remove('pageView--active');
    gallerySection.dataset.transition = 'in';
    requestAnimationFrame(() => {
      gallerySection.classList.add('pageView--active');
    });

    // Scroll to top of gallery
    gallerySection.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  }

  function initGallery() {
    const backBtn = document.getElementById('galleryBack');
    if (!backBtn) return;

    backBtn.addEventListener('click', () => {
      const projectsSection = document.getElementById('projects');
      const gallerySection = document.getElementById('projectsGallery');
      if (!projectsSection || !gallerySection) return;

      gallerySection.classList.remove('pageView--active');
      gallerySection.dataset.transition = 'out';
      gallerySection.hidden = true;
      projectsSection.hidden = false;
      projectsSection.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    });
  }

  // ===== Intent/sub-category layered navigation =====
  function renderSubCategories(intent) {
    const el = document.getElementById('subCategoryList');
    if (!el) return;

    el.innerHTML = '';
    const subs = SUB_CATEGORIES_BY_INTENT[intent] || [];

    // Prefer a sub-category that actually has a project; fall back to first.
    const projectsForIntent = PROJECT_CATALOG.filter((p) => p.intent === intent);
    const subWithProject = subs.find((s) => projectsForIntent.some((p) => p.subCategory === s));
    const defaultSub = subWithProject || subs[0] || null;

    subs.forEach((sub) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'subCatBtn';
      btn.setAttribute('role', 'listitem');
      btn.textContent = ''; // we'll add children below

      const left = document.createElement('div');
      left.className = 'subCatBtn__name';
      left.textContent = sub;

      const count = document.createElement('div');
      count.className = 'subCatBtn__count mono';
      count.textContent = String(projectsForIntent.filter((p) => p.subCategory === sub).length);

      const row = document.createElement('span');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.width = '100%';
      row.style.gap = '12px';
      row.appendChild(left);
      row.appendChild(count);

      btn.appendChild(row);

      const current = sub === defaultSub;
      btn.setAttribute('aria-current', current ? 'true' : 'false');
      btn.dataset.sub = sub;

      btn.addEventListener('click', () => {
        // update pressed state
        el.querySelectorAll('[aria-current="true"]').forEach((b) => b.setAttribute('aria-current', 'false'));
        btn.setAttribute('aria-current', 'true');
        renderProjects({ intent, subCategory: sub });

        // open gallery (page-like view)
        openGallery({ intent, subCategory: sub });
      });

      el.appendChild(btn);
    });

    if (defaultSub) {
      renderProjects({ intent, subCategory: defaultSub });
    } else {
      renderProjects({ intent, subCategory: '' });
    }
  }

  function renderProjects({ intent, subCategory }) {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const projects = PROJECT_CATALOG.filter((p) => p.intent === intent && (!subCategory || p.subCategory === subCategory));

    if (!projects.length) {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.innerHTML = `<h3 class="card__title mono" style="margin-bottom:6px">no projects</h3><p class="card__body">No snapshots mapped into this sub-category yet.</p>`;
      grid.appendChild(empty);
      return;
    }

    projects.forEach((p, i) => {
      const idx = String(i + 1);
      const article = document.createElement('article');
      article.className = 'project';
      article.setAttribute('data-project', '');

      const severityClass = p.severity?.className || '';

      const outcomeTagsHtml = (p.outcomeTags || [])
        .map((t) => `<span class="outcomeTag ${outcomeTagClass(t)}">${escapeHtml(t)}</span>`)
        .join('');

      article.innerHTML = `
        <div class="project__top">
          <div>
            <div class="project__eyebrow mono">${escapeHtml(p.id)}</div>
            <h3 class="project__title">${escapeHtml(p.title)}</h3>
          </div>
          <div class="project__severity ${severityClass}">impact: ${escapeHtml(p.severity?.kind || '')}</div>
        </div>

        <div class="projectMetaRow" aria-label="Project classification">
          <span class="metaBadge metaBadge--intent">${escapeHtml(p.intent)}</span>
          <span class="metaBadge metaBadge--sub">${escapeHtml(p.subCategory)}</span>
        </div>

        <div class="outcomeTags" aria-label="Outcome tags">${outcomeTagsHtml}</div>

        <div class="snapshot">
          ${p.snapshotRows
            .map(
              (row) => `
              <div class="snapRow">
                <div class="snapKey mono">${escapeHtml(row[0])}</div>
                <div class="snapVal">${escapeHtml(row[1])}</div>
              </div>
            `
            )
            .join('')}
        </div>

        <div class="project__actions">
          <button class="btn btn--ghost" type="button" data-toggle="details-${idx}">Toggle technical notes</button>
          <span class="muted mono" data-note-${idx} hidden>
            ${escapeHtml(p.notes)}
          </span>
        </div>
      `;

      grid.appendChild(article);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#039;');
  }





  function initProjectsNav() {
    const intentButtons = document.querySelectorAll('.navNode[data-intent]');
    const mapButtons = document.querySelectorAll('.mapNode[data-map]');

    if (!intentButtons.length) return;


    function setIntent(intent) {
      // intent selector state
      intentButtons.forEach((b) => {
        const active = b.dataset.intent === intent;
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      // systems map state
      mapButtons.forEach((b) => {
        const active = b.dataset.map === intent;
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      renderSubCategories(intent);
    }

    intentButtons.forEach((btn) => {
      btn.addEventListener('click', () => setIntent(btn.dataset.intent));
    });

    mapButtons.forEach((btn) => {
      btn.addEventListener('click', () => setIntent(btn.dataset.map));
    });

    // Initial render defaults to Academic.
    setIntent('Academic');
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
    initGallery();
    initProjectsNav();
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


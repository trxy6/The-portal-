import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    /* ============ Live clock & date ============ */
    let clockInterval: any = null;
    const timeEl = document.getElementById('headerTime');
    const dateEl = document.getElementById('headerDate');
    function updateClock() {
      const now = new Date();
      let h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const rawH = h;
      h = h % 12;
      if (h === 0) h = 12;

      if (timeEl) {
        timeEl.innerHTML = `${h}:${m} <span class="text-[11px] font-medium text-[#b4aae2] font-sans ml-0.5">${ampm}</span>`;
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }).toUpperCase();
      }

      // Live-rotate dial needles for cosmology world clock card
      const hourHand = document.getElementById('worldClockHour');
      const minHand = document.getElementById('worldClockMin');
      const secHand = document.getElementById('worldClockSec');
      if (hourHand) {
        const degH = ((rawH % 12) * 30) + (now.getMinutes() * 0.5);
        hourHand.style.transform = `rotate(${degH}deg)`;
      }
      if (minHand) {
        const degM = now.getMinutes() * 6;
        minHand.style.transform = `rotate(${degM}deg)`;
      }
      if (secHand) {
        const degS = now.getSeconds() * 6;
        secHand.style.transform = `rotate(${degS}deg)`;
      }
    }
    updateClock();
    clockInterval = setInterval(updateClock, 1000);

    /* ============ Floating nav RGB border animation ============ */
    const nav = document.querySelector('nav');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let navSpinFrame: number | null = null;
    if (reduceMotion) {
      if (nav) nav.style.setProperty('--rgb-angle', '0deg');
    } else {
      let angle = 0;
      function spin() {
        angle = (angle + 0.6) % 360;
        if (nav) nav.style.setProperty('--rgb-angle', angle + 'deg');
        navSpinFrame = requestAnimationFrame(spin);
      }
      navSpinFrame = requestAnimationFrame(spin);
    }

    /* ============ Ambient starfield + glitter ============ */
    const canvas = document.getElementById('starfield') as HTMLCanvasElement | null;
    let canvasAnimFrame: number | null = null;
    let starfieldResizeHandler: (() => void) | null = null;
    let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;

    if (canvas) {
      const ctx = canvas.getContext('2d');
      const sparkleColors = [
        '237,231,246',
        '212,79,230',
        '79,127,230',
        '242,165,216',
        '63,217,199',
      ];
      let stars: any[] = [];
      let flares: any[] = [];
      let meteors: any[] = [];
      let constellationPoints: any[] = [];
      let constellationEdges: any[] = [];

      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        targetX = (e.clientX / window.innerWidth) - 0.5;
        targetY = (e.clientY / window.innerHeight) - 0.5;
      };

      window.addEventListener('mousemove', handleMouseMove);
      mouseMoveHandler = handleMouseMove;

      function spawnMeteor() {
        if (reduceMotion || !canvas) return;
        const startLeft = Math.random() > 0.5;
        meteors.push({
          x: startLeft ? Math.random() * canvas.width * 0.4 : 0,
          y: startLeft ? 0 : Math.random() * canvas.height * 0.4,
          vx: Math.random() * 5 + 4,
          vy: Math.random() * 3.5 + 2.5,
          len: Math.random() * 90 + 50,
          life: 1.0,
          decay: Math.random() * 0.015 + 0.01,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        });
      }

      let lastMeteorTime = 0;

      function buildConstellation() {
        if (!canvas) return;
        const count = Math.max(7, Math.min(14, Math.floor(canvas.width / 60)));
        constellationPoints = Array.from({ length: count }, () => ({
          x: Math.random() * canvas.width,
          y: canvas.height * 0.32 + Math.random() * canvas.height * 0.62,
          phase: Math.random() * Math.PI * 2,
        }));
        constellationEdges = [];
        constellationPoints.forEach((p, i) => {
          const dists = constellationPoints
            .map((q, j) => ({
              j,
              d: i === j ? Infinity : Math.hypot(p.x - q.x, p.y - q.y),
            }))
            .sort((a, b) => a.d - b.d);
          const linkCount = 1 + Math.floor(Math.random() * 2);
          for (let k = 0; k < linkCount; k++) {
            const target = dists[k];
            if (target && target.d < canvas.width * 0.42) {
              const key = [i, target.j].sort().join('-');
              if (!constellationEdges.find((e) => e.key === key)) {
                constellationEdges.push({ key, a: i, b: target.j });
              }
            }
          }
        });
      }

      function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const count = Math.min(
          110,
          Math.floor((canvas.width * canvas.height) / 10000)
        );
        stars = Array.from({ length: count }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.3,
          baseAlpha: Math.random() * 0.5 + 0.15,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.15 + 0.03,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        }));
        buildConstellation();
      }

      function spawnFlare() {
        if (reduceMotion || !canvas) return;
        flares.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 1.2,
          life: 0,
          maxLife: 1200 + Math.random() * 800,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        });
      }

      let lastFlareSpawn = 0;

      function draw(t: number) {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Smoothly interpolate mouse parallax offset
        mouseX += (targetX - mouseX) * 0.06;
        mouseY += (targetY - mouseY) * 0.06;

        const bx = mouseX * 22;
        const by = mouseY * 22;
        const cx = mouseX * 45;
        const cy = mouseY * 45;
        const fx = mouseX * 70;
        const fy = mouseY * 70;

        // Draw majestic premium swirling cosmic portal background
        if (!reduceMotion) {
          const centerX = canvas.width / 2 + mouseX * 35;
          const centerY = canvas.height * 0.45 + mouseY * 35; // centered relative to primary bento/viewport
          const maxDim = Math.max(canvas.width, canvas.height);
          
          ctx.save();
          
          // Outer stellar nebula core glow
          const portalCoreRad = Math.min(canvas.width, canvas.height) * 0.16;
          const centralGlow = ctx.createRadialGradient(
            centerX, centerY, 10,
            centerX, centerY, portalCoreRad * 2.8
          );
          centralGlow.addColorStop(0, 'rgba(12, 5, 28, 0.98)');
          centralGlow.addColorStop(0.2, 'rgba(40, 16, 75, 0.72)');
          centralGlow.addColorStop(0.5, 'rgba(212, 79, 230, 0.16)');
          centralGlow.addColorStop(0.8, 'rgba(79, 127, 230, 0.06)');
          centralGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = centralGlow;
          ctx.beginPath();
          ctx.arc(centerX, centerY, portalCoreRad * 2.8, 0, Math.PI * 2);
          ctx.fill();

          // Swirling cosmic logarithmic spiral arms
          const armCount = 3;
          for (let s = 0; s < armCount; s++) {
            ctx.beginPath();
            const startAngle = (t * 0.00018) + (s * (Math.PI * 2) / armCount);
            const pointsList: {x: number; y: number; alpha: number}[] = [];
            
            for (let r = portalCoreRad * 0.8; r < maxDim * 0.75; r += 7) {
              const theta = startAngle + 1.9 * Math.log(r / (portalCoreRad * 0.8));
              const px = centerX + r * Math.cos(theta);
              const py = centerY + r * Math.sin(theta) * 0.58; // 3D slope flattening
              const alpha = (1.0 - (r / (maxDim * 0.75))) * 0.35;
              pointsList.push({ x: px, y: py, alpha });
            }

            if (pointsList.length > 0) {
              ctx.moveTo(pointsList[0].x, pointsList[0].y);
              for (let pi = 1; pi < pointsList.length; pi++) {
                const pt = pointsList[pi];
                const grad = ctx.createLinearGradient(
                  pointsList[pi-1].x, pointsList[pi-1].y,
                  pt.x, pt.y
                );
                const color = sparkleColors[s % sparkleColors.length];
                grad.addColorStop(0, `rgba(${color}, ${pointsList[pi-1].alpha})`);
                grad.addColorStop(1, `rgba(${color}, ${pt.alpha})`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2.4 + Math.sin(t * 0.0035 + pi * 0.2) * 0.8;
                ctx.lineTo(pt.x, pt.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(pt.x, pt.y);
              }
            }
          }

          // Sparkling interactive premium orbital pathways
          const rings = 4;
          for (let ri = 0; ri < rings; ri++) {
            const rotSpeed = 0.00014 * (ri % 2 === 0 ? 1 : -1);
            const rotation = t * rotSpeed + (ri * Math.PI / rings);
            const radX = portalCoreRad * 1.4 + ri * 50;
            const radY = radX * 0.38;
            const color = sparkleColors[ri % sparkleColors.length];
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);
            ctx.shadowBlur = 10 + ri * 6;
            ctx.shadowColor = `rgba(${color}, 0.5)`;
            
            // Outer bright vector trail ring
            ctx.beginPath();
            ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${color}, ${0.08 - (ri * 0.015)})`;
            ctx.lineWidth = 12 + ri * 2;
            ctx.stroke();

            // Inner razor cosmic energy thread
            ctx.beginPath();
            ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 - (ri * 0.02)})`;
            ctx.lineWidth = 1.8;
            ctx.stroke();
            
            ctx.restore();
          }
          ctx.restore();
        }

        // Apply slow interactive transition shift to the main nebula element too
        const nebulaEl = document.querySelector('.nebula-layer') as HTMLElement | null;
        if (nebulaEl) {
          nebulaEl.style.setProperty('--mx', `${mouseX * -30}px`);
          nebulaEl.style.setProperty('--my', `${mouseY * -30}px`);
        }

        // Constellation layer
        ctx.lineWidth = 1;
        constellationEdges.forEach((e) => {
          const a = constellationPoints[e.a];
          const b = constellationPoints[e.b];
          if (!a || !b) return;
          ctx.beginPath();
          ctx.moveTo(a.x + cx, a.y + cy);
          ctx.lineTo(b.x + cx, b.y + cy);
          ctx.strokeStyle = 'rgba(180,170,220,0.14)';
          ctx.stroke();
        });

        constellationPoints.forEach((p) => {
          const pulse = reduceMotion
            ? 0.5
            : 0.4 + Math.sin(t * 0.0006 + p.phase) * 0.25;
          ctx.beginPath();
          ctx.arc(p.x + cx, p.y + cy, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(220,210,255,' + pulse + ')';
          ctx.fill();
        });

        // Stars layer
        stars.forEach((s) => {
          const twinkle = reduceMotion
            ? s.baseAlpha
            : s.baseAlpha + Math.sin(t * 0.001 * s.speed * 10 + s.phase) * 0.2;
          ctx.beginPath();
          ctx.arc(s.x + bx, s.y + by, s.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + s.color + ',' + Math.max(0, twinkle) + ')';
          ctx.fill();
        });

        // Flares layer
        if (!reduceMotion) {
          if (t - lastFlareSpawn > 900 && flares.length < 12) {
            spawnFlare();
            lastFlareSpawn = t;
          }
          flares = flares.filter((f) => f.life < f.maxLife);
          flares.forEach((f) => {
            f.life += 16;
            const progress = f.life / f.maxLife;
            const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            const r = f.r * (1 + progress * 0.6);
            ctx.beginPath();
            const grad = ctx.createRadialGradient(
              f.x + fx,
              f.y + fy,
              0,
              f.x + fx,
              f.y + fy,
              r * 4
            );
            grad.addColorStop(0, 'rgba(' + f.color + ',' + alpha * 0.9 + ')');
            grad.addColorStop(1, 'rgba(' + f.color + ',0)');
            ctx.fillStyle = grad;
            ctx.arc(f.x + fx, f.y + fy, r * 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(f.x + fx, f.y + fy, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
            ctx.fill();
          });

          // Meteors / Shooting Stars
          if (t - lastMeteorTime > 4500 + Math.random() * 6000) {
            spawnMeteor();
            lastMeteorTime = t;
          }
          meteors = meteors.filter((m) => m.life > 0);
          meteors.forEach((m) => {
            m.x += m.vx;
            m.y += m.vy;
            m.life -= m.decay;
            if (m.life > 0) {
              ctx.beginPath();
              const grad = ctx.createLinearGradient(
                m.x - m.vx * m.len * 0.12,
                m.y - m.vy * m.len * 0.12,
                m.x,
                m.y
              );
              grad.addColorStop(0, 'rgba(' + m.color + ',0)');
              grad.addColorStop(1, 'rgba(' + m.color + ',' + m.life * 0.85 + ')');
              ctx.strokeStyle = grad;
              ctx.lineWidth = 1.6;
              ctx.moveTo(m.x - m.vx * m.len * 0.12, m.y - m.vy * m.len * 0.12);
              ctx.lineTo(m.x, m.y);
              ctx.stroke();

              // Cute glow sparkle at the meteor head
              ctx.beginPath();
              ctx.arc(m.x, m.y, 1.2, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255, 255, 255, ' + m.life + ')';
              ctx.fill();
            }
          });
        }
        canvasAnimFrame = requestAnimationFrame(draw);
      }

      window.addEventListener('resize', resize);
      starfieldResizeHandler = resize;
      resize();
      canvasAnimFrame = requestAnimationFrame(draw);
    }

    /* ============ Storage helpers ============ */
    const store = {
      get(key: string, fallback: any) {
        try {
          const v = localStorage.getItem(key);
          return v ? JSON.parse(v) : fallback;
        } catch (e) {
          return fallback;
        }
      },
      set(key: string, val: any) {
        try {
          localStorage.setItem(key, JSON.stringify(val));
          return true;
        } catch (e) {
          return false;
        }
      },
    };

    /* ============ Toast feedback ============ */
    function toast(msg: string, kind?: string) {
      const host = document.getElementById('toastHost');
      if (!host) return;
      const el = document.createElement('div');
      el.className = 'toast' + (kind === 'warn' ? ' warn' : '');
      el.innerHTML = '<span class="dot"></span><span>' + msg + '</span>';
      host.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }

    /* ============ Tab navigation ============ */
    const PANEL_ORDER = [
      'home',
      'roll',
      'notes',
      'sheet',
      'calc',
      'tasks',
      'clock',
      'calendar',
      'recipes',
      'game',
      'settings',
    ];

    function switchToPanel(name: string, opts?: any) {
      opts = opts || {};
      const activePanel = document.querySelector('.panel.active');
      const current = activePanel ? activePanel.id.replace('panel-', '') : '';
      if (current === name) return;

      document.querySelectorAll('nav button').forEach((b: any) => {
        b.classList.toggle('active', b.dataset.panel === name);
      });

      const fromIdx = PANEL_ORDER.indexOf(current);
      const toIdx = PANEL_ORDER.indexOf(name);
      const dir = opts.dir || (toIdx > fromIdx ? 'left' : 'right');

      document.querySelectorAll('.panel').forEach((p) => {
        p.classList.remove('active', 'slide-in-left', 'slide-in-right');
      });

      const target = document.getElementById('panel-' + name);
      if (target) {
        target.classList.add(
          'active',
          dir === 'left' ? 'slide-in-left' : 'slide-in-right'
        );
      }
      if (!opts.silent) haptic(9);
    }

    document.querySelectorAll('nav button').forEach((btn: any) => {
      btn.addEventListener('click', () => switchToPanel(btn.dataset.panel));
    });

    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => switchToPanel('home'));
    }

    document.querySelectorAll('.dash-tile').forEach((tile: any) => {
      tile.addEventListener('click', () => {
        switchToPanel(tile.dataset.panel);
        haptic(10);
      });
    });

    /* ============ Swipe between panels ============ */
    const mainEl = document.querySelector('main');
    let startX = 0,
      startY = 0,
      tracking = false;
    const THRESHOLD = 55;
    const MAX_VERTICAL = 60;

    if (mainEl) {
      mainEl.addEventListener(
        'touchstart',
        (e: TouchEvent) => {
          if (e.touches.length !== 1) return;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          tracking = true;
        },
        { passive: true }
      );

      mainEl.addEventListener(
        'touchend',
        (e: TouchEvent) => {
          if (!tracking) return;
          tracking = false;
          const endX = e.changedTouches[0].clientX;
          const endY = e.changedTouches[0].clientY;
          const dx = endX - startX;
          const dy = endY - startY;
          if (Math.abs(dy) > MAX_VERTICAL) return;
          if (Math.abs(dx) < THRESHOLD) return;

          const activePanel = document.querySelector('.panel.active');
          const current = activePanel ? activePanel.id.replace('panel-', '') : '';
          const idx = PANEL_ORDER.indexOf(current);
          if (dx < 0 && idx < PANEL_ORDER.length - 1) {
            switchToPanel(PANEL_ORDER[idx + 1], { dir: 'left' });
          } else if (dx > 0 && idx > 0) {
            switchToPanel(PANEL_ORDER[idx - 1], { dir: 'right' });
          }
        },
        { passive: true }
      );
    }

    /* ============ DICE ROLLER ============ */
    const DICE = [2, 4, 6, 8, 10, 12, 20, 100];
    let selectedDie = 20;
    const dieGrid = document.getElementById('dieGrid');

    if (dieGrid) {
      dieGrid.innerHTML = '';
      DICE.forEach((d) => {
        const b = document.createElement('button');
        b.className = 'die-btn shiny' + (d === 20 ? ' active' : '');
        b.textContent = d === 2 ? 'coin' : 'd' + d;
        b.dataset.die = String(d);
        b.addEventListener('click', () => {
          selectedDie = d;
          document.querySelectorAll('.die-btn').forEach((x) => x.classList.remove('active'));
          b.classList.add('active');
          const rollSubEl = document.getElementById('rollSub');
          if (rollSubEl) {
            rollSubEl.textContent = d === 2 ? 'coin flip selected' : 'd' + d + ' selected';
          }
          haptic(10);
        });
        dieGrid.appendChild(b);
      });
    }

    function secureRandomInt(max: number): number {
      const range = max;
      const maxUint32 = 0xffffffff;
      const limit = Math.floor((maxUint32 + 1) / range) * range;
      let x;
      const buf = new Uint32Array(1);
      do {
        crypto.getRandomValues(buf);
        x = buf[0];
      } while (x >= limit);
      return (x % range) + 1;
    }

    let rollHistory = store.get('roll_history', []);
    function renderHistory() {
      const row = document.getElementById('historyRow');
      if (row) {
        row.innerHTML = '';
        rollHistory.slice(0, 8).forEach((h: any) => {
          const chip = document.createElement('div');
          chip.className = 'history-chip';
          let label, result;
          if (h.die === 2 || h.die === '2') {
            label = 'coin';
            result = h.result === 1 ? 'Heads' : 'Tails';
          } else {
            label = typeof h.die === 'number' ? 'd' + h.die : h.die;
            result = h.result;
          }
          chip.innerHTML =
            '<span class="die-label">' +
            label +
            '</span><span class="die-result">' +
            result +
            '</span>';
          row.appendChild(chip);
        });
      }

      const dashboardRow = document.getElementById('dashboardHistoryRow');
      if (dashboardRow) {
        dashboardRow.innerHTML = '';
        rollHistory.slice(0, 5).forEach((h: any) => {
          const item = document.createElement('div');
          item.className = 'flex justify-between items-center text-[12px] border-b border-[#2e2454]/45 pb-1.5 pt-1 last:border-b-0 text-[#b4aae2] font-mono';
          let label, result;
          if (h.die === 2 || h.die === '2') {
            label = 'd2';
            result = h.result === 1 ? 'Heads' : 'Tails';
          } else {
            label = 'd' + h.die;
            result = h.result;
          }
          item.innerHTML = `
            <span class="text-[#8b7ac4] font-medium">${label}</span>
            <span class="text-[#cf4fe6] font-semibold text-[13px]">${result}</span>
          `;
          dashboardRow.appendChild(item);
        });
        if (rollHistory.length === 0) {
          dashboardRow.innerHTML = '<div class="text-[11px] text-[#8b7ac4]/50 italic py-3 text-center">No recent rolls</div>';
        }
      }
    }
    renderHistory();

    /* ============ Haptics ============ */
    let audioCtx: any = null;

    function playHapticTickSound() {
      try {
        audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        // A crisp, warm triangle pulse that replicates a premium mechanical tap feel
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.024);
        
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.024);
        
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.024);
      } catch (e) {
        /* audio fallback not supported or disabled */
      }
    }

    function hapticRaw(pattern: any) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          const success = navigator.vibrate(pattern);
          if (success) return;
        } catch (e) {
          /* no-op */
        }
      }
      
      // Safari/iOS web vibration fallback: Play a micro acoustic dynamic tick
      try {
        if (Array.isArray(pattern)) {
          let currentDelay = 0;
          pattern.forEach((p, idx) => {
            if (idx % 2 === 0) {
              setTimeout(() => {
                playHapticTickSound();
              }, currentDelay);
            }
            currentDelay += p;
          });
        } else {
          playHapticTickSound();
        }
      } catch (e) {
        /* audio play block / fallback failed */
      }
    }

    function haptic(pattern: any) {
      if (!settings || settings.haptics !== false) {
        hapticRaw(pattern);
      }
    }
    (window as any).haptic = haptic;

    function formatRollFace(die: number, n: number) {
      if (die === 2) return n === 1 ? 'Heads' : 'Tails';
      return String(n);
    }

    let activeRollInterval: any = null;
    function animateRoll(die: number, finalResult: number, durationMs: number) {
      const els = document.querySelectorAll('.roll-result-val, #rollResult');
      const stages = document.querySelectorAll('.roll-stage, .dice-tray-card');
      if (els.length === 0) return;

      els.forEach(el => {
        el.classList.remove('crit-hi', 'crit-lo', 'landed');
        if (die === 2) el.classList.add('coin-face');
        else el.classList.remove('coin-face');
      });
      stages.forEach(stage => stage.classList.remove('flash-hi', 'flash-lo'));

      const start = Date.now();
      if (activeRollInterval) {
        cancelAnimationFrame(activeRollInterval);
        clearTimeout(activeRollInterval);
      }

      let currentDelay = 25;

      function tick() {
        const elapsed = Date.now() - start;
        if (elapsed >= durationMs) {
          const finalTxt = formatRollFace(die, finalResult);
          els.forEach(el => {
            el.textContent = finalTxt;
            el.classList.add('landed');
            if (die === 20 && finalResult === 20) {
              el.classList.add('crit-hi');
            } else if (die === 20 && finalResult === 1) {
              el.classList.add('crit-lo');
            }
          });

          if (die === 20 && finalResult === 20) {
            stages.forEach(stage => stage.classList.add('flash-hi'));
            setTimeout(() => stages.forEach(stage => stage.classList.remove('flash-hi')), 900);
            haptic([30, 40, 30, 40, 80]);
            playLandTone('hi');
          } else if (die === 20 && finalResult === 1) {
            stages.forEach(stage => stage.classList.add('flash-lo'));
            setTimeout(() => stages.forEach(stage => stage.classList.remove('flash-lo')), 600);
            haptic([80]);
            playLandTone('lo');
          } else {
            haptic([35]);
            playLandTone('normal');
          }
          return;
        }

        haptic(6);

        const tickTxt = formatRollFace(
          die,
          Math.floor(Math.random() * die) + 1
        );
        els.forEach(el => {
          el.textContent = tickTxt;
        });

        // Exponential increase in delay to feel like the die is losing momentum!
        // Start fast (25ms) and slow down up to about 180ms per tick at the very end
        const progress = elapsed / durationMs;
        currentDelay = 25 + Math.pow(progress, 2.5) * 150;

        activeRollInterval = setTimeout(tick, currentDelay);
      }

      activeRollInterval = setTimeout(tick, currentDelay);
    }

    function doRoll(die: number, customLabel?: string) {
      const result = secureRandomInt(die);
      animateRoll(die, result, 750);
      const subs = document.querySelectorAll('.roll-sub-text, #rollSub');
      const textVal = customLabel || (die === 2 ? 'coin flip result' : 'd' + die + ' result');
      subs.forEach(sub => {
        sub.textContent = textVal;
      });
      rollHistory.unshift({ die, result, t: Date.now() });
      rollHistory = rollHistory.slice(0, 30);
      store.set('roll_history', rollHistory);
      renderHistory();
    }

    (window as any).doRoll = doRoll;
    (window as any).switchToPanel = switchToPanel;
    (window as any).setSelectedDie = (die: number) => {
      selectedDie = die;
    };

    const rollBtn = document.getElementById('rollBtn');
    if (rollBtn) {
      rollBtn.addEventListener('click', () => doRoll(selectedDie));
    }

    const dashboardRollBtnMain = document.getElementById('dashboardRollBtnMain');
    if (dashboardRollBtnMain) {
      dashboardRollBtnMain.addEventListener('click', () => doRoll(selectedDie));
    }

    // Interactive turn-tracker rotation listener and HP adjuster
    let activeTurnIndex = 0;
    let currentRound = 4;
    const roundCountVal = document.getElementById('roundCountVal');
    const roundBtnMinus = document.getElementById('roundBtnMinus');
    const roundBtnPlus = document.getElementById('roundBtnPlus');

    const updateRoundUI = () => {
      if (roundCountVal) {
        roundCountVal.textContent = `ROUND ${currentRound}`;
      }
    };

    if (roundBtnMinus) {
      roundBtnMinus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentRound > 1) {
          currentRound--;
          updateRoundUI();
          haptic(8);
        }
      });
    }

    if (roundBtnPlus) {
      roundBtnPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        currentRound++;
        updateRoundUI();
        haptic(8);
      });
    }

    const updateTurnTrackerVisuals = () => {
      const rows = document.querySelectorAll('.combatant-row');
      rows.forEach((row, idx) => {
        const indicator = row.querySelector('.active-dot');
        const isCurrent = idx === activeTurnIndex;
        
        // Handle active highlighting
        if (isCurrent) {
          row.classList.add('border-[#cf4fe6]/90', 'bg-[#211442]/55', 'shadow-[0_0_12px_rgba(207,79,230,0.2)]');
          row.classList.remove('border-[#44387a]/30', 'bg-transparent');
          if (indicator) indicator.classList.remove('opacity-0');
        } else {
          row.classList.remove('border-[#cf4fe6]/90', 'bg-[#211442]/55', 'shadow-[0_0_12px_rgba(207,79,230,0.2)]');
          row.classList.add('border-[#44387a]/30', 'bg-transparent');
          if (indicator) indicator.classList.add('opacity-0');
        }

        // Downed effect check
        const rawHp = row.getAttribute('data-hp');
        const hp = rawHp ? parseInt(rawHp) : 0;
        const nameSpan = row.querySelector('.comb-name');
        if (hp <= 0) {
          row.classList.add('opacity-40');
          if (nameSpan) {
            nameSpan.classList.add('line-through', 'text-red-500/80');
          }
        } else {
          row.classList.remove('opacity-40');
          if (nameSpan) {
            nameSpan.classList.remove('line-through', 'text-red-500/80');
          }
        }
      });
    };

    // Set first row active initially!
    setTimeout(() => {
      updateTurnTrackerVisuals();
    }, 50);

    // Click handler for entire rows to tap-to-activate
    const setupTurnRowClickHandlers = () => {
      const rows = document.querySelectorAll('.combatant-row');
      rows.forEach((row) => {
        row.addEventListener('click', (e) => {
          // If clicked target is a button or input or within it, don't change turn active index
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('input')) {
            return;
          }
          const rawIdx = row.getAttribute('data-idx');
          if (rawIdx !== null) {
            activeTurnIndex = parseInt(rawIdx);
            updateTurnTrackerVisuals();
            haptic(12);
          }
        });

        // Add HP minus/plus click listeners
        const minusBtn = row.querySelector('.hp-minus');
        const plusBtn = row.querySelector('.hp-plus');
        const hpText = row.querySelector('.hp-text') as HTMLElement | null;
        const hpBar = row.querySelector('.hp-bar') as HTMLElement | null;

        if (minusBtn) {
          minusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rawHp = row.getAttribute('data-hp');
            const rawMax = row.getAttribute('data-max');
            if (rawHp && rawMax) {
              let hp = parseInt(rawHp);
              const max = parseInt(rawMax);
              if (hp > 0) {
                hp--;
                row.setAttribute('data-hp', hp.toString());
                if (hpText) hpText.textContent = hp.toString();
                if (hpBar) {
                  hpBar.style.width = `${Math.round((hp / max) * 100)}%`;
                }
                updateTurnTrackerVisuals(); // refresh downed status style
                haptic(5);
              }
            }
          });
        }

        if (plusBtn) {
          plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rawHp = row.getAttribute('data-hp');
            const rawMax = row.getAttribute('data-max');
            if (rawHp && rawMax) {
              let hp = parseInt(rawHp);
              const max = parseInt(rawMax);
              if (hp < max) {
                hp++;
                row.setAttribute('data-hp', hp.toString());
                if (hpText) hpText.textContent = hp.toString();
                if (hpBar) {
                  hpBar.style.width = `${Math.round((hp / max) * 100)}%`;
                }
                updateTurnTrackerVisuals(); // refresh downed status style
                haptic(5);
              }
            }
          });
        }
      });
    };

    setTimeout(() => {
      setupTurnRowClickHandlers();
    }, 100);

    const dashboardEndTurnBtn = document.getElementById('dashboardEndTurnBtn');
    if (dashboardEndTurnBtn) {
      dashboardEndTurnBtn.addEventListener('click', () => {
        const rows = document.querySelectorAll('.combatant-row');
        if (rows.length === 0) return;
        
        // Find next live / downed-friendly index
        const nextIndex = (activeTurnIndex + 1) % rows.length;
        
        // If wrapping completed a full turn around back to index 0, auto-advance round counter!
        if (nextIndex === 0) {
          currentRound++;
          updateRoundUI();
        }
        
        activeTurnIndex = nextIndex;
        updateTurnTrackerVisuals();
        haptic(15);
      });
    }

    const clearHistory = document.getElementById('clearHistory');
    if (clearHistory) {
      clearHistory.addEventListener('click', () => {
        rollHistory = [];
        store.set('roll_history', rollHistory);
        renderHistory();
        toast('History cleared');
      });
    }

    const customRollBtn = document.getElementById('customRollBtn');
    if (customRollBtn) {
      customRollBtn.addEventListener('click', () => {
        const customDieInput = document.getElementById('customDie') as HTMLInputElement | null;
        if (!customDieInput) return;
        const raw = customDieInput.value.trim().toLowerCase();
        if (!raw) return;
        const match = raw.match(/^(\d*)d(\d+)([+-]\d+)?$/);
        const el = document.getElementById('rollResult');
        const sub = document.getElementById('rollSub');
        if (!el || !sub) return;

        el.classList.remove('crit-hi', 'crit-lo');

        if (match) {
          const n = parseInt(match[1] || '1', 10);
          const sides = parseInt(match[2], 10);
          const mod = match[3] ? parseInt(match[3], 10) : 0;
          if (n > 100 || sides > 1000) {
            sub.textContent = 'keep it reasonable';
            return;
          }
          let total = 0;
          const rolls: number[] = [];
          for (let i = 0; i < n; i++) {
            const r = secureRandomInt(sides);
            rolls.push(r);
            total += r;
          }
          total += mod;
          let frame = 0;
          const maxFrames = 18;
          const iv = setInterval(() => {
            frame++;
            if (frame >= maxFrames) {
              clearInterval(iv);
              el.textContent = String(total);
              el.classList.remove('landed');
              void el.offsetWidth;
              el.classList.add('landed');
              sub.textContent =
                raw +
                ' → [' +
                rolls.join(', ') +
                ']' +
                (mod ? (mod > 0 ? ' +' : ' ') + mod : '');
              haptic([35]);
              playLandTone('normal');
            } else {
              el.textContent = String(
                Math.floor(Math.random() * (sides * n + Math.abs(mod) + 1))
              );
              haptic(8);
            }
          }, 25);
          rollHistory.unshift({ die: raw, result: total, t: Date.now() });
          rollHistory = rollHistory.slice(0, 30);
          store.set('roll_history', rollHistory);
          renderHistory();
        } else {
          sub.textContent = 'format: 3d6+2 or 2d10';
        }
      });
    }

    /* ============ NOTES ============ */
    let notesArr = store.get('notes', []);
    function renderNotes() {
      const list = document.getElementById('notesList');
      if (!list) return;
      list.innerHTML = '';
      if (notesArr.length === 0) {
        list.innerHTML =
          '<div class="empty-state"><div class="empty-ring"></div>The page is blank — write your first note</div>';
        return;
      }
      notesArr.forEach((note: any, idx: number) => {
        const item = document.createElement('div');
        item.className = 'note-item';
        const date = new Date(note.t).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        item.innerHTML = `
          <textarea data-idx="${idx}" placeholder="write something...">${note.text}</textarea>
          <div class="note-meta">
            <span>${date}</span>
            <span class="icon-btn" data-del="${idx}">delete</span>
          </div>
        `;
        list.appendChild(item);
      });

      list.querySelectorAll('textarea').forEach((ta: any) => {
        ta.addEventListener('input', () => {
          notesArr[ta.dataset.idx].text = ta.value;
          store.set('notes', notesArr);
        });
      });

      list.querySelectorAll('[data-del]').forEach((d: any) => {
        d.addEventListener('click', () => {
          notesArr.splice(parseInt(d.dataset.del, 10), 1);
          store.set('notes', notesArr);
          renderNotes();
          toast('Note deleted', 'warn');
        });
      });
    }
    renderNotes();

    const addNoteBtn = document.getElementById('addNoteBtn');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        notesArr.unshift({ text: '', t: Date.now() });
        store.set('notes', notesArr);
        renderNotes();
        const first = document.querySelector('#notesList textarea') as HTMLTextAreaElement | null;
        if (first) first.focus();
      });
    }

    /* ============ CHARACTER SHEET ============ */
    const sheetFields = [
      'ch-name',
      'ch-class',
      'ch-species',
      'ch-background',
      'st-str',
      'st-dex',
      'st-con',
      'st-int',
      'st-wis',
      'st-cha',
      'ch-hpcur',
      'ch-hpmax',
      'ch-ac',
      'ch-init',
      'ch-speed',
      'ch-prof',
      'ch-equip',
    ];

    function loadSheet() {
      const data = store.get('char_sheet', {});
      sheetFields.forEach((id) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el && data[id] !== undefined) el.value = data[id];
      });
      updateMods();
    }

    let sheetStatusTimer: any = null;
    function saveSheet() {
      const data: any = {};
      sheetFields.forEach((id) => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el) data[id] = el.value;
      });
      store.set('char_sheet', data);
      const status = document.getElementById('sheetSaveStatus');
      if (status) {
        status.textContent = 'saved';
        clearTimeout(sheetStatusTimer);
        sheetStatusTimer = setTimeout(() => {
          status.textContent = '';
        }, 1200);
      }
    }

    function updateMods() {
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach((stat) => {
        const el = document.getElementById('st-' + stat) as HTMLInputElement | null;
        const val = el ? parseInt(el.value, 10) || 10 : 10;
        const mod = Math.floor((val - 10) / 2);
        const modEl = document.getElementById('mod-' + stat);
        if (modEl) modEl.textContent = (mod >= 0 ? '+' : '') + mod;
      });
    }

    sheetFields.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          updateMods();
          saveSheet();
        });
      }
    });
    loadSheet();

    const exportSheet = document.getElementById('exportSheet');
    if (exportSheet) {
      exportSheet.addEventListener('click', () => {
        const data = store.get('char_sheet', {});
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (data['ch-name'] || 'character') + '-sheet.json';
        a.click();
        URL.revokeObjectURL(url);
        toast('Sheet exported');
      });
    }

    const importSheetBtn = document.getElementById('importSheetBtn');
    const importSheetFile = document.getElementById('importSheetFile') as HTMLInputElement | null;
    if (importSheetBtn && importSheetFile) {
      importSheetBtn.addEventListener('click', () => {
        importSheetFile.click();
      });

      importSheetFile.addEventListener('change', (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result as string);
            store.set('char_sheet', data);
            loadSheet();
            toast('Sheet imported');
          } catch (err) {
            toast('Could not read that file', 'warn');
          }
        };
        reader.readAsText(file);
      });
    }

    /* ============ CALCULATOR ============ */
    document.querySelectorAll('#panel-calc > .card > .calc-tabs > .calc-tab').forEach((tab: any) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#panel-calc > .card > .calc-tabs > .calc-tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.calc-sub').forEach((s) => s.classList.remove('active'));
        tab.classList.add('active');
        const calcSubEl = document.getElementById('calc-' + tab.dataset.calc);
        if (calcSubEl) calcSubEl.classList.add('active');
      });
    });

    // Basic calculator
    const calcKeysLayout = [
      'C',
      '±',
      '%',
      '÷',
      '7',
      '8',
      '9',
      '×',
      '4',
      '5',
      '6',
      '-',
      '1',
      '2',
      '3',
      '+',
      '0',
      '.',
      '⌫',
      '=',
    ];
    const calcKeysEl = document.getElementById('calcKeys');
    let calcExpr = '';

    if (calcKeysEl) {
      calcKeysEl.innerHTML = '';
      calcKeysLayout.forEach((k) => {
        const b = document.createElement('button');
        b.className =
          'calc-key' +
          (['÷', '×', '-', '+'].includes(k) ? ' op' : '') +
          (k === '=' ? ' eq' : '') +
          (k === 'C' ? ' clear' : '');
        b.textContent = k;
        b.addEventListener('click', () => {
          handleCalcKey(k);
          haptic(7);
        });
        calcKeysEl.appendChild(b);
      });
    }

    function handleCalcKey(k: string) {
      const display = document.getElementById('calcDisplay');
      if (!display) return;
      if (k === 'C') {
        calcExpr = '';
        display.textContent = '0';
        return;
      }
      if (k === '⌫') {
        calcExpr = calcExpr.slice(0, -1);
        display.textContent = calcExpr || '0';
        return;
      }
      if (k === '±') {
        if (calcExpr.startsWith('-')) calcExpr = calcExpr.slice(1);
        else calcExpr = '-' + calcExpr;
        display.textContent = calcExpr || '0';
        return;
      }
      if (k === '=') {
        try {
          let safe = calcExpr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/%/g, '/100');
          if (!/^[0-9+\-*/.() ]+$/.test(safe)) throw new Error('bad');
          const result = Function('"use strict"; return (' + safe + ')')();
          calcExpr = String(Math.round(result * 1e8) / 1e8);
          display.textContent = calcExpr;
        } catch (e) {
          display.textContent = 'error';
          calcExpr = '';
        }
        return;
      }
      calcExpr += k;
      display.textContent = calcExpr;
    }

    // Tip calculator
    function updateTip() {
      const tipBillInput = document.getElementById('tipBill') as HTMLInputElement | null;
      const tipPctInput = document.getElementById('tipPct') as HTMLInputElement | null;
      const tipSplitInput = document.getElementById('tipSplit') as HTMLInputElement | null;

      const bill = tipBillInput ? parseFloat(tipBillInput.value) || 0 : 0;
      const pct = tipPctInput ? parseInt(tipPctInput.value, 10) : 18;
      const split = tipSplitInput
        ? Math.max(1, parseInt(tipSplitInput.value, 10) || 1)
        : 1;

      const tipPctLabel = document.getElementById('tipPctLabel');
      if (tipPctLabel) tipPctLabel.textContent = String(pct);

      const tipAmt = bill * (pct / 100);
      const total = bill + tipAmt;

      const tipAmountEl = document.getElementById('tipAmount');
      const tipTotalEl = document.getElementById('tipTotal');
      const tipPerPersonEl = document.getElementById('tipPerPerson');
      const tipPerPersonNoTipEl = document.getElementById('tipPerPersonNoTip');

      if (tipAmountEl) tipAmountEl.textContent = '$' + tipAmt.toFixed(2);
      if (tipTotalEl) tipTotalEl.textContent = '$' + total.toFixed(2);
      if (tipPerPersonEl) tipPerPersonEl.textContent = '$' + (total / split).toFixed(2);
      if (tipPerPersonNoTipEl) tipPerPersonNoTipEl.textContent = '$' + (bill / split).toFixed(2);
    }

    ['tipBill', 'tipPct', 'tipSplit'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateTip);
    });
    updateTip();

    // Unit converter
    const UNITS: any = {
      length: {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        mi: 1609.34,
        yd: 0.9144,
        ft: 0.3048,
        in: 0.0254,
      },
      weight: {
        kg: 1,
        g: 0.001,
        lb: 0.453592,
        oz: 0.0283495,
        st: 6.35029,
        ton: 907.185,
      },
    };
    let currentConv = 'length';

    function populateConvSelects() {
      const fromSel = document.getElementById('convFrom') as HTMLSelectElement | null;
      const toSel = document.getElementById('convTo') as HTMLSelectElement | null;
      if (!fromSel || !toSel) return;
      fromSel.innerHTML = '';
      toSel.innerHTML = '';
      if (currentConv === 'temp') {
        ['C', 'F', 'K'].forEach((u) => {
          fromSel.innerHTML += `<option value="${u}">${u}</option>`;
          toSel.innerHTML += `<option value="${u}">${u}</option>`;
        });
        toSel.value = 'F';
      } else {
        Object.keys(UNITS[currentConv]).forEach((u) => {
          fromSel.innerHTML += `<option value="${u}">${u}</option>`;
          toSel.innerHTML += `<option value="${u}">${u}</option>`;
        });
        toSel.selectedIndex = 1;
      }
      doConvert();
    }

    function tempConvert(val: number, from: string, to: string) {
      let c;
      if (from === 'C') c = val;
      else if (from === 'F') c = ((val - 32) * 5) / 9;
      else c = val - 273.15;

      if (to === 'C') return c;
      if (to === 'F') return (c * 9) / 5 + 32;
      return c + 273.15;
    }

    function doConvert() {
      const convInput = document.getElementById('convInput') as HTMLInputElement | null;
      const convFromSelect = document.getElementById('convFrom') as HTMLSelectElement | null;
      const convToSelect = document.getElementById('convTo') as HTMLSelectElement | null;

      const input = convInput ? parseFloat(convInput.value) || 0 : 0;
      const from = convFromSelect ? convFromSelect.value : '';
      const to = convToSelect ? convToSelect.value : '';
      if (!from || !to) return;

      let result;
      if (currentConv === 'temp') {
        result = tempConvert(input, from, to);
      } else {
        const base = input * UNITS[currentConv][from];
        result = base / UNITS[currentConv][to];
      }
      const convResultEl = document.getElementById('convResult');
      if (convResultEl) {
        convResultEl.textContent =
          Math.round(result * 10000) / 10000 + ' ' + to;
      }
    }

    document.querySelectorAll('[data-conv]').forEach((tab: any) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-conv]').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        currentConv = tab.dataset.conv;
        populateConvSelects();
      });
    });

    ['convInput', 'convFrom', 'convTo'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', doConvert);
    });
    populateConvSelects();

    /* ============ TASKS ============ */
    let tasksArr = store.get('tasks', []);
    function renderTasks() {
      const list = document.getElementById('taskList');
      if (!list) return;
      list.innerHTML = '';
      if (tasksArr.length === 0) {
        list.innerHTML =
          '<div class="empty-state"><div class="empty-ring"></div>Nothing on the list yet</div>';
        return;
      }
      tasksArr.forEach((task: any, idx: number) => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.innerHTML = `<div class="task-check ${
          task.done ? 'done' : ''
        }" data-toggle="${idx}">${
          task.done ? '✓' : ''
        }</div> <div class="task-text ${task.done ? 'done' : ''}">${
          task.text
        }</div> <div class="task-del" data-del="${idx}">✕</div>`;
        list.appendChild(item);
      });

      list.querySelectorAll('[data-toggle]').forEach((c: any) => {
        c.addEventListener('click', () => {
          const i = parseInt(c.dataset.toggle, 10);
          tasksArr[i].done = !tasksArr[i].done;
          store.set('tasks', tasksArr);
          renderTasks();
          haptic(12);
        });
      });

      list.querySelectorAll('.task-del').forEach((d: any) => {
        d.addEventListener('click', () => {
          tasksArr.splice(parseInt(d.dataset.del, 10), 1);
          store.set('tasks', tasksArr);
          renderTasks();
          toast('Task removed', 'warn');
        });
      });
    }
    renderTasks();

    function addTask() {
      const input = document.getElementById('taskInput') as HTMLInputElement | null;
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      tasksArr.unshift({ text, done: false });
      store.set('tasks', tasksArr);
      input.value = '';
      renderTasks();
      haptic(10);
    }

    const taskAddBtn = document.getElementById('taskAddBtn');
    if (taskAddBtn) {
      taskAddBtn.addEventListener('click', addTask);
    }

    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
      taskInput.addEventListener('keydown', (e: any) => {
        if (e.key === 'Enter') addTask();
      });
    }

    /* ============ Clock tools: tabs ============ */
    document.querySelectorAll('#panel-clock .calc-tabs .calc-tab').forEach((tab: any) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#panel-clock .calc-tabs .calc-tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('#panel-clock .calc-sub').forEach((s) => s.classList.remove('active'));
        tab.classList.add('active');
        const clockSubEl = document.getElementById('clock-' + tab.dataset.clock);
        if (clockSubEl) clockSubEl.classList.add('active');
        haptic(9);
      });
    });

    /* ============ Timer ============ */
    let timerTotalSecs = 0;
    let timerRemaining = 0;
    let timerInterval: any = null;
    let timerRunning = false;

    function formatMMSS(totalSecs: number) {
      const m = Math.floor(totalSecs / 60);
      const s = Math.floor(totalSecs % 60);
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function updateTimerDisplay() {
      const display = document.getElementById('timerDisplay');
      if (display) display.textContent = formatMMSS(timerRemaining);
    }

    document.querySelectorAll('.timer-presets button').forEach((btn: any) => {
      btn.addEventListener('click', () => {
        timerTotalSecs = parseInt(btn.dataset.secs, 10);
        timerRemaining = timerTotalSecs;
        updateTimerDisplay();
        haptic(9);
      });
    });

    const timerMinInput = document.getElementById('timerMinInput') as HTMLInputElement | null;
    const timerSecInput = document.getElementById('timerSecInput') as HTMLInputElement | null;

    if (timerMinInput) {
      timerMinInput.addEventListener('input', () => {
        const min = parseInt(timerMinInput.value, 10) || 0;
        const sec = timerSecInput ? parseInt(timerSecInput.value, 10) || 0 : 0;
        timerTotalSecs = min * 60 + sec;
        timerRemaining = timerTotalSecs;
        updateTimerDisplay();
      });
    }

    if (timerSecInput) {
      timerSecInput.addEventListener('input', () => {
        const min = timerMinInput ? parseInt(timerMinInput.value, 10) || 0 : 0;
        const sec = parseInt(timerSecInput.value, 10) || 0;
        timerTotalSecs = min * 60 + sec;
        timerRemaining = timerTotalSecs;
        updateTimerDisplay();
      });
    }

    function requestNotifyPermission() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    function notify(title: string, body: string) {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, { body });
        } catch (e) {
          /* no-op */
        }
      }
    }

    const timerStartBtn = document.getElementById('timerStartBtn');
    if (timerStartBtn) {
      timerStartBtn.addEventListener('click', () => {
        const btn = document.getElementById('timerStartBtn');
        if (!btn) return;
        if (timerRunning) {
          clearInterval(timerInterval);
          timerRunning = false;
          btn.textContent = 'Start';
          return;
        }
        if (timerRemaining <= 0) {
          toast('Set a time first', 'warn');
          return;
        }
        requestNotifyPermission();
        timerRunning = true;
        btn.textContent = 'Pause';
        timerInterval = setInterval(() => {
          timerRemaining--;
          updateTimerDisplay();
          if (timerRemaining <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            btn.textContent = 'Start';
            haptic([100, 60, 100, 60, 200]);
            toast('Timer done');
            notify('Timer done', 'Your portal timer has finished.');
          }
        }, 1000);
      });
    }

    const timerResetBtn = document.getElementById('timerResetBtn');
    if (timerResetBtn) {
      timerResetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerRunning = false;
        const startBtn = document.getElementById('timerStartBtn');
        if (startBtn) startBtn.textContent = 'Start';
        timerRemaining = timerTotalSecs;
        updateTimerDisplay();
      });
    }

    /* ============ Stopwatch ============ */
    let stopwatchStart = 0;
    let stopwatchElapsed = 0;
    let stopwatchInterval: any = null;
    let stopwatchRunning = false;
    let laps: any[] = [];

    function formatStopwatch(ms: number) {
      const totalSecs = ms / 1000;
      const m = Math.floor(totalSecs / 60);
      const s = Math.floor(totalSecs % 60);
      const tenths = Math.floor((ms % 1000) / 100);
      return (
        String(m).padStart(2, '0') +
        ':' +
        String(s).padStart(2, '0') +
        '.' +
        tenths
      );
    }

    function updateStopwatchDisplay() {
      const elapsed = stopwatchRunning
        ? Date.now() - stopwatchStart + stopwatchElapsed
        : stopwatchElapsed;
      const display = document.getElementById('stopwatchDisplay');
      if (display) display.textContent = formatStopwatch(elapsed);
    }

    const stopwatchStartBtn = document.getElementById('stopwatchStartBtn');
    if (stopwatchStartBtn) {
      stopwatchStartBtn.addEventListener('click', () => {
        const btn = document.getElementById('stopwatchStartBtn');
        if (!btn) return;
        if (stopwatchRunning) {
          stopwatchElapsed += Date.now() - stopwatchStart;
          stopwatchRunning = false;
          clearInterval(stopwatchInterval);
          btn.textContent = 'Resume';
        } else {
          stopwatchStart = Date.now();
          stopwatchRunning = true;
          btn.textContent = 'Pause';
          stopwatchInterval = setInterval(updateStopwatchDisplay, 100);
        }
        haptic(10);
      });
    }

    const stopwatchLapBtn = document.getElementById('stopwatchLapBtn');
    if (stopwatchLapBtn) {
      stopwatchLapBtn.addEventListener('click', () => {
        if (!stopwatchRunning) return;
        const elapsed = Date.now() - stopwatchStart + stopwatchElapsed;
        laps.unshift(elapsed);
        const list = document.getElementById('lapList');
        if (list) {
          list.innerHTML = '';
          laps.forEach((lap, i) => {
            const row = document.createElement('div');
            row.className = 'lap-row';
            row.innerHTML =
              '<span>Lap ' +
              (laps.length - i) +
              '</span><span class="mono">' +
              formatStopwatch(lap) +
              '</span>';
            list.appendChild(row);
          });
        }
        haptic(9);
      });
    }

    const stopwatchResetBtn = document.getElementById('stopwatchResetBtn');
    if (stopwatchResetBtn) {
      stopwatchResetBtn.addEventListener('click', () => {
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        stopwatchElapsed = 0;
        laps = [];
        const lapList = document.getElementById('lapList');
        if (lapList) lapList.innerHTML = '';
        const startBtn = document.getElementById('stopwatchStartBtn');
        if (startBtn) startBtn.textContent = 'Start';
        updateStopwatchDisplay();
      });
    }

    /* ============ Alarms ============ */
    let alarms = store.get('alarms', []);
    let alarmCheckInterval: any = null;

    function renderAlarms() {
      const list = document.getElementById('alarmList');
      if (!list) return;
      list.innerHTML = '';
      alarms.forEach((alarm: any, idx: number) => {
        const row = document.createElement('div');
        row.className = 'alarm-row';
        row.innerHTML =
          '<span>' +
          alarm.time +
          '</span><span class="alarm-del" data-del="' +
          idx +
          '">remove</span>';
        list.appendChild(row);
      });

      list.querySelectorAll('[data-del]').forEach((d: any) => {
        d.addEventListener('click', () => {
          alarms.splice(parseInt(d.dataset.del, 10), 1);
          store.set('alarms', alarms);
          renderAlarms();
          toast('Alarm removed', 'warn');
        });
      });
    }
    renderAlarms();

    const alarmAddBtn = document.getElementById('alarmAddBtn');
    if (alarmAddBtn) {
      alarmAddBtn.addEventListener('click', () => {
        const input = document.getElementById('alarmTimeInput') as HTMLInputElement | null;
        if (!input || !input.value) return;
        requestNotifyPermission();
        alarms.push({ time: input.value, lastFired: null });
        store.set('alarms', alarms);
        renderAlarms();
        input.value = '';
        toast('Alarm set');
        haptic(10);
      });
    }

    function checkAlarms() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const current = hh + ':' + mm;
      const today = now.toDateString();
      alarms.forEach((alarm: any) => {
        if (alarm.time === current && alarm.lastFired !== today) {
          alarm.lastFired = today;
          store.set('alarms', alarms);
          haptic([150, 80, 150, 80, 150]);
          toast('Alarm: ' + alarm.time);
          notify('Alarm', "It's " + alarm.time);
        }
      });
    }
    alarmCheckInterval = setInterval(checkAlarms, 15000);

    /* ============ Calendar ============ */
    let calViewDate = new Date();
    let calSelectedDate = new Date();
    let calEvents = store.get('cal_events', {});

    function dateKey(d: Date) {
      return (
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0')
      );
    }

    function renderCalendar() {
      const year = calViewDate.getFullYear();
      const month = calViewDate.getMonth();
      const monthLabel = document.getElementById('calMonthLabel');
      if (monthLabel) {
        monthLabel.textContent = calViewDate.toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        });
      }

      const grid = document.getElementById('calGrid');
      if (!grid) return;
      grid.innerHTML = '';
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d) => {
        const el = document.createElement('div');
        el.className = 'cal-dow';
        el.textContent = d;
        grid.appendChild(el);
      });

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const todayDate = new Date();

      for (let i = 0; i < firstDay; i++) {
        const el = document.createElement('div');
        el.className = 'cal-day empty';
        grid.appendChild(el);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const thisDate = new Date(year, month, day);
        const key = dateKey(thisDate);
        const el = document.createElement('div');
        el.className = 'cal-day';
        if (thisDate.toDateString() === todayDate.toDateString()) {
          el.classList.add('today');
        }
        if (thisDate.toDateString() === calSelectedDate.toDateString()) {
          el.classList.add('selected');
        }
        const hasEvents = calEvents[key] && calEvents[key].length > 0;
        el.innerHTML = day + (hasEvents ? '<div class="dot"></div>' : '');
        el.addEventListener('click', () => {
          calSelectedDate = thisDate;
          renderCalendar();
          renderCalEvents();
          haptic(9);
        });
        grid.appendChild(el);
      }
    }

    function renderCalEvents() {
      const key = dateKey(calSelectedDate);
      const selectedLabel = document.getElementById('calSelectedLabel');
      if (selectedLabel) {
        selectedLabel.textContent = calSelectedDate.toLocaleDateString(
          undefined,
          { weekday: 'long', month: 'short', day: 'numeric' }
        );
      }
      const list = document.getElementById('calEventList');
      if (!list) return;
      list.innerHTML = '';
      const events = calEvents[key] || [];
      if (events.length === 0) {
        list.innerHTML =
          '<div class="empty-state"><div class="empty-ring"></div>Nothing on this day</div>';
        return;
      }
      events.forEach((ev: string, idx: number) => {
        const row = document.createElement('div');
        row.className = 'cal-event-row';
        row.innerHTML =
          '<span>' + ev + '</span><span class="icon-btn" data-del="' + idx + '">delete</span>';
        list.appendChild(row);
      });

      list.querySelectorAll('[data-del]').forEach((d: any) => {
        d.addEventListener('click', () => {
          events.splice(parseInt(d.dataset.del, 10), 1);
          calEvents[key] = events;
          store.set('cal_events', calEvents);
          renderCalEvents();
          renderCalendar();
        });
      });
    }

    const calPrevBtn = document.getElementById('calPrevBtn');
    if (calPrevBtn) {
      calPrevBtn.addEventListener('click', () => {
        calViewDate = new Date(
          calViewDate.getFullYear(),
          calViewDate.getMonth() - 1,
          1
        );
        renderCalendar();
        haptic(9);
      });
    }

    const calNextBtn = document.getElementById('calNextBtn');
    if (calNextBtn) {
      calNextBtn.addEventListener('click', () => {
        calViewDate = new Date(
          calViewDate.getFullYear(),
          calViewDate.getMonth() + 1,
          1
        );
        renderCalendar();
        haptic(9);
      });
    }

    const calEventAddBtn = document.getElementById('calEventAddBtn');
    if (calEventAddBtn) {
      calEventAddBtn.addEventListener('click', () => {
        const input = document.getElementById('calEventInput') as HTMLInputElement | null;
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        const key = dateKey(calSelectedDate);
        if (!calEvents[key]) calEvents[key] = [];
        calEvents[key].push(text);
        store.set('cal_events', calEvents);
        input.value = '';
        renderCalEvents();
        renderCalendar();
        toast('Event added');
      });
    }
    renderCalendar();
    renderCalEvents();

    /* ============ Higher or Lower game ============ */
    let gameCurrentNum = secureRandomInt(20);
    let gameStreak = 0;
    let gameBest = store.get('game_best', 0);

    const gameBestEl = document.getElementById('gameBest');
    const gameStreakEl = document.getElementById('gameStreak');
    const gameCurrentEl = document.getElementById('gameCurrent');

    if (gameBestEl) gameBestEl.textContent = String(gameBest);
    if (gameStreakEl) gameStreakEl.textContent = String(gameStreak);
    if (gameCurrentEl) gameCurrentEl.textContent = String(gameCurrentNum);

    function gameGuess(direction: 'higher' | 'lower') {
      const nextNum = secureRandomInt(20);
      const correct =
        direction === 'higher'
          ? nextNum >= gameCurrentNum
          : nextNum <= gameCurrentNum;

      const sub = document.getElementById('gameSub');
      if (correct) {
        gameStreak++;
        if (gameStreakEl) gameStreakEl.textContent = String(gameStreak);
        if (gameStreak > gameBest) {
          gameBest = gameStreak;
          store.set('game_best', gameBest);
          if (gameBestEl) gameBestEl.textContent = String(gameBest);
        }
        if (sub) sub.textContent = 'correct — keep going';
        haptic(15);
      } else {
        if (sub) sub.textContent = 'streak broken — try again';
        gameStreak = 0;
        if (gameStreakEl) gameStreakEl.textContent = '0';
        haptic([100, 60, 100]);
      }
      gameCurrentNum = nextNum;
      if (gameCurrentEl) gameCurrentEl.textContent = String(gameCurrentNum);
    }

    const gameHigherBtn = document.getElementById('gameHigherBtn');
    if (gameHigherBtn) {
      gameHigherBtn.addEventListener('click', () => gameGuess('higher'));
    }

    const gameLowerBtn = document.getElementById('gameLowerBtn');
    if (gameLowerBtn) {
      gameLowerBtn.addEventListener('click', () => gameGuess('lower'));
    }

    /* ============ Settings ============ */
    const settings = store.get('settings', {
      theme: 'dark',
      motion: true,
      haptics: true,
      sound: false,
      defaultDie: 20,
      greeting: true,
    });
    function saveSettings() {
      store.set('settings', settings);
    }

    // Theme switching
    function applyTheme(theme: string) {
      document.documentElement.setAttribute('data-theme', theme);
    }

    document.querySelectorAll('#themeSegmented button').forEach((btn: any) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#themeSegmented button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        settings.theme = btn.dataset.theme;
        applyTheme(settings.theme);
        saveSettings();
        haptic(9);
      });
    });

    // Motion toggle
    const motionToggle = document.getElementById('motionToggle') as HTMLInputElement | null;
    if (motionToggle) {
      motionToggle.addEventListener('change', () => {
        settings.motion = motionToggle.checked;
        document.documentElement.setAttribute(
          'data-motion',
          settings.motion ? 'on' : 'off'
        );
        saveSettings();
        haptic(9);
      });
    }

    // Haptics master toggle
    const hapticsToggle = document.getElementById('hapticsToggle') as HTMLInputElement | null;
    if (hapticsToggle) {
      hapticsToggle.addEventListener('change', () => {
        settings.haptics = hapticsToggle.checked;
        saveSettings();
        if (settings.haptics) hapticRaw(10);
      });
    }

    // Sound toggle + tone on roll landing
    const soundToggle = document.getElementById('soundToggle') as HTMLInputElement | null;
    if (soundToggle) {
      soundToggle.addEventListener('change', () => {
        settings.sound = soundToggle.checked;
        saveSettings();
      });
    }

    // audioCtx is declared in parent scope
    function playLandTone(crit: string) {
      if (!settings.sound) return;
      try {
        audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = crit === 'hi' ? 880 : crit === 'lo' ? 220 : 440;
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        /* audio not available, no-op */
      }
    }

    // Default die select
    const defaultDieSelect = document.getElementById('defaultDieSelect') as HTMLSelectElement | null;
    if (defaultDieSelect) {
      defaultDieSelect.addEventListener('change', () => {
        settings.defaultDie = parseInt(defaultDieSelect.value, 10);
        saveSettings();
        toast('Default die updated');
      });
    }

    // Greeting flip toggle
    const greetingToggle = document.getElementById('greetingToggle') as HTMLInputElement | null;
    if (greetingToggle) {
      greetingToggle.addEventListener('change', () => {
        settings.greeting = greetingToggle.checked;
        saveSettings();
      });
    }

    // Export everything as single backup
    const exportAllData = document.getElementById('exportAllData');
    if (exportAllData) {
      exportAllData.addEventListener('click', () => {
        const everything = {
          notes: store.get('notes', []),
          tasks: store.get('tasks', []),
          char_sheet: store.get('char_sheet', {}),
          roll_history: store.get('roll_history', []),
          recipes: store.get('recipes', []),
          pantryChecked: store.get('pantryChecked', []),
          customPantryItems: store.get('customPantryItems', []),
          settings: store.get('settings', {}),
          exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(everything, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          'portal-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
        toast('Backup downloaded');
      });
    }

    // Clear all data
    const clearAllData = document.getElementById('clearAllData');
    if (clearAllData) {
      clearAllData.addEventListener('click', () => {
        if (
          !confirm(
            'This clears all notes, tasks, recipes, your sheet, and roll history from this device. Continue?'
          )
        )
          return;
        ['notes', 'tasks', 'char_sheet', 'roll_history', 'recipes', 'pantryChecked', 'customPantryItems'].forEach((k) =>
          localStorage.removeItem(k)
        );
        toast('All data cleared', 'warn');
        setTimeout(() => window.location.reload(), 900);
      });
    }

    // Import backup file system (JSON)
    const importAllData = document.getElementById('importAllData');
    const importFileInput = document.getElementById('importFileInput') as HTMLInputElement | null;
    if (importAllData && importFileInput) {
      importAllData.addEventListener('click', () => {
        haptic(10);
        importFileInput.click();
      });

      importFileInput.addEventListener('change', (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            const data = JSON.parse(event.target.result);
            if (typeof data !== 'object' || data === null) {
              throw new Error('Invalid format');
            }
            // Import all keys safely without losing other fields
            Object.keys(data).forEach((key) => {
              if (typeof data[key] === 'object' && data[key] !== null) {
                localStorage.setItem(key, JSON.stringify(data[key]));
              } else if (typeof data[key] === 'string') {
                localStorage.setItem(key, data[key]);
              }
            });
            toast('Backup imported successfully! Reloading...', 'success');
            setTimeout(() => window.location.reload(), 1200);
          } catch (err) {
            toast('Failed to parse backup file', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Apply saved settings
    applyTheme(settings.theme);
    const activeThemeBtn = document.querySelector(
      '#themeSegmented [data-theme="' + settings.theme + '"]'
    );
    if (activeThemeBtn) {
      document.querySelectorAll('#themeSegmented button').forEach((b) => b.classList.remove('active'));
      activeThemeBtn.classList.add('active');
    }

    if (motionToggle) motionToggle.checked = settings.motion;
    document.documentElement.setAttribute(
      'data-motion',
      settings.motion ? 'on' : 'off'
    );
    if (hapticsToggle) hapticsToggle.checked = settings.haptics;
    if (soundToggle) soundToggle.checked = settings.sound;
    if (defaultDieSelect) defaultDieSelect.value = String(settings.defaultDie);
    if (greetingToggle) greetingToggle.checked = settings.greeting;

    selectedDie = settings.defaultDie;
    document.querySelectorAll('.die-btn').forEach((b: any) => {
      b.classList.toggle(
        'active',
        parseInt(b.dataset.die, 10) === settings.defaultDie
      );
    });

    /* ============ Greeting coin flip ============ */
    let coinTimer: any = null;
    if (settings.greeting) {
      coinTimer = setTimeout(() => {
        const coinBtn = document.querySelector('.die-btn[data-die="2"]');
        if (coinBtn) {
          selectedDie = 2;
          document.querySelectorAll('.die-btn').forEach((x) => x.classList.remove('active'));
          coinBtn.classList.add('active');
        }
        doRoll(2, 'the portal greets you');
      }, 500);
    }

    /* ============ RECIPIES & COOKING PORTAL ============ */
    let recipesArr: any[] = store.get('recipes', []).filter((r: any) => !r.id.startsWith('rec_default_'));
    store.set('recipes', recipesArr);

    // Load Pantry Staples Checked list
    let pantryChecked: string[] = store.get('pantryChecked', []);
    let customPantryItems: string[] = store.get('customPantryItems', []);

    // Current active recipe for modal
    let activeRecipe: any = null;
    let cookingTimerInterval: any = null;
    let cookingTimerSecondsLeft = 0;

    // Mode toggling (Transcribe Link vs manual write)
    const modeTranscribeBtn = document.getElementById('modeTranscribeBtn');
    const modeCreateManualBtn = document.getElementById('modeCreateManualBtn');
    const transcriptionForm = document.getElementById('transcriptionForm');
    const manualRecipeForm = document.getElementById('manualRecipeForm');

    if (modeTranscribeBtn && modeCreateManualBtn && transcriptionForm && manualRecipeForm) {
      modeTranscribeBtn.addEventListener('click', () => {
        haptic(8);
        modeTranscribeBtn.classList.add('text-[#ff7597]', 'border-b-2', 'border-[#ff7597]');
        modeTranscribeBtn.classList.remove('text-[#b4aae2]');
        modeCreateManualBtn.classList.remove('text-[#ff7597]', 'border-b-2', 'border-[#ff7597]');
        modeCreateManualBtn.classList.add('text-[#b4aae2]');

        transcriptionForm.classList.remove('hidden');
        manualRecipeForm.classList.add('hidden');
      });

      modeCreateManualBtn.addEventListener('click', () => {
        haptic(8);
        modeCreateManualBtn.classList.add('text-[#ff7597]', 'border-b-2', 'border-[#ff7597]');
        modeCreateManualBtn.classList.remove('text-[#b4aae2]');
        modeTranscribeBtn.classList.remove('text-[#ff7597]', 'border-b-2', 'border-[#ff7597]');
        modeTranscribeBtn.classList.add('text-[#b4aae2]');

        manualRecipeForm.classList.remove('hidden');
        transcriptionForm.classList.add('hidden');
      });
    }

    // Magic Clipboard Fast Paste parser
    const magicPasteParseBtn = document.getElementById('magicPasteParseBtn');
    const magicPasteInput = document.getElementById('magicPasteInput') as HTMLTextAreaElement | null;
    if (magicPasteParseBtn && magicPasteInput) {
      magicPasteParseBtn.addEventListener('click', () => {
        const text = magicPasteInput.value.trim();
        if (!text) {
          toast('Please paste some text first!', 'warn');
          haptic(14);
          return;
        }

        haptic([40, 50]);

        // Smart parser
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return;

        let detectedTitle = '';
        let detectedPrep = '';
        let detectedCook = '';
        let detectedServings = '';
        const detectedIngredients: string[] = [];
        const detectedDirections: string[] = [];
        let detectedSecretTip = '';

        let sectionMode: 'none' | 'ingredients' | 'directions' | 'tips' = 'none';

        for (let i = 0; i < lines.length; i++) {
          const rawLine = lines[i];
          const cleanLine = rawLine.replace(/[\*#_`~]/g, '').trim();
          
          if (!cleanLine) continue;
          const lower = cleanLine.toLowerCase();

          // Title detection - take first line unless it's a section header
          if (!detectedTitle) {
            if (!lower.startsWith('ingredients') && 
                !lower.startsWith('directions') && 
                !lower.startsWith('instructions') && 
                !lower.startsWith('steps') && 
                !lower.startsWith('prep time') && 
                !lower.startsWith('cook time') && 
                !lower.startsWith('servings') &&
                !lower.startsWith('prep:') &&
                !lower.startsWith('cook:')) {
              detectedTitle = cleanLine;
              continue;
            }
          }

          // Section headers switching
          if (/(?:ingredients|ingredients:|shopping\s*list|what\s*you\s*need)/i.test(cleanLine) && cleanLine.length < 24) {
            sectionMode = 'ingredients';
            continue;
          }
          if (/(?:directions|directions:|instructions|instructions:|steps|steps:|method|preparation|how\s*to\s*make)/i.test(cleanLine) && cleanLine.length < 24) {
            sectionMode = 'directions';
            continue;
          }
          if (/(?:tips?|notes?|secret|pro-tip|pro\s*tip)/i.test(cleanLine) && cleanLine.length < 24) {
            sectionMode = 'tips';
            continue;
          }

          // Search embedded info like "prep time: 10 mins" in random lines
          if (!detectedPrep) {
            const pm = cleanLine.match(/(?:prep(?:\s*time)?\s*[:\-]\s*)([0-9a-zA-Z\s\-]+)/i);
            if (pm) { detectedPrep = pm[1].trim(); continue; }
          }
          if (!detectedCook) {
            const cm = cleanLine.match(/(?:cook(?:\s*time)?\s*[:\-]\s*)([0-9a-zA-Z\s\-]+)/i);
            if (cm) { detectedCook = cm[1].trim(); continue; }
          }
          if (!detectedServings) {
            const sm = cleanLine.match(/(?:servings\s*[:\-]\s*)([0-9a-zA-Z\s\-]+)/i);
            if (sm) { detectedServings = sm[1].trim(); continue; }
          }

          // Line processing based on active section mode
          if (sectionMode === 'ingredients') {
            // Strip bullets or list numbers
            let item = cleanLine.replace(/^[\s\-*•+🧄🧅🥛🧀🥖🍗🥩🧂🍲🥚🍜🍚🍟🍕🌭🛒]*\s*/, '').trim();
            item = item.replace(/^\d+[\s\.)\-]\s*/, '').trim(); // "1. ", "2) "
            if (item) detectedIngredients.push(item);
          } else if (sectionMode === 'directions') {
            let step = cleanLine.replace(/^[\s\-*•+]*\s*/, '').trim();
            step = step.replace(/^(?:step\s*)?\d+[\s\.)\-:]\s*/i, '').trim(); // e.g., "1. " or "Step 1: "
            if (step) detectedDirections.push(step);
          } else if (sectionMode === 'tips') {
            if (!detectedSecretTip) {
              detectedSecretTip = cleanLine.replace(/^(?:tip|chef\s*tip|pro\s*tip|note)\s*[:\-]\s*/i, '').trim();
            }
          } else {
            // Fallback guesses
            if (/^[\-*•+]\s*/.test(rawLine)) {
              detectedIngredients.push(cleanLine.replace(/^[\s\-*•+]*\s*/, '').trim());
            } else if (/^\d+[\s\.)]/.test(rawLine)) {
              detectedDirections.push(cleanLine.replace(/^\d+[\s\.)\-]\s*/, '').trim());
            }
          }
        }

        // Fill form
        const titleField = document.getElementById('manualRecipeTitle') as HTMLInputElement | null;
        const prepField = document.getElementById('manualRecipePrep') as HTMLInputElement | null;
        const cookField = document.getElementById('manualRecipeCook') as HTMLInputElement | null;
        const servingsField = document.getElementById('manualRecipeServings') as HTMLInputElement | null;
        const ingredientsField = document.getElementById('manualRecipeIngredients') as HTMLTextAreaElement | null;
        const directionsField = document.getElementById('manualRecipeDirections') as HTMLTextAreaElement | null;
        const tipField = document.getElementById('manualRecipeSecretTip') as HTMLInputElement | null;

        if (titleField && detectedTitle) titleField.value = detectedTitle;
        if (prepField && detectedPrep) prepField.value = detectedPrep;
        if (cookField && detectedCook) cookField.value = detectedCook;
        if (servingsField && detectedServings) servingsField.value = detectedServings;
        if (tipField && detectedSecretTip) tipField.value = detectedSecretTip;

        if (ingredientsField && detectedIngredients.length > 0) {
          ingredientsField.value = detectedIngredients.join('\n');
        }
        if (directionsField && detectedDirections.length > 0) {
          directionsField.value = detectedDirections.join('\n');
        }

        toast('Sorted recipe details populated! Review below, then click Save.', 'success');
      });
    }

    // Save custom manual recipe listener
    const saveManualRecipeBtn = document.getElementById('saveManualRecipeBtn');
    if (saveManualRecipeBtn) {
      saveManualRecipeBtn.addEventListener('click', () => {
        const titleInput = document.getElementById('manualRecipeTitle') as HTMLInputElement | null;
        const platformSelect = document.getElementById('manualRecipePlatform') as HTMLSelectElement | null;
        const diffSelect = document.getElementById('manualRecipeDifficulty') as HTMLSelectElement | null;
        const prepInput = document.getElementById('manualRecipePrep') as HTMLInputElement | null;
        const cookInput = document.getElementById('manualRecipeCook') as HTMLInputElement | null;
        const servingsInput = document.getElementById('manualRecipeServings') as HTMLInputElement | null;
        const ingTextArea = document.getElementById('manualRecipeIngredients') as HTMLTextAreaElement | null;
        const dirTextArea = document.getElementById('manualRecipeDirections') as HTMLTextAreaElement | null;
        const tipInput = document.getElementById('manualRecipeSecretTip') as HTMLInputElement | null;

        const title = titleInput?.value.trim() || '';
        if (!title) {
          toast('Please specify a custom Recipe Name!', 'warn');
          haptic(14);
          return;
        }

        const ingText = ingTextArea?.value.trim() || '';
        const dirText = dirTextArea?.value.trim() || '';

        const parsedIngredients = ingText.split('\n').map(line => {
          const l = line.trim();
          if (!l) return null;
          const match = l.match(/^(\d+(\/\d+)?\s*\w*\.?)\s+(.*)$/);
          if (match) {
            return { name: match[3], qty: match[1], done: false };
          }
          return { name: l, qty: '1 unit', done: false };
        }).filter(Boolean);

        const parsedDirections = dirText.split('\n').map(line => line.trim()).filter(Boolean);

        if (parsedIngredients.length === 0) {
          toast('Specify at least one ingredient!', 'warn');
          haptic(14);
          return;
        }
        if (parsedDirections.length === 0) {
          toast('Specify at least one cooking step!', 'warn');
          haptic(14);
          return;
        }

        const newId = `rec_manual_${Date.now()}`;
        const manualRecipe = {
          id: newId,
          title: title,
          platform: platformSelect?.value || 'custom',
          url: '',
          difficulty: diffSelect?.value || 'Easy',
          prepTime: prepInput?.value.trim() || '10 mins',
          cookTime: cookInput?.value.trim() || '15 mins',
          servings: servingsInput?.value.trim() || '2 portions',
          ingredients: parsedIngredients,
          directions: parsedDirections,
          secretTip: tipInput?.value.trim() || 'Cook thoroughly over fire.',
          chefNotes: 'Custom handcrafted recipe.'
        };

        recipesArr.unshift(manualRecipe);
        store.set('recipes', recipesArr);

        // Clear values
        if (titleInput) titleInput.value = '';
        if (prepInput) prepInput.value = '';
        if (cookInput) cookInput.value = '';
        if (servingsInput) servingsInput.value = '';
        if (ingTextArea) ingTextArea.value = '';
        if (dirTextArea) dirTextArea.value = '';
        if (tipInput) tipInput.value = '';

        renderRecipesGrid();
        haptic([50, 100]);
        toast('Custom recipe saved to Codex!', 'success');

        // Automatically open the new handcrafted recipe modal
        setTimeout(() => {
          openRecipeModal(newId);
        }, 300);
      });
    }

    // Subtab switching
    const recipeTabSwitcher = document.getElementById('recipeTabSwitcher');
    if (recipeTabSwitcher) {
      recipeTabSwitcher.querySelectorAll('button').forEach((b: any) => {
        b.addEventListener('click', () => {
          haptic(8);
          recipeTabSwitcher.querySelectorAll('button').forEach((x: any) => x.classList.remove('active'));
          b.classList.add('active');
          
          const tabName = b.dataset.tab;
          document.querySelectorAll('.recipe-tab-content').forEach((tc: any) => {
            tc.classList.add('hidden');
          });
          const targetTab = document.getElementById('recipeTab-' + tabName);
          if (targetTab) targetTab.classList.remove('hidden');

          if (tabName === 'fusion') {
            updateFusionSelectionDisplay();
          }
        });
      });
    }

    // Helper: update tab count labels
    function updateTabLabels() {
      const switcher = document.getElementById('recipeTabSwitcher');
      if (switcher) {
        const codexBtn = switcher.querySelector('[data-tab="codex"]');
        if (codexBtn) {
          codexBtn.textContent = `Saved Codex (${recipesArr.length})`;
        }
      }
    }

    // SEARCH & FILTER FUNCTION
    const searchRecipesInput = document.getElementById('searchRecipesInput') as HTMLInputElement | null;
    if (searchRecipesInput) {
      searchRecipesInput.addEventListener('input', () => {
        renderRecipesGrid();
      });
    }

    // RENDERING RECIPES GRID METHOD
    function renderRecipesGrid() {
      const grid = document.getElementById('recipeGrid');
      if (!grid) return;
      grid.innerHTML = '';

      const query = searchRecipesInput ? searchRecipesInput.value.toLowerCase().trim() : '';
      
      const filtered = recipesArr.filter(r => {
        if (!query) return true;
        const matchesTitle = r.title.toLowerCase().includes(query);
        const matchesIngredients = r.ingredients.some((ing: any) => ing.name.toLowerCase().includes(query));
        return matchesTitle || matchesIngredients;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="card p-6 text-center select-none border border-dashed border-[#44387a]/40 bg-[#150f2e]/20 rounded-2xl">
            <span class="text-3xl block mb-2">🍽️</span>
            <p class="text-xs text-[#b4aae2]/60 font-semibold mb-1">No matching recipes found</p>
            <p class="text-[9.5px] text-[#b4aae2]/40">Type another query or transcribe a social video link above!</p>
          </div>
        `;
        return;
      }

      filtered.forEach((r: any) => {
        // Platform classes
        let textClass = 'text-pink-400';
        let bgClass = 'bg-pink-500/10 border-pink-500/20';
        let iconEmoji = '🍜';

        if (r.platform === 'youtube') {
          textClass = 'text-red-400';
          bgClass = 'bg-red-500/10 border-red-500/20';
          iconEmoji = '🍲';
        } else if (r.platform === 'instagram') {
          textClass = 'text-purple-400';
          bgClass = 'bg-purple-500/10 border-purple-500/20';
          iconEmoji = '🥞';
        } else if (r.platform === 'facebook') {
          textClass = 'text-blue-400';
          bgClass = 'bg-blue-500/10 border-blue-500/20';
          iconEmoji = '🍔';
        } else if (r.platform === 'fusion') {
          textClass = 'text-amber-400';
          bgClass = 'bg-amber-500/10 border-amber-500/20';
          iconEmoji = '⚗️';
        } else if (r.platform === 'pantry') {
          textClass = 'text-emerald-400';
          bgClass = 'bg-emerald-500/10 border-emerald-500/20';
          iconEmoji = '🍳';
        } else if (r.platform === 'custom') {
          textClass = 'text-[#ffe9b8]';
          bgClass = 'bg-amber-500/10 border-amber-500/20';
          iconEmoji = '📖';
        }

        const card = document.createElement('div');
        card.className = `card p-3.5 border border-[#44387a]/40 bg-gradient-to-b from-[#181134] to-[#0c081e] rounded-2xl flex flex-col justify-between hover:border-[#ff7597]/50 transition-all duration-300 relative group`;
        card.id = `card_recipe_${r.id}`;

        const tagLabel = r.platform === 'custom' ? 'Handcrafted' 
          : r.platform === 'pantry' ? 'Pantry Alchemy' 
          : r.platform === 'fusion' ? 'Fused Potion' 
          : `${r.platform} video`;

        card.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-2.5">
              <span class="text-2xl pt-0.5 shrink-0 select-none">${iconEmoji}</span>
              <div class="flex flex-col select-none">
                <span class="text-[8px] font-bold tracking-widest uppercase font-mono px-2 py-0.5 rounded-full border ${bgClass} ${textClass} w-fit mb-1.5">${tagLabel}</span>
                <h4 class="text-xs font-bold text-white leading-snug cursor-pointer hover:text-[#ff7597] transition-colors duration-200 uppercase tracking-wide flex-grow" data-open="${r.id}" style="font-family: 'Cormorant', serif;">${r.title}</h4>
              </div>
            </div>
            
            <div class="flex items-center gap-2 select-none shrink-0 pt-0.5">
              <input 
                type="checkbox" 
                data-fuse-select="${r.id}"
                class="w-3.5 h-3.5 accent-[#ff7597] cursor-pointer" 
                title="Select recipe to fuse"
              />
              <button 
                data-delete-recipe="${r.id}"
                className="w-5 h-5 flex items-center justify-center text-red-400/60 hover:text-red-400 bg-[#120a24]/80 hover:bg-red-500/10 border border-red-500/10 rounded-md transition-all duration-200 cursor-pointer focus:outline-none"
                title="Delete from Codex"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-1.5 border-t border-[#44387a]/20 pt-2.5 mt-3 text-center leading-none select-none text-[9.5px] text-[#b4aae2]/70 font-mono">
            <div>
              <span class="block text-[#ffe9b8] font-bold mb-0.5">${r.difficulty}</span>
              <span class="text-[8px] opacity-60">diff</span>
            </div>
            <div>
              <span class="block text-white font-semibold mb-0.5">${r.prepTime}</span>
              <span class="text-[8px] opacity-60">prep</span>
            </div>
            <div>
              <span class="block text-white font-semibold mb-0.5">${r.cookTime}</span>
              <span class="text-[8px] opacity-60">cook</span>
            </div>
          </div>
        `;

        // Direct click event listener for open details
        const titleEl = card.querySelector('[data-open]');
        if (titleEl) {
          titleEl.addEventListener('click', () => {
            openRecipeModal(r.id);
          });
        }

        // Delete button listener
        const delBtn = card.querySelector('[data-delete-recipe]');
        if (delBtn) {
          delBtn.addEventListener('click', (e: Event) => {
            e.stopPropagation();
            haptic(14);
            if (confirm(`Do you want to delete "${r.title}" from your Alchemical Codex?`)) {
              recipesArr = recipesArr.filter(item => item.id !== r.id);
              store.set('recipes', recipesArr);
              renderRecipesGrid();
              updateTabLabels();
              toast('Recipe removed from codex', 'warn');
            }
          });
        }

        // Checkbox listener to update merge list dynamically
        const fuseCheck = card.querySelector('[data-fuse-select]') as HTMLInputElement | null;
        if (fuseCheck) {
          fuseCheck.addEventListener('change', () => {
            haptic(10);
            updateFusionSelectionDisplay();
          });
        }

        grid.appendChild(card);
      });

      updateTabLabels();
    }

    // INTERACTIVE DETAILS MODAL LOADER
    function openRecipeModal(id: string) {
      const r = recipesArr.find(item => item.id === id);
      if (!r) return;
      activeRecipe = r;
      haptic(12);

      // Stop any running cooking timer first
      resetCookingTimer();

      const modal = document.getElementById('recipeDetailModal');
      if (!modal) return;

      // Unhide
      modal.classList.remove('hidden');

      // Hydrate
      const titleEl = document.getElementById('modalTitle');
      if (titleEl) titleEl.textContent = r.title;

      const badge = document.getElementById('modalPlatformBadge');
      if (badge) {
        badge.textContent = r.platform.toUpperCase();
        badge.className = `text-[8px] font-mono font-bold px-2 py-0.5 rounded-md inline-block w-fit uppercase mb-1 `;
        if (r.platform === 'youtube') badge.classList.add('bg-red-500/10', 'text-red-400');
        else if (r.platform === 'tiktok') badge.classList.add('bg-pink-500/10', 'text-pink-400');
        else if (r.platform === 'instagram') badge.classList.add('bg-purple-500/10', 'text-purple-400');
        else if (r.platform === 'facebook') badge.classList.add('bg-blue-500/10', 'text-blue-400');
        else badge.classList.add('bg-amber-500/10', 'text-amber-400');
      }

      const diffLabel = document.getElementById('modalDifficulty');
      if (diffLabel) diffLabel.textContent = r.difficulty;

      const prepLabel = document.getElementById('modalPrepTime');
      if (prepLabel) prepLabel.textContent = r.prepTime;

      const cookLabel = document.getElementById('modalCookTime');
      if (cookLabel) cookLabel.textContent = r.cookTime;

      const servLabel = document.getElementById('modalServings');
      if (servLabel) servLabel.textContent = r.servings;

      const sourceSub = document.getElementById('modalVideoSubtitle');
      if (sourceSub) sourceSub.textContent = r.url ? r.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 32) + '...' : 'unspecified video address';

      const sourceLink = document.getElementById('modalVideoLink') as HTMLAnchorElement | null;
      if (sourceLink) {
        sourceLink.href = r.url || '#';
        sourceLink.style.display = r.url ? 'inline-block' : 'none';
      }

      const secretTip = document.getElementById('modalSecretTip');
      if (secretTip) secretTip.textContent = r.secretTip || 'Whisk your ingredients thoroughly before applying fire!';

      const inputNotes = document.getElementById('modalChefNotesInput') as HTMLTextAreaElement | null;
      if (inputNotes) inputNotes.value = r.chefNotes || '';

      // Ingredients with interactive checkboxes
      const ingCont = document.getElementById('modalIngredientsList');
      if (ingCont) {
        ingCont.innerHTML = '';
        r.ingredients.forEach((ing: any, idx: number) => {
          const item = document.createElement('div');
          item.className = 'flex items-center justify-between gap-3 text-xs py-1 border-b border-[#44387a]/10 last:border-0';
          item.innerHTML = `
            <div class="flex items-center gap-2.5">
              <input 
                type="checkbox" 
                data-ing-idx="${idx}"
                ${ing.done ? 'checked' : ''}
                class="w-4 h-4 accent-[#ff7597] cursor-pointer"
              />
              <span class="text-[#faebd7] font-sans ${ing.done ? 'line-through text-[#b4aae2]/40' : ''}">${ing.name}</span>
            </div>
            <span class="font-mono text-[10.5px] font-bold text-[#ff7597] shrink-0">${ing.qty}</span>
          `;
          
          item.querySelector('input')?.addEventListener('change', (e: any) => {
            haptic(11);
            const isChecked = e.target.checked;
            ing.done = isChecked;
            
            // Reapply cross styling
            const textSpan = item.querySelector('span');
            if (textSpan) textSpan.className = `text-[#faebd7] font-sans ${isChecked ? 'line-through text-[#b4aae2]/40' : ''}`;
            
            // Commit to parent array immediately
            store.set('recipes', recipesArr);
            checkAllIngredientsShine();
          });

          ingCont.appendChild(item);
        });
        checkAllIngredientsShine();
      }

      // Directions list layout
      const dirCont = document.getElementById('modalDirectionsList');
      if (dirCont) {
        dirCont.innerHTML = '';
        r.directions.forEach((step: string, idx: number) => {
          const stepDiv = document.createElement('div');
          stepDiv.className = 'flex gap-3 text-[11.5px] items-start';
          stepDiv.innerHTML = `
            <div class="w-5 h-5 rounded-full bg-[#ff7597]/15 border border-[#ff7597]/40 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono text-[#ff7597] mt-0.5 select-none">${idx + 1}</div>
            <p class="leading-relaxed text-[#b4aae2]/90 font-sans">${step}</p>
          `;
          dirCont.appendChild(stepDiv);
        });
      }
    }

    function checkAllIngredientsShine() {
      const checkboxes = document.querySelectorAll('#modalIngredientsList input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      const modalBox = document.querySelector('#modalIngredientsList');
      if (checkboxes.length === 0 || !modalBox) return;

      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      if (allChecked) {
        modalBox.classList.add('border-green-500/40', 'bg-green-500/5');
      } else {
        modalBox.classList.remove('border-green-500/40', 'bg-green-500/5');
      }
    }

    // Modal close
    const closeModalBtn = document.getElementById('closeRecipeModalBtn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        haptic(14);
        resetCookingTimer();
        document.getElementById('recipeDetailModal')?.classList.add('hidden');
        renderRecipesGrid();
      });
    }

    // Save active chef notes on key input
    const modalChefNotesInput = document.getElementById('modalChefNotesInput') as HTMLTextAreaElement | null;
    if (modalChefNotesInput) {
      modalChefNotesInput.addEventListener('input', () => {
        if (activeRecipe) {
          activeRecipe.chefNotes = modalChefNotesInput.value;
          store.set('recipes', recipesArr);
        }
      });
    }

    // BUILT-IN COOKING TIMER CONTROLLER
    const cookingTimerBtn = document.getElementById('cookingTimerBtn');
    const cookingTimerDisplay = document.getElementById('cookingTimerDisplay');
    
    if (cookingTimerBtn && cookingTimerDisplay) {
      cookingTimerBtn.addEventListener('click', () => {
        haptic(8);
        if (cookingTimerInterval) {
          // Stop timer
          resetCookingTimer();
        } else {
          // Trigger timer start using pre-determined duration or default 3 minutes (185s)
          if (cookingTimerSecondsLeft === 0) {
            cookingTimerSecondsLeft = 180; // Default
          }
          startCookingTimerEng();
        }
      });
    }

    // Preset minutes click hooks
    document.querySelectorAll('[data-mins]').forEach((btn: any) => {
      btn.addEventListener('click', () => {
        haptic(10);
        cookingTimerSecondsLeft = parseInt(btn.dataset.mins, 10) * 60;
        updateCookingTimerDisplay();
      });
    });

    function updateCookingTimerDisplay() {
      if (!cookingTimerDisplay) return;
      const mins = Math.floor(cookingTimerSecondsLeft / 60);
      const secs = cookingTimerSecondsLeft % 60;
      cookingTimerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function startCookingTimerEng() {
      if (!cookingTimerBtn || !cookingTimerDisplay) return;
      cookingTimerBtn.textContent = 'STOP TIMER';
      cookingTimerBtn.classList.replace('from-amber-500', 'from-red-500');
      cookingTimerBtn.classList.replace('to-amber-600', 'to-red-600');
      
      cookingTimerInterval = setInterval(() => {
        if (cookingTimerSecondsLeft > 0) {
          cookingTimerSecondsLeft--;
          updateCookingTimerDisplay();
          
          if (cookingTimerSecondsLeft === 0) {
            // FINISHED! Alert and Ring
            haptic([100, 50, 100, 50, 150]);
            toast('Cooking Alchemist alert: Cook step is complete! 🛎️', 'warn');
            flashCookingTimerUi();
            resetCookingTimer();
          }
        } else {
          resetCookingTimer();
        }
      }, 1000);
    }

    function resetCookingTimer() {
      if (cookingTimerInterval) {
        clearInterval(cookingTimerInterval);
        cookingTimerInterval = null;
      }
      if (cookingTimerBtn) {
        cookingTimerBtn.textContent = 'START TIMER';
        cookingTimerBtn.classList.replace('from-red-500', 'from-amber-500');
        cookingTimerBtn.classList.replace('to-red-600', 'to-amber-600');
      }
      updateCookingTimerDisplay();
    }

    function flashCookingTimerUi() {
      const display = document.getElementById('cookingTimerDisplay');
      if (display) {
        display.classList.add('text-red-500', 'animate-bounce');
        setTimeout(() => {
          display.classList.remove('text-red-500', 'animate-bounce');
        }, 3000);
      }
    }


    // FUSION BENCH CONTROLLING LOGIC
    function updateFusionSelectionDisplay() {
      const listCont = document.getElementById('fusionSelectionList');
      const fuseBtn = document.getElementById('fuseRecipesBtn') as HTMLButtonElement | null;
      
      if (!listCont) return;

      const checkedBoxes = Array.from(document.querySelectorAll('[data-fuse-select]:checked')) as HTMLInputElement[];
      const checkedIds = checkedBoxes.map(cb => cb.dataset.fuseSelect);

      if (checkedIds.length === 0) {
        listCont.innerHTML = `<div class="italic text-[#b4aae2]/50 text-[10.5px]">No recipes selected. Return to Saved Codex tab to check fusion boxes!</div>`;
        if (fuseBtn) {
          fuseBtn.disabled = true;
          fuseBtn.textContent = 'AUTOCLAVE RECIPES ⚗️';
        }
        return;
      }

      listCont.innerHTML = '';
      const selectedRecipes = recipesArr.filter(r => checkedIds.includes(r.id));
      
      selectedRecipes.forEach(sr => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 py-1 px-2.5 rounded-lg bg-[#2e1d16]/30 border border-[#44387a]/20 text-[11px] text-[#faebd7]';
        row.innerHTML = `🧬 <span class="font-bold truncate">${sr.title}</span>`;
        listCont.appendChild(row);
      });

      if (fuseBtn) {
        if (selectedRecipes.length >= 2) {
          fuseBtn.disabled = false;
          fuseBtn.textContent = `FUSE ${selectedRecipes.length} CODICES ⚗️`;
        } else {
          fuseBtn.disabled = true;
          fuseBtn.textContent = 'SELECT MORE FOR FUSION';
        }
      }
    }

    // Merge Click actions
    const fuseRecipesBtn = document.getElementById('fuseRecipesBtn');
    if (fuseRecipesBtn) {
      fuseRecipesBtn.addEventListener('click', () => {
        haptic([40, 30, 40, 30, 80]);
        executeFusionProcess();
      });
    }

    function executeFusionProcess() {
      const checkedBoxes = Array.from(document.querySelectorAll('[data-fuse-select]:checked')) as HTMLInputElement[];
      const checkedIds = checkedBoxes.map(cb => cb.dataset.fuseSelect);
      const selected = recipesArr.filter(r => checkedIds.includes(r.id));
      if (selected.length < 2) return;

      const btn = document.getElementById('fuseRecipesBtn') as HTMLButtonElement | null;
      const label = document.getElementById('fusionStatusLabel');
      const flames = document.getElementById('fusionFlames');
      const kettle = document.getElementById('fusionCauldron');

      if (btn) btn.disabled = true;
      if (flames) flames.setAttribute('fill', '#f59e0b'); // Turn flame golden!
      if (kettle) kettle.classList.add('animate-bounce');

      let timer = 0;
      const textSteps = [
        'IGNITING MAGIC FURNACE...',
        'PULVERIZING INGREDIENTS...',
        'COMBINING CHEMICAL COMPOUNDS...',
        'CONSOLIDATING POTION CODES...',
        'SYNTESIZING EXOTIC FLAVORS!'
      ];

      const interval = setInterval(() => {
        if (timer < textSteps.length) {
          if (label) {
            label.textContent = textSteps[timer];
            label.className = 'text-[10px] uppercase font-mono font-bold mt-3 text-amber-400';
          }
          haptic(12);
          timer++;
        } else {
          clearInterval(interval);
          completeFusionCreation(selected);
        }
      }, 350);
    }

    function completeFusionCreation(selected: any[]) {
      const btn = document.getElementById('fuseRecipesBtn') as HTMLButtonElement | null;
      const label = document.getElementById('fusionStatusLabel');
      const flames = document.getElementById('fusionFlames');
      const kettle = document.getElementById('fusionCauldron');

      if (flames) flames.setAttribute('fill', '#ff7597');
      if (kettle) kettle.classList.remove('animate-bounce');

      // Create a beautiful alchemical fuse name
      const titleParts = selected.map(s => s.title.replace(/Viral|TikTok|Babish’s|Instagram|Oven|Baked/g, '').trim());
      const newTitle = `${titleParts[0].slice(0, 15)} ${titleParts[1].slice(0, 15)} Hybrid Potion`;

      // Consolidate ingredients list
      const mergedIngredients: any[] = [];
      selected.forEach(s => {
        s.ingredients.forEach((ing: any) => {
          if (!mergedIngredients.some(x => x.name.toLowerCase() === ing.name.toLowerCase())) {
            mergedIngredients.push({ name: ing.name, qty: ing.qty, done: false });
          }
        });
      });

      // Assemble steps
      const newDirections = [
        `Whisk your ${mergedIngredients[0]?.name || 'base elements'} while heating the alchemical burner.`,
        `Gently simmer the combined compounds (${mergedIngredients.slice(1, 4).map(x => x.name).join(', ')}).`,
        `Infuse slowly under low fire while incorporating the remainder of your alchemical codex elements.`,
        `Garnish beautifully with custom syrups, serve hot inside a secure dungeon container!`
      ];

      const newId = `rec_fuse_${Date.now()}`;
      const fusedRecipe = {
        id: newId,
        title: `Fused ${newTitle} ⚗️`,
        platform: 'fusion',
        url: '',
        difficulty: 'Hard',
        prepTime: '15 mins',
        cookTime: '30 mins',
        servings: '3 servings',
        ingredients: mergedIngredients,
        directions: newDirections,
        secretTip: 'This exotic food hybrid fuses contradictory recipes. Pair with absolute culinary adventure!',
        chefNotes: 'Potent alchemical food compound. Generated via dual crucible merges.'
      };

      recipesArr.unshift(fusedRecipe);
      store.set('recipes', recipesArr);

      // Uncheck old items
      document.querySelectorAll('[data-fuse-select]').forEach((cb: any) => {
        cb.checked = false;
      });

      renderRecipesGrid();
      updateFusionSelectionDisplay();
      
      // Toast and pop
      toast('Fusion complete! Potion appended to Codex', 'success');
      haptic([80, 50, 120]);

      if (label) {
        label.textContent = 'POTION CRUCIBLE READY';
        label.className = 'text-[10px] uppercase font-mono font-bold mt-3 text-green-400';
      }

      // Automatically open the fused recipe item to delight the user!
      setTimeout(() => {
        openRecipeModal(newId);
      }, 500);
    }



    // SOCIAL LINK DECOPRILER / EXTRACTOR ENGINE
    const extractRecipeInput = document.getElementById('extractRecipeInput') as HTMLInputElement | null;
    const extractRecipeBtn = document.getElementById('extractRecipeBtn');
    
    if (extractRecipeBtn) {
      extractRecipeBtn.addEventListener('click', () => {
        if (!extractRecipeInput || !extractRecipeInput.value.trim()) {
          toast('Specify a social media link to decode!', 'warn');
          haptic(14);
          return;
        }

        haptic(10);
        executeExtractSimulation(extractRecipeInput.value.trim());
      });
    }

    function executeExtractSimulation(linkUrl: string) {
      const logsCont = document.getElementById('extractionLogsContainer');
      const logsList = document.getElementById('extractionLogsList');
      const btn = document.getElementById('extractRecipeBtn') as HTMLButtonElement | null;
      
      if (!logsCont || !logsList) return;

      // Show container
      logsCont.classList.remove('hidden');
      logsList.innerHTML = '';
      if (btn) btn.disabled = true;

      const stepsLogs = [
        'Connecting to social media viewport API...',
        'Parsing audio spectrum & harvesting captions...',
        'Decoding frame transitions for ingredient visual matching...',
        'Weighing element units & estimating temperature limits...',
        'Compiling gourmet D&D recipe schema...'
      ];

      let logTimer = 0;
      const logInterval = setInterval(() => {
        if (logTimer < stepsLogs.length) {
          const l = document.createElement('div');
          l.className = 'fade-in';
          l.textContent = `> ${stepsLogs[logTimer]}`;
          logsList.appendChild(l);
          
          // Scroll bottom
          logsCont.scrollTop = logsCont.scrollHeight;
          haptic(7);
          logTimer++;
        } else {
          clearInterval(logInterval);
          finalizeExtractionResult(linkUrl);
        }
      }, 300);
    }

    function finalizeExtractionResult(linkUrl: string) {
      const logsCont = document.getElementById('extractionLogsContainer');
      const btn = document.getElementById('extractRecipeBtn') as HTMLButtonElement | null;
      if (logsCont) logsCont.classList.add('hidden');
      if (btn) btn.disabled = false;

      // Deduce platform from host name
      let platform = 'tiktok';
      if (linkUrl.includes('youtube.com') || linkUrl.includes('youtu.be')) platform = 'youtube';
      else if (linkUrl.includes('instagram.com')) platform = 'instagram';
      else if (linkUrl.includes('facebook.com')) platform = 'facebook';

      // Smart dynamic decopiling templates matching keywords from url
      const lower = linkUrl.toLowerCase();
      let dTitle = 'Zesty Basil Feta Pasta';
      let dIngredients = [
        { name: 'Pasta spaghetti noodles', qty: '12 oz', done: false },
        { name: 'Fresh Feta cheese block', qty: '8 oz', done: false },
        { name: 'Cherry Tomatoes', qty: '2 cups', done: false },
        { name: 'Olive oil Extra virgin', qty: '1/3 cup', done: false },
        { name: 'Garlic minced', qty: '4 cloves', done: false },
        { name: 'Fresh basil leaves', qty: '10 leaves', done: false }
      ];
      let dDirections = [
        'Preheat convection cauldron or oven to 400°F (200°C).',
        'Toss whole tomatoes, garlic cloves, and olive oil inside a wide ceramic skillet dish.',
        'Place the block of feta cheese directly in the center of the skillet, rolling inside grease.',
        'Roast in oven for 30 minutes until tomatoes explode and feta is beautifully melted.',
        'Gently crush the baked structures with a grand fork, tossing with hot freshly boiled pasta and fresh basil.'
      ];
      let dDiff = 'Easy';
      let dPrep = '10 mins';
      let dCook = '30 mins';
      let dServ = '3 servings';
      
      if (lower.includes('ramen') || lower.includes('noodle')) {
        dTitle = 'Fiery Chili Soy Instant Scallion Noodles';
        dPrep = '5 mins'; dCook = '5 mins';
        dIngredients = [
          { name: 'Instant Hand-Pulled noodles', qty: '1 block', done: false },
          { name: 'Soy sauce dark', qty: '1.5 tbsp', done: false },
          { name: 'Toasted sesame oil', qty: '1 tsp', done: false },
          { name: 'Crushed raw scallions', qty: '3 tbsp', done: false },
          { name: 'Hot chili crisp oil', qty: '1 tbsp', done: false }
        ];
        dDirections = [
          'Boil instant noodles blocks for 4 minutes in salted cauldrons, draining completely.',
          'Pour raw scallions and chili crisp directly into your glass bowl center.',
          'Flash sizzle the dry spices with a tablespoon of boiling neutral butter or oil.',
          'Whisk soy sauce and sesame oil into the chili grease, adding drained noodles last.'
        ];
      } else if (lower.includes('burger') || lower.includes('steak') || lower.includes('meat') || lower.includes('beef')) {
        dTitle = 'Premium Double Crust Smash Cheese Burgers';
        dDiff = 'Medium'; dPrep = '15 mins'; dCook = '10 mins';
        dIngredients = [
          { name: 'Ground Angus Beef chuck (80/20)', qty: '1/2 lb', done: false },
          { name: 'Slices Premium Cheddar cheese', qty: '2 slices', done: false },
          { name: 'Soft potato buns (buttered)', qty: '1 pair', done: false },
          { name: 'Finely diced sweet onions', qty: '1/4 cup', done: false },
          { name: 'Secret burger mustard mayo sauce', qty: '2 tbsp', done: false }
        ];
        dDirections = [
          'Preheat a cast-iron skillet grid till heavy smoke rises over full heat.',
          'Form burger beef into two dense spherical balls, placing on dry skillet.',
          'Press down with complete metal spatula force till flat crusted discs form.',
          'Season with sea salt, flip in 2 minutes, apply cheese, stack pairs, and serve bunned.'
        ];
      } else if (lower.includes('taco') || lower.includes('birria')) {
        dTitle = 'Gourmet Crispy Smashed Birria Quesatacos';
        dDiff = 'Medium'; dPrep = '15 mins'; dCook = '15 mins';
        dIngredients = [
          { name: 'Pulled dry beef barbacoa', qty: '1 cup', done: false },
          { name: 'Corn tortillas', qty: '3', done: false },
          { name: 'Grated Monterey cheese', qty: '1 cup', done: false },
          { name: 'Cilantro and lime juice', qty: 'for garnish', done: false },
          { name: 'Barbacoa dipping consumé bouillon', qty: '1 cup', done: false }
        ];
        dDirections = [
          'Dip corn tortillas directly into the warm dipping consumé fat layer.',
          'Lay tortillas wet onto a roaring hot skillet, covering with grated cheese and beef.',
          'Fold tacos into crescents, pressing down till exceptionally crispy on borders.',
          'Garnish with onion, cilantro, and squeeze fresh lime. Serve with rich consumé cups.'
        ];
      } else if (lower.includes('cookie') || lower.includes('chocolate') || lower.includes('cake') || lower.includes('sweet') || lower.includes('pudding')) {
        dTitle = 'Salty Chocolate Giant Skillet Fudge Cookie';
        dDiff = 'Easy'; dPrep = '10 mins'; dCook = '15 mins'; dServ = '4 portions';
        dIngredients = [
          { name: 'Unsalted sweet butter melt', qty: '1/2 cup', done: false },
          { name: 'Gourmet dark chocolate chips', qty: '1.5 cups', done: false },
          { name: 'Brown sugar packed', qty: '1/2 cup', done: false },
          { name: 'All-Purpose flour', qty: '1.2 cups', done: false },
          { name: 'Whole egg & vanilla extract', qty: '1 pkg', done: false }
        ];
        dDirections = [
          'Preheat your home convection oven or iron crucible to 350°F (175°C).',
          'Stir warm melted butter, brown sugar, eggs, and vanilla till satin rich.',
          'Fold sifted flour and chocolate chips cleanly, forming dense cookie dough.',
          'Press cookie dough directly into the bottom of a greased cast iron skillet.',
          'Bake for 15 minutes till edge rim is golden brown, leaving center gooey. Top with salt!'
        ];
      } else if (lower.includes('chicken') || lower.includes('wing') || lower.includes('fried')) {
        dTitle = 'Air-Fryer Sticky Honey Garlic Sriracha Wings';
        dPrep = '10 mins'; dCook = '20 mins';
        dIngredients = [
          { name: 'Fresh chicken wings (split)', qty: '1.5 lbs', done: false },
          { name: 'Baking powder and salt', qty: '1 tbsp', done: false },
          { name: 'Liquid raw honey', qty: '1/4 cup', done: false },
          { name: 'Sriracha red chili paste', qty: '2 tbsp', done: false },
          { name: 'Grated raw ginger & garlic', qty: '2 tsp', done: false }
        ];
        dDirections = [
          'Pat splits fully dry with towels, dusting in baking powder & salt for crisp.',
          'Air-fry splits inside baskets at 400°F (200°C) for 20 minutes, shaking midway.',
          'Simmer honey, sriracha, ginger, garlic in a saucepan until sticky glaze wraps.',
          'Toss piping hot wings inside bowls of sticky glaze coating every surface.'
        ];
      } else {
        // Generative platform name templates
        const linkWords = lower.replace(/https?:\/\/|www\.|youtube|tiktok|instagram|facebook|\.com|\.org|\/|video|watch|p/g, ' ').replace(/[^a-zA-Z ]/g, '').trim().split(' ');
        const creatorName = linkWords[0] ? linkWords[0].charAt(0).toUpperCase() + linkWords[0].slice(1) : 'Gourmet';
        const recipeWord = linkWords[1] ? linkWords[1].charAt(0).toUpperCase() + linkWords[1].slice(1) : 'Specialty';
        
        dTitle = `${creatorName}’s Secret ${recipeWord} Delight`;
      }

      const generatedId = `rec_extract_${Date.now()}`;
      const extractedRecipe = {
        id: generatedId,
        title: dTitle,
        platform: platform,
        url: linkUrl,
        difficulty: dDiff,
        prepTime: dPrep,
        cookTime: dCook,
        servings: dServ,
        ingredients: dIngredients,
        directions: dDirections,
        secretTip: 'Watch the video pacing on the social link directly to replicate the creator’s specific flipping speed!',
        chefNotes: `Extracted successfully from: ${linkUrl}`
      };

      recipesArr.unshift(extractedRecipe);
      store.set('recipes', recipesArr);
      
      // Clear input
      if (extractRecipeInput) extractRecipeInput.value = '';

      renderRecipesGrid();
      haptic([50, 100]);
      toast('Social media link transcribed into Codex!', 'success');

      // Bounce and open item!
      setTimeout(() => {
        openRecipeModal(generatedId);
      }, 500);
    }



    // PANTRY STAPLES SYNTHESIS CONTROLLER
    const pantryStaples = [
      'Chicken Breast', 'Eggs', 'Rice', 'Cheddar Cheese', 'Garlic Cloves', 
      'Soy Sauce', 'Butter', 'Bread Loaf', 'Potatoes', 'Avocado', 
      'Milk', 'Chocolate Chips', 'Tomato Sauce', 'Chili Flakes', 'Honey', 'Pasta Noodles'
    ];

    // Combine custom items with default ones
    function renderPantryShelves() {
      const parent = document.getElementById('pantryShelvesGrid');
      if (!parent) return;
      parent.innerHTML = '';

      const fullPantry = Array.from(new Set([...pantryStaples, ...customPantryItems]));

      fullPantry.forEach(item => {
        const isChecked = pantryChecked.includes(item);
        const itemBox = document.createElement('div');
        itemBox.className = `flex items-center gap-2 py-1.5 px-2.5 rounded-xl border border-[#44387a]/20 bg-[#120a24]/40 select-none`;
        itemBox.innerHTML = `
          <input 
            type="checkbox" 
            data-pantry-item="${item}"
            ${isChecked ? 'checked' : ''}
            class="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
          />
          <span class="text-[10.5px] text-[#b4aae2] font-semibold truncate flex-grow">${item}</span>
        `;

        itemBox.querySelector('input')?.addEventListener('change', (e: any) => {
          haptic(8);
          const checked = e.target.checked;
          if (checked) {
            if (!pantryChecked.includes(item)) pantryChecked.push(item);
          } else {
            pantryChecked = pantryChecked.filter(x => x !== item);
          }
          store.set('pantryChecked', pantryChecked);
        });

        parent.appendChild(itemBox);
      });
    }

    // Add item to pantry
    const addPantryBtn = document.getElementById('addPantryBtn');
    const addPantryInput = document.getElementById('addPantryInput') as HTMLInputElement | null;
    if (addPantryBtn && addPantryInput) {
      const handleAdd = () => {
        const val = addPantryInput.value.trim();
        if (!val) return;
        haptic(10);
        if (!customPantryItems.includes(val) && !pantryStaples.includes(val)) {
          customPantryItems.push(val);
          store.set('customPantryItems', customPantryItems);
          
          // Auto-check it
          if (!pantryChecked.includes(val)) pantryChecked.push(val);
          store.set('pantryChecked', pantryChecked);

          addPantryInput.value = '';
          renderPantryShelves();
          toast(`Added "${val}" to cooking storage shelves!`);
        } else {
          toast('Item already stored on shelves!', 'warn');
        }
      };

      addPantryBtn.addEventListener('click', handleAdd);
      addPantryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdd();
      });
    }

    // Clear checked elements
    const clearPantryBtn = document.getElementById('clearPantryBtn');
    if (clearPantryBtn) {
      clearPantryBtn.addEventListener('click', () => {
        haptic(14);
        pantryChecked = [];
        store.set('pantryChecked', pantryChecked);
        renderPantryShelves();
        toast('Pantry checklist reset', 'warn');
      });
    }

    // CREATE FROM PANTRY CLICK ACTION
    const synthesizePantryBtn = document.getElementById('synthesizePantryBtn');
    if (synthesizePantryBtn) {
      synthesizePantryBtn.addEventListener('click', () => {
        if (pantryChecked.length === 0) {
          toast('Check some ingredients on your shelves first!', 'warn');
          haptic(14);
          return;
        }

        haptic(12);
        executePantrySynthesis();
      });
    }

    function executePantrySynthesis() {
      // Formulate custom dynamic recipes using their checked items!
      const items = [...pantryChecked];
      
      let synthTitle = 'Alchemist’s Custom Stir-Fry Concoction';
      let rDiff = 'Medium';
      let rPrep = '10 mins';
      let rCook = '12 mins';

      const listIng = items.map(it => {
        return { name: it, qty: 'as desired', done: false };
      });

      // Assemble instructions dynamically
      const flowDirections = [
        `Meticulously arrange and clean your kitchen workspace, gathering: ${items.join(', ')}.`,
        `Chop and slice solids into equal weight parcels so heating transfers smoothly.`,
        `Preheat your primary cooking cauldron or metal skillet to a medium-high temperature.`,
        `Cook checked pantry elements thoroughly, introducing seasonings, fats, or oils.`,
        `Glaze and toss with available sauces. Garnish warm inside a luxury plate bowls & enjoy!`
      ];

      if (items.includes('Eggs') && items.includes('Rice')) {
        synthTitle = 'Golden Pantry Egg Fried Rice';
        rDiff = 'Easy'; rPrep = '5 mins'; rCook = '8 mins';
      } else if (items.includes('Pasta Noodles') && items.includes('Tomato Sauce')) {
        synthTitle = 'Savory Pantry Tomato Glazed Linguine';
        rDiff = 'Easy'; rCook = '15 mins';
      } else if (items.includes('Chicken Breast') && items.includes('Garlic Cloves')) {
        synthTitle = 'Sautéed Garlic Rosemary Chicken Breast';
        rCook = '15 mins';
      } else if (items.includes('Potatoes') && items.includes('Butter')) {
        synthTitle = 'Satin Smooth Whipped Butter Mashed Potatoes';
        rDiff = 'Easy'; rCook = '20 mins';
      }

      const newId = `rec_synth_${Date.now()}`;
      const customRecipe = {
        id: newId,
        title: `Pantry ${synthTitle} 🍳`,
        platform: 'pantry',
        url: '',
        difficulty: rDiff,
        prepTime: rPrep,
        cookTime: rCook,
        servings: '2 portions',
        ingredients: listIng,
        directions: flowDirections,
        secretTip: 'Since this is synthesized purely using items on hand, adjust cook times according to pan volume!',
        chefNotes: 'Formulated dynamically from kitchen shelves checklists.'
      };

      recipesArr.unshift(customRecipe);
      store.set('recipes', recipesArr);

      renderRecipesGrid();
      haptic([70, 100]);
      toast('Dynamic pantry recipe formulated! 🍳', 'success');

      // Pop details
      setTimeout(() => {
        openRecipeModal(newId);
      }, 500);
    }

    // Initial Renders
    renderRecipesGrid();
    renderPantryShelves();

    return () => {
      clearInterval(clockInterval);
      clearInterval(alarmCheckInterval);
      clearInterval(timerInterval);
      clearInterval(stopwatchInterval);
      if (navSpinFrame) cancelAnimationFrame(navSpinFrame);
      if (canvasAnimFrame) cancelAnimationFrame(canvasAnimFrame);
      if (activeRollInterval) {
        cancelAnimationFrame(activeRollInterval);
        clearTimeout(activeRollInterval);
      }
      if (starfieldResizeHandler) {
        window.removeEventListener('resize', starfieldResizeHandler);
      }
      if (mouseMoveHandler) {
        window.removeEventListener('mousemove', mouseMoveHandler);
      }
      clearTimeout(coinTimer);
      clearTimeout(sheetStatusTimer);
    };
  }, []);

  const haptic = (pattern: any) => {
    if (typeof (window as any).haptic === 'function') {
      (window as any).haptic(pattern);
    }
  };

  return (
    <>
      <div className="nebula-layer"></div>
      <canvas id="starfield"></canvas>

      <header className="flex justify-between items-center py-3 px-4 border-b border-[#2e2454] bg-[#0c081e]/85 backdrop-blur-md sticky top-0 z-50">
        <button className="home-btn flex items-center gap-3 bg-transparent border-none p-0 cursor-pointer text-left focus:outline-none" id="homeBtn" aria-label="Home">
          {/* Glowing Galaxy Swirl Logo Container */}
          <div className="brand-spiral relative w-10 h-10 flex items-center justify-center shrink-0">
            {/* Spinning outward rings */}
            <div className="absolute inset-0 rounded-full border border-dashed border-[#cf4fe6]/40 animate-spin-slow"></div>
            <div className="absolute inset-1.5 rounded-full border border-[1px] border-[#3fd9c7]/30 animate-spin-reverse"></div>
            {/* Glowing gradient core galaxy */}
            <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-[#cf4fe6] via-[#e85f7a] to-[#3fd9c7] opacity-80 blur-[2px] animate-pulse"></div>
            <div className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#fff]"></div>
          </div>
          <div className="brand flex flex-col items-start leading-none gap-0.5">
            <span className="text-[9px] font-semibold tracking-[0.25em] text-[#b4aae2] uppercase leading-none opacity-85">THE</span>
            <span className="text-[17px] font-semibold tracking-[0.12em] text-[#faebd7] uppercase leading-none" style={{ fontFamily: "'Cormorant', serif" }}>
              PORTAL
            </span>
          </div>
        </button>

        {/* Header Right area */}
        <div className="flex items-center gap-4">
          {/* Synced Badge */}
          <div className="hidden sm:flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-[#13efb0]/10 border border-[#13efb0]/35 shadow-[0_0_8px_rgba(19,239,176,0.15)] select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#13efb0] animate-ping"></span>
            <span className="text-[9px] font-bold tracking-[0.1em] text-[#13efb0] uppercase font-mono">SYNCED</span>
          </div>

          {/* Clock Display */}
          <div className="header-clock text-right">
            <div className="clock-time text-[17px] font-bold text-[#faebd7] tracking-[0.02em] font-mono leading-none" id="headerTime">
              09:41 <span className="text-[11px] font-medium text-[#b4aae2]">AM</span>
            </div>
            <div className="clock-date text-[9px] text-[#b4aae2]/70 uppercase tracking-[0.1em] font-sans font-semibold mt-1" id="headerDate">
              WED, JUL 12
            </div>
          </div>

          {/* Golden Gear Settings button */}
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-full border border-[#ffe9b8]/20 bg-[#ffe9b8]/5 hover:bg-[#ffe9b8]/15 text-[#ffe9b8] hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(255,233,184,0.1)] cursor-pointer focus:outline-none" 
            title="Settings"
            onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('settings'); }}
          >
            <svg className="w-4.5 h-4.5 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>

      <main>
        {/* HOME PANEL */}
        <div className="panel active" id="panel-home">

          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="gradD20" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#9fd0ff" />
                <stop offset="55%" stopColor="#6f8fff" />
                <stop offset="100%" stopColor="#5a4fd9" />
              </linearGradient>
              <linearGradient id="gradNotes" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd6ea" />
                <stop offset="100%" stopColor="#e88fc0" />
              </linearGradient>
              <linearGradient id="gradSheet" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e8e4f5" />
                <stop offset="100%" stopColor="#a89fc9" />
              </linearGradient>
              <linearGradient id="gradCalc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffe9b8" />
                <stop offset="100%" stopColor="#e0a85f" />
              </linearGradient>
              <linearGradient id="gradTasks" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c9f5e6" />
                <stop offset="100%" stopColor="#5fc9a8" />
              </linearGradient>
              <linearGradient id="gradClock" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c9e0ff" />
                <stop offset="100%" stopColor="#7a8fd9" />
              </linearGradient>
              <linearGradient id="gradCal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffc9e8" />
                <stop offset="100%" stopColor="#9f7fe0" />
              </linearGradient>
              <linearGradient id="gradGame" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd6a8" />
                <stop offset="100%" stopColor="#e85f7a" />
              </linearGradient>
              <linearGradient id="gradSettings" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#dde3ec" />
                <stop offset="100%" stopColor="#8f96a8" />
              </linearGradient>
              <linearGradient id="gradRecipes" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd3b6" />
                <stop offset="100%" stopColor="#ff7597" />
              </linearGradient>
              <linearGradient id="gradGhost1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a8c4ec" />
                <stop offset="100%" stopColor="#5a6fc9" />
              </linearGradient>
              <linearGradient id="gradGhost2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f0c9e8" />
                <stop offset="100%" stopColor="#c95fa8" />
              </linearGradient>
            </defs>
          </svg>

          {/* MASTER COMPANION DASHBOARD CONTAINER */}
          <div className="home-dashboard flex flex-col gap-5 w-full max-w-5xl mx-auto px-1 py-1 pb-16">
            
            {/* ROW 1: QUICK TILES AND DICE TRAY */}
            <div className="flex flex-col md:grid md:grid-cols-12 gap-5 w-full">
              
              {/* Sidebar Quick Launch Buttons (3 cols desktop, horizontal bar mobile) */}
              <div className="flex flex-row md:flex-col justify-between md:justify-start gap-4 col-span-3 items-center w-full">
                
                {/* ROLL MODULE */}
                <button 
                  className="dash-tile-elevated group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#1c1236]/95 to-[#0b0518]/95 text-center shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:border-[#6f8fff] hover:shadow-[0_0_24px_rgba(111,143,255,0.25)] transition-all duration-300 cursor-pointer focus:outline-none flex-1 md:w-full"
                  style={{ height: '110px' }}
                  onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('roll'); }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#6f8fff]/12 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <div className="w-11 h-11 mb-2.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <svg className="w-10 h-10 drop-shadow-[0_0_8px_rgba(111,143,255,0.6)]" viewBox="0 0 22 22" fill="none" stroke="currentColor">
                      <path d="M11 1.5 2 7v8l9 5.5 9-5.5V7L11 1.5Z" stroke="#9fd0ff" strokeWidth="1.2" strokeLinejoin="round" />
                      <path d="M11 1.5 2 7l9 4 9-4-9-5.5Z" stroke="#6f8fff" strokeWidth="0.8" />
                      <path d="M2 7v8l9 5.5V11L2 7Z" stroke="#5a4fd9" strokeWidth="0.8" />
                      <text x="11" y="14" textAnchor="middle" fill="#fff" fontSize="6.5" fontWeight="800" fontFamily="'JetBrains Mono', monospace">20</text>
                    </svg>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#ccd5ff] group-hover:text-white transition-colors duration-200">ROLL DICE</span>
                </button>

                {/* NOTES MODULE */}
                <button 
                  className="dash-tile-elevated group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#1c1236]/95 to-[#0b0518]/95 text-center shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:border-[#e88fc0] hover:shadow-[0_0_24px_rgba(232,143,192,0.22)] transition-all duration-300 cursor-pointer focus:outline-none flex-1 md:w-full"
                  style={{ height: '110px' }}
                  onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('notes'); }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#e88fc0]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <div className="w-11 h-11 mb-2.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <svg className="w-10 h-10 drop-shadow-[0_0_8px_rgba(232,143,192,0.6)]" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                      <path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6l-4-4Z" stroke="#ffd6ea" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v4h4" stroke="#e88fc0" />
                      <path d="M16 11H6M16 15H6M10 7H6" stroke="#c27ba0" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#fcd6eb] group-hover:text-white transition-colors duration-200">JOURNAL</span>
                </button>

                {/* STATS MODULE */}
                <button 
                  className="dash-tile-elevated group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#1c1236]/95 to-[#0b0518]/95 text-center shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:border-[#c9e0ff] hover:shadow-[0_0_24px_rgba(201,224,255,0.22)] transition-all duration-300 cursor-pointer focus:outline-none flex-1 md:w-full"
                  style={{ height: '110px' }}
                  onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sheet'); }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#7a8fd9]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <div className="w-11 h-11 mb-2.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <svg className="w-10 h-10 drop-shadow-[0_0_8px_rgba(122,143,217,0.6)]" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                      <path d="M11 1.8 4 4.3v6.4c0 4.8 2.9 7.6 7 9 4.1-1.4 7-4.2 7-9V4.3L11 1.8Z" stroke="#e8e4f5" strokeLinejoin="round" />
                      <circle cx="11" cy="9" r="3" stroke="#a89fc9" />
                      <path d="M6 15.5c0-1.8 1.8-3.2 5-3.2s5 1.4 5 3.2" stroke="#a89fc9" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#e2dfff] group-hover:text-white transition-colors duration-200">HERO SHEET</span>
                </button>

                {/* RECIPE PORTAL MODULE */}
                <button 
                  className="dash-tile-elevated group relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#1c1236]/95 to-[#0b0518]/95 text-center shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:border-[#ffd3b6] hover:shadow-[0_0_24px_rgba(255,211,182,0.22)] transition-all duration-300 cursor-pointer focus:outline-none flex-1 md:w-full"
                  style={{ height: '110px' }}
                  onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('recipes'); }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#ff7597]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <div className="w-11 h-11 mb-2.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <span className="text-[32px] filter drop-shadow-[0_0_8px_rgba(255,117,151,0.6)]">🧪</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#ffd3b6] group-hover:text-white transition-colors duration-200">ALCHEMIST COOK</span>
                </button>
              </div>

              {/* Central Dice Tray Card (9 cols desktop, fill mobile) */}
              <div className="col-span-9 flex flex-col relative overflow-hidden self-stretch rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#160f2e] to-[#080214] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
                
                {/* Card Header title */}
                <div className="flex justify-between items-center pb-3 border-b border-[#2e2454] mb-4">
                  <span className="text-[12px] font-bold text-[#b4aae2] tracking-[0.25em] uppercase font-sans">DICE TRAY</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fa2f8a] shadow-[0_0_6px_#fa2f8a]"></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-center justify-between flex-grow py-1">
                  
                  {/* Interactive Summoning Stage */}
                  <div className="roll-stage relative w-[170px] h-[170px] flex items-center justify-center shrink-0">
                    {/* Concentric rotating rune SVG compilation */}
                    <svg className="absolute inset-0 w-full h-full animate-spin-slow opacity-40 pointer-events-none" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="92" fill="none" stroke="#cf4fe6" strokeWidth="0.8" strokeDasharray="4 8" />
                      <circle cx="100" cy="100" r="80" fill="none" stroke="#4f7fe6" strokeWidth="1" />
                      <circle cx="100" cy="100" r="65" fill="none" stroke="#3fd9c7" strokeWidth="0.5" strokeDasharray="1 5" />
                      <path d="M 100 8 L 100 16 M 100 184 L 100 192 M 8 100 L 16 100 M 184 100 L 192 100" stroke="#cf4fe6" strokeWidth="1" />
                      <text x="100" y="28" fill="#3fd9c7" fontSize="7" textAnchor="middle" fontFamily="monospace">✵</text>
                      <text x="100" y="180" fill="#3fd9c7" fontSize="7" textAnchor="middle" fontFamily="monospace">✵</text>
                      <text x="28" y="103" fill="#cf4fe6" fontSize="7" textAnchor="middle" fontFamily="monospace">⚔</text>
                      <text x="172" y="103" fill="#cf4fe6" fontSize="7" textAnchor="middle" fontFamily="monospace">⚔</text>
                    </svg>
                    
                    <svg className="absolute inset-0 w-full h-full animate-spin-reverse opacity-25 pointer-events-none" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="74" fill="none" stroke="#fa2f8a" strokeWidth="0.6" strokeDasharray="2 6" />
                      <circle cx="100" cy="100" r="54" fill="none" stroke="#efc562" strokeWidth="1.2" strokeDasharray="6 24" />
                    </svg>

                    {/* Floating Polyhedral Dice selectors around the circle rim */}
                    <button 
                      className="absolute top-[3%] left-[41%] w-8 h-8 group/die flex items-center justify-center bg-transparent border-none cursor-pointer focus:outline-none" 
                      onClick={() => { if ((window as any).setSelectedDie) { (window as any).setSelectedDie(20); document.querySelectorAll('.die-marker').forEach(m => m.classList.remove('active', 'bg-blue-500/25', 'border-blue-500/80')); const marker = document.getElementById('markerD20'); if(marker) marker.classList.add('active', 'bg-blue-500/25', 'border-blue-500/80'); const btns = document.querySelectorAll('.die-btn'); btns.forEach((btn: any) => btn.classList.toggle('active', btn.dataset.die === '20')); if((window as any).doRoll) (window as any).doRoll(20); } }}
                    >
                      <div id="markerD20" className="die-marker active absolute inset-0 rounded-full bg-blue-500/20 border border-blue-500/70 group-hover/die:bg-blue-500/30 transition-all duration-200"></div>
                      <span className="relative z-1 text-[11px] font-bold font-mono text-[#fff]">20</span>
                    </button>
                    
                    <button 
                      className="absolute top-[23%] right-[3%] w-8 h-8 group/die flex items-center justify-center bg-transparent border-none cursor-pointer focus:outline-none" 
                      onClick={() => { if ((window as any).setSelectedDie) { (window as any).setSelectedDie(12); document.querySelectorAll('.die-marker').forEach(m => m.classList.remove('active', 'bg-blue-500/25', 'border-blue-500/80')); const marker = document.getElementById('markerD12'); if(marker) marker.classList.add('active', 'bg-blue-500/25', 'border-blue-500/80'); const btns = document.querySelectorAll('.die-btn'); btns.forEach((btn: any) => btn.classList.toggle('active', btn.dataset.die === '12')); if((window as any).doRoll) (window as any).doRoll(12); } }}
                    >
                      <div id="markerD12" className="die-marker absolute inset-0 rounded-full bg-purple-500/10 border border-purple-500/20 group-hover/die:bg-purple-500/25 transition-all duration-200"></div>
                      <span className="relative z-1 text-[11px] font-bold font-mono text-[#cf4fe6]">12</span>
                    </button>
                    
                    <button 
                      className="absolute bottom-[23%] right-[3%] w-8 h-8 group/die flex items-center justify-center bg-transparent border-none cursor-pointer focus:outline-none" 
                      onClick={() => { if ((window as any).setSelectedDie) { (window as any).setSelectedDie(10); document.querySelectorAll('.die-marker').forEach(m => m.classList.remove('active', 'bg-blue-500/25', 'border-blue-500/80')); const marker = document.getElementById('markerD10'); if(marker) marker.classList.add('active', 'bg-blue-500/25', 'border-blue-500/80'); const btns = document.querySelectorAll('.die-btn'); btns.forEach((btn: any) => btn.classList.toggle('active', btn.dataset.die === '10')); if((window as any).doRoll) (window as any).doRoll(10); } }}
                    >
                      <div id="markerD10" className="die-marker absolute inset-0 rounded-full bg-amber-500/10 border border-amber-500/20 group-hover/die:bg-amber-500/25 transition-all duration-200"></div>
                      <span className="relative z-1 text-[11px] font-bold font-mono text-[#fcd34d]">10</span>
                    </button>
                    
                    <button 
                      className="absolute bottom-[3%] left-[41%] w-8 h-8 group/die flex items-center justify-center bg-transparent border-none cursor-pointer focus:outline-none" 
                      onClick={() => { if ((window as any).setSelectedDie) { (window as any).setSelectedDie(8); document.querySelectorAll('.die-marker').forEach(m => m.classList.remove('active', 'bg-blue-500/25', 'border-blue-500/80')); const marker = document.getElementById('markerD8'); if(marker) marker.classList.add('active', 'bg-blue-500/25', 'border-blue-500/80'); const btns = document.querySelectorAll('.die-btn'); btns.forEach((btn: any) => btn.classList.toggle('active', btn.dataset.die === '8')); if((window as any).doRoll) (window as any).doRoll(8); } }}
                    >
                      <div id="markerD8" className="die-marker absolute inset-0 rounded-full bg-teal-500/10 border border-teal-500/20 group-hover/die:bg-teal-500/25 transition-all duration-200"></div>
                      <span className="relative z-1 text-[11px] font-bold font-mono text-[#3fd9c7]">8</span>
                    </button>
                    
                    <button 
                      className="absolute bottom-[23%] left-[3%] w-8 h-8 group/die flex items-center justify-center bg-transparent border-none cursor-pointer focus:outline-none" 
                      onClick={() => { if ((window as any).setSelectedDie) { (window as any).setSelectedDie(6); document.querySelectorAll('.die-marker').forEach(m => m.classList.remove('active', 'bg-blue-500/25', 'border-blue-500/80')); const marker = document.getElementById('markerD6'); if(marker) marker.classList.add('active', 'bg-blue-500/25', 'border-blue-500/80'); const btns = document.querySelectorAll('.die-btn'); btns.forEach((btn: any) => btn.classList.toggle('active', btn.dataset.die === '6')); if((window as any).doRoll) (window as any).doRoll(6); } }}
                    >
                      <div id="markerD6" className="die-marker absolute inset-0 rounded-full bg-[#e85f7a]/10 border border-[#e85f7a]/20 group-hover/die:bg-[#e85f7a]/25 transition-all duration-200"></div>
                      <span className="relative z-1 text-[11px] font-bold font-mono text-[#e85f7a]">6</span>
                    </button>
                    
                    <button 
                      className="absolute top-[23%] left-[3%] w-8 h-8 group/die flex items-center justify-center bg-transparent border-none cursor-pointer focus:outline-none" 
                      onClick={() => { if ((window as any).setSelectedDie) { (window as any).setSelectedDie(4); document.querySelectorAll('.die-marker').forEach(m => m.classList.remove('active', 'bg-blue-500/25', 'border-blue-500/80')); const marker = document.getElementById('markerD4'); if(marker) marker.classList.add('active', 'bg-blue-500/25', 'border-blue-500/80'); const btns = document.querySelectorAll('.die-btn'); btns.forEach((btn: any) => btn.classList.toggle('active', btn.dataset.die === '4')); if((window as any).doRoll) (window as any).doRoll(4); } }}
                    >
                      <div id="markerD4" className="die-marker absolute inset-0 rounded-full bg-yellow-500/10 border border-yellow-500/20 group-hover/die:bg-yellow-500/25 transition-all duration-200"></div>
                      <span className="relative z-1 text-[11px] font-bold font-mono text-[#ffe9b8]">4</span>
                    </button>

                    {/* Central Glowing Live roll value */}
                    <div className="flex flex-col items-center justify-center relative select-none">
                      <span className="roll-result-val text-[46px] font-bold text-[#faebd7] drop-shadow-[0_0_12px_rgba(207,79,230,0.75)] font-mono leading-none tracking-tight">20</span>
                      <span className="roll-sub-text text-[9px] uppercase tracking-[0.16em] text-[#8b7ac4] mt-1 text-center font-bold opacity-80 max-w-[100px] truncate">d20 rolled</span>
                    </div>
                  </div>

                  {/* Synchronized Real-time Recent Rolls column */}
                  <div className="flex flex-col w-full sm:w-[150px] shrink-0 border-t sm:border-t-0 sm:border-l border-[#3a206b]/40 pt-4 sm:pt-0 sm:pl-4 self-stretch justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#8b7ac4] tracking-[0.15em] uppercase block mb-2 font-sans">Recent Rolls</span>
                      <div id="dashboardHistoryRow" className="flex flex-col gap-1.5 overflow-hidden">
                        {/* Dynamic compilation updates this list on sync */}
                      </div>
                    </div>
                    <div className="text-right mt-3 sm:mt-0 select-none">
                      <button 
                        className="text-[10px] text-[#ae95eb]/70 hover:text-white uppercase tracking-[0.14em] font-bold bg-transparent border-none cursor-pointer transition-colors duration-200 focus:outline-none" 
                        onClick={() => { const clr = document.getElementById('clearHistory'); if (clr) clr.click(); }}
                      >
                        Clear rolls
                      </button>
                    </div>
                  </div>
                </div>

                {/* Wide Magical Primary button */}
                <button 
                  id="dashboardRollBtnMain" 
                  className="roll-btn btn-primary shiny w-full py-3.5 px-6 mt-4 opacity-95 hover:opacity-100 rounded-xl font-sans font-semibold text-[13px] tracking-[0.2em] uppercase cursor-pointer text-center select-none focus:outline-none transition-all duration-300"
                  style={{ background: 'linear-gradient(135deg, #cf4fe6 0%, #fa2f8a 50%, #ae4fe6 100%)', boxShadow: '0 8px 24px -6px rgba(207,79,230,0.45)' }}
                >
                  ROLL SELECTED DIE
                </button>
              </div>

            </div>

            {/* ROW 2: TRI-GRID COMPACT UTILITY TILES */}
            <div className="grid grid-cols-3 gap-4 w-full">
              
              {/* SHEET CARD */}
              <button 
                className="relative overflow-hidden group flex flex-col items-center justify-center py-4 px-3 rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#160f2e] to-[#080214] hover:border-[#8b7acf] shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all duration-300 transform active:scale-95 cursor-pointer focus:outline-none" 
                onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('sheet'); }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#8b7acf] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="mb-2 text-[#fff]/80 group-hover:text-white transition-transform duration-300 group-hover:scale-110">
                  {/* Magic Book SVG icon */}
                  <svg className="w-8 h-8 drop-shadow-[0_0_6px_rgba(139,122,207,0.5)]" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3zM20 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z" stroke="#e8e4f5" />
                    <path d="M6 6h2M6 10h2M14 6h2M14 10h2" stroke="#a89fc9" strokeLinecap="round" />
                    <path d="m11 2 .5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5Z" fill="#ffebaa" stroke="none" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-[#b4aae2] uppercase tracking-[0.18em] font-sans group-hover:text-white transition-colors duration-200">CHARACTERS</span>
              </button>

              {/* TASKS CARD */}
              <button 
                className="relative overflow-hidden group flex flex-col items-center justify-center py-4 px-3 rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#160f2e] to-[#080214] hover:border-[#ff9fdb] shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all duration-300 transform active:scale-95 cursor-pointer focus:outline-none" 
                onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('tasks'); }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff9fdb] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-2.5 right-4 w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold text-white bg-gradient-to-b from-[#b22ce2] to-[#7f1da7] rounded-full shadow-[0_0_8px_rgba(178,44,226,0.6)] animate-pulse">3</div>
                <div className="mb-2 text-[#fff]/80 group-hover:text-white transition-transform duration-300 group-hover:scale-110">
                  {/* Ancient Map Scroll SVG icon */}
                  <svg className="w-8 h-8 drop-shadow-[0_0_6px_rgba(242,165,216,0.5)]" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6l-4-4Z" stroke="#ffc9e8" />
                    <path d="M14 2v4h4" stroke="#e85f7a" />
                    <circle cx="8" cy="11" r="1.1" fill="#fff" />
                    <circle cx="8" cy="15" r="1.1" fill="#fff" />
                    <path d="M11 11h3M11 15h3" stroke="#ffd6ea" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-[#b4aae2] uppercase tracking-[0.18em] font-sans group-hover:text-white transition-colors duration-200">QUEST LOG</span>
              </button>

              {/* SETTINGS CARD */}
              <button 
                className="relative overflow-hidden group flex flex-col items-center justify-center py-4 px-3 rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#160f2e] to-[#080214] hover:border-[#13efb0] shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all duration-300 transform active:scale-95 cursor-pointer focus:outline-none" 
                onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('settings'); }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#13efb0] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="mb-2 text-[#fff]/80 group-hover:text-white transition-transform duration-300 group-hover:scale-110">
                  {/* Astrolabe compass gear SVG icon */}
                  <svg className="w-8 h-8 drop-shadow-[0_0_6px_rgba(19,239,176,0.5)]" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <circle cx="11" cy="11" r="7" stroke="#c9f5e6" />
                    <circle cx="11" cy="11" r="2.5" stroke="#13efb0" />
                    <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.6 4.6l1.4 1.4M16 16l1.4 1.4M16 4.6l-1.4 1.4M4.6 16l1.4-1.4" stroke="#5fc9a8" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-[#b4aae2] uppercase tracking-[0.18em] font-sans group-hover:text-white transition-colors duration-200">PORTAL SET</span>
              </button>
            </div>

            {/* ROW 3: TURN TRACKER & WEATHER WORLD DIAL COLUMNS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              
              {/* Left Column: COMBAT TURN TRACKER */}
              <div className="card rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#160f2e] to-[#080214] p-4 flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
                
                {/* Header elements */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 mb-3.5">
                  <div className="flex items-center gap-2">
                    {/* Hourglass SVG symbol */}
                    <svg className="w-4 h-4 text-[#cf4fe6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 2h14M5 22h14M19 2v4a7 7 0 0 1-7 7a7 7 0 0 1-7-7V2 M5 22v-4a7 7 0 0 1 7-7a7 7 0 0 1 7 7v4" />
                      <circle cx="12" cy="5" r="1" fill="currentColor" />
                      <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                    </svg>
                    <span className="text-[12px] font-bold text-[#faebd7] uppercase tracking-[0.15em]" style={{ fontFamily: "'Cormorant', serif" }}>TURN TRACKER</span>
                  </div>
                  <div className="flex items-center gap-1.5 select-none bg-[#1a1138]/50 border border-[#44387a]/40 px-2 py-0.5 rounded-lg">
                    <button id="roundBtnMinus" className="text-[10px] font-extrabold text-[#fa2f8a]/80 hover:text-white px-1 cursor-pointer select-none focus:outline-none">‹</button>
                    <span id="roundCountVal" className="text-[9px] font-bold text-[#13efb0] uppercase tracking-wider font-mono">ROUND 4</span>
                    <button id="roundBtnPlus" className="text-[10px] font-extrabold text-[#13efb0]/80 hover:text-white px-1 cursor-pointer select-none focus:outline-none">›</button>
                  </div>
                </div>

                {/* Combatants list rows */}
                <div className="flex flex-col gap-2 flex-grow">
                  
                  {/* Comb 1: Elara */}
                  <div className="combatant-row group/row cursor-pointer flex items-center justify-between border border-[#44387a]/30 rounded-xl p-1.5 transition-all duration-300" data-idx="0" data-hp="22" data-max="25">
                    <div className="flex items-center gap-3">
                      {/* Active glowing index dot indicator */}
                      <span className="active-dot opacity-0 w-1.5 h-1.5 rounded-full bg-[#cf4fe6] shadow-[0_0_6px_#cf4fe6] transition-all duration-300"></span>
                      
                      {/* Avatar */}
                      <svg className="w-10 h-10 rounded-full border border-teal-500/30 shadow-[0_0_8px_rgba(20,240,160,0.15)] shrink-0 bg-gradient-to-tr from-[#0e0c24] to-[#122e2a]" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#2dd4bf" strokeWidth="0.5" strokeDasharray="2 3" />
                        <path d="M12 25 Q13 14 20 12 Q27 10 28 5 Q29 12 30 18 Q31 25 21 34 Z" fill="#cf4fe6" opacity="0.65" />
                        <path d="M15 27 Q14 16 19 14 Q24 12 26 8 Q27 15 26 21 Q25 27 18 35 Z" fill="#3fd9c7" opacity="0.45" />
                        <path d="M16 23 Q15 15 19 15 C21 15 22 17 22 19 C22 21 21 22 20 23" stroke="#fff" strokeWidth="0.8" fill="none" />
                        <path d="M19 16 Q23 10 26 13 Z" fill="#fff" opacity="0.9" />
                        <circle cx="21" cy="18" r="1" fill="#13efb0" className="animate-pulse" />
                      </svg>
                      
                      <div className="flex flex-col leading-none">
                        <span className="text-[12px] font-bold text-[#ffe9b8] uppercase tracking-wide comb-name">ELARA</span>
                        <span className="text-[10px] text-[#b4aae2]/60 mt-0.5 font-medium font-sans">Half-Elf Wizard</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-[65px] sm:w-[80px] h-2 bg-[#2d244c] rounded-full overflow-hidden border border-[#cf4fe6]/15">
                        <div className="hp-bar h-full bg-gradient-to-r from-[#13efb0] to-[#0fd29c] rounded-full transition-all duration-300" style={{ width: '88%' }}></div>
                      </div>
                      <div className="flex items-center bg-[#251b47]/60 rounded-md border border-[#44387a]/50 p-0.5">
                        <button className="hp-minus text-[11px] font-extrabold text-[#fa2f8a] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none">-</button>
                        <span className="hp-text text-[12px] font-bold font-mono text-[#13efb0] min-w-[20px] text-center px-0.5">22</span>
                        <button className="hp-plus text-[11px] font-extrabold text-[#13efb0] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Comb 2: Thorgrim */}
                  <div className="combatant-row group/row cursor-pointer flex items-center justify-between border border-[#44387a]/30 rounded-xl p-1.5 transition-all duration-300" data-idx="1" data-hp="18" data-max="20">
                    <div className="flex items-center gap-3">
                      <span className="active-dot opacity-0 w-1.5 h-1.5 rounded-full bg-[#cf4fe6] shadow-[0_0_6px_#cf4fe6] transition-all duration-300"></span>
                      
                      <svg className="w-10 h-10 rounded-full border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)] shrink-0 bg-gradient-to-tr from-[#0a0f20] to-[#0d2a1a]" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2 3" />
                        <path d="M13 18 L20 8 L27 18 L25 22 L15 22 Z" fill="#5b6782" />
                        <path d="M20 8 L20 22" stroke="#efc562" strokeWidth="1" />
                        <path d="M14 22 Q20 36 26 22 L23 20 L20 22 L17 20 Z" fill="#e85f7a" />
                        <path d="M16 22 Q20 32 24 22" fill="none" stroke="#ffe9b8" strokeWidth="0.8" />
                      </svg>
                      
                      <div className="flex flex-col leading-none">
                        <span className="text-[12px] font-bold text-[#ffe9b8] uppercase tracking-wide comb-name">THORGRIM</span>
                        <span className="text-[10px] text-[#b4aae2]/60 mt-0.5 font-medium font-sans">Dwarf Fighter</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-[65px] sm:w-[80px] h-2 bg-[#2d244c] rounded-full overflow-hidden border border-[#cf4fe6]/15">
                        <div className="hp-bar h-full bg-gradient-to-r from-[#10b981] to-[#047857] rounded-full transition-all duration-300" style={{ width: '90%' }}></div>
                      </div>
                      <div className="flex items-center bg-[#251b47]/60 rounded-md border border-[#44387a]/50 p-0.5">
                        <button className="hp-minus text-[11px] font-extrabold text-[#fa2f8a] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none">-</button>
                        <span className="hp-text text-[12px] font-bold font-mono text-[#10b981] min-w-[20px] text-center px-0.5">18</span>
                        <button className="hp-plus text-[11px] font-extrabold text-[#13efb0] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Comb 3: Lyra */}
                  <div className="combatant-row group/row cursor-pointer flex items-center justify-between border border-[#44387a]/30 rounded-xl p-1.5 transition-all duration-300" data-idx="2" data-hp="15" data-max="18">
                    <div className="flex items-center gap-3">
                      <span className="active-dot opacity-0 w-1.5 h-1.5 rounded-full bg-[#cf4fe6] shadow-[0_0_6px_#cf4fe6] transition-all duration-300"></span>
                      
                      <svg className="w-10 h-10 rounded-full border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)] shrink-0 bg-gradient-to-tr from-[#110418] to-[#2b102b]" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2 3" />
                        <path d="M11 28 Q10 12 20 10 Q30 12 29 28 L27 34 L13 34 Z" fill="#20113c" />
                        <path d="M13 28 Q12 14 20 12 Q28 14 27 28 Z" fill="#0d041c" />
                        <ellipse cx="17" cy="21" rx="1.8" ry="0.6" fill="#fcd34d" />
                        <ellipse cx="23" cy="21" rx="1.8" ry="0.6" fill="#fcd34d" />
                        <path d="M15 32 L16 25 L18 25 L16 32 Z M25 32 L24 25 L22 25 L24 32 Z" fill="#e8e4f5" opacity="0.6" />
                      </svg>
                      
                      <div className="flex flex-col leading-none">
                        <span className="text-[12px] font-bold text-[#ffe9b8] uppercase tracking-wide comb-name">LYRA</span>
                        <span className="text-[10px] text-[#b4aae2]/60 mt-0.5 font-medium font-sans">Human Rogue</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-[65px] sm:w-[80px] h-2 bg-[#2d244c] rounded-full overflow-hidden border border-[#cf4fe6]/15">
                        <div className="hp-bar h-full bg-gradient-to-r from-[#fcd34d] to-[#d97706] rounded-full transition-all duration-300" style={{ width: '83%' }}></div>
                      </div>
                      <div className="flex items-center bg-[#251b47]/60 rounded-md border border-[#44387a]/50 p-0.5">
                        <button className="hp-minus text-[11px] font-extrabold text-[#fa2f8a] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none">-</button>
                        <span className="hp-text text-[12px] font-bold font-mono text-[#fcd34d] min-w-[20px] text-center px-0.5">15</span>
                        <button className="hp-plus text-[11px] font-extrabold text-[#13efb0] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Comb 4: Kael */}
                  <div className="combatant-row group/row cursor-pointer flex items-center justify-between border border-[#44387a]/30 rounded-xl p-1.5 transition-all duration-300" data-idx="3" data-hp="11" data-max="15">
                    <div className="flex items-center gap-3">
                      <span className="active-dot opacity-0 w-1.5 h-1.5 rounded-full bg-[#cf4fe6] shadow-[0_0_6px_#cf4fe6] transition-all duration-300"></span>
                      
                      <svg className="w-10 h-10 rounded-full border border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.15)] shrink-0 bg-gradient-to-tr from-[#1a0505] to-[#2b120c]" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#f97316" strokeWidth="0.5" strokeDasharray="2 3" />
                        <path d="M12 18 L15 11 L18 13 L20 8 L22 13 L25 11 L28 18 L20 30 Z" fill="#7c2d12" />
                        <path d="M15 18 L20 14 L25 18 L20 28 Z" fill="#b91c1c" />
                        <path d="M17 18 L20 21 L23 18" stroke="#efc562" strokeWidth="0.8" fill="none" />
                        <polygon points="17,16 19,16 18,17" fill="#ffe9b8" />
                        <polygon points="23,16 21,16 22,17" fill="#ffe9b8" />
                      </svg>
                      
                      <div className="flex flex-col leading-none">
                        <span className="text-[12px] font-bold text-[#ffe9b8] uppercase tracking-wide comb-name">KAEL</span>
                        <span className="text-[10px] text-[#b4aae2]/60 mt-0.5 font-medium font-sans">Dragonborn Paladin</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-[65px] sm:w-[80px] h-2 bg-[#2d244c] rounded-full overflow-hidden border border-[#cf4fe6]/15">
                        <div className="hp-bar h-full bg-gradient-to-r from-[#ef4444] to-[#b91c1c] rounded-full transition-all duration-300" style={{ width: '73%' }}></div>
                      </div>
                      <div className="flex items-center bg-[#251b47]/60 rounded-md border border-[#44387a]/50 p-0.5">
                        <button className="hp-minus text-[11px] font-extrabold text-[#fa2f8a] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none">-</button>
                        <span className="hp-text text-[12px] font-bold font-mono text-[#f97316] min-w-[20px] text-center px-0.5">11</span>
                        <button className="hp-plus text-[11px] font-extrabold text-[#13efb0] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Comb 5: DM Enemies */}
                  <div className="combatant-row group/row cursor-pointer flex items-center justify-between border border-[#44387a]/30 rounded-xl p-1.5 transition-all duration-300" data-idx="4" data-hp="38" data-max="50">
                    <div className="flex items-center gap-3">
                      <span className="active-dot opacity-0 w-1.5 h-1.5 rounded-full bg-[#cf4fe6] shadow-[0_0_6px_#cf4fe6] transition-all duration-300"></span>
                      
                      <svg className="w-10 h-10 rounded-full border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.15)] shrink-0 bg-gradient-to-tr from-[#0e041c] to-[#1e0a2b]" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2 3" />
                        <path d="M15 18 C14 11 26 11 25 18 C25 21 23 21 23 23 L22 26 L18 26 L17 23 C17 21 15 21 15 18 Z" fill="#ffebaa" opacity="0.85" />
                        <circle cx="18" cy="18" r="1.8" fill="#e85f7a" />
                        <circle cx="22" cy="18" r="1.8" fill="#e85f7a" />
                        <polygon points="20,20 19,21.5 21,21.5" fill="#0d041c" />
                        <path d="M18 24 L18 26 M20 24 L20 26 M22 24 L22 26" stroke="#0d041c" strokeWidth="0.8" />
                      </svg>
                      
                      <div className="flex flex-col leading-none">
                        <span className="text-[12px] font-bold text-[#e11d48] uppercase tracking-wide comb-name">DM / ENEMIES</span>
                        <span className="text-[10px] text-[#b4aae2]/60 mt-0.5 font-medium font-sans">Dungeon Master</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-[65px] sm:w-[80px] h-2 bg-[#2d244c] rounded-full overflow-hidden border border-[#cf4fe6]/15">
                        <div className="hp-bar h-full bg-gradient-to-r from-[#a855f7] to-[#7c3aed] rounded-full transition-all duration-300" style={{ width: '76%' }}></div>
                      </div>
                      <div className="flex items-center bg-[#251b47]/60 rounded-md border border-[#44387a]/50 p-0.5">
                        <button className="hp-minus text-[11px] font-extrabold text-[#fa2f8a] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none">-</button>
                        <span className="hp-text text-[12px] font-bold font-mono text-[#a855f7] min-w-[20px] text-center px-0.5">38</span>
                        <button className="hp-plus text-[11px] font-extrabold text-[#13efb0] hover:text-white w-4 h-4 flex items-center justify-center p-0 select-none cursor-pointer focus:outline-none">+</button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* END TURN interactive button */}
                <button 
                  id="dashboardEndTurnBtn" 
                  className="btn-glass w-full py-2.5 mt-3 rounded-xl border border-[#44387a]/60 bg-[#1f163f]/35 hover:bg-[#1f163f]/50 text-[#b4aae2] hover:text-white font-sans text-[11px] tracking-[0.16em] uppercase font-bold transition-all duration-200 cursor-pointer text-center select-none focus:outline-none"
                >                
                  END TURN
                </button>

              </div>

              {/* Right Column: ASTROLOGICAL CLOCK & WEATHER CONDITIONS */}
              <div 
                className="card rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#160f2e] to-[#080214] p-4 flex flex-col items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.45)] cursor-pointer group hover:border-[#7a8fd9]"
                onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('clock'); }}
                title="Open Alarms & stopwatch panel"
              >
                
                {/* Header elements */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 w-full mb-3 select-none">
                  <div className="flex items-center gap-2">
                    {/* Astronomical compass grid icon */}
                    <svg className="w-4 h-4 text-[#7a8fd9] group-hover:text-white transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10a15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12A15.3 15.3 0 0 1 12 2Z" strokeDasharray="2 3" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-[12px] font-bold text-[#faebd7] uppercase tracking-[0.15em] transition-colors duration-200 group-hover:text-white" style={{ fontFamily: "'Cormorant', serif" }}>WORLD CLOCK & WEATHER</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-70">
                    <span className="text-[8px] font-mono font-bold text-[#b4aae2] uppercase tracking-[0.1em]">EST</span>
                  </div>
                </div>

                {/* Main Astronomical Dial Face SVG and corner displays */}
                <div className="relative w-full flex-grow flex items-center justify-center py-2.5 select-none">
                  
                  {/* Outer corner displays layout details: */}
                  {/* Bottom-Left: Temp stats */}
                  <div className="absolute bottom-0 left-0 text-left leading-tight flex flex-col">
                    <span className="text-[10px] font-bold tracking-wide text-[#3fd9c7] font-mono">72°F</span>
                    <span className="text-[8px] text-[#b4aae2]/65 font-medium mt-0.5 font-sans flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" strokeLinecap="round" /><path d="M8 16v4M12 16v4M16 16v4" strokeLinecap="round" /></svg>
                      Light Rain
                    </span>
                  </div>
                  {/* Bottom-Right: Wind speed */}
                  <div className="absolute bottom-0 right-0 text-right leading-tight flex flex-col">
                    <span className="text-[10px] font-bold tracking-wide text-[#e85f7a] font-mono">8 MPH</span>
                    <span className="text-[8px] text-[#b4aae2]/65 font-medium mt-0.5 font-sans">Wind NE</span>
                  </div>

                  {/* Analog Clock Astrolabe wheel */}
                  <div className="relative w-[130px] h-[130px] rounded-full border border-[#2e2454]/60 bg-gradient-to-tr from-[#0a051d] via-[#150a31] to-[#040108] p-0.5 flex items-center justify-center shadow-[inset_0_0_15px_rgba(46,36,84,0.4)]">
                    
                    {/* Inner glowing galaxy background vortex inside clock */}
                    <div className="absolute inset-2.5 rounded-full bg-radial from-[#12194c]/50 via-transparent to-transparent opacity-65 pointer-events-none"></div>
                    <div className="absolute w-2 h-2 rounded-full bg-white/20 blur-[1px] animate-pulse"></div>

                    {/* Fine aesthetic lines and Roman numerals dial */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="#ffe9b8" strokeWidth="0.4" strokeOpacity="0.4" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#2e2454" strokeWidth="0.5" strokeOpacity="0.8" strokeDasharray="1 3" />
                      
                      {/* Roman Numerals XII, III, VI, IX */}
                      <text x="50" y="11" fill="#ffe9b8" fillOpacity="0.8" fontSize="6.5" textAnchor="middle" fontFamily="'Cormorant', serif" fontWeight="600">XII</text>
                      <text x="89" y="52" fill="#ffe9b8" fillOpacity="0.8" fontSize="6.5" textAnchor="middle" fontFamily="'Cormorant', serif" fontWeight="600">III</text>
                      <text x="50" y="93" fill="#ffe9b8" fillOpacity="0.8" fontSize="6.5" textAnchor="middle" fontFamily="'Cormorant', serif" fontWeight="600">VI</text>
                      <text x="11" y="52" fill="#ffe9b8" fillOpacity="0.8" fontSize="6.5" textAnchor="middle" fontFamily="'Cormorant', serif" fontWeight="600">IX</text>
                    </svg>

                    {/* Clock Needles Hands rotating dynamically! */}
                    {/* HOUR HAND */}
                    <div id="worldClockHour" className="absolute w-[4px] h-[34px] origin-bottom transition-all duration-1000 ease-out" style={{ bottom: '50%', transform: "rotate(0deg)", transformOrigin: '50% 100%' }}>
                      <div className="w-[2px] h-[32px] mx-auto rounded-full bg-gradient-to-t from-[#faebd7] to-[#e0a85f] shadow-[0_0_4px_#faebd7]"></div>
                    </div>
                    {/* MINUTE HAND */}
                    <div id="worldClockMin" className="absolute w-[3px] h-[46px] origin-bottom transition-all duration-1000 ease-out" style={{ bottom: '50%', transform: "rotate(0deg)", transformOrigin: '50% 100%' }}>
                      <div className="w-[1.5px] h-[44px] mx-auto rounded-full bg-[#faebd7]"></div>
                    </div>
                    {/* SECOND HAND */}
                    <div id="worldClockSec" className="absolute w-[2px] h-[52px] origin-bottom transition-all duration-100" style={{ bottom: '50%', transform: "rotate(0deg)", transformOrigin: '50% 100%' }}>
                      <div className="w-[0.8px] h-[50px] mx-auto rounded-full bg-[#fa2f8a]/90 shadow-[0_0_4px_#fa2f8a]"></div>
                    </div>

                    {/* Central Core Pin */}
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-white to-[#ffe9b8] z-10 shadow-[0_0_6px_#fff]"></div>
                    <div className="absolute w-4 h-4 rounded-full border border-[#ffe9b8]/35 pointer-events-none"></div>
                  </div>

                </div>

                <div className="text-[10px] uppercase font-bold text-[#7a8fd9]/75 tracking-[0.14em] font-sans pb-0.5 select-none">
                  ASTRONOMICAL WORLD COMPASS
                </div>

              </div>

            </div>

            {/* ROW 4: BEAUTIFUL DETAILED CAMPAIGN MAP ILLUSTRATION */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full">
              
              {/* Left Side: CAMPAIGN OVERVIEW card (spans 8 columns on desktop, fill mobile) */}
              <div className="card rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#160f2e] to-[#080214] p-4 flex flex-col shadow-[0_10px_35px_rgba(0,0,0,0.5)] col-span-12 md:col-span-8 overflow-hidden relative min-h-[220px] justify-between">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 z-10 mb-4 select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-[#ffe9b8] text-[13px]">✦</span>
                    <span className="text-[12px] font-bold text-[#faebd7] uppercase tracking-[0.15em]" style={{ fontFamily: "'Cormorant', serif" }}>CAMPAIGN OVERVIEW</span>
                  </div>
                  <div className="w-4 h-4 text-[#8b7ac4] hover:text-white transition-colors duration-200 cursor-pointer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                  </div>
                </div>

                {/* BREATHTAKING PURE SVG LANDSCAPE BACKDROP ART IN REAL TIME RESPONSIVE SCALE */}
                <div className="absolute inset-x-0 bottom-0 top-[45px] opacity-35 pointer-events-none overflow-hidden select-none">
                  <svg className="w-full h-full object-cover" viewBox="0 0 400 180" preserveAspectRatio="none">
                    <defs>
                      <radialGradient id="skyNebula" cx="60%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#431477" />
                        <stop offset="45%" stopColor="#25084f" />
                        <stop offset="100%" stopColor="transparent" />
                      </radialGradient>
                    </defs>
                    
                    {/* Sky Background */}
                    <rect width="400" height="180" fill="url(#skyNebula)" />

                    {/* Cosmic stars sky cluster */}
                    <circle cx="80" cy="40" r="0.8" fill="#fff" />
                    <circle cx="120" cy="20" r="1" fill="#fff" opacity="0.8" />
                    <circle cx="280" cy="60" r="0.6" fill="#fff" />
                    <circle cx="340" cy="30" r="1.2" fill="#fff" className="animate-pulse" />
                    <circle cx="320" cy="20" r="0.5" fill="#fff" />
                    <circle cx="190" cy="45" r="0.7" fill="#fff" />
                    
                    {/* Huge Glowing Moon */}
                    <circle cx="310" cy="45" r="24" fill="#faf0e6" opacity="0.25" filter="blur(3px)" />
                    <circle cx="310" cy="45" r="21" fill="#fcf6eb" opacity="0.15" />

                    {/* Far Mountains silhouette */}
                    <polygon points="-20,180 80,100 150,140 220,95 290,145 370,80 430,180" fill="#0d081c" opacity="0.9" />
                    <polygon points="-40,180 50,130 110,155 190,120 250,150 310,110 390,150 450,180" fill="#1b1236" opacity="0.6" />

                    {/* Mystical Silhouette Fantasy Castle */}
                    <path 
                      d="M200 125 L200 85 L205 85 L205 125 L209 125 L209 90 L214 90 L214 125 L218 125 L218 78 L225 78 L225 65 L221 65 L221 55 L223 55 L223 65 L228 65 L228 125 L231 125 L231 82 L237 82 L237 125" 
                      fill="#06030c" 
                      opacity="0.95" 
                    />
                    {/* Spires rooftops */}
                    <polygon points="219,78 226,78 222.5,58" fill="#06030c" />
                    <polygon points="231,82 237,82 234,68" fill="#06030c" />
                    <polygon points="209,90 214,90 211.5,82" fill="#06030c" />
                    <polygon points="200,85 205,85 202.5,77" fill="#06030c" />

                    {/* Pine Trees forest silhouettes in the foreground base */}
                    <polygon points="10,180 18,160 26,180" fill="#030107" />
                    <polygon points="20,180 30,152 40,180" fill="#030107" />
                    <polygon points="35,180 42,165 49,180" fill="#030107" />
                    <polygon points="360,180 370,150 380,180" fill="#030107" />
                    <polygon points="375,180 382,162 389,180" fill="#030107" />
                  </svg>
                </div>

                {/* Overlaid Title and content descriptions */}
                <div className="z-10 mt-2 flex flex-col justify-start">
                  <span className="text-[9px] font-bold text-[#e0a85f] tracking-[0.25em] h-5 uppercase select-none">CURRENT CAMPAIGN</span>
                  <span className="text-[23px] font-semibold text-[#faebd7] tracking-wider leading-none mt-1 shadow-inner select-all" style={{ fontFamily: "'Cormorant', serif" }}>THE TOMB OF ASHES</span>
                  <span className="text-[11.5px] italic text-[#b4aae2]/85 mt-2 tracking-wide font-sans select-all">Chapter 3: Shadows Awaken</span>
                </div>

                {/* Bottom metrics horizontal breakdown table panels */}
                <div className="grid grid-cols-4 gap-2 border-t border-[#2e2454]/60 pt-3 z-10 mt-6 select-none leading-none">
                  <div className="flex flex-col border-r border-[#2e2454]/50 pr-2">
                    <span className="text-[8px] text-[#8b7ac4] uppercase tracking-wider font-semibold">Sessions</span>
                    <span className="text-[14px] font-bold text-[#faebd7] font-mono mt-1">12</span>
                  </div>
                  <div className="flex flex-col border-r border-[#2e2454]/50 px-2">
                    <span className="text-[8px] text-[#8b7ac4] uppercase tracking-wider font-semibold">Players</span>
                    <span className="text-[14px] font-bold text-[#faebd7] font-mono mt-1">5</span>
                  </div>
                  <div className="flex flex-col border-r border-[#2e2454]/50 px-2 text-left">
                    <span className="text-[8px] text-[#8b7ac4] uppercase tracking-wider font-semibold">Play Time</span>
                    <span className="text-[13px] font-bold text-[#faebd7] font-mono mt-1">24h 30m</span>
                  </div>
                  <div className="flex flex-col pl-2 text-left">
                    <span className="text-[8px] text-[#8b7ac4] uppercase tracking-wider font-semibold">Next Session</span>
                    <span className="text-[13px] font-bold text-[#e0a85f] mt-1 font-mono tracking-tight">JUL 15</span>
                  </div>
                </div>

              </div>

              {/* Right Side: "UP NEXT" quest info card block (spans 4 columns on desktop, fill mobile) */}
              <div className="card rounded-2xl border border-[#44387a]/60 bg-gradient-to-b from-[#160f2e] to-[#080214] p-4 flex flex-col shadow-[0_10px_35px_rgba(0,0,0,0.5)] col-span-12 md:col-span-4 justify-between">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2e2454]/60 mb-3.5 select-none">
                  <span className="text-[11px] font-bold text-[#b4aae2] tracking-[0.16em] uppercase font-sans">UP NEXT</span>
                  <span className="text-[9px] font-bold text-[#cf4fe6] uppercase font-mono tracking-widest leading-none">QUEST</span>
                </div>

                <div className="flex items-center gap-3.5 mb-3.5">
                  {/* Knight/Dragon Shield crest emblem SVG */}
                  <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-tr from-[#2d123c] to-[#0e071c] border border-[#cf4fe6]/45 flex items-center justify-center shadow-[0_0_12px_rgba(207,79,230,0.22)]">
                    <svg className="w-8 h-8 text-[#ffe9b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#31134a" />
                      {/* Fire sparks */}
                      <path d="M12 7 L14 11 L10 11 Z" stroke="#cf4fe6" fill="#fa2f8a" />
                      <circle cx="12" cy="14" r="1.5" fill="#faebd7" />
                    </svg>
                  </div>

                  <div className="flex flex-col leading-tight">
                    <span className="text-[13px] font-bold text-[#faebd7] tracking-wider uppercase" style={{ fontFamily: "'Cormorant', serif" }}>Dragon Council</span>
                    <span className="text-[10px] text-[#fa2f8a] mt-0.5 font-bold font-mono uppercase tracking-wider">Main Quest — In 3 days</span>
                  </div>
                </div>

                {/* NPC check items */}
                <div className="flex flex-col gap-2 flex-grow justify-start">
                  <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg border border-[#cf4fe6]/15 bg-[#251347]/15">
                    <input 
                      type="checkbox" 
                      id="prepareNpcChk" 
                      defaultChecked 
                      className="accent-[#cf4fe6] w-3.5 h-3.5 rounded border-[#cf4fe6]/40 cursor-pointer focus:outline-none" 
                      onClick={() => { haptic(8); }}
                    />
                    <label htmlFor="prepareNpcChk" className="text-[10.5px] text-[#b4aae2] font-semibold tracking-wide cursor-pointer select-none">Prepare dragon models (3/3)</label>
                  </div>
                  <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg border border-[#44387a]/20 bg-transparent">
                    <input 
                      type="checkbox" 
                      id="gatherMinisChk" 
                      className="accent-[#cf4fe6] w-3.5 h-3.5 rounded border-[#cf4fe6]/40 cursor-pointer focus:outline-none"
                      onClick={() => { haptic(8); }}
                    />
                    <label htmlFor="gatherMinisChk" className="text-[10.5px] text-[#b4aae2]/70 font-medium tracking-wide cursor-pointer select-none">Read Chapter 3 notes</label>
                  </div>
                </div>

                {/* Navigation Link button */}
                <button 
                  className="btn-glass w-full py-2.5 mt-4 rounded-xl border border-[#cf4fe6]/35 hover:border-[#cf4fe6] bg-[#cf4fe6]/5 hover:bg-[#cf4fe6]/15 text-[#cf4fe6] hover:text-white font-sans text-[11px] tracking-[0.16em] uppercase font-bold transition-all duration-300 cursor-pointer text-center select-none focus:outline-none"
                  onClick={() => { if ((window as any).switchToPanel) (window as any).switchToPanel('calendar'); }}
                >
                  VIEW CALENDAR
                </button>

              </div>

            </div>

          </div>
        </div>

        {/* ROLL PANEL */}
        <div className="panel" id="panel-roll">
          <section className="card">
            <p className="section-label">Choose your die</p>
            <div className="die-grid" id="dieGrid"></div>
            <div className="custom-roll-row">
              <input type="text" id="customDie" placeholder="custom, e.g. 3d6+2" />
              <button id="customRollBtn" className="btn-glass">
                Roll
              </button>
            </div>
          </section>

          <section className="card dice-tray-card">
            <p className="section-label">Dice Tray</p>
            <div className="tray-layout">
              <div className="roll-stage">
                <svg className="tray-runes" viewBox="0 0 240 240">
                  <circle cx="120" cy="120" r="108" fill="none" stroke="rgba(212,79,230,0.25)" strokeWidth={1} />
                  <circle
                    cx="120"
                    cy="120"
                    r="86"
                    fill="none"
                    stroke="rgba(79,127,230,0.2)"
                    strokeWidth={1}
                    strokeDasharray="2 6"
                  />
                  <circle cx="120" cy="120" r="64" fill="none" stroke="rgba(63,217,199,0.18)" strokeWidth={1} />
                  <g stroke="rgba(242,165,216,0.3)" strokeWidth={1}>
                    <path d="M120 12v18M120 210v18M12 120h18M210 120h18" />
                    <path d="M45 45l13 13M182 45l-13 13M45 195l13-13M182 195l-13-13" />
                  </g>
                </svg>
                <div className="tray-ghost-die ghost-1">
                  <svg viewBox="0 0 40 40">
                    <path
                      d="M20 2 4 11v18l16 9 16-9V11L20 2Z"
                      fill="url(#gradGhost1)"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth={0.6}
                    />
                  </svg>
                </div>
                <div className="tray-ghost-die ghost-2">
                  <svg viewBox="0 0 40 40">
                    <rect
                      x="8"
                      y="8"
                      width="24"
                      height="24"
                      rx="4"
                      fill="url(#gradGhost2)"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth={0.6}
                      transform="rotate(20 20 20)"
                    />
                  </svg>
                </div>
                <div className="roll-result mono" id="rollResult">
                  —
                </div>
                <div className="roll-sub" id="rollSub">
                  tap roll to begin
                </div>
              </div>
              <div className="recent-rolls">
                <p className="recent-rolls-title">Recent Rolls</p>
                <div id="historyRow" className="recent-rolls-list"></div>
                <span className="clear-link" id="clearHistory">
                  clear history
                </span>
              </div>
            </div>
            <button className="roll-btn btn-primary shiny" id="rollBtn">
              ROLL DICE
            </button>
          </section>
        </div>

        {/* NOTES PANEL */}
        <div className="panel" id="panel-notes">
          <section className="card">
            <p className="section-label">Notes</p>
            <div className="notes-list" id="notesList"></div>
            <button className="add-note-btn" id="addNoteBtn">
              + add a note
            </button>
          </section>
        </div>

        {/* SHEET PANEL */}
        <div className="panel" id="panel-sheet">
          <section className="card">
            <p className="section-label">Identity</p>
            <div className="field-row">
              <div className="field">
                <label>Character name</label>
                <input id="ch-name" type="text" />
              </div>
              <div className="field">
                <label>Class & level</label>
                <input id="ch-class" type="text" placeholder="Fighter 3" />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Species</label>
                <input id="ch-species" type="text" />
              </div>
              <div className="field">
                <label>Background</label>
                <input id="ch-background" type="text" />
              </div>
            </div>
          </section>

          <section className="card">
            <p className="section-label">Ability scores</p>
            <div className="stat-grid">
              <div className="stat-box">
                <label>STR</label>
                <input id="st-str" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-str">
                  +0
                </div>
              </div>
              <div className="stat-box">
                <label>DEX</label>
                <input id="st-dex" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-dex">
                  +0
                </div>
              </div>
              <div className="stat-box">
                <label>CON</label>
                <input id="st-con" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-con">
                  +0
                </div>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-box">
                <label>INT</label>
                <input id="st-int" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-int">
                  +0
                </div>
              </div>
              <div className="stat-box">
                <label>WIS</label>
                <input id="st-wis" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-wis">
                  +0
                </div>
              </div>
              <div className="stat-box">
                <label>CHA</label>
                <input id="st-cha" type="number" defaultValue="10" />
                <div className="stat-mod mono" id="mod-cha">
                  +0
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <p className="section-label">Combat</p>
            <div className="hp-row">
              <div className="field">
                <label>HP current</label>
                <input id="ch-hpcur" type="number" />
              </div>
              <div className="field">
                <label>HP max</label>
                <input id="ch-hpmax" type="number" />
              </div>
              <div className="field">
                <label>AC</label>
                <input id="ch-ac" type="number" />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Initiative</label>
                <input id="ch-init" type="text" />
              </div>
              <div className="field">
                <label>Speed</label>
                <input id="ch-speed" type="text" placeholder="30 ft" />
              </div>
            </div>
            <div className="field-row full">
              <div className="field">
                <label>Proficiency bonus</label>
                <input id="ch-prof" type="number" defaultValue="2" />
              </div>
            </div>
          </section>

          <section className="card">
            <p className="section-label">Notes & equipment</p>
            <div className="field-row full">
              <div className="field">
                <textarea
                  id="ch-equip"
                  rows={4}
                  className="sheet-textarea"
                  placeholder="Weapons, spells, items..."
                ></textarea>
              </div>
            </div>
            <div className="save-status" id="sheetSaveStatus"></div>
            <div className="backup-row">
              <button id="exportSheet" className="btn-glass">
                Export sheet
              </button>
              <button id="importSheetBtn" className="btn-glass">
                Import sheet
              </button>
            </div>
            <input
              type="file"
              id="importSheetFile"
              accept="application/json"
              style={{ display: 'none' }}
            />
          </section>
        </div>

        {/* CALC PANEL */}
        <div className="panel" id="panel-calc">
          <section className="card">
            <div className="calc-tabs">
              <div className="calc-tab active" data-calc="basic">
                Calculator
              </div>
              <div className="calc-tab" data-calc="tip">
                Tip / Split
              </div>
              <div className="calc-tab" data-calc="convert">
                Convert
              </div>
            </div>

            <div className="calc-sub active" id="calc-basic">
              <div className="calc-display mono" id="calcDisplay">
                0
              </div>
              <div className="calc-keys" id="calcKeys"></div>
            </div>

            <div className="calc-sub" id="calc-tip">
              <div className="tip-row">
                <label>Bill amount</label>
                <input type="number" id="tipBill" placeholder="0.00" inputMode="decimal" />
              </div>
              <div className="tip-row">
                <label>
                  Tip percent: <span id="tipPctLabel">18</span>%
                </label>
                <input type="range" id="tipPct" min="0" max="35" defaultValue="18" />
              </div>
              <div className="tip-row">
                <label>Split between</label>
                <input type="number" id="tipSplit" defaultValue="1" min="1" inputMode="numeric" />
              </div>
              <div className="tip-results">
                <div className="tip-result-box">
                  <div className="val mono" id="tipAmount">
                    $0.00
                  </div>
                  <div className="lbl">tip</div>
                </div>
                <div className="tip-result-box">
                  <div className="val mono" id="tipTotal">
                    $0.00
                  </div>
                  <div className="lbl">total</div>
                </div>
                <div className="tip-result-box">
                  <div className="val mono" id="tipPerPerson">
                    $0.00
                  </div>
                  <div className="lbl">each (w/ tip)</div>
                </div>
                <div className="tip-result-box">
                  <div className="val mono" id="tipPerPersonNoTip">
                    $0.00
                  </div>
                  <div className="lbl">each (bill only)</div>
                </div>
              </div>
            </div>

            <div className="calc-sub" id="calc-convert">
              <div className="calc-tabs" style={{ marginBottom: '14px' }}>
                <div className="calc-tab active" data-conv="length">
                  Length
                </div>
                <div className="calc-tab" data-conv="weight">
                  Weight
                </div>
                <div className="calc-tab" data-conv="temp">
                  Temp
                </div>
              </div>
              <div className="convert-row">
                <input type="number" id="convInput" defaultValue="1" inputMode="decimal" />
                <select id="convFrom"></select>
              </div>
              <div style={{ textAlign: 'center' }} className="convert-arrow">
                ↓
              </div>
              <div className="convert-row">
                <select id="convTo" style={{ flex: 1 }}></select>
              </div>
              <div className="convert-result mono" id="convResult">
                —
              </div>
            </div>
          </section>
        </div>

        {/* TASKS PANEL */}
        <div className="panel" id="panel-tasks">
          <section className="card">
            <p className="section-label">To-do</p>
            <div className="task-input-row">
              <input type="text" id="taskInput" placeholder="add a task..." />
              <button id="taskAddBtn" className="btn-icon">
                +
              </button>
            </div>
            <div id="taskList"></div>
          </section>
        </div>

        {/* CLOCK PANEL */}
        <div className="panel" id="panel-clock">
          <section className="card">
            <div className="calc-tabs">
              <div className="calc-tab active" data-clock="timer">
                Timer
              </div>
              <div className="calc-tab" data-clock="stopwatch">
                Stopwatch
              </div>
              <div className="calc-tab" data-clock="alarm">
                Alarm
              </div>
            </div>

            <div className="calc-sub active" id="clock-timer">
              <div className="big-display mono" id="timerDisplay">
                00:00
              </div>
              <div className="timer-presets">
                <button data-secs="60" className="btn-chip">
                  1 min
                </button>
                <button data-secs="300" className="btn-chip">
                  5 min
                </button>
                <button data-secs="600" className="btn-chip">
                  10 min
                </button>
                <button data-secs="900" className="btn-chip">
                  15 min
                </button>
              </div>
              <div className="convert-row">
                <input type="number" id="timerMinInput" placeholder="min" inputMode="numeric" min="0" />
                <input type="number" id="timerSecInput" placeholder="sec" inputMode="numeric" min="0" max="59" />
              </div>
              <button className="roll-btn btn-primary shiny" id="timerStartBtn">
                Start
              </button>
              <button className="btn-glass" id="timerResetBtn" style={{ width: '100%', marginTop: '8px' }}>
                Reset
              </button>
              <p className="settings-note" id="timerNote">
                Set a time and start. A notification fires when it ends, if your browser
                allows it.
              </p>
            </div>

            <div className="calc-sub" id="clock-stopwatch">
              <div className="big-display mono" id="stopwatchDisplay">
                00:00.0
              </div>
              <button className="roll-btn btn-primary shiny" id="stopwatchStartBtn">
                Start
              </button>
              <div className="backup-row">
                <button id="stopwatchLapBtn" className="btn-glass">
                  Lap
                </button>
                <button id="stopwatchResetBtn" className="btn-glass danger">
                  Reset
                </button>
              </div>
              <div id="lapList"></div>
            </div>

            <div className="calc-sub" id="clock-alarm">
              <div className="task-input-row">
                <input type="time" id="alarmTimeInput" />
                <button id="alarmAddBtn" className="btn-icon">
                  +
                </button>
              </div>
              <p className="settings-note">
                Alarms fire as a notification while this app is open or running in the
                background. They will not wake a locked phone the way a built-in clock
                app can — that requires system-level access a web app cannot get.
              </p>
              <div id="alarmList"></div>
            </div>
          </section>
        </div>

        {/* CALENDAR PANEL */}
        <div className="panel" id="panel-calendar">
          <section className="card">
            <div className="cal-header">
              <button id="calPrevBtn" className="btn-icon">
                <svg className="icon" viewBox="0 0 22 22" style={{ width: '16px', height: '16px' }}>
                  <path d="M13.5 4 7 11l6.5 7" />
                </svg>
              </button>
              <p className="section-label" id="calMonthLabel" style={{ margin: 0, border: 'none' }}></p>
              <button id="calNextBtn" className="btn-icon">
                <svg className="icon" viewBox="0 0 22 22" style={{ width: '16px', height: '16px' }}>
                  <path d="M8.5 4 15 11l-6.5 7" />
                </svg>
              </button>
            </div>
            <div className="cal-grid" id="calGrid"></div>
          </section>
          <section className="card" id="calEventsCard">
            <p className="section-label" id="calSelectedLabel">
              Events
            </p>
            <div id="calEventList"></div>
            <div className="task-input-row">
              <input type="text" id="calEventInput" placeholder="add an event for this day..." />
              <button id="calEventAddBtn" className="btn-icon">
                +
              </button>
            </div>
          </section>
        </div>

        {/* GAME PANEL */}
        <div className="panel" id="panel-game">
          <section className="card">
            <p className="section-label">Higher or Lower</p>
            <div className="game-stage">
              <div className="game-current mono" id="gameCurrent">
                --
              </div>
              <div className="game-sub" id="gameSub">
                guess if the next roll is higher or lower
              </div>
            </div>
            <div className="game-buttons">
              <button className="game-btn lower" id="gameLowerBtn">
                ▼ Lower
              </button>
              <button className="game-btn higher" id="gameHigherBtn">
                ▲ Higher
              </button>
            </div>
            <div className="game-stats">
              <div className="tip-result-box">
                <div className="val mono" id="gameStreak">
                  0
                </div>
                <div className="lbl">streak</div>
              </div>
              <div className="tip-result-box">
                <div className="val mono" id="gameBest">
                  0
                </div>
                <div className="lbl">best</div>
              </div>
            </div>
          </section>
        </div>

        {/* RECIPES & COOKING PORTAL PANEL */}
        <div className="panel" id="panel-recipes">
          
          {/* Header section with theme colors */}
          <section className="card p-4 relative overflow-hidden mb-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-center pb-2 border-b border-[#2e2454]/60 mb-3 select-none">
              <div className="flex items-center gap-2">
                <span className="text-[#ff7597] text-sm animate-pulse">🧪</span>
                <span className="text-[12.5px] font-bold text-[#faebd7] uppercase tracking-[0.2em]" style={{ fontFamily: "'Cormorant', serif" }}>Alchemist Cook's Crucible</span>
              </div>
              <span className="text-[9px] text-[#ff7597] font-bold border border-[#ff7597]/30 px-2.5 py-0.5 rounded-full bg-[#ff7597]/10 uppercase tracking-widest font-mono">No Token Cost</span>
            </div>
            
            <p className="text-[11px] text-[#b4aae2]/85 leading-relaxed">
              Decompile links from YouTube, TikTok, Instagram, or Facebook into accurate cooking instructions. Fuse dynamic recipes or synthesize custom potions using ingredients on your storage shelves.
            </p>

            {/* Custom Tab Segmented Selector */}
            <div className="segmented mt-4 w-full" id="recipeTabSwitcher">
              <button data-tab="codex" className="active text-xs">Saved Codex (3)</button>
              <button data-tab="fusion" className="text-xs">Fusion Bench</button>
              <button data-tab="pantry" className="text-xs">Pantry Alchemist</button>
            </div>
          </section>

          {/* TAB 1: SAVED CODEX */}
          <div className="recipe-tab-content active-tab" id="recipeTab-codex">
            
            {/* Decryptor link input & Manual Recipe Form */}
            <section className="card p-4">
              <div className="flex gap-4 border-b border-[#2e2454]/60 pb-2 mb-3.5 select-none text-[10px] font-bold tracking-[0.15em] uppercase">
                <button 
                  id="modeTranscribeBtn" 
                  className="text-[#ff7597] border-b-2 border-[#ff7597] pb-1 cursor-pointer focus:outline-none hover:text-white transition-colors duration-200"
                >
                  Transcribe Social Link
                </button>
                <button 
                  id="modeCreateManualBtn" 
                  className="text-[#b4aae2] pb-1 cursor-pointer focus:outline-none hover:text-white transition-colors duration-200"
                >
                  ➕ Write or Paste Recipe
                </button>
              </div>

              {/* MODE 1: TRANSCRIPTION SOURCE */}
              <div id="transcriptionForm" className="flex flex-col gap-2.5">
                <span className="text-[8px] font-bold text-[#b4aae2] tracking-[0.18em] uppercase block mb-1 select-none">Enter Facebook, Instagram, YouTube or TikTok Link</span>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input 
                    type="url" 
                    id="extractRecipeInput"
                    placeholder="https://www.tiktok.com/@creator/video/..." 
                    className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/40 rounded-xl px-3 py-2.5 flex-grow text-xs focus:outline-none focus:border-[#ff7597]/80 font-sans"
                    style={{ minWidth: '0' }}
                  />
                  <button 
                    id="extractRecipeBtn"
                    className="px-4 py-2.5 bg-gradient-to-r from-[#ff7597] to-[#e11d48] hover:from-[#ff9fbe] hover:to-[#f43f5e] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] shrink-0 active:scale-95 focus:outline-none cursor-pointer"
                  >
                    DECODE LINK ⚗️
                  </button>
                </div>

                {/* Extraction progress tracker logs - initially hidden */}
                <div id="extractionLogsContainer" className="hidden mt-3.5 p-3 rounded-xl border border-[#ff7597]/25 bg-[#120716]/65 font-mono text-[10px] leading-relaxed text-[#ffd6ea]">
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#ff7597]/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff7597] animate-ping"></div>
                    <span className="font-bold tracking-wider uppercase text-[9px] text-white">DECODING STREAM CAPTIONS...</span>
                  </div>
                  <div id="extractionLogsList" className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                    {/* Instantiated via JS */}
                  </div>
                </div>
              </div>

              {/* MODE 2: MANUAL WRITE OR PASTE */}
              <div id="manualRecipeForm" className="hidden flex flex-col gap-3">
                <span className="text-[8px] font-bold text-[#b4aae2] tracking-[0.18em] uppercase block select-none">Handcraft Your Custom Recipe Potion</span>
                
                {/* AI / Gemini / Blog Textbox Smart Fast Paste */}
                <div className="bg-[#1b1236]/80 p-3 rounded-xl border border-[#44387a]/60 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[8px] font-bold text-[#ff7597] tracking-[0.18em] uppercase block select-none">✨ Magic Clipboard Paste (AI / Gemini / Blogs)</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">No API/Tokens</span>
                  </div>
                  <p className="text-[9.5px] text-[#b4aae2]/60 leading-snug">
                    Paste any recipe copied from Gemini, ChatGPT, or websites here, and click "Auto-Parse". We'll sort out the name, cooking times, ingredients, and steps instantly!
                  </p>
                  <textarea 
                    id="magicPasteInput" 
                    placeholder="Paste your raw text or Gemini output here... e.g.&#10;**Sweet & Sour Pork**&#10;Prep Time: 15 mins | Cook: 15 mins&#10;Ingredients:&#10;- 1 lb pork shoulder&#10;- 1 bell pepper&#10;Directions:&#10;1. Cut the pork..." 
                    className="w-full bg-[#120a24]/90 border border-[#44387a]/40 text-white placeholder-[#b4aae2]/25 text-xs rounded-xl p-2.5 h-20 focus:outline-none focus:border-[#ff7597]/75 font-sans leading-relaxed resize-y"
                  ></textarea>
                  <button 
                    id="magicPasteParseBtn"
                    type="button"
                    className="w-full py-1.5 bg-[#44387a]/60 hover:bg-[#ff7597]/25 text-[#faebd7] hover:text-[#ff7597] border border-[#44387a]/80 hover:border-[#ff7597]/40 rounded-lg text-[10.5px] font-mono uppercase tracking-wider transition-all duration-300 active:scale-95 cursor-pointer focus:outline-none flex items-center justify-center gap-1.5"
                  >
                    Auto-Parse & Sort Recipe ⚡
                  </button>
                </div>
                
                <div>
                  <label htmlFor="manualRecipeTitle" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Recipe Name (Custom Name)</label>
                  <input 
                    type="text" 
                    id="manualRecipeTitle" 
                    placeholder="e.g. Grandma's Secret Beef Stew" 
                    className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/40 rounded-xl px-3 py-2 w-full text-xs focus:outline-none focus:border-[#ff7597]/80"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="manualRecipePlatform" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Source / Tag</label>
                    <select 
                      id="manualRecipePlatform" 
                      className="bg-[#120a24]/95 border border-[#44387a]/60 text-white rounded-xl px-2.5 py-2.5 w-full text-xs focus:outline-none focus:border-[#ff7597]/80 select-none cursor-pointer"
                    >
                      <option value="custom">Handcrafted</option>
                      <option value="pantry">Pantry Alchemist</option>
                      <option value="tiktok">TikTok Style</option>
                      <option value="youtube">YouTube Channel</option>
                      <option value="instagram">Instagram</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="manualRecipeDifficulty" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Difficulty</label>
                    <select 
                      id="manualRecipeDifficulty" 
                      className="bg-[#120a24]/95 border border-[#44387a]/60 text-white rounded-xl px-2.5 py-2.5 w-full text-xs focus:outline-none select-none cursor-pointer"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="manualRecipePrep" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Prep Time</label>
                    <input 
                      type="text" 
                      id="manualRecipePrep" 
                      placeholder="10 mins" 
                      className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/30 rounded-xl px-2.5 py-2 w-full text-xs focus:outline-none focus:border-[#ff7597]/80"
                    />
                  </div>
                  <div>
                    <label htmlFor="manualRecipeCook" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Cook Time</label>
                    <input 
                      type="text" 
                      id="manualRecipeCook" 
                      placeholder="15 mins" 
                      className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/30 rounded-xl px-2.5 py-2 w-full text-xs focus:outline-none focus:border-[#ff7597]/80"
                    />
                  </div>
                  <div>
                    <label htmlFor="manualRecipeServings" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Servings</label>
                    <input 
                      type="text" 
                      id="manualRecipeServings" 
                      placeholder="4 servings" 
                      className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/30 rounded-xl px-2.5 py-2 w-full text-xs focus:outline-none focus:border-[#ff7597]/80"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="manualRecipeIngredients" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Ingredients (Paste / Type, one per line)</label>
                  <textarea 
                    id="manualRecipeIngredients" 
                    placeholder="e.g.&#10;3 cups Chicken Broth&#10;2 cloves Garlic, minced&#10;1 pinch Black Pepper" 
                    className="w-full bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/35 text-xs rounded-xl p-3 h-24 focus:outline-none focus:border-[#ff7597]/80 font-sans leading-relaxed"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="manualRecipeDirections" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Cooking steps (Paste / Type, one per line)</label>
                  <textarea 
                    id="manualRecipeDirections" 
                    placeholder="e.g.&#10;Bring broth to dynamic boil&#10;Gently whisk garlic and spice in kettle&#10;Serve piping hot with fresh toast" 
                    className="w-full bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/35 text-xs rounded-xl p-3 h-24 focus:outline-none focus:border-[#ff7597]/80 font-sans leading-relaxed"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="manualRecipeSecretTip" className="text-[9px] font-bold text-[#b4aae2]/80 uppercase tracking-wide block mb-1">Secret Chef Tip (Optional)</label>
                  <input 
                    type="text" 
                    id="manualRecipeSecretTip" 
                    placeholder="e.g. Garnish with high-contrast sliced lemon zest" 
                    className="bg-[#120a24]/90 border border-[#44387a]/60 text-white placeholder-[#b4aae2]/40 rounded-xl px-3 py-2 w-full text-xs focus:outline-none focus:border-[#ff7597]/80"
                  />
                </div>

                <button 
                  id="saveManualRecipeBtn"
                  className="w-full py-2.5 mt-1 bg-gradient-to-r from-emerald-500 to-[#10b981] hover:from-emerald-400 hover:to-[#059669] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] shrink-0 active:scale-95 focus:outline-none cursor-pointer"
                >
                  SAVE RECIPE TO CODEX ⚙️
                </button>
              </div>
            </section>

            {/* Global Search and Filter */}
            <div className="flex items-center gap-2.5 mb-3 select-none">
              <input 
                type="text" 
                id="searchRecipesInput"
                placeholder="Search codex by titles or ingredients..." 
                className="bg-[#120a24]/60 border border-[#2e2454]/60 text-white placeholder-[#b4aae2]/30 rounded-xl px-3.5 py-2 w-full text-[11.5px] focus:outline-none focus:border-[#ff7597]/50"
              />
            </div>

            {/* Recipe Grid list */}
            <div className="grid grid-cols-1 gap-4" id="recipeGrid">
              {/* Loaded dynamically by JS */}
            </div>
            
          </div>

          {/* TAB 2: FUSION BENCH */}
          <div className="recipe-tab-content hidden" id="recipeTab-fusion">
            <section className="card p-4 text-center">
              <div className="text-3xl mb-1.5">⚗️</div>
              <p className="text-[13px] font-bold text-[#faebd7] tracking-wider uppercase mb-1" style={{ fontFamily: "'Cormorant', serif" }}>Alchemical Fusion Chambers</p>
              <p className="text-[10px] text-[#b4aae2]/70 leading-relaxed mb-4 max-w-sm mx-auto">
                Select some recipes in the <b>Saved Codex</b> using their fusion checkboxes, then fire up the crucible furnace below to blend them into an exotic hybrid potion recipe!
              </p>

              {/* Bench status displays */}
              <div className="p-3.5 rounded-2xl border border-[#44387a]/40 bg-[#16102b]/40 mb-4 max-w-md mx-auto text-left">
                <span className="text-[9px] font-mono text-[#ff7597] font-bold block uppercase tracking-wider mb-2">TARGETS MARKED FOR MERGE</span>
                <div id="fusionSelectionList" className="space-y-1.5 text-xs text-[#faebd7]">
                  <div className="italic text-[#b4aae2]/50 text-[10.5px]">No recipes selected. Return to Saved Codex tab to check fusion boxes!</div>
                </div>
              </div>

              {/* Giant merge mechanism visual */}
              <div className="relative w-full py-6 flex flex-col items-center justify-center select-none">
                
                {/* Ambient glowing circles */}
                <div id="fusionGlowBackdrop" className="absolute w-36 h-36 bg-[#ff7597]/15 rounded-full blur-2xl opacity-40 transition-all duration-300"></div>
                
                {/* Interactive alchemical kettle cauldron SVG */}
                <svg className="w-24 h-24 text-[#b4aae2] relative z-10 transition-transform duration-300" id="fusionCauldron" viewBox="0 0 100 100">
                  <path d="M25 40 Q50 30 75 40 L80 65 Q80 85 50 85 Q20 85 20 65 Z" fill="#1b1231" stroke="#ff7597" strokeWidth="2.5" />
                  <path d="M22 47 Q50 38 78 47" fill="none" stroke="#ff7597" strokeWidth="1" opacity="0.4" />
                  <ellipse cx="50" cy="40" rx="25" ry="6" fill="#421b38" stroke="#ff7597" strokeWidth="1.5" />
                  
                  {/* Cauldron bubbles */}
                  <circle cx="42" cy="38" r="1.5" fill="#ffd6ea" className="animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <circle cx="50" cy="37" r="2.5" fill="#ffd6ea" className="animate-bounce" style={{ animationDelay: '0.5s' }} />
                  <circle cx="58" cy="39" r="1.8" fill="#ffd6ea" className="animate-bounce" style={{ animationDelay: '0.3s' }} />
                  
                  {/* Fire rack */}
                  <path d="M15 85 L85 85 M30 85 L35 93 M70 85 L65 93" stroke="#44387a" strokeWidth="3" />
                  {/* Flames */}
                  <path id="fusionFlames" d="M40 92 Q50 78 50 82 Q50 78 60 92" fill="#ff7597" opacity="0.8" />
                </svg>

                {/* Live fusing status text */}
                <div id="fusionStatusLabel" className="text-[10px] uppercase font-mono font-bold mt-3 text-[#b4aae2]">STANDING BY FOR HEARTH IGNITION</div>
              </div>

              <button 
                id="fuseRecipesBtn"
                disabled
                className="w-full max-w-xs py-3 md:py-3.5 bg-gradient-to-r from-amber-500 via-[#ff7597] to-purple-600 hover:opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(255,117,151,0.2)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
              >
                AUTOCLAVE RECIPES ⚗️
              </button>
            </section>
          </div>

          {/* TAB 3: PANTRY ALCHEMIST */}
          <div className="recipe-tab-content hidden" id="recipeTab-pantry">
            
            {/* Custom Pantry list addition form */}
            <section className="card p-4 mb-4">
              <span className="text-[9px] font-bold text-amber-400 tracking-[0.18em] uppercase block mb-2 select-none">ADD STAPLES TO STORAGE</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="addPantryInput"
                  placeholder="e.g. Sriracha Sauce, White Onion, Garlic..."
                  className="bg-[#120a24]/90 border border-[#2e2454]/60 text-white placeholder-[#b4aae2]/40 rounded-xl px-3 py-2 flex-grow text-xs focus:outline-none focus:border-amber-400 font-sans"
                />
                <button 
                  id="addPantryBtn"
                  className="px-4 bg-[#2e1d16] hover:bg-[#3d271f] text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs uppercase transition-all duration-200 cursor-pointer focus:outline-none shrink-0"
                >
                  + ADD ITEM
                </button>
              </div>
            </section>

            {/* Staples shelf checklist */}
            <section className="card p-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#2e2454]/60 mb-3 select-none">
                <span className="text-[9px] font-bold text-amber-400 tracking-[0.18em] uppercase block">INGREDIENTS IN MY KITCHEN</span>
                <button id="clearPantryBtn" className="text-[8px] text-[#ff2e5b] uppercase font-mono font-bold hover:underline bg-transparent border-none p-0 cursor-pointer focus:outline-none">RESET SHELVES</button>
              </div>

              <div id="pantryShelvesGrid" className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                {/* Dynamically populated checklists */}
              </div>

              <button 
                id="synthesizePantryBtn"
                className="w-full py-3.5 mt-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_4px_14px_rgba(245,158,11,0.25)] cursor-pointer focus:outline-none text-center block select-none"
              >
                CREATE FROM PANTRY 🍳
              </button>
            </section>
          </div>

        </div>

        {/* DETAILS OVERLAY MODAL - VIEWING INGREDIENTS & STEPS */}
        <div id="recipeDetailModal" className="hidden fixed inset-0 z-[100] bg-[#0c081e]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#160f2e] border border-[#cf4fe6]/40 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-panel-in-left">
            
            {/* Modal sticky top header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#2d244c] bg-[#110b24]">
              <div className="flex flex-col select-none">
                <span id="modalPlatformBadge" className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#ff2e5b]/10 text-[#ff2e5b] inline-block w-fit uppercase mb-1">YOUTUBE</span>
                <span id="modalTitle" className="text-sm font-bold text-white tracking-wide" style={{ fontFamily: "'Cormorant', serif" }}>Recipe Title</span>
              </div>
              <button 
                id="closeRecipeModalBtn"
                className="w-8 h-8 rounded-full border border-[#44387a] bg-[#120a24]/80 text-[#b4aae2] hover:text-white flex items-center justify-center font-bold text-xs transition-colors duration-200 cursor-pointer focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Scrollable details wrapper */}
            <div className="flex-grow overflow-y-auto p-5 space-y-5">
              
              {/* Stat specs */}
              <div className="grid grid-cols-4 gap-2 text-center select-none">
                <div className="bg-[#1f163f]/50 border border-[#2d244c] p-2 rounded-xl">
                  <div className="text-[8px] uppercase tracking-wider text-[#b4aae2]/60 font-semibold mb-0.5">Difficulty</div>
                  <div id="modalDifficulty" className="text-[11px] font-bold text-[#ffd6ea]">Easy</div>
                </div>
                <div className="bg-[#1f163f]/50 border border-[#2d244c] p-2 rounded-xl">
                  <div className="text-[8px] uppercase tracking-wider text-[#b4aae2]/60 font-semibold mb-0.5">Prep Time</div>
                  <div id="modalPrepTime" className="text-[11px] font-mono font-bold text-[#faebd7]">10 mins</div>
                </div>
                <div className="bg-[#1f163f]/50 border border-[#2d244c] p-2 rounded-xl">
                  <div className="text-[8px] uppercase tracking-wider text-[#b4aae2]/60 font-semibold mb-0.5">Cook Time</div>
                  <div id="modalCookTime" className="text-[11px] font-mono font-bold text-[#faebd7]">15 mins</div>
                </div>
                <div className="bg-[#1f163f]/50 border border-[#2d244c] p-2 rounded-xl">
                  <div className="text-[8px] uppercase tracking-wider text-[#b4aae2]/60 font-semibold mb-0.5">Servings</div>
                  <div id="modalServings" className="text-[11px] font-bold text-[#ffd3b6]">2 cups</div>
                </div>
              </div>

              {/* Source social video link widget */}
              <div className="bg-gradient-to-r from-[#1a0f30] to-[#0d071c] p-3 rounded-2xl border border-[#2d244c]/60 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">📹</span>
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-[#b4aae2]/60 font-semibold uppercase">Source Culinary Video</span>
                    <span className="text-[11px] text-[#ffd6ea] font-medium mt-0.5 truncate max-w-[190px] sm:max-w-xs" id="modalVideoSubtitle">original stream link</span>
                  </div>
                </div>
                <a 
                  id="modalVideoLink"
                  href="#" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3.5 py-1.5 bg-[#44387a]/40 hover:bg-[#cf4fe6]/20 text-[#ffe9b8] hover:text-white border border-[#44387a] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
                >
                  PLAY VIDEO ↗
                </a>
              </div>

              {/* Interactive ingredients listing */}
              <div>
                <span className="text-[10px] font-bold text-[#ff7597] tracking-[0.16em] uppercase block mb-2.5 select-none font-sans">INGREDIENTS CHECKLIST (TAP TO COUNT)</span>
                <div id="modalIngredientsList" className="space-y-1.5 bg-[#120a24]/40 p-3 rounded-2xl border border-[#2d244c]/60">
                  {/* Loaded via JS */}
                </div>
              </div>

              {/* Cooking directions steps */}
              <div>
                <span className="text-[10px] font-bold text-[#ff7597] tracking-[0.16em] uppercase block mb-2.5 select-none font-sans">PREPARATION INSTRUCTION WORKFLOW</span>
                <div id="modalDirectionsList" className="space-y-3">
                  {/* Loaded via JS */}
                </div>
              </div>

              {/* Kitchen Assistant Timer System */}
              <div className="bg-[#120a24]/90 border border-amber-500/30 p-4 rounded-3xl relative overflow-hidden">
                <p className="text-[9px] font-bold text-amber-400 tracking-[0.2em] uppercase mb-2 select-none">BUILT-IN ALCHEMICAL COOKING TIMER</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-2 border border-amber-500/20 rounded-full text-amber-400 text-lg animate-pulse">⏰</div>
                    <div className="text-2xl font-mono text-amber-300 font-extrabold tracking-widest select-all" id="cookingTimerDisplay">00:00</div>
                  </div>
                  
                  {/* Pre-fill minutes options */}
                  <div className="flex gap-1 select-none">
                    <button data-mins="3" className="px-2 py-1 bg-[#2e1d16] border border-amber-500/30 text-[10px] rounded-lg text-amber-300 cursor-pointer focus:outline-none">3m</button>
                    <button data-mins="5" className="px-2 py-1 bg-[#2e1d16] border border-amber-500/30 text-[10px] rounded-lg text-amber-300 cursor-pointer focus:outline-none">5m</button>
                    <button data-mins="10" className="px-2 py-1 bg-[#2e1d16] border border-amber-500/30 text-[10px] rounded-lg text-amber-300 cursor-pointer focus:outline-none">10m</button>
                  </div>

                  <button 
                    id="cookingTimerBtn"
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-white rounded-xl font-bold text-[10px] uppercase cursor-pointer focus:outline-none shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  >
                    START TIMER
                  </button>
                </div>
              </div>

              {/* Editable chef lab notebook section */}
              <div>
                <div className="flex justify-between items-center mb-1.5 select-none">
                  <span className="text-[10px] font-bold text-[#ff7597] tracking-[0.16em] uppercase block font-sans">MY PERSONAL KITCHEN LAB NOTES</span>
                  <span className="text-[9px] text-[#b4aae2]/50 font-bold uppercase font-mono tracking-wider">AUTO-SAVED IN DEVICE</span>
                </div>
                <textarea 
                  id="modalChefNotesInput"
                  placeholder="Insert custom substitutions, ratios, spices, seasoning quantities or feedback on the recipe here..."
                  className="w-full bg-[#120a24]/80 border border-[#2e2454]/60 text-white placeholder-[#b4aae2]/30 text-xs rounded-2xl p-3.5 leading-relaxed h-20 focus:outline-none focus:border-[#cf4fe6]"
                ></textarea>
              </div>

              {/* Special chef tip box info section */}
              <div className="p-3.5 rounded-2xl border border-[#ff7597]/20 bg-[#ff7597]/5 select-all leading-relaxed">
                <span className="text-[9px] font-mono text-[#ff7597] font-extrabold uppercase tracking-widest block mb-1.5">ALCHEMIST SECRET TIPS & TRICKS</span>
                <p id="modalSecretTip" className="text-[11px] italic text-[#ffd6ea]">Adding cold butter gives the sauces an incredible reflective luster!</p>
              </div>

            </div>
          </div>
        </div>
        <div className="panel" id="panel-settings">
          <section className="card">
            <p className="section-label">Appearance</p>
            <div className="setting-row">
              <div className="setting-label">
                <span>Theme</span>
                <span className="setting-sub">how the portal looks</span>
              </div>
              <div className="segmented" id="themeSegmented">
                <button data-theme="dark" className="active">
                  Dark
                </button>
                <button data-theme="contrast">High contrast</button>
                <button data-theme="light">Light</button>
              </div>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <span>Motion</span>
                <span className="setting-sub">animations and ambient drift</span>
              </div>
              <label className="switch">
                <input type="checkbox" id="motionToggle" defaultChecked />
                <span className="switch-track"></span>
              </label>
            </div>
          </section>

          <section className="card">
            <p className="section-label">Feedback</p>
            <div className="setting-row">
              <div className="setting-label">
                <span>Haptics</span>
                <span className="setting-sub">vibration on rolls and taps (Android)</span>
              </div>
              <label className="switch">
                <input type="checkbox" id="hapticsToggle" defaultChecked />
                <span className="switch-track"></span>
              </label>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <span>Sound</span>
                <span className="setting-sub">a soft tone on roll landing</span>
              </div>
              <label className="switch">
                <input type="checkbox" id="soundToggle" />
                <span className="switch-track"></span>
              </label>
            </div>
          </section>

          <section className="card">
            <p className="section-label">Dice</p>
            <div className="setting-row">
              <div className="setting-label">
                <span>Default die</span>
                <span className="setting-sub">selected when you open Roll</span>
              </div>
              <select id="defaultDieSelect" className="settings-select">
                <option value="2">Coin</option>
                <option value="4">d4</option>
                <option value="6">d6</option>
                <option value="8">d8</option>
                <option value="10">d10</option>
                <option value="12">d12</option>
                <option value="20" selected>
                  d20
                </option>
                <option value="100">d100</option>
              </select>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <span>Greeting flip</span>
                <span className="setting-sub">auto coin flip when the app opens</span>
              </div>
              <label className="switch">
                <input type="checkbox" id="greetingToggle" defaultChecked />
                <span className="switch-track"></span>
              </label>
            </div>
          </section>

          <section className="card">
            <p className="section-label">Your data</p>
            <p className="settings-note">
              Everything you enter — notes, sheet, tasks, roll history — stays only
              on this device. Nothing is sent anywhere. Export to take your data to other devices!
            </p>
            <div className="backup-row flex flex-wrap gap-2.5 mt-2">
              <button id="exportAllData" className="btn-glass flex-1 min-w-[120px]">
                📥 Export Backup
              </button>
              <button id="importAllData" className="btn-glass flex-1 min-w-[120px]">
                📤 Import Backup
              </button>
              <button id="clearAllData" className="btn-glass danger flex-1 min-w-[120px]">
                🗑️ Clear Data
              </button>
              <input type="file" id="importFileInput" accept=".json" className="hidden" />
            </div>
          </section>

          <section className="card">
            <p className="section-label">About</p>
            <p className="settings-note">
              The Portal — a companion for the table and beyond. Roll fair dice,
              keep notes, track your character, calculate anything, and never lose the
              thread.
            </p>
          </section>
        </div>
      </main>

      <div id="toastHost"></div>

      <nav>
        <button className="active" data-panel="home">
          <svg className="ic" viewBox="0 0 22 22">
            <path d="M3 10.5 11 4l8 6.5M5 9v9h12V9" />
          </svg>
          Home
        </button>
        <button data-panel="roll">
          <svg className="ic" viewBox="0 0 22 22">
            <path d="M11 2 2 7.5v7L11 20l9-5.5v-7L11 2Z" />
            <circle cx="11" cy="11" r="1.6" fill="currentColor" stroke="none" />
          </svg>
          Roll
        </button>
        <button data-panel="notes">
          <svg className="ic" viewBox="0 0 22 22">
            <path d="M15.5 2.5 19 6l-11 11-4.2 1.2L5 14 15.5 2.5Z" />
          </svg>
          Notes
        </button>
        <button data-panel="tasks">
          <svg className="ic" viewBox="0 0 22 22">
            <rect x="3" y="3" width="16" height="16" rx="3" />
            <path d="m7 11 3 3 5-6" />
          </svg>
          Tasks
        </button>
        <button data-panel="calendar">
          <svg className="ic" viewBox="0 0 22 22">
            <rect x="3" y="4.5" width="16" height="14.5" rx="2.5" />
            <path d="M3 9h16M7 2.5v3M15 2.5v3" />
          </svg>
          Cal
        </button>
        <button data-panel="recipes">
          <span className="text-[14px] leading-none mb-0.5" style={{ filter: 'drop-shadow(0 0 4px rgba(255,117,151,0.5))' }}>🍳</span>
          Cook
        </button>
        <button data-panel="settings">
          <svg className="ic" viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="3" />
            <path d="M11 2.5v2.2M11 17.3v2.2M19.5 11h-2.2M4.7 11H2.5M17 5l-1.6 1.6M6.6 15.4 5 17M17 17l-1.6-1.6M6.6 6.6 5 5" />
          </svg>
          Settings
        </button>
      </nav>
    </>
  );
}

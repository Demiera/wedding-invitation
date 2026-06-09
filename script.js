// Church map popup toggle
  function toggleChurchMap() {
    const popup = document.getElementById('churchMapPopup');
    const overlay = document.getElementById('churchMapOverlay');
    const isOpen = popup.classList.contains('popup-open');
    if (isOpen) {
      popup.classList.remove('popup-open');
      overlay.classList.remove('popup-open');
    } else {
      popup.classList.add('popup-open');
      overlay.classList.add('popup-open');
    }
  }

  // Countdown
  function updateCountdown() {
    const wedding = new Date('2026-06-26T14:00:00');
    const now = new Date();
    const diff = wedding - now;
    if (diff <= 0) {
      ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => document.getElementById(id).textContent = '0');
      return;
    }
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);
    document.getElementById('cd-days').textContent  = String(days).padStart(2,'0');
    document.getElementById('cd-hours').textContent = String(hours).padStart(2,'0');
    document.getElementById('cd-mins').textContent  = String(mins).padStart(2,'0');
    document.getElementById('cd-secs').textContent  = String(secs).padStart(2,'0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Envelope toggle — envelope hides when opened, letter floats up
  function toggleEnvelope() {
    const env = document.getElementById('mainEnvelope');
    const cta = document.getElementById('envCta');
    const close = document.getElementById('closeBtn');
    const letter = document.getElementById('letterCard');
    const isOpen = env.classList.contains('open');

    if (isOpen) {
      letter.classList.remove('letter-animate');
      setTimeout(() => {
        letter.classList.remove('letter-visible');
        env.classList.remove('open');
        env.classList.remove('env-hide');
      }, 600);
      cta.style.opacity = '1';
      cta.style.pointerEvents = 'auto';
      close.style.display = 'none';
    } else {
      env.classList.add('open');
      cta.style.opacity = '0';
      cta.style.pointerEvents = 'none';
      close.style.display = 'inline-flex';
      // After flap opens, fade out envelope then show letter
      setTimeout(() => {
        env.classList.add('env-hide');
      }, 700);
      setTimeout(() => {
        letter.classList.add('letter-visible');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            letter.classList.add('letter-animate');
          });
        });
      }, 950);
    }
  }

  // Send message to Gmail via FormSubmit
  function sendMessageViaEmail() {
    const msg = document.getElementById('guestMessage').value.trim();
    const name = document.getElementById('guestName').value.trim();
    if (!msg) { 
      showInputError('Please write a message first.');
      return; 
    }

    const btn = document.querySelector('.send-message-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="sending-dots"><span>.</span><span>.</span><span>.</span></span> Sending`;

    // Use FormSubmit for real email delivery to Gmail
    const formData = new FormData();
    formData.append('_to', 'jpbebora@gmail.com');
    formData.append('_subject', 'Wedding Message' + (name ? ' from ' + name : ''));
    formData.append('name', name || 'Anonymous Guest');
    formData.append('message', msg);
    formData.append('_captcha', 'false');
    formData.append('_template', 'box');

    fetch('https://formsubmit.co/ajax/353ca3c40cfb00f4ec196d6340cb71ab', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      showThankYou(name);
    })
    .catch(() => {
      // Fallback: mailto if fetch fails
      showThankYou(name);
      const subject = encodeURIComponent('Wedding Message' + (name ? ' from ' + name : ''));
      const body = encodeURIComponent((name ? 'From: ' + name + '\n\n' : '') + msg);
      setTimeout(() => { window.location.href = `mailto:jpbebora@gmail.com?subject=${subject}&body=${body}`; }, 1200);
    });
  }

  function showInputError(msg) {
    const existing = document.querySelector('.input-error');
    if (existing) existing.remove();
    const err = document.createElement('p');
    err.className = 'input-error';
    err.textContent = msg;
    err.style.cssText = 'color:#c0392b;font-family:Cinzel,serif;font-size:10px;letter-spacing:2px;text-align:center;margin-top:6px;';
    document.querySelector('.letter-message-box').appendChild(err);
    setTimeout(() => err.remove(), 3000);
  }

  function showThankYou(name) {
    const overlay = document.getElementById('thankYouOverlay');
    overlay.querySelector('.ty-name').textContent = name ? name : 'dear guest';
    overlay.classList.add('ty-visible');
    // Confetti burst
    launchConfetti();
    setTimeout(() => {
      overlay.classList.remove('ty-visible');
      const btn = document.querySelector('.send-message-btn');
      btn.disabled = false;
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg> Message Sent!`;
      btn.style.background = 'var(--sage)';
    }, 4000);
  }

  function launchConfetti() {
    const colors = ['#b8933a','#7a8f5a','#f5e6a3','#e8d5a3','#c0392b','#ffffff'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 4;
      const startX = Math.random() * window.innerWidth;
      c.style.cssText = `
        position:fixed; z-index:9999; pointer-events:none;
        left:${startX}px; top:-10px;
        width:${size}px; height:${size * (Math.random() > 0.5 ? 1 : 2.5)}px;
        background:${color}; border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        animation: confettiFall ${(Math.random() * 2 + 2).toFixed(1)}s ease-in ${(Math.random() * 0.8).toFixed(2)}s forwards;
        transform: rotate(${Math.random() * 360}deg);
      `;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }
  }

  // Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 80);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Generate QR code
  const qrData = 'https://gcash.me/johnandhazil2026'; // ← CHANGE THIS to your GCash QR link
  new QRCode(document.getElementById('qrCanvas'), {
    text: qrData,
    width: 90,
    height: 90,
    colorDark: '#3d4e28',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });



  // ── BACKGROUND PARTICLE ANIMATIONS ──
  function createParticles() {
    const configs = [
      {
        selector: '.hero',
        count: 22,
        colors: ['rgba(184,147,58,0.18)', 'rgba(90,110,63,0.18)', 'rgba(232,215,163,0.25)'],
        type: 'petal'
      },
      {
        selector: '.verse-section',
        count: 20,
        colors: ['rgba(184,147,58,0.14)', 'rgba(255,255,255,0.1)', 'rgba(232,215,163,0.12)'],
        type: 'star'
      },
      {
        selector: '.details-section',
        count: 16,
        colors: ['rgba(184,147,58,0.12)', 'rgba(90,110,63,0.1)', 'rgba(154,173,114,0.12)'],
        type: 'petal'
      },
      {
        selector: '.attire-section',
        count: 14,
        colors: ['rgba(184,147,58,0.15)', 'rgba(245,230,163,0.25)', 'rgba(240,232,214,0.3)'],
        type: 'petal'
      },
      {
        selector: '.note-section',
        count: 14,
        colors: ['rgba(184,147,58,0.1)', 'rgba(90,110,63,0.1)', 'rgba(61,78,40,0.08)'],
        type: 'star'
      },
      {
        selector: '.reception-section',
        count: 18,
        colors: ['rgba(184,147,58,0.12)', 'rgba(255,255,255,0.07)', 'rgba(122,143,90,0.1)'],
        type: 'star'
      },
      {
        selector: '.countdown-section',
        count: 16,
        colors: ['rgba(184,147,58,0.18)', 'rgba(61,78,40,0.12)', 'rgba(245,230,163,0.3)'],
        type: 'petal'
      },
      {
        selector: '.envelope-section',
        count: 20,
        colors: ['rgba(184,147,58,0.18)', 'rgba(90,110,63,0.12)', 'rgba(232,215,163,0.22)'],
        type: 'petal'
      },
      {
        selector: 'footer',
        count: 16,
        colors: ['rgba(184,147,58,0.12)', 'rgba(255,255,255,0.06)', 'rgba(122,143,90,0.1)'],
        type: 'star'
      }
    ];

    configs.forEach(cfg => {
      const section = document.querySelector(cfg.selector);
      if (!section) return;

      // Ensure section has position:relative (already set, but just in case)
      const existingPos = getComputedStyle(section).position;
      if (existingPos === 'static') section.style.position = 'relative';

      // Check if it already has a particles container injected
      if (section.querySelector('.section-particles')) return;

      const container = document.createElement('div');
      container.className = 'section-particles';
      section.insertBefore(container, section.firstChild);

      for (let i = 0; i < cfg.count; i++) {
        const el = document.createElement('div');
        const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
        const left = Math.random() * 95 + '%';
        const delay = Math.random() * 12 + 's';
        const dur = (Math.random() * 10 + 8) + 's';

        if (cfg.type === 'star') {
          el.className = 'star-particle';
          const size = Math.random() * 4 + 2;
          el.style.cssText = `
            left:${left}; top:${Math.random()*90+'%'};
            width:${size}px; height:${size}px;
            background:${color};
            animation-duration:${(Math.random()*3+2)+'s'};
            animation-delay:${delay};
          `;
        } else {
          el.className = 'leaf-particle';
          const size = Math.random() * 10 + 6;
          el.style.cssText = `
            left:${left}; bottom:-20px;
            width:${size}px; height:${size*1.6}px;
            background:${color};
            border-radius:${Math.random()>0.5?'50% 0':'0 50%'};
            animation-duration:${dur};
            animation-delay:${delay};
          `;
        }
        container.appendChild(el);
      }
    });
  }

  createParticles();
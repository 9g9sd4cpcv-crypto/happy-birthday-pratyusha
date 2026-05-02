/* ═══════════════════════════════════════════════════════════
   PRATYUSHA'S BIRTHDAY WEBSITE — script.js
   All sections: Intro · Lock · Heartbeat · Voice · Chat
                 Timeline · Gallery · Fireworks · Admin
═══════════════════════════════════════════════════════════ */

"use strict";

/* ──────────────────────────────────────────────────────────
   UNLOCK DATE  (8 May 2025 00:00:00 local time)
────────────────────────────────────────────────────────── */
const UNLOCK_DATE = new Date(2025, 4, 8, 0, 0, 0);  // Month is 0-based → 4 = May

/* ──────────────────────────────────────────────────────────
   STATE
────────────────────────────────────────────────────────── */
let isUnlocked     = false;
let musicPlaying   = false;
let hbInterval     = null;
let hbAudioCtx     = null;
let vnPlaying      = false;
let vnTimerID      = null;
let vnProgress     = 0;
let footerClicks   = 0;
let adminAuthed    = false;
let fireworksActive= false;
let fwRAF          = null;
let speechSynth    = window.speechSynthesis;
let currentUtterance = null;
let speechWords    = [];
let speechWordIdx  = 0;

/* ──────────────────────────────────────────────────────────
   DOM REFS
────────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const introEl       = $('cinematic-intro');
const lockEl        = $('lock-screen');
const burstEl       = $('unlock-burst');
const mainEl        = $('main-site');
const musicBtn      = $('music-btn');
const bgMusic       = $('bg-music');
const fireworksCvs  = $('fireworks-canvas');
const fwCtx         = fireworksCvs.getContext('2d');

/* ═══════════════════════════════════════════════════════════
   1. CINEMATIC INTRO
═══════════════════════════════════════════════════════════ */
function runIntro() {
  // Starfield on intro canvas
  const cvs  = $('intro-canvas');
  const ctx  = cvs.getContext('2d');
  const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  const stars = Array.from({length:180}, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random()*1.5+.3,
    a: Math.random(), da: (Math.random()*.006+.002)*(Math.random()<.5?1:-1)
  }));

  let running = true;
  (function drawStars(){
    if(!running) return;
    ctx.clearRect(0,0,cvs.width,cvs.height);
    stars.forEach(s => {
      s.a = Math.max(0, Math.min(1, s.a + s.da));
      if(s.a<=0||s.a>=1) s.da *= -1;
      ctx.beginPath();
      ctx.arc(s.x*cvs.width, s.y*cvs.height, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,220,230,${s.a})`;
      ctx.fill();
    });
    requestAnimationFrame(drawStars);
  })();

  // Sequence
  const l1 = $('intro-line-1');
  const l2 = $('intro-line-2');
  const nm = $('intro-name');

  setTimeout(()=> l1.classList.add('show'), 800);
  setTimeout(()=> l2.classList.add('show'), 2600);
  setTimeout(()=> nm.classList.add('show'), 4400);

  setTimeout(()=> {
    running = false;
    introEl.style.transition = 'opacity 1.2s ease';
    introEl.style.opacity    = '0';
    setTimeout(()=> {
      introEl.classList.add('hidden');
      afterIntro();
    }, 1200);
  }, 7200);
}

/* ═══════════════════════════════════════════════════════════
   2. AFTER INTRO → decide: lock or main
═══════════════════════════════════════════════════════════ */
function afterIntro() {
  const now = new Date();
  if(now >= UNLOCK_DATE) {
    unlockSite(true);
  } else {
    lockEl.classList.remove('hidden');
    initParticles();
    startCountdown();
  }
}

/* ═══════════════════════════════════════════════════════════
   3. LOCK SCREEN PARTICLES
═══════════════════════════════════════════════════════════ */
function initParticles() {
  const cvs = $('particle-canvas');
  const ctx = cvs.getContext('2d');
  cvs.width  = window.innerWidth;
  cvs.height = window.innerHeight;
  window.addEventListener('resize', ()=>{ cvs.width=window.innerWidth; cvs.height=window.innerHeight; });

  const particles = Array.from({length:90}, () => ({
    x: Math.random()*cvs.width,
    y: Math.random()*cvs.height,
    vy: -(Math.random()*.6+.2),
    vx: (Math.random()-.5)*.3,
    r: Math.random()*2+.5,
    a: Math.random()*.7+.1,
    color: Math.random()<.6 ? '233,30,140' : '245,200,66'
  }));

  (function loop(){
    ctx.clearRect(0,0,cvs.width,cvs.height);
    particles.forEach(p => {
      p.y += p.vy; p.x += p.vx;
      if(p.y < -10) { p.y = cvs.height + 10; p.x = Math.random()*cvs.width; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${p.color},${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(loop);
  })();
}

/* ═══════════════════════════════════════════════════════════
   4. COUNTDOWN
═══════════════════════════════════════════════════════════ */
function startCountdown() {
  function tick() {
    const now  = new Date();
    const diff = UNLOCK_DATE - now;
    if(diff <= 0) {
      clearInterval(cdTimer);
      triggerUnlock();
      return;
    }
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);
    $('cd-days').textContent  = String(days).padStart(2,'0');
    $('cd-hours').textContent = String(hours).padStart(2,'0');
    $('cd-mins').textContent  = String(mins).padStart(2,'0');
    $('cd-secs').textContent  = String(secs).padStart(2,'0');
  }
  tick();
  const cdTimer = setInterval(tick, 1000);
}

/* ═══════════════════════════════════════════════════════════
   5. UNLOCK
═══════════════════════════════════════════════════════════ */
function triggerUnlock() {
  lockEl.style.transition = 'opacity 1s ease';
  lockEl.style.opacity    = '0';
  setTimeout(()=> {
    lockEl.classList.add('hidden');
    burstEl.classList.remove('hidden');
    runBurstEffect();
    setTimeout(()=> {
      burstEl.style.transition = 'opacity 1s ease';
      burstEl.style.opacity    = '0';
      setTimeout(()=> {
        burstEl.classList.add('hidden');
        unlockSite(false);
      }, 1000);
    }, 3500);
  }, 1000);
}

function unlockSite(immediate) {
  isUnlocked = true;
  mainEl.classList.remove('hidden');
  mainEl.style.opacity = '0';
  mainEl.style.transition = 'opacity 1.5s ease';
  setTimeout(()=> mainEl.style.opacity = '1', 50);
  initMainSite();
}

/* ═══════════════════════════════════════════════════════════
   6. BURST EFFECT (hearts + glow explosion)
═══════════════════════════════════════════════════════════ */
function runBurstEffect() {
  const cvs = $('burst-canvas');
  const ctx = cvs.getContext('2d');
  cvs.width  = window.innerWidth;
  cvs.height = window.innerHeight;

  const hearts = Array.from({length:120}, () => ({
    x: cvs.width/2 + (Math.random()-.5)*60,
    y: cvs.height/2 + (Math.random()-.5)*60,
    vx: (Math.random()-.5)*18,
    vy: (Math.random()-.5)*18 - 4,
    size: Math.random()*22+8,
    alpha: 1,
    color: Math.random()<.6 ? `hsl(${330+Math.random()*30},100%,65%)` : `hsl(${45+Math.random()*20},100%,65%)`
  }));

  let frame = 0;
  (function loop(){
    if(frame++ > 140) return;
    ctx.clearRect(0,0,cvs.width,cvs.height);
    hearts.forEach(h => {
      h.x += h.vx; h.vy += .22; h.y += h.vy;
      h.alpha -= .012;
      if(h.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = h.alpha;
      ctx.font        = `${h.size}px serif`;
      ctx.fillStyle   = h.color;
      ctx.fillText('❤️', h.x, h.y);
      ctx.restore();
    });
    requestAnimationFrame(loop);
  })();
}

/* ═══════════════════════════════════════════════════════════
   7. MAIN SITE INIT
═══════════════════════════════════════════════════════════ */
function initMainSite() {
  initParallax();
  initHeroCanvas();
  spawnFloatingHearts();
  initMusic();
  initScrollReveal();
  initHeartbeat();
  initVoiceMessage();
  initChat();
  initVoiceNote();
  initGallery();
  initFireworks();
  initFooterAdmin();
}

/* ═══════════════════════════════════════════════════════════
   8. PARALLAX
═══════════════════════════════════════════════════════════ */
function initParallax() {
  const stars  = $('para-stars');
  const nebula = $('para-nebula');
  window.addEventListener('scroll', ()=>{
    const y = window.scrollY;
    stars.style.transform  = `translateY(${y * .18}px)`;
    nebula.style.transform = `translateY(${y * .08}px)`;
  }, {passive:true});
}

/* ═══════════════════════════════════════════════════════════
   9. HERO CANVAS (sparkles)
═══════════════════════════════════════════════════════════ */
function initHeroCanvas() {
  const cvs = $('hero-canvas');
  const ctx = cvs.getContext('2d');
  const resize = ()=>{ cvs.width=cvs.offsetWidth; cvs.height=cvs.offsetHeight; };
  resize();
  window.addEventListener('resize', resize);

  const sparkles = Array.from({length:60}, () => randSparkle(cvs));

  function randSparkle(c) {
    return {
      x: Math.random()*c.width, y: Math.random()*c.height,
      size: Math.random()*3+.5, alpha: 0, growing:true,
      speed: Math.random()*.02+.005,
      color: Math.random()<.5 ? '233,30,140' : '245,200,66'
    };
  }

  (function loop(){
    ctx.clearRect(0,0,cvs.width,cvs.height);
    sparkles.forEach((s,i)=>{
      if(s.growing) s.alpha = Math.min(1, s.alpha+s.speed);
      else s.alpha = Math.max(0, s.alpha-s.speed);
      if(s.alpha>=1) s.growing=false;
      if(s.alpha<=0) sparkles[i] = randSparkle(cvs);
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${s.color},1)`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${s.color},.8)`;
      ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(loop);
  })();
}

/* ═══════════════════════════════════════════════════════════
   10. FLOATING HEARTS
═══════════════════════════════════════════════════════════ */
function spawnFloatingHearts() {
  const container = $('floating-hearts-container');
  const EMOJIS = ['❤️','💕','💖','💗','✨','🌸','💫'];

  function spawn() {
    const el = document.createElement('span');
    el.className = 'float-heart';
    el.textContent = EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
    el.style.left   = Math.random()*100 + '%';
    el.style.bottom = '-2rem';
    const dur = 8 + Math.random()*6;
    el.style.animationDuration = dur + 's';
    el.style.fontSize = (1 + Math.random()*1.2) + 'rem';
    container.appendChild(el);
    setTimeout(()=> el.remove(), dur*1000);
  }

  setInterval(spawn, 700);
  for(let i=0;i<6;i++) setTimeout(spawn, i*300);
}

/* ═══════════════════════════════════════════════════════════
   11. MUSIC
═══════════════════════════════════════════════════════════ */
function initMusic() {
  bgMusic.volume = 0;

  musicBtn.addEventListener('click', ()=>{
    if(musicPlaying) {
      fadeMusicOut();
    } else {
      bgMusic.play().then(()=>{
        fadeMusicIn();
      }).catch(()=>{});
    }
  });
}

function fadeMusicIn() {
  musicPlaying = true;
  musicBtn.textContent = '🔊';
  musicBtn.classList.add('playing');
  let v = bgMusic.volume;
  const t = setInterval(()=>{
    v = Math.min(0.42, v + .02);
    bgMusic.volume = v;
    if(v >= 0.42) clearInterval(t);
  }, 60);
}

function fadeMusicOut() {
  let v = bgMusic.volume;
  const t = setInterval(()=>{
    v = Math.max(0, v - .02);
    bgMusic.volume = v;
    if(v <= 0) {
      clearInterval(t);
      bgMusic.pause();
      musicPlaying = false;
      musicBtn.textContent = '🎵';
      musicBtn.classList.remove('playing');
    }
  }, 60);
}

/* ═══════════════════════════════════════════════════════════
   12. SCROLL REVEAL
═══════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e => {
      if(e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ═══════════════════════════════════════════════════════════
   13. HEARTBEAT
═══════════════════════════════════════════════════════════ */
function initHeartbeat() {
  const btn   = $('hb-hold-btn');
  const cvs   = $('hb-canvas');
  const ctx   = cvs.getContext('2d');
  const sect  = $('heartbeat-section');

  const resize = ()=>{ cvs.width=cvs.offsetWidth; cvs.height=cvs.offsetHeight; };
  resize();
  window.addEventListener('resize', resize);

  let waves = [];

  function startHB() {
    if(hbInterval) return;
    btn.classList.add('pressing');

    // Vibration
    if(navigator.vibrate) navigator.vibrate([100,50,100,50,100]);

    // Heartbeat sound via Web Audio
    hbAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function beatSound() {
      const osc = hbAudioCtx.createOscillator();
      const gain = hbAudioCtx.createGain();
      osc.connect(gain); gain.connect(hbAudioCtx.destination);
      osc.frequency.setValueAtTime(80, hbAudioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, hbAudioCtx.currentTime + .12);
      gain.gain.setValueAtTime(.4, hbAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, hbAudioCtx.currentTime + .25);
      osc.start();
      osc.stop(hbAudioCtx.currentTime + .25);
    }

    const INTERVAL = 700;
    beatSound();
    hbInterval = setInterval(()=>{
      beatSound();
      waves.push({x:cvs.width/2,y:cvs.height/2,r:0,a:1});
      if(navigator.vibrate) navigator.vibrate(80);
    }, INTERVAL);

    sect.style.transition = 'background .15s ease';
    sect.style.background = 'radial-gradient(ellipse at center, rgba(233,30,140,.18) 0%, transparent 65%)';
  }

  function stopHB() {
    btn.classList.remove('pressing');
    if(hbInterval) { clearInterval(hbInterval); hbInterval=null; }
    if(hbAudioCtx) { hbAudioCtx.close(); hbAudioCtx=null; }
    if(navigator.vibrate) navigator.vibrate(0);
    sect.style.background = '';
  }

  btn.addEventListener('mousedown', startHB);
  btn.addEventListener('touchstart', (e)=>{ e.preventDefault(); startHB(); }, {passive:false});
  window.addEventListener('mouseup', stopHB);
  window.addEventListener('touchend', stopHB);

  // Draw waves
  (function loopWave(){
    ctx.clearRect(0,0,cvs.width,cvs.height);
    waves = waves.filter(w => w.a > 0.02);
    waves.forEach(w => {
      w.r += 4; w.a -= .025;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(233,30,140,${w.a})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    requestAnimationFrame(loopWave);
  })();
}

/* ═══════════════════════════════════════════════════════════
   14. VOICE MESSAGE (Web Speech API)
═══════════════════════════════════════════════════════════ */
const VOICE_MESSAGE = `Dear Pratyusha… Happy Birthday. 
I don't have the right words — no poem is beautiful enough, no song is deep enough — to truly say what you mean to me. 
You are the soft light that fills even my darkest mornings. 
Since December seventeen, twenty twenty three, you have unknowingly become my favorite story. 
Bankura gave me many things, but none more precious than you. 
I hope this birthday wraps you in all the warmth you so effortlessly give others. 
Happy Birthday Pratyusha. You are my favorite what-if, my most beautiful coincidence, my heart's quietest and loudest song. 
Always yours, with love.`;

function initVoiceMessage() {
  const btn      = $('voice-btn');
  const fill     = $('voice-progress-fill');
  const display  = $('voice-text-display');

  btn.addEventListener('click', ()=>{
    if(speechSynth.speaking) {
      speechSynth.cancel();
      btn.textContent = '🎙️ Listen to my message';
      btn.classList.remove('speaking');
      fill.style.width = '0%';
      display.textContent = '';
      return;
    }

    display.textContent = '';
    fill.style.width = '0%';

    const utterance = new SpeechSynthesisUtterance(VOICE_MESSAGE);
    utterance.rate   = 0.88;
    utterance.pitch  = 1.05;
    utterance.volume = 1;

    // Try a soft female voice
    const voices = speechSynth.getVoices();
    const preferred = voices.find(v =>
      (v.name.toLowerCase().includes('female') ||
       v.name.toLowerCase().includes('samantha') ||
       v.name.toLowerCase().includes('zira') ||
       v.name.toLowerCase().includes('victoria') ||
       v.name.includes('Google UK English Female')) &&
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
    if(preferred) utterance.voice = preferred;

    const words   = VOICE_MESSAGE.split(/\s+/);
    let wordIdx   = 0;
    const totalWords = words.length;

    utterance.onboundary = (e)=>{
      if(e.name === 'word') {
        wordIdx++;
        const progress = Math.min(100, (wordIdx / totalWords) * 100);
        fill.style.width = progress + '%';
        // Show current chunk
        const chunkEnd = Math.min(wordIdx+8, totalWords);
        display.innerHTML = words.slice(Math.max(0,wordIdx-2), chunkEnd)
          .map((w,i)=> i===2 ? `<span class="highlight">${w}</span>` : w)
          .join(' ');
      }
    };

    utterance.onend = ()=>{
      btn.textContent = '🎙️ Listen again';
      btn.classList.remove('speaking');
      fill.style.width = '100%';
      display.textContent = '— Always yours, with love ❤️';
    };

    currentUtterance = utterance;
    speechSynth.speak(utterance);
    btn.innerHTML = '<span class="voice-icon">⏹</span> Stop';
    btn.classList.add('speaking');
  });

  // Populate voices on load
  if(speechSynth.onvoiceschanged !== undefined) {
    speechSynth.onvoiceschanged = ()=> speechSynth.getVoices();
  }
}

/* ═══════════════════════════════════════════════════════════
   15. CHAT REPLAY
═══════════════════════════════════════════════════════════ */
const CHAT_MESSAGES = [
  { side:'me',  text:'Hey… happy birthday 🎂', delay:600 },
  { side:'me',  text:'I made something special for you tonight 🌙', delay:1800 },
  { side:'her', text:'Aww what is it? 🥺', delay:3200 },
  { side:'me',  text:'Just… something that says what I never could out loud', delay:4600 },
  { side:'her', text:'You\'re making me emotional already 😭', delay:6200 },
  { side:'me',  text:'Since December 17th, 2023… you\'ve been my favorite thought ❤️', delay:7800 },
  { side:'her', text:'Stop 😭❤️', delay:9400 },
  { side:'me',  text:'Never. Happy Birthday Pratyusha. You deserve the whole universe 🌌', delay:10800 },
  { side:'her', text:'This is the best birthday ever 🥹💕', delay:12600 },
];

function initChat() {
  const msgsEl  = $('chat-messages');
  const typing  = $('chat-typing');

  const obs = new IntersectionObserver((entries)=>{
    if(!entries[0].isIntersecting) return;
    obs.disconnect();
    playChat(msgsEl, typing);
  }, {threshold:.3});

  obs.observe($('chat-section'));
}

function playChat(msgsEl, typing) {
  CHAT_MESSAGES.forEach((msg, i) => {
    // Show typing before each message briefly
    setTimeout(()=>{
      typing.classList.remove('hidden');
    }, msg.delay - 700);

    setTimeout(()=>{
      typing.classList.add('hidden');
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${msg.side}`;
      bubble.textContent = msg.text;
      msgsEl.appendChild(bubble);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }, msg.delay);
  });
}

/* ═══════════════════════════════════════════════════════════
   16. VOICE NOTE PLAYER
═══════════════════════════════════════════════════════════ */
function initVoiceNote() {
  const waveEl  = $('vn-waveform');
  const playBtn = $('vn-play');
  const timeEl  = $('vn-time');
  const DURATION = 12;

  // Generate waveform bars
  const BARS = 36;
  const heights = Array.from({length:BARS}, ()=> 4 + Math.random()*22);
  heights.forEach(h => {
    const bar = document.createElement('div');
    bar.className = 'vn-bar';
    bar.style.height = h + 'px';
    waveEl.appendChild(bar);
  });

  const bars = waveEl.querySelectorAll('.vn-bar');

  function updateBars(progress) {
    const activeIdx = Math.floor(progress * BARS);
    bars.forEach((b,i) => b.classList.toggle('active', i < activeIdx));
  }

  function fmtTime(s) {
    const m = Math.floor(s/60);
    const sec = Math.floor(s%60);
    return `${m}:${String(sec).padStart(2,'0')}`;
  }

  function startVN() {
    vnPlaying = true;
    playBtn.textContent = '⏸';
    const tick = 100;
    const step = tick / (DURATION * 1000);
    vnTimerID = setInterval(()=>{
      vnProgress = Math.min(1, vnProgress + step);
      updateBars(vnProgress);
      timeEl.textContent = `${fmtTime(vnProgress*DURATION)} / ${fmtTime(DURATION)}`;
      if(vnProgress >= 1) stopVN();
    }, tick);
  }

  function stopVN() {
    vnPlaying = false;
    playBtn.textContent = '▶';
    clearInterval(vnTimerID);
  }

  playBtn.addEventListener('click', ()=>{
    if(vnProgress >= 1) { vnProgress = 0; updateBars(0); timeEl.textContent=`0:00 / ${fmtTime(DURATION)}`; }
    if(vnPlaying) stopVN();
    else startVN();
  });
}

/* ═══════════════════════════════════════════════════════════
   17. GALLERY & LIGHTBOX
═══════════════════════════════════════════════════════════ */
function initGallery() {
  const lightbox = $('lightbox');
  const lbImg    = $('lb-img');
  const lbClose  = $('lb-close');

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', ()=>{
      lbImg.src = item.dataset.src;
      lightbox.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  });

  lbClose.addEventListener('click', closeLB);
  lightbox.addEventListener('click', (e)=>{ if(e.target===lightbox) closeLB(); });

  function closeLB() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
    lbImg.src = '';
  }
}

/* ═══════════════════════════════════════════════════════════
   18. FIREWORKS
═══════════════════════════════════════════════════════════ */
function initFireworks() {
  const resize = ()=>{ fireworksCvs.width=window.innerWidth; fireworksCvs.height=window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  $('fireworks-btn').addEventListener('click', ()=>{
    if(!fireworksActive) {
      fireworksActive = true;
      $('fireworks-btn').textContent = '✨ Stop Celebration';
      runFireworks();
    } else {
      fireworksActive = false;
      $('fireworks-btn').textContent = '🎆 Celebrate!';
      if(fwRAF) cancelAnimationFrame(fwRAF);
      fwCtx.clearRect(0,0,fireworksCvs.width,fireworksCvs.height);
    }
  });
}

let fwParticles = [];

function runFireworks() {
  let frame = 0;
  function loop() {
    if(!fireworksActive) return;
    fwRAF = requestAnimationFrame(loop);
    fwCtx.fillStyle = 'rgba(5,3,10,.18)';
    fwCtx.fillRect(0,0,fireworksCvs.width,fireworksCvs.height);

    if(frame % 28 === 0) launchFirework();
    frame++;

    fwParticles = fwParticles.filter(p => p.life > 0);
    fwParticles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += .06; // gravity
      p.life -= p.decay;
      fwCtx.save();
      fwCtx.globalAlpha = Math.max(0, p.life);
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      fwCtx.fillStyle = p.color;
      fwCtx.shadowBlur = 6;
      fwCtx.shadowColor = p.color;
      fwCtx.fill();
      fwCtx.restore();
    });
  }
  loop();
}

function launchFirework() {
  const x = Math.random() * fireworksCvs.width;
  const y = Math.random() * fireworksCvs.height * .6;
  const COUNT = 80 + Math.floor(Math.random()*40);
  const hue = Math.floor(Math.random()*360);
  for(let i=0;i<COUNT;i++) {
    const angle = (Math.PI*2/COUNT)*i;
    const speed = Math.random()*5+2;
    fwParticles.push({
      x, y,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed,
      r: Math.random()*2.5+.5,
      life: 1,
      decay: Math.random()*.015+.008,
      color: `hsl(${hue+Math.random()*40},100%,${60+Math.random()*20}%)`
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   19. ADMIN PANEL
═══════════════════════════════════════════════════════════ */
function initFooterAdmin() {
  const footer = $('footer-click-target');
  const overlay = $('admin-overlay');

  footer.addEventListener('click', ()=>{
    footerClicks++;
    if(footerClicks >= 5) {
      footerClicks = 0;
      overlay.classList.remove('hidden');
    }
  });

  $('admin-login-btn').addEventListener('click', checkAdminPwd);
  $('admin-password').addEventListener('keydown', (e)=>{ if(e.key==='Enter') checkAdminPwd(); });

  $('admin-close').addEventListener('click', closeAdmin);
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeAdmin(); });

  $('admin-unlock').addEventListener('click', ()=>{
    closeAdmin();
    if(!isUnlocked) triggerUnlock();
    else alert('Site is already unlocked!');
  });

  $('admin-preview').addEventListener('click', ()=>{
    closeAdmin();
    fireworksActive = true;
    $('fireworks-btn').textContent = '✨ Stop Celebration';
    runFireworks();
    document.querySelector('#final-section').scrollIntoView({behavior:'smooth'});
  });

  $('admin-lock').addEventListener('click', ()=>{
    location.reload();
  });

  // Update admin clock
  setInterval(()=>{
    if(!$('admin-content').classList.contains('hidden')) {
      $('admin-time').textContent = new Date().toLocaleTimeString();
      $('admin-status').textContent = isUnlocked ? '🔓 Unlocked' : '🔒 Locked';
    }
  }, 1000);
}

function checkAdminPwd() {
  const val = $('admin-password').value;
  if(val === 'I Love You Pratyusha') {
    $('admin-login').classList.add('hidden');
    $('admin-content').classList.remove('hidden');
    $('admin-time').textContent   = new Date().toLocaleTimeString();
    $('admin-status').textContent = isUnlocked ? '🔓 Unlocked' : '🔒 Locked';
  } else {
    $('admin-err').classList.remove('hidden');
    $('admin-password').style.borderColor = '#e91e8c';
    setTimeout(()=>{ $('admin-err').classList.add('hidden'); $('admin-password').style.borderColor=''; }, 2000);
  }
}

function closeAdmin() {
  $('admin-overlay').classList.add('hidden');
  $('admin-password').value = '';
  $('admin-login').classList.remove('hidden');
  $('admin-content').classList.add('hidden');
  $('admin-err').classList.add('hidden');
}

/* ═══════════════════════════════════════════════════════════
   START
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', runIntro);

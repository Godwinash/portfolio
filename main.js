/****************************************************
 *  Godwin Ashiekaa Portfolio — Interaction Engine
 ****************************************************/

/* ================================
   DOM REFERENCES
================================ */
const canvas = document.getElementById("rippleCanvas");
const ctx = canvas.getContext("2d");

// Hero text area (distance calculations + typewriter)
const heroTitle = document.getElementById("heroTitle");
const heroSub = document.getElementById("heroSub");
const cursor = document.getElementById("cursor");

// Mobile navigation
const navButton = document.getElementById("navButton");
const navClose = document.getElementById("navClose");
const mobileNav = document.getElementById("mobileNav");

// Project cards
const cards = document.querySelectorAll(".project-card");

/* ================================
   GLOBAL STATE
================================ */
let navOpen = false;
let ripples = [];
let scrollVelocity = 0;
let scrollCooldown = false;

let lastScrollY = window.scrollY;
let lastTime = performance.now();

const proximityRadius = 180; // px

// Mobile detection: used to disable ripple effects on touch/coarse devices
let isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth < 768;

/****************************************************
 * NAVIGATION
 ****************************************************/

function openNav() {
  mobileNav.classList.remove("opacity-0", "pointer-events-none");
  mobileNav.classList.add("opacity-100");
  document.body.style.overflow = "hidden";
}

function closeNav() {
  mobileNav.classList.add("opacity-0", "pointer-events-none");
  mobileNav.classList.remove("opacity-100");
  document.body.style.overflow = "";
}

navButton.addEventListener("click", openNav);
navClose.addEventListener("click", closeNav);

// Close on link click (mobile UX)
document.querySelectorAll(".mobile-link").forEach(link => {
  link.addEventListener("click", closeNav);
});


/****************************************************
 * CANVAS SETUP
 ****************************************************/
let w, h;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);


/****************************************************
 * RIPPLE SPAWN LOGIC
 ****************************************************/

// Creates ripple objects with consistent structure
function createRipple(x, y, isNearHero) {
  ripples.push({
    x,
    y,
    radius: isNearHero ? 3 : 6,
    alpha: isNearHero ? 0.6 : 0.4,
    growth: isNearHero ? 1.0 : 2.5,
  });
}

// Cursor Movement — ambient ripples
window.addEventListener("mousemove", (e) => {
  const { x, y } = getHeroCenter();
  const dist = Math.hypot(e.clientX - x, e.clientY - y);
  createRipple(e.clientX, e.clientY, dist < proximityRadius);
});

// Scroll-Pulse — ripple expands from hero center
function spawnScrollPulse() {
  const x = Math.random() * w;
  const y = Math.random() * h;

  ripples.push({
    x,
    y,
    radius: 22,
    alpha: 0.85,
    growth: 4.0
  });
}




/****************************************************
 * RIPPLE DRAW LOOP
 ****************************************************/
function draw() {
  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < ripples.length; i++) {
    const r = ripples[i];

    // draw
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.lineWidth = 1.1 + r.radius * 0.03;
    ctx.shadowBlur = 12;
    // deep accent purple + neon pulse
    ctx.shadowColor = `rgba(124, 58, 237, ${r.alpha * 0.8})`;
    ctx.strokeStyle = `rgba(91, 33, 182, ${r.alpha})`;
    ctx.stroke();

    // physics
    r.radius += r.growth;
    r.alpha -= 0.006;

    // nav gravity mode — attract ripples to hamburger
    if (navOpen) {
      const c = getNavIconCenter();
      r.x += (c.x - r.x) * 0.14;
      r.y += (c.y - r.y) * 0.14;
      r.alpha *= 0.92;
      r.radius *= 0.94;
    }

    // cleanup
    if (r.alpha <= 0 || r.radius >= 900) {
      ripples.splice(i, 1);
      i--;
    }
  }

  // frame reset
  ctx.shadowBlur = 0;
  ctx.lineWidth = 0;

  requestAnimationFrame(draw);
}

draw(); // start loop


/****************************************************
 * SCROLL EVENT (velocity + pulses)
 ****************************************************/

window.addEventListener("scroll", () => {
  const now = performance.now();
  const dy = window.scrollY - lastScrollY;
  const dt = now - lastTime;

  scrollVelocity = Math.abs(dy / dt) * 1200;
  lastScrollY = window.scrollY;
  lastTime = now;

  // Burst ripple if strong movement
  if (Math.abs(dy) > 14 && !scrollCooldown) {
    // larger movements get a few pulses
    if (Math.abs(dy) > 60) {
      spawnScrollPulse();
      spawnScrollPulse();
      spawnScrollPulse();
    } else {
      spawnScrollPulse();
    }
    scrollCooldown = true;
    setTimeout(() => (scrollCooldown = false), 180);
  }
});


/****************************************************
 * HERO CENTER CALC
 ****************************************************/
function getHeroCenter() {
  const rect = heroTitle.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getNavIconCenter() {
  const rect = navButton.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}


/****************************************************
 * TYPEWRITER EFFECT
 ****************************************************/
const typeText = "Crafting Digital Experiences";
const TYPE_SPEED = 65;
let i = 0;

function typeWriter() {
  if (i < typeText.length) {
    heroTitle.innerHTML = typeText.substring(0, i) + cursor.outerHTML;
    i++;
    setTimeout(typeWriter, TYPE_SPEED);
  } else {
    cursor.style.animation = "blink .8s infinite";
    heroSub.classList.remove("opacity-0");
  }
}

typeWriter();


/****************************************************
 * INTERSECTION OBSERVER (PROJECT CARDS)
 ****************************************************/
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (!entry.isIntersecting) return;

      entry.target.style.transitionDelay = `${index * 120}ms`;
      entry.target.classList.add("opacity-100", "translate-y-0");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.18 }
);

cards.forEach((card) => observer.observe(card));



// === TILT ===
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const el = card.querySelector('.project-inner');
    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    el.style.transform = `rotateX(${-(y / 30)}deg) rotateY(${x / 30}deg) scale(1.03)`;
  });

  card.addEventListener('mouseleave', () => {
    card.querySelector('.project-inner').style.transform = "";
  });
});

// === PROJECT MODAL SYSTEM ==================================

const modal = document.getElementById("projectModal");
const modalInner = document.getElementById("modalInner");
const modalClose = document.getElementById("modalClose");

// Reusable function
function openProjectModal(project) {
  modalInner.innerHTML = `
    <h2 class="text-3xl font-bold">${project.title}</h2>

    <!-- Screens -->
    <div class="grid gap-3">
      ${project.images.map(src => `
        <img src="${src}"             onerror="this.onerror=null;this.src='images/placeholder.svg'"             class="w-full rounded-xl border border-[#292929]"
             alt="${project.title} preview"/>
      `).join("")}
    </div>

    <p class="text-gray-300 leading-relaxed">${project.description}</p>

    <div>
      <span class="text-sm text-accent font-semibold block">Tech Stack:</span>
      <div class="flex flex-wrap gap-2 mt-1">
        ${project.tech.map(t => `
          <span class="px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded-full text-sm">
            ${t}
          </span>
        `).join("")}
      </div>
    </div>

    <div class="flex gap-3 pt-4">
      <a href="${project.link}" target="_blank"
         class="px-4 py-2 font-semibold rounded-lg accent-btn accent-btn--sm">
         Live Demo
      </a>
    </div>
  `;

  modal.classList.remove("hidden");
}

// close
modalClose.addEventListener("click", () => {
  modal.classList.add("hidden");
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});

// === PROJECT DATA =====================================
const PROJECTS = {
  travelAgency: {
    title: "Travel Agency Demo",
    description:
      "A modern travel landing page featuring bold hero design, destinations, and a clean booking layout.",
    tech: ["HTML", "TailwindCSS", "JavaScript"],
    link: "https://godwinash.github.io/travel_agency_demo/",
    images: [
      "travel1.png",
      "travel2.png",
      "travel3.png",
    ]
  },

  yum: {
    title: "Yum Brand Redesign",
    description:
      "UI overhaul of a fast-food brand, focusing on visual hierarchy and product clarity.",
    tech: ["HTML", "TailwindCSS", "JavaScript"],
    link: "https://godwinash.github.io/yum-demo/",
    images: [
      "yum1.png",
      "yum2.png",
      "yum3.png",
    ]
  },

  gamifiedTodo: {
    title: "Gamified To-Do List",
    description:
      "Turns tasks into XP-based challenges with game-like UI for motivation.",
    tech: ["HTML", "TailwindCSS", "JavaScript"],
    link: "https://godwinash.github.io/gamified-to-do-list/",
    images: [
      "game1.png",
      "game2.png",
    ]
  },

  aiCoffee: {
    title: "AI Coffee",
    description:
      "A mood-based coffee recommendation tool powered by interactive UI prompts.",
    tech: ["HTML", "TailwindCSS", "JavaScript"],
    link: "https://godwinash.github.io/AI-Coffee/",
    images: [
      "coffee1.png",
      "coffee2.png",
    ]
  },
};

// === CARD CLICK → OPEN MODAL ================================
document.querySelectorAll(".project-card").forEach(card => {
  const id = card.getAttribute("data-project");
  if (!PROJECTS[id]) return;

  card.addEventListener("click", () => openProjectModal(PROJECTS[id]));
});

// === LIGHTBOX =========================================
const lightbox = document.getElementById("lightbox");
const lightImg = document.getElementById("lightImg");
const lightboxClose = document.getElementById("lightboxClose");
const lightPrev = document.getElementById("lightPrev");
const lightNext = document.getElementById("lightNext");

let currentImages = [];
let currentIndex = 0;

function openLightbox(images, index = 0) {
  currentImages = images;
  currentIndex = index;
  lightImg.src = images[index];

  lightbox.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function showNext() {
  currentIndex = (currentIndex + 1) % currentImages.length;
  lightImg.src = currentImages[currentIndex];
}

function showPrev() {
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  lightImg.src = currentImages[currentIndex];
}

function closeLightbox() {
  lightbox.classList.add("hidden");
  document.body.style.overflow = "";
  lightImg.classList.remove("zoomed");
}

lightboxClose.addEventListener("click", closeLightbox);
lightNext.addEventListener("click", showNext);
lightPrev.addEventListener("click", showPrev);

// click outside
lightbox.addEventListener("click", e => {
  if (e.target === lightbox) closeLightbox();
});

// zoom
lightImg.addEventListener("click", () => {
  lightImg.classList.toggle("zoomed");
});

// keyboard
window.addEventListener("keydown", e => {
  if (lightbox.classList.contains("hidden")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") showNext();
  if (e.key === "ArrowLeft") showPrev();
});

let touchStartX = 0;

lightImg.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
});

lightImg.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (dx > 60) showPrev();   // swipe right
  if (dx < -60) showNext();  // swipe left
});

// === IMAGE CLICK -> LIGHTBOX ==========================
document.addEventListener("click", e => {
  if (!e.target.classList.contains("modal-img")) return;

  const activeProject = PROJECTS[currentModalTarget];

  const index = [...e.target.parentNode.querySelectorAll('.modal-img')]
    .indexOf(e.target);

  openLightbox(activeProject.images, index);
});

let currentModalTarget = null;

// ===============================
// PROCESS SECTION SCROLL ANIMATION
// ===============================

const processSteps = document.querySelectorAll(".process-step");
const processLine = document.getElementById("process-line");

function animateProcess() {
  const trigger = window.innerHeight * 0.8;

  processSteps.forEach((step, i) => {
    const rect = step.getBoundingClientRect();

    if (rect.top < trigger) {
      step.classList.remove("opacity-0", "translate-y-10");
      step.classList.add("opacity-100", "translate-y-0");

      // Extend timeline line
      const lineHeight = ((i + 1) / processSteps.length) * 100;
      processLine.style.height = lineHeight + "%";
    }
  });
}

window.addEventListener("scroll", animateProcess);
animateProcess();

// ==================================
// ALTERNATING PROCESS TIMELINE ANIMATION
// ==================================
const steps = document.querySelectorAll(".process-step");
const line = document.getElementById("process-line");

function animateTimeline() {
  const trigger = window.innerHeight * 0.8;

  steps.forEach((step, index) => {
    const rect = step.getBoundingClientRect();

    if (rect.top < trigger) {
      step.classList.remove("opacity-0", "translate-y-10");
      step.classList.add("opacity-100", "translate-y-0");

      // grow center line
      const lineHeight = ((index + 1) / steps.length) * 100;
      line.style.height = `${lineHeight}%`;
    }
  });
}

window.addEventListener("scroll", animateTimeline);
animateTimeline();

// ======================
// ABOUT SECTION REVEAL
// ======================
const aboutBox = document.querySelector(".about-reveal");

function revealAbout() {
  const rect = aboutBox.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.85) {
    aboutBox.classList.remove("opacity-0", "translate-y-10");
    aboutBox.classList.add("opacity-100", "translate-y-0");
    window.removeEventListener("scroll", revealAbout);
  }
}

window.addEventListener("scroll", revealAbout);
revealAbout();


/* ============================
   Contact form: validation + simulated send
   - Shows status messages
   - Safe honeypot to block bots
   - Placeholder for EmailJS / backend integration
   ============================ */

(function contactFormModule(){
  const form = document.getElementById('contactForm');
  const sendBtn = document.getElementById('sendBtn');
  const status = document.getElementById('formStatus');

  if (!form) return;

  // small helper
  function setStatus(text, type='info') {
    status.textContent = text;
    status.classList.remove('form-success','form-error');
    if (type === 'success') status.classList.add('form-success');
    if (type === 'error') status.classList.add('form-error');
  }

  // Validate simple email
  function validEmail(e) {
    return /\S+@\S+\.\S+/.test(e);
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();

    // Honeypot (hidden field) — anti-spam (guarded)
    const honeypot = form.querySelector('input[name="website"]');

    if (honeypot && honeypot.value.trim() !== "") {
        alert("Spam detected");
        return; // stop form
    }


    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      setStatus('Please complete all fields.', 'error');
      return;
    }
    if (!validEmail(email)) {
      setStatus('Please enter a valid email address.', 'error');
      return;
    }

    // Sending state
    sendBtn.disabled = true;
    sendBtn.setAttribute('aria-busy', 'true');
    setStatus('Sending…');

    // If EmailJS is available, use it; otherwise simulate a send
    if (window.emailjs) {
      try { emailjs.init("fas5PKATKpE8nwJVM"); } catch (e) {}
      emailjs.sendForm("service_5dti7sy", "template_qwmewq9", form)
        .then(() => {
          setStatus('Message sent. I will reply within 48 hours.', 'success');
          form.reset();
          sendBtn.disabled = false;
          sendBtn.removeAttribute('aria-busy');
        }).catch((err) => {
          console.error('EmailJS error', err);
          setStatus('Failed to send. Try again later.', 'error');
          sendBtn.disabled = false;
          sendBtn.removeAttribute('aria-busy');
        });
    } else {
      // Simulated async send for local/dev
      setTimeout(() => {
        setStatus('Message sent. I will reply within 48 hours.', 'success');
        form.reset();
        sendBtn.disabled = false;
        sendBtn.removeAttribute('aria-busy');
      }, 900);
    }
  });

  // Accessibility: clear status on input
  form.addEventListener('input', () => {
    if (status.textContent) setStatus('');
  });
})();


// Footer 
document.getElementById("year").textContent = new Date().getFullYear();

// === PAGE LOAD REVEAL ==================================

window.addEventListener("load", () => {
  // Hero first
  const hero = document.getElementById("hero");
  const nav = document.getElementById("siteNav");

  setTimeout(() => nav?.classList.add("show"), 150);
  setTimeout(() => hero?.classList.add("show"), 300);
});


// === SCROLL REVEAL =====================================
const reveals = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

reveals.forEach(el => revealObserver.observe(el));


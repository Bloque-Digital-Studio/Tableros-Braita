// ========================================================================
// ANIMACIONES PREMIUM Y TRANSICIONES FLUIDAS
// Copia y pega este script antes del cierre </body> en cada HTML
// ========================================================================

document.addEventListener('DOMContentLoaded', function() {
  // Intersection Observer para animaciones al scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observar todos los elementos con clase reveal
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // SMOOTH SCROLL PARALLAX
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  });

  function updateParallax() {
    const parallaxElements = document.querySelectorAll('.parallax');
    parallaxElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const scrollPosition = window.pageYOffset;
      const elementPosition = rect.top + scrollPosition;
      const distance = scrollPosition - elementPosition;
      el.style.transform = `translateY(${distance * 0.5}px)`;
    });
    ticking = false;
  }

  // BUTTON RIPPLE EFFECT
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.position = 'absolute';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.background = 'rgba(255,255,255,0.5)';
      ripple.style.borderRadius = '50%';
      ripple.style.pointerEvents = 'none';
      ripple.style.animation = 'ripple 0.6s ease-out';

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  // HOVER CARD ELEVATION
  const cards = document.querySelectorAll('.prod-card, .srv-node, .flow-card, .sel-card, .why-card, .maq-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    });
  });

  // SMOOTH NAV LINK SCROLL
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // HEADER SCROLL EFFECT
  const header = document.querySelector('header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      header.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.1)';
    } else {
      header.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.04)';
    }
    lastScroll = window.scrollY;
  });

  // MENU TOGGLE MOBILE
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('main-nav');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      navMenu.classList.toggle('is-active');
    });

    // Cerrar menú al hacer click en un link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('is-active');
      });
    });
  }

  // FORM FOCUS EFFECTS
  const formInputs = document.querySelectorAll('input, textarea, select');
  formInputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      this.style.boxShadow = '0 0 0 2px rgba(47, 102, 144, 0.1)';
    });

    input.addEventListener('blur', function() {
      this.style.boxShadow = 'none';
    });
  });

  // SCROLL PROGRESS BAR
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (window.scrollY / windowHeight) * 100;
      progressBar.style.width = scrolled + '%';
    });
  }

  // ANIMATION STAGGER
  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach((el, index) => {
    el.style.animationDelay = `${index * 0.1}s`;
  });

  // SMOOTH TRANSITIONS ON NAVIGATION
  document.querySelectorAll('a:not([target="_blank"])').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http')) {
        e.preventDefault();
        document.body.style.opacity = '0.8';
        document.body.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          window.location.href = href;
        }, 150);
      }
    });
  });

  console.log('✨ Premium interactions loaded successfully');
});

// ========================================================================
// INTERSECTION OBSERVER ANIMATION
// ========================================================================
const animationStyle = document.createElement('style');
animationStyle.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .reveal {
    animation: fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-play-state: paused;
  }

  .reveal.active {
    animation-play-state: running;
  }

  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(animationStyle);

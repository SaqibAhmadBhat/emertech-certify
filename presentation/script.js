/**
 * EMERTECH CERTIFY — PRESENTATION SCRIPTS
 * Interactive features, keyboard navigation, and tabbed showcases.
 * Author: Saqib Ahmad Bhat
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Reading / Presentation Progress Bar
  const progressBar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  });

  // 2. Active Section Highlighting in Navbar
  const sections = Array.from(document.querySelectorAll('.pres-section'));
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => sectionObserver.observe(sec));

  // 3. Keyboard Navigation (Left / Right Arrow, Spacebar)
  document.addEventListener('keydown', (e) => {
    // Avoid interfering if focus is in an input or textarea
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const currentScroll = window.scrollY;
    const sectionOffsets = sections.map(sec => ({
      id: sec.id,
      top: sec.offsetTop - 80
    }));

    let currentIndex = 0;
    for (let i = 0; i < sectionOffsets.length; i++) {
      if (currentScroll >= sectionOffsets[i].top - 50) {
        currentIndex = i;
      }
    }

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      if (currentIndex < sections.length - 1) {
        e.preventDefault();
        sections[currentIndex + 1].scrollIntoView({ behavior: 'smooth' });
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (currentIndex > 0) {
        e.preventDefault();
        sections[currentIndex - 1].scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // 4. Interactive Workflow Stepper
  const stepButtons = document.querySelectorAll('.step-btn');
  const stepContents = document.querySelectorAll('.step-content');

  stepButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const stepNum = btn.getAttribute('data-step');
      
      stepButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      stepContents.forEach(content => {
        if (content.id === `step-${stepNum}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // 5. Interactive Demo Screenshot Tabs & Browser URL bar
  const tabButtons = document.querySelectorAll('.tab-btn');
  const demoImage = document.getElementById('demo-image');
  const browserUrl = document.querySelector('.browser-url');

  const urlMap = {
    'verification-success.png': 'http://localhost:3000/verify?hash=0x7f83b165...',
    'tamper-detection.png': 'http://localhost:3000/verify [TAMPER_DETECTED]',
    'qr-verification.png': 'http://localhost:3000/verify/qr-scanner',
    'revoked-certificate.png': 'http://localhost:3000/verify [STATUS: REVOKED]',
    'certificate-issuance.png': 'http://localhost:3000/institution/issue',
    'student-dashboard.png': 'http://localhost:3000/student/dashboard',
    'institution-dashboard.png': 'http://localhost:3000/institution/dashboard',
    'admin-dashboard.png': 'http://localhost:3000/admin/dashboard',
    'landing.png': 'http://localhost:3000/'
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const imgName = btn.getAttribute('data-img');
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Subtle fade effect
      demoImage.style.opacity = '0.3';
      setTimeout(() => {
        demoImage.src = `assets/${imgName}`;
        demoImage.style.opacity = '1';
        if (browserUrl && urlMap[imgName]) {
          browserUrl.textContent = urlMap[imgName];
        }
      }, 150);
    });
  });
});

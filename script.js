document.addEventListener('DOMContentLoaded', () => {
  // Preloader Functionality
  window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    preloader.style.opacity = '0';
    preloader.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  });
  
  // Burger Menu Toggle
  const burger = document.querySelector('.burger');
  const navLinks = document.querySelector('.nav-links');
  const navItems = document.querySelectorAll('.nav-links li');
  
  burger.addEventListener('click', () => {
    navLinks.classList.toggle('nav-active');
    
    // Animate Links
    navItems.forEach((link, index) => {
      if (link.style.animation) {
        link.style.animation = '';
      } else {
        link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
      }
    });
    
    // Burger Animation
    burger.classList.toggle('toggle');
  });
  
  // Append navLinkFade animation style
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes navLinkFade {
      from { opacity: 0; transform: translateX(50px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
  
  // Dark Mode Toggle
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    if(document.body.classList.contains('dark-mode')) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  });
  
  // Back to Top Button
  const backToTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if(window.scrollY > 300) {
      backToTop.style.display = 'block';
    } else {
      backToTop.style.display = 'none';
    }
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  // Project Filtering
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      const filter = button.getAttribute('data-filter');
      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if(filter === 'all' || filter === category) {
          card.style.display = 'block';
          card.classList.add('animate__animated', 'animate__fadeIn');
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
  
  // Modal for Project Details
  const projectModal = document.getElementById('project-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDescription = document.getElementById('modal-description');
  const modalTech = document.getElementById('modal-tech');
  const modalLink = document.getElementById('modal-link');
  const closeModal = document.querySelector('.close-modal');
  const viewProjectButtons = document.querySelectorAll('.view-project');
  
  viewProjectButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const projectCard = e.target.closest('.project-card');
      const title = projectCard.getAttribute('data-title');
      const description = projectCard.getAttribute('data-description');
      const tech = projectCard.getAttribute('data-tech');
      modalTitle.textContent = title;
      modalDescription.textContent = description;
      modalTech.textContent = "Tech Stack: " + tech;
      modalLink.href = projectCard.getAttribute('data-link') || "#";
      projectModal.style.display = 'block';
    });
  });
  
  closeModal.addEventListener('click', () => {
    projectModal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === projectModal) {
      projectModal.style.display = 'none';
    }
  });
  
  // Testimonial Slider Auto-rotate
  let testimonialIndex = 0;
  const testimonials = document.querySelectorAll('.testimonial');
  function showTestimonial(index) {
    testimonials.forEach((testimonial, i) => {
      testimonial.style.display = (i === index) ? 'block' : 'none';
    });
  }
  showTestimonial(testimonialIndex);
  setInterval(() => {
    testimonialIndex = (testimonialIndex + 1) % testimonials.length;
    showTestimonial(testimonialIndex);
  }, 5000);
  
  // Intersection Observer for Scroll-triggered Animations & Progress Bar Animation
  const observerOptions = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        // Animate progress bars
        if(entry.target.classList.contains('progress')){
          entry.target.style.width = entry.target.getAttribute('data-width');
        }
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.about-text, .about-image, .project-card, form, .progress').forEach(el => {
    observer.observe(el);
  });
  
  // Initialize tsParticles with Improved Configuration
  tsParticles.load("tsparticles", {
    background: { color: { value: "#0f2027" } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: { enable: false, mode: "push" },
        onHover: { enable: false, mode: "repulse" },
        resize: true,
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 100, duration: 0.4 },
      },
    },
    particles: {
      color: { value: "#ffffff" },
      links: {
        color: "#ffffff",
        distance: 150,
        enable: true,
        opacity: 0.5,
        width: 1,
      },
      collisions: { enable: false },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "bounce" },
        random: false,
        speed: 2,
        straight: false,
      },
      number: { density: { enable: true, area: 800 }, value: 80 },
      opacity: { value: 0.5 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 5 } },
    },
    detectRetina: true,
  });
  
  // Language Toggle Functionality
  const langToggle = document.getElementById('lang-toggle');
  const translations = {
    en: {
      heroHeading: "Hi, I'm Justin Kuhn",
      heroSubheading: "I'm a software engineer specializing in AI engineering and web development.",
      aboutHeading: "About Me",
      skillsHeading: "Skills",
      experienceHeading: "Experience",
      projectsHeading: "Projects",
      testimonialsHeading: "Testimonials",
      blogHeading: "Case Studies",
      contactHeading: "Contact Me",
      downloadResume: "Download Resume"
    },
    es: {
      heroHeading: "Hola, soy Justin Kuhn",
      heroSubheading: "Soy un ingeniero de software especializado en ingeniería de IA y desarrollo web.",
      aboutHeading: "Sobre Mí",
      skillsHeading: "Habilidades",
      experienceHeading: "Experiencia",
      projectsHeading: "Proyectos",
      testimonialsHeading: "Testimonios",
      blogHeading: "Estudios de Caso",
      contactHeading: "Contáctame",
      downloadResume: "Descargar CV"
    }
  };
  let currentLang = 'en';
  langToggle.addEventListener('click', () => {
    currentLang = (currentLang === 'en') ? 'es' : 'en';
    updateLanguage();
    langToggle.textContent = (currentLang === 'en') ? "ES" : "EN";
  });
  
  function updateLanguage() {
    document.querySelector('#hero .hero-content h1').textContent = translations[currentLang].heroHeading;
    document.querySelector('#hero .hero-content p').textContent = translations[currentLang].heroSubheading;
    document.querySelector('#about h2').textContent = translations[currentLang].aboutHeading;
    document.querySelector('#skills h2').textContent = translations[currentLang].skillsHeading;
    document.querySelector('#timeline h2').textContent = translations[currentLang].experienceHeading;
    document.querySelector('#projects h2').textContent = translations[currentLang].projectsHeading;
    document.querySelector('#testimonials h2').textContent = translations[currentLang].testimonialsHeading;
    document.querySelector('#blog h2').textContent = translations[currentLang].blogHeading;
    document.querySelector('#contact h2').textContent = translations[currentLang].contactHeading;
    document.querySelector('.download-resume').textContent = translations[currentLang].downloadResume;
  }
});

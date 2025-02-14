// Hide preloader when page loads
window.addEventListener('load', function() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.display = 'none';
  }
});

// Hamburger menu toggle
const hamburger = document.getElementById("hamburger");
const navLinks = document.querySelector(".nav-links");
hamburger.addEventListener("click", function() {
  navLinks.classList.toggle("active");
  hamburger.classList.toggle("rotate");
});

// Fade-in on scroll using Intersection Observer with rootMargin adjustment
const faders = document.querySelectorAll('.fade-in-section');
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px"
};
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);
faders.forEach(fader => {
  observer.observe(fader);
});

// Fade-out / fade-in navigation on scroll
let prevScrollPos = window.pageYOffset;
const header = document.getElementById('main-header');

window.addEventListener('scroll', function() {
  const currentScrollPos = window.pageYOffset;
  
  // Always show nav at the very top
  if (currentScrollPos <= 0) {
    header.classList.remove('hidden');
  } 
  // Scrolling down - fade out the header
  else if (currentScrollPos > prevScrollPos) {
    header.classList.add('hidden');
  } 
  // Scrolling up - fade the header back in
  else {
    header.classList.remove('hidden');
  }
  
  prevScrollPos = currentScrollPos;
});

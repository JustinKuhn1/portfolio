window.addEventListener('load', function() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.display = 'none';
  }
});


document.addEventListener("DOMContentLoaded", function() {
  // Hamburger menu toggle
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");
  hamburger.addEventListener("click", function() {
    navLinks.classList.toggle("active");
    // Add a slight rotation effect on the hamburger icon
    hamburger.classList.toggle("rotate");
  });

  // Theme toggle (optional)
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", function() {
    document.body.classList.toggle("dark-theme");
    themeToggle.innerHTML = document.body.classList.contains("dark-theme") 
      ? '<i class="fas fa-sun"></i>' 
      : '<i class="fas fa-moon"></i>';
  });

  // Fade-in on scroll using Intersection Observer
  const faders = document.querySelectorAll('.fade-in-section');
  const options = {
    threshold: 0.1
  };
  const observer = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, options);

  faders.forEach(fader => {
    observer.observe(fader);
  });

  // Sticky header slide up/down
let prevScrollPos = window.pageYOffset;
const header = document.getElementById('main-header');

window.addEventListener('scroll', function() {
  const currentScrollPos = window.pageYOffset;
  
  if (currentScrollPos <= 0) {
    // If at the very top, always show the header
    header.style.transform = 'translateY(0)';
  } else if (currentScrollPos > prevScrollPos) {
    // Scrolling down -> slide header up
    header.style.transform = 'translateY(-100%)';
  } else {
    // Scrolling up -> slide header down
    header.style.transform = 'translateY(0)';
  }
  
  prevScrollPos = currentScrollPos;
});

});

// Hide preloader when page loads
window.addEventListener('load', function() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.display = 'none';
  }
});

/*=============== SHOW MENU ===============*/
const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

/* Menu show */
if(navToggle){
   navToggle.addEventListener('click', () =>{
      navMenu.classList.add('show-menu')
   })
}

/* Menu hidden */
if(navClose){
   navClose.addEventListener('click', () =>{
      navMenu.classList.remove('show-menu')
   })
}
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

document.addEventListener("DOMContentLoaded", function () {
  let lastScrollTop = 0;
  const navbar = document.querySelector(".header");

  window.addEventListener("scroll", function () {
      let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      let scrollHeight = document.documentElement.scrollHeight;
      let windowHeight = window.innerHeight;

      if (currentScroll <= 0 || currentScroll + windowHeight >= scrollHeight) {
          // Show navbar when at the top or bottom
          navbar.style.transition = "top 0.3s ease-in-out, opacity 0.3s ease-in-out";
          navbar.style.opacity = "1";
      } else if (currentScroll > lastScrollTop) {
          // Scrolling down, hide the navbar
          navbar.style.opacity = "0";
      } else {
          // Scrolling up, show the navbar
          navbar.style.opacity = "1";
      }

      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  });
});


// Back to Top Button with Smooth Fade Out
const backToTop = document.getElementById('back-to-top');
let scrollTimeout;

window.addEventListener('scroll', () => {
  // Clear any existing timeout
  clearTimeout(scrollTimeout);

  // Show the button when scrolled down
  if(window.scrollY > 300) {
    backToTop.style.display = 'block';
    backToTop.style.opacity = '1';
  } else {
    backToTop.style.opacity = '0';
    // Use a slight delay before hiding to complete fade out
    setTimeout(() => {
      backToTop.style.display = 'none';
    }, 300);
    return;
  }

  // Set a timeout to fade out the button after inactivity
  scrollTimeout = setTimeout(() => {
    if(window.scrollY > 300) {
      backToTop.style.opacity = '0';
      // Use a slight delay before hiding to complete fade out
      setTimeout(() => {
        backToTop.style.display = 'none';
      }, 300);
    }
  }, 1500); // 2 seconds of inactivity
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
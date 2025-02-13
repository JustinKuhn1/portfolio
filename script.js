document.addEventListener("DOMContentLoaded", function() {
  // Hamburger menu toggle
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");
  
  hamburger.addEventListener("click", function() {
    navLinks.classList.toggle("active");
  });

  // Example: Theme toggle (if needed)
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", function() {
    document.body.classList.toggle("dark-theme");
    themeToggle.innerHTML = document.body.classList.contains("dark-theme") 
      ? '<i class="fas fa-sun"></i>' 
      : '<i class="fas fa-moon"></i>';
  });
});

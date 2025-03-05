document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const accountBtn = document.getElementById('account-btn');
  const authModal = document.getElementById('auth-modal');
  const closeBtn = document.querySelector('.auth-close');
  const tabBtns = document.querySelectorAll('.auth-tab-btn');
  const tabContents = document.querySelectorAll('.auth-tab-content');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const resetForm = document.getElementById('reset-form');
  const forgotPasswordLink = document.getElementById('forgot-password');
  const backToLoginBtn = document.querySelector('.auth-back-btn');
  const googleBtns = document.querySelectorAll('.auth-google-btn');
  const welcomeMessageElement = document.querySelector(".welcome-message p");

  // Authentication state observer
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in
      console.log("User is signed in:", user.displayName || user.email);
      updateAccountButton(true, user);
      
      // If modal is open, close it
      if (authModal) authModal.style.display = "none";

      // Update last login timestamp
      firebase.firestore().collection('users').doc(user.uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(error => {
        console.error("Error updating last login:", error);
      });
    } else {
      // User is signed out
      console.log("User is signed out");
      updateAccountButton(false);
    }
  });
  
  // Update welcome message based on auth state
  if (firebase.auth) {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user && welcomeMessageElement) {
        const displayName = user.displayName || user.email.split('@')[0] || "there";
        welcomeMessageElement.textContent = `Hello, ${displayName}! I'm KuhnAI. How can I assist you today?`;
      } else if (welcomeMessageElement) {
        welcomeMessageElement.textContent = "Hello! I'm KuhnAI. How can I assist you today?";
      }
    });
  }

  // Update account button based on auth state
  function updateAccountButton(isLoggedIn, user) {
    const accountBtn = document.getElementById('account-btn');
    if (!accountBtn) return; // Exit if accountBtn not found (e.g., on pages without it)
    
    const accountText = accountBtn.querySelector('span');
    
    if (isLoggedIn) {
      accountText.textContent = 'My Profile';
      
      let dropdownExists = document.querySelector('.account-dropdown');
      if (!dropdownExists) {
        const dropdown = document.createElement('div');
        dropdown.className = 'account-dropdown';
        dropdown.innerHTML = `
          <ul>
            <li><a href="profile.html" id="profile-link">Profile</a></li>
            <li><a href="#" id="settings-link">Settings</a></li>
            <li><a href="#" id="logout-link">Logout</a></li>
          </ul>
        `;
        
        accountBtn.parentNode.style.position = 'relative';
        accountBtn.parentNode.appendChild(dropdown);
        
        // Add event listener for logout
        document.getElementById('logout-link').addEventListener('click', function(e) {
          e.preventDefault();
          firebase.auth().signOut().then(() => {
            window.location.href = 'index.html'; // Redirect to home after logout
          });
        });
      }
    } else {
      accountText.textContent = 'Account';
      
      const dropdown = document.querySelector('.account-dropdown');
      if (dropdown) {
        dropdown.remove();
      }
    }
  }
  
  // Show modal or toggle dropdown when account button is clicked
  accountBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    if (firebase.auth().currentUser) {
      // Toggle dropdown for logged-in users
      const dropdown = document.querySelector('.account-dropdown');
      if (dropdown) {
        dropdown.classList.toggle('show');
      }
    } else if (authModal) {
      // Show modal for logged-out users
      authModal.style.display = "block";
    }
  });
  
  // Close modal when close button is clicked
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      authModal.style.display = "none";
    });
  }
  
  // Close modal when clicking outside
  if (authModal) {
    window.addEventListener('click', function(e) {
      if (e.target === authModal) {
        authModal.style.display = "none";
      }
    });
  }
  
  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
  
  // Forgot password link
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      tabContents.forEach(c => c.classList.remove('active'));
      document.getElementById('reset-tab').classList.add('active');
    });
  }
  
  // Back to login button
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', function() {
      document.getElementById('reset-tab').classList.remove('active');
      document.getElementById('login-tab').classList.add('active');
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('[data-tab="login"]').classList.add('active');
    });
  }
  
  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Logging in...';
      submitBtn.disabled = true;
      
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log("Login successful");
          authModal.style.display = "none";
        })
        .catch((error) => {
          console.error("Login error:", error);
          alert(`Login failed: ${error.message}`);
        })
        .finally(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }
  
  // Signup form submission
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Creating account...';
      submitBtn.disabled = true;
      
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          
          return user.updateProfile({
            displayName: name
          }).then(() => {
            return firebase.firestore().collection('users').doc(user.uid).set({
              name: name,
              email: email,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
              bio: '',
              isVerified: false,
              photo: '' // Default empty photo URL
            });
          });
        })
        .then(() => {
          console.log("Signup successful");
          authModal.style.display = "none";
        })
        .catch((error) => {
          console.error("Signup error:", error);
          alert(`Signup failed: ${error.message}`);
        })
        .finally(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }
  
  // Reset password form submission
  if (resetForm) {
    resetForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('reset-email').value;
      
      const submitBtn = resetForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      
      firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
          alert(`Password reset email sent to ${email}. Please check your inbox.`);
          document.getElementById('reset-tab').classList.remove('active');
          document.getElementById('login-tab').classList.add('active');
          tabBtns.forEach(b => b.classList.remove('active'));
          document.querySelector('[data-tab="login"]').classList.add('active');
        })
        .catch((error) => {
          console.error("Reset error:", error);
          alert(`Password reset failed: ${error.message}`);
        })
        .finally(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }
  
  // Google sign-in
  googleBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const provider = new firebase.auth.GoogleAuthProvider();
      
      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          const user = result.user;
          const isNewUser = result.additionalUserInfo.isNewUser;
          
          if (isNewUser) {
            return firebase.firestore().collection('users').doc(user.uid).set({
              name: user.displayName || user.email.split('@')[0],
              email: user.email,
              photo: user.photoURL || '',
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
              bio: '',
              isVerified: false
            });
          }
        })
        .then(() => {
          console.log("Google sign-in successful");
          if (authModal) authModal.style.display = "none";
        })
        .catch((error) => {
          console.error("Google sign-in error:", error);
          if (error.code !== 'auth/popup-closed-by-user') {
            alert(`Google sign-in failed: ${error.message}`);
          }
        });
    });
  });
});
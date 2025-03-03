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
    const welcomeMessageElement = document.querySelector(".welcome-message p"); // Add this line to get welcome message

    // Authentication state observer
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in
        console.log("User is signed in:", user.displayName || user.email);
        updateAccountButton(true, user);
        
        // If modal is open, close it
        authModal.style.display = "none";
      } else {
        // User is signed out
        console.log("User is signed out");
        updateAccountButton(false);
      }
    });
    
    // Add Firebase auth state listener to update welcome message
  if (firebase.auth) {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user && welcomeMessageElement) {
        // User is signed in, personalize the welcome message
        const displayName = user.displayName || user.email.split('@')[0] || "there";
        welcomeMessageElement.textContent = `Hello, ${displayName}! I'm KuhnAI. How can I assist you today?`;
      } else if (welcomeMessageElement) {
        // User is not signed in, use default message
        welcomeMessageElement.textContent = "Hello! I'm KuhnAI. How can I assist you today?";
      }
    });
  }
  
    // Update account button based on auth state
    function updateAccountButton(isLoggedIn, user) {
      const accountBtn = document.getElementById('account-btn');
      const accountText = accountBtn.querySelector('span');
      
      if (isLoggedIn) {
        accountText.textContent = 'My Profile';
        
        // Create dropdown menu for logged in users
        let dropdownExists = document.querySelector('.account-dropdown');
        if (!dropdownExists) {
          const dropdown = document.createElement('div');
          dropdown.className = 'account-dropdown';
          dropdown.innerHTML = `
            <ul>
              <li><a href="#" id="profile-link">Profile</a></li>
              <li><a href="#" id="settings-link">Settings</a></li>
              <li><a href="#" id="logout-link">Logout</a></li>
            </ul>
          `;
          
          accountBtn.parentNode.style.position = 'relative';
          accountBtn.parentNode.appendChild(dropdown);
          
          // Add event listener for logout
          document.getElementById('logout-link').addEventListener('click', function(e) {
            e.preventDefault();
            firebase.auth().signOut();
          });
        }
      } else {
        accountText.textContent = 'Account';
        
        // Remove dropdown if it exists
        const dropdown = document.querySelector('.account-dropdown');
        if (dropdown) {
          dropdown.remove();
        }
      }
    }
    
    // Show modal when account button is clicked
    accountBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // If user is logged in, don't show modal
      if (firebase.auth().currentUser) {
        // Toggle dropdown instead
        const dropdown = document.querySelector('.account-dropdown');
        if (dropdown) {
          dropdown.classList.toggle('show');
        }
        return;
      }
      
      authModal.style.display = "block";
    });
    
    // Close modal when close button is clicked
    closeBtn.addEventListener('click', function() {
      authModal.style.display = "none";
    });
    
    // Close modal when clicking outside the modal
    window.addEventListener('click', function(e) {
      if (e.target === authModal) {
        authModal.style.display = "none";
      }
    });
    
    // Tab switching
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.add('active');
      });
    });
    
    // Forgot password link
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Hide all tabs and show reset password form
      tabContents.forEach(c => c.classList.remove('active'));
      document.getElementById('reset-tab').classList.add('active');
    });
    
    // Back to login button
    backToLoginBtn.addEventListener('click', function() {
      // Hide reset form and show login form
      document.getElementById('reset-tab').classList.remove('active');
      document.getElementById('login-tab').classList.add('active');
      
      // Update tab buttons
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('[data-tab="login"]').classList.add('active');
    });
    
    // Login form submission
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Logging in...';
      submitBtn.disabled = true;
      
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in successfully
          console.log("Login successful");
          authModal.style.display = "none";
        })
        .catch((error) => {
          // Handle errors
          console.error("Login error:", error);
          alert(`Login failed: ${error.message}`);
        })
        .finally(() => {
          // Reset button state
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
    
    // Signup form submission
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      
      // Show loading state
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Creating account...';
      submitBtn.disabled = true;
      
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed up successfully
          const user = userCredential.user;
          
          // Update profile with display name
          return user.updateProfile({
            displayName: name
          }).then(() => {
            // Create user document in Firestore
            return firebase.firestore().collection('users').doc(user.uid).set({
              name: name,
              email: email,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          });
        })
        .then(() => {
          console.log("Signup successful");
          authModal.style.display = "none";
        })
        .catch((error) => {
          // Handle errors
          console.error("Signup error:", error);
          alert(`Signup failed: ${error.message}`);
        })
        .finally(() => {
          // Reset button state
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
    
    // Reset password form submission
    resetForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('reset-email').value;
      
      // Show loading state
      const submitBtn = resetForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      
      firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
          // Email sent successfully
          alert(`Password reset email sent to ${email}. Please check your inbox.`);
          
          // Switch back to login tab
          document.getElementById('reset-tab').classList.remove('active');
          document.getElementById('login-tab').classList.add('active');
          
          // Update tab buttons
          tabBtns.forEach(b => b.classList.remove('active'));
          document.querySelector('[data-tab="login"]').classList.add('active');
        })
        .catch((error) => {
          // Handle errors
          console.error("Reset error:", error);
          alert(`Password reset failed: ${error.message}`);
        })
        .finally(() => {
          // Reset button state
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
    
    // Google sign-in
    googleBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        firebase.auth().signInWithPopup(provider)
          .then((result) => {
            // Google sign-in successful
            const user = result.user;
            
            // Check if this is a new user
            const isNewUser = result.additionalUserInfo.isNewUser;
            
            if (isNewUser) {
              // Create user document in Firestore for new users
              return firebase.firestore().collection('users').doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                photo: user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              });
            }
          })
          .then(() => {
            console.log("Google sign-in successful");
            authModal.style.display = "none";
          })
          .catch((error) => {
            // Handle errors
            console.error("Google sign-in error:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
              alert(`Google sign-in failed: ${error.message}`);
            }
          });
      });
    });
  });
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, checking for verified-badge...');

    const logoutBtn = document.getElementById('logout-btn');
    const chatHistoryList = document.getElementById('chat-history-list');
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const editProfileClose = document.getElementById('edit-profile-close');
    const editProfileForm = document.getElementById('edit-profile-form');
    const deleteAccountBtn = document.querySelector('.delete-account-btn');
    const chatSearch = document.getElementById('chat-search');
    const downloadChatBtn = document.getElementById('download-chat-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const newChatSessionBtn = document.getElementById('new-chat-session');
    const chatSessionSelect = document.getElementById('chat-session-select');
    let chatHistory = [];
    let currentSessionId = null;

    // Redirect to login if not authenticated
    firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = 'index.html';
        return;
      }

      const userRef = firebase.firestore().collection('users').doc(user.uid);
      const sessionsRef = userRef.collection('chat_sessions');

      // Populate profile info and verify badge
      document.getElementById('profile-username').textContent = user.displayName || user.email.split('@')[0];
      document.getElementById('profile-email').textContent = user.email;
      document.getElementById('profile-avatar').src = user.photoURL || 'images/default-avatar.png';

      userRef.get().then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          console.log('User data:', data); // Debug log to verify data

          document.getElementById('profile-joined').textContent = data.createdAt?.toDate().toLocaleDateString() || 'Unknown';
          document.getElementById('profile-last-login').textContent = data.lastLogin?.toDate().toLocaleString() || 'Unknown';
          document.getElementById('profile-bio').textContent = data.bio || 'Tell us about yourself!';
          document.getElementById('edit-name').value = data.name || '';
          document.getElementById('edit-bio').value = data.bio || '';

          // Check and display verification status with enhanced debugging and delay
          setTimeout(() => {
            const verifiedBadge = document.getElementById('verified-badge');
            console.log('Verified badge element (after delay):', verifiedBadge); // Log to check if element exists after delay
            if (verifiedBadge) {
              const isVerified = data.isVerified === true; // Explicitly check for true
              verifiedBadge.style.display = isVerified ? 'inline-block' : 'none';
              console.log('Verification status:', isVerified); // Log verification status
            } else {
              console.error('Verified badge element not found in the DOM. Check HTML for id="verified-badge".');
              // Attempt to find the element again with a fallback
              const fallbackBadge = document.querySelector('.verified-badge');
              if (fallbackBadge) {
                console.warn('Found badge via class, but ID is missing. Using fallback.');
                fallbackBadge.style.display = data.isVerified === true ? 'inline-block' : 'none';
              } else {
                console.error('No verified badge found by class or ID.');
              }
            }
          }, 100); // Small delay to ensure DOM is fully rendered

        } else {
          console.error('User document does not exist in Firestore.');
        }
      }).catch(error => {
        console.error('Error fetching user data:', error);
        alert('Failed to load profile data: ' + error.message);
      });

      // Update last login
      userRef.update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(error => {
        console.error('Error updating last login:', error);
      });

      // Load chat sessions
      loadChatSessions();

      // Load stats
      updateStats();
    });

    // Load chat sessions into dropdown
    function loadChatSessions() {
      const user = firebase.auth().currentUser;
      if (!user) return;

      const sessionsRef = firebase.firestore().collection('users').doc(user.uid).collection('chat_sessions');
      sessionsRef.orderBy('createdAt', 'desc').get().then((snapshot) => {
        chatSessionSelect.innerHTML = '<option value="">Select a session</option>';
        snapshot.forEach(doc => {
          const session = doc.data();
          const option = document.createElement('option');
          option.value = doc.id;
          option.textContent = session.name || `Session ${doc.id.slice(0, 8)}`;
          chatSessionSelect.appendChild(option);
        });
        if (snapshot.docs.length > 0) {
          chatSessionSelect.value = snapshot.docs[0].id; // Default to latest session
          loadSessionMessages(snapshot.docs[0].id);
        }
      });
    }

    // Load messages for a specific session
    function loadSessionMessages(sessionId) {
      if (!sessionId) {
        chatHistoryList.innerHTML = '<p>No session selected.</p>';
        chatHistory = [];
        return;
      }
      currentSessionId = sessionId;
      const user = firebase.auth().currentUser;
      const messagesRef = firebase.firestore().collection('users').doc(user.uid)
        .collection('chat_sessions').doc(sessionId).collection('messages');
      messagesRef.orderBy('timestamp', 'desc').limit(50).get().then((snapshot) => {
        chatHistory = snapshot.docs.map(doc => doc.data());
        renderChatHistory(chatHistory);
      });
    }

    // Render chat history
    function renderChatHistory(messages) {
      chatHistoryList.innerHTML = '';
      messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${msg.type}`;
        msgDiv.innerHTML = `
          <p>${msg.message}</p>
          <small>${msg.timestamp?.toDate().toLocaleString() || 'Unknown time'}</small>
        `;
        chatHistoryList.appendChild(msgDiv);
      });
    }

    // Create new chat session
    newChatSessionBtn.addEventListener('click', () => {
      const user = firebase.auth().currentUser;
      if (!user) {
        alert('Please log in to create a new chat session.');
        return;
      }
      const sessionsRef = firebase.firestore().collection('users').doc(user.uid).collection('chat_sessions');
      const sessionName = prompt('Enter a name for this chat session (optional):');
      sessionsRef.add({
        name: sessionName || `Session ${Date.now()}`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then((docRef) => {
        loadChatSessions();
        chatSessionSelect.value = docRef.id;
        loadSessionMessages(docRef.id);
      });
    });

    // Switch chat session
    chatSessionSelect.addEventListener('change', (e) => {
      loadSessionMessages(e.target.value);
    });

    // Chat history search
    chatSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filteredHistory = chatHistory.filter(msg => 
        msg.message.toLowerCase().includes(query)
      );
      renderChatHistory(filteredHistory);
    });

    // Download chat history
    downloadChatBtn.addEventListener('click', () => {
      const text = chatHistory.map(msg => 
        `[${msg.timestamp?.toDate().toLocaleString() || 'Unknown'}] ${msg.type.toUpperCase()}: ${msg.message}`
      ).join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_session_${currentSessionId || 'unknown'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Update stats
    function updateStats() {
      const user = firebase.auth().currentUser;
      const sessionsRef = firebase.firestore().collection('users').doc(user.uid).collection('chat_sessions');
      sessionsRef.get().then((snapshot) => {
        let totalMessages = 0;
        let uniqueDays = new Set();
        let aiInteractions = 0;

        const promises = snapshot.docs.map(doc => 
          doc.ref.collection('messages').get().then(msgSnapshot => {
            totalMessages += msgSnapshot.size;
            msgSnapshot.forEach(doc => {
              const msg = doc.data();
              const date = msg.timestamp?.toDate().toDateString();
              if (date) uniqueDays.add(date);
              if (msg.type === 'ai') aiInteractions++;
            });
          })
        );

        Promise.all(promises).then(() => {
          document.getElementById('stat-messages').textContent = totalMessages;
          document.getElementById('stat-days').textContent = uniqueDays.size;
          document.getElementById('stat-interactions').textContent = aiInteractions;
        });
      });
    }

    /* Edit profile modal
    editProfileBtn.addEventListener('click', () => {
      editProfileModal.style.display = 'block';
    });

    editProfileClose.addEventListener('click', () => {
      editProfileModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === editProfileModal) {
        editProfileModal.style.display = 'none';
      }
    });
  */
    editProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-name').value;
      const bio = document.getElementById('edit-bio').value;
      const avatarFile = document.getElementById('edit-avatar').files[0];
      const user = firebase.auth().currentUser;

      if (avatarFile) {
        alert('Avatar upload not implemented yet. Requires Firebase Storage setup.');
      }

      user.updateProfile({ displayName: name }).then(() => {
        return firebase.firestore().collection('users').doc(user.uid).update({
          name: name,
          bio: bio
        });
      }).then(() => {
        document.getElementById('profile-username').textContent = name;
        document.getElementById('profile-bio').textContent = bio || 'Tell us about yourself!';
        editProfileModal.style.display = 'none';
        alert('Profile updated successfully!');
      }).catch(error => {
        console.error('Error updating profile:', error);
        alert('Failed to update profile: ' + error.message);
      });
    });

    // Delete account
    deleteAccountBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        const user = firebase.auth().currentUser;
        const userRef = firebase.firestore().collection('users').doc(user.uid);
        const sessionsRef = userRef.collection('chat_sessions');

        sessionsRef.get().then(snapshot => {
          const batch = firebase.firestore().batch();
          snapshot.docs.forEach(sessionDoc => {
            const messagesRef = sessionsRef.doc(sessionDoc.id).collection('messages');
            messagesRef.get().then(msgSnapshot => {
              msgSnapshot.docs.forEach(msgDoc => batch.delete(msgDoc.ref));
            });
            batch.delete(sessionDoc.ref);
          });
          return batch.commit();
        }).then(() => {
          return userRef.delete();
        }).then(() => {
          return user.delete();
        }).then(() => {
          window.location.href = 'index.html';
        }).catch(error => {
          console.error('Error deleting account:', error);
          alert('Failed to delete account: ' + error.message);
        });
      }
    });

    // Logout functionality
    logoutBtn.addEventListener('click', () => {
      firebase.auth().signOut().then(() => {
        window.location.href = 'index.html';
      });
    });

    // Dark mode toggle
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      darkModeToggle.innerHTML = document.body.classList.contains('dark-mode') 
        ? '<i class="ri-sun-line"></i>' 
        : '<i class="ri-moon-line"></i>';
      localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
      darkModeToggle.innerHTML = '<i class="ri-sun-line"></i>';
    }
  });
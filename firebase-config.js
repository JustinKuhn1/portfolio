const firebaseConfig = {
    apiKey: "AIzaSyAfLvf08wEVytpN6BlgyWmmkffY3kjTnes",
    authDomain: "kuhnai-207af.firebaseapp.com",
    projectId: "kuhnai-207af",
    storageBucket: "kuhnai-207af.firebasestorage.app",
    messagingSenderId: "958425795689",
    appId: "1:958425795689:web:d3350fa250be29e0f426f8"
  };

  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
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

// This code would typically be placed in an admin panel or management interface
// Create a function to update the status in Firebase

function updateModelStatus(statusType, statusMessage) {
    // Reference to the status document
    const statusRef = db.collection("system").doc("status");
    
    return statusRef.set({
      type: statusType,         // "online", "updating", "offline"
      message: statusMessage,   // Custom message to display
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      console.log("Status updated successfully");
      return true;
    })
    .catch((error) => {
      console.error("Error updating status: ", error);
      return false;
    });
  }
  
  // Example usage:
  // updateModelStatus("updating", "Updating..."); 
  // updateModelStatus("online", "Online");
  // updateModelStatus("offline", "Maintenance");
// ==========================================
// ORDER CONFIRMATION PAGE (FIREBASE)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDnsilhjbCfdJvkqOohw_40F_xD_D97OQo",
    authDomain: "formique-backend.firebaseapp.com",
    projectId: "formique-backend",
    storageBucket: "formique-backend.firebasestorage.app",
    messagingSenderId: "1039018133322",
    appId: "1:1039018133322:web:057c329ab797fee1c4e3b3",
    measurementId: "G-NEBDNSBXYN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('order');

let currentOrder = null;
let countdownInterval;
const TIME_LIMIT_MINUTES = 15; // Auto-cancels after 15 minutes

async function init() {
    if (!orderId) {
        window.showMessage("Invalid Link", "No order ID was found in the URL. Please ensure you clicked the link directly from your checkout process or email.");
        return;
    }

    try {
        // Fetch the specific Order using Firebase
        const orderRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(orderRef);
        
        if (!docSnap.exists()) {
            window.showMessage("Order Not Found", "We couldn't locate this order in our system. It may have been removed.");
            return;
        }

        currentOrder = { id: docSnap.id, ...docSnap.data() };

        // Route based on current database status
        if (currentOrder.status === 'cancelled') {
            window.showMessage("Order Cancelled", "This order has been cancelled. If you wish to purchase these items, please place a new order.");
            return;
        }
        
        if (currentOrder.status === 'confirmed' || currentOrder.status === 'processing' || currentOrder.status === 'paid') {
            window.showMessage("Payment Sent", "Thank you! Your payment is currently under verification. Once verified, your order will be processed and we will email you with updates.");
            return;
        }

        // If the order is pending, set up the UI and the timer
        setupActiveOrder();

    } catch (err) {
        console.error("Database Connection Error:", err);
        window.showMessage("Connection Error", "Failed to connect to the database. Please refresh the page.");
    }
}

function setupActiveOrder() {
    const createdTime = currentOrder.created_at || new Date().getTime();
    const expirationTime = createdTime + (TIME_LIMIT_MINUTES * 60 * 1000);
    const now = new Date().getTime();

    // If the 15 minutes have already expired
    if (now >= expirationTime) {
        window.cancelOrder('auto_expired');
        return;
    }

    // Populate UI details safely
    const dispOrderId = document.getElementById('dispOrderId');
    const dispTotal = document.getElementById('dispTotal');
    const modalTotal = document.getElementById('modalTotal');
    const dispMethod = document.getElementById('dispMethod');

    if(dispOrderId) dispOrderId.innerText = '#' + currentOrder.id.substring(0,8).toUpperCase();
    if(dispTotal) dispTotal.innerText = `₱${parseFloat(currentOrder.total_price || 0).toLocaleString()}`;
    if(modalTotal) modalTotal.innerText = `₱${parseFloat(currentOrder.total_price || 0).toLocaleString()}`;
    if(dispMethod) dispMethod.innerText = currentOrder.payment_method || "Manual Transfer";

    startTimer(expirationTime);

    // Switch from loading to main view
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

function startTimer(expirationTime) {
    const timerEl = document.getElementById('timer');
    if(!timerEl) return;
    
    countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expirationTime - now;

        // Timer hits zero
        if (distance <= 0) {
            clearInterval(countdownInterval);
            timerEl.innerText = "EXPIRED";
            window.cancelOrder('auto_expired');
            return;
        }

        // Calculate visual time remaining
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        timerEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Attach functions to the window object so your HTML onclicks can trigger them
window.cancelOrder = async function(reason) {
    clearInterval(countdownInterval);
    
    const btnCancel = document.getElementById('btnCancel');
    const btnConfirm = document.getElementById('btnConfirm');

    if(btnCancel) {
        btnCancel.innerText = "Cancelling...";
        btnCancel.disabled = true;
    }
    if(btnConfirm) btnConfirm.disabled = true;

    try {
        // Update the order status in Firestore to 'cancelled'
        await updateDoc(doc(db, "orders", orderId), { status: 'cancelled' });

        if (reason === 'auto_expired') {
            window.showMessage("Time Expired", "Your 15-minute payment window has expired, and this order has been automatically cancelled. Please place a new order if you wish to proceed.");
        } else {
            window.showMessage("Order Cancelled", "You have successfully cancelled this order. No charges have been made.");
        }
    } catch (error) {
        console.error("Cancel failed:", error);
        alert("Failed to cancel order. Please contact support.");
    }
}

window.confirmPayment = async function() {
    const btnConfirm = document.getElementById('btnConfirm');
    const btnCancel = document.getElementById('btnCancel');
    
    if(btnConfirm) {
        btnConfirm.innerText = "Verifying...";
        btnConfirm.disabled = true;
    }
    if(btnCancel) btnCancel.disabled = true;

    try {
        // Update the order status in Firestore to 'processing'
        await updateDoc(doc(db, "orders", orderId), { status: 'processing' });
        
        clearInterval(countdownInterval);
        window.showMessage("Payment Sent", "Thank you! We have received notice of your payment. Our team will manually verify the transaction and send a final confirmation email shortly.");
    } catch (error) {
        console.error("Confirm failed:", error);
        alert("Failed to update status. Please try again.");
        if(btnConfirm) {
            btnConfirm.innerText = "I Have Sent The Payment";
            btnConfirm.disabled = false;
        }
        if(btnCancel) btnCancel.disabled = false;
    }
}

window.showMessage = function(title, desc) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    
    const msgTitle = document.getElementById('msgTitle');
    const msgDesc = document.getElementById('msgDesc');
    
    if(msgTitle) {
        msgTitle.innerText = title;
        // Styling based on message type
        if(title === "Order Cancelled" || title === "Time Expired" || title === "Invalid Link" || title === "Order Not Found") {
            msgTitle.style.color = 'var(--danger)';
        } else if (title === "Payment Sent" || title === "Payment Confirmed") {
            msgTitle.style.color = '#10b981'; // Success Green
        }
    }
    if(msgDesc) msgDesc.innerText = desc;

    const messageState = document.getElementById('messageState');
    if(messageState) messageState.style.display = 'block';
}

window.toggleModal = function(show) {
    const modal = document.getElementById('qrModal');
    if(!modal) return;
    if(show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

// Close the QR modal if the user clicks outside the modal box
window.onclick = function(event) {
    const modal = document.getElementById('qrModal');
    if (event.target == modal) {
        window.toggleModal(false);
    }
}

// Ensures the DOM is ready before trying to fetch the order
window.onload = () => setTimeout(init, 500);
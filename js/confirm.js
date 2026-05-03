// Supabase Initialization
const supabaseUrl = 'https://mckfmkzcrpwnypxgqsuj.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ja2Zta3pjcnB3bnlweGdxc3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTUyOTYsImV4cCI6MjA5MjA3MTI5Nn0.pRc3Bf8pPu3JDIkMdXjbILVUHYn7Z34OqRxjnnjxigE'; 

// Renamed to 'supabaseClient' to prevent the global naming conflict!
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('order');

let currentOrder = null;
let countdownInterval;
const TIME_LIMIT_MINUTES = 15; // Auto-cancels after 15 minutes

async function init() {
    if (!orderId) {
        showMessage("Invalid Link", "No order ID was found in the URL. Please ensure you clicked the link directly from your checkout process or email.");
        return;
    }

    try {
        // Fetch Order using supabaseClient
        const { data, error } = await supabaseClient.from('orders').select('*').eq('id', orderId).single();
        
        if (error || !data) {
            console.error("Supabase Error:", error);
            showMessage("Order Not Found", "We couldn't locate this order in our system. It may have been removed.");
            return;
        }

        currentOrder = data;

        // Route based on current status
        if (currentOrder.status === 'cancelled') {
            showMessage("Order Cancelled", "This order has been cancelled. If you wish to purchase these items, please place a new order.");
            return;
        }
        
        if (currentOrder.status === 'confirmed' || currentOrder.status === 'processing' || currentOrder.status === 'paid') {
            showMessage("Payment Sent", "Thank you! Your payment is currently under verification. Once verified, your order will be processed and we will email you with updates.");
            return;
        }

        // If pending, check expiration time
        setupActiveOrder();

    } catch (err) {
        console.error("Catch Error:", err);
        showMessage("Connection Error", "Failed to connect to the secure database. Please refresh the page.");
    }
}

function setupActiveOrder() {
    const createdTime = new Date(currentOrder.created_at).getTime();
    const expirationTime = createdTime + (TIME_LIMIT_MINUTES * 60 * 1000);
    const now = new Date().getTime();

    // If already expired
    if (now >= expirationTime) {
        cancelOrder('auto_expired');
        return;
    }

    // Populate UI details
    document.getElementById('dispOrderId').innerText = '#' + currentOrder.id.substring(0,8).toUpperCase();
    document.getElementById('dispTotal').innerText = `₱${parseFloat(currentOrder.total_price).toLocaleString()}`;
    document.getElementById('modalTotal').innerText = `₱${parseFloat(currentOrder.total_price).toLocaleString()}`;
    document.getElementById('dispMethod').innerText = currentOrder.payment_method;

    // Start Timer
    startTimer(expirationTime);

    // Show main content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

function startTimer(expirationTime) {
    const timerEl = document.getElementById('timer');
    
    countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expirationTime - now;

        if (distance <= 0) {
            clearInterval(countdownInterval);
            timerEl.innerText = "EXPIRED";
            cancelOrder('auto_expired');
            return;
        }

        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        timerEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

async function cancelOrder(reason) {
    clearInterval(countdownInterval);
    
    if(document.getElementById('btnCancel')) {
        document.getElementById('btnCancel').innerText = "Cancelling...";
        document.getElementById('btnCancel').disabled = true;
        document.getElementById('btnConfirm').disabled = true;
    }

    // Update using supabaseClient
    const { error } = await supabaseClient.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    
    if (error) {
        alert("Failed to cancel order. Please contact support.");
        return;
    }

    if (reason === 'auto_expired') {
        showMessage("Time Expired", "Your 15-minute payment window has expired, and this order has been automatically cancelled. Please place a new order if you wish to proceed.");
    } else {
        showMessage("Order Cancelled", "You have successfully cancelled this order. No charges have been made.");
    }
}

async function confirmPayment() {
    const btn = document.getElementById('btnConfirm');
    btn.innerText = "Verifying...";
    btn.disabled = true;
    document.getElementById('btnCancel').disabled = true;

    // Update using supabaseClient
    const { error } = await supabaseClient.from('orders').update({ status: 'processing' }).eq('id', orderId);
    
    if (error) {
        alert("Failed to update status. Please try again.");
        btn.innerText = "I Have Sent The Payment";
        btn.disabled = false;
        document.getElementById('btnCancel').disabled = false;
        return;
    }

    clearInterval(countdownInterval);
    showMessage("Payment Sent", "Thank you! We have received notice of your payment. Our team will manually verify the transaction and send a final confirmation email shortly.");
}

function showMessage(title, desc) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    
    document.getElementById('msgTitle').innerText = title;
    document.getElementById('msgDesc').innerText = desc;
    
    if(title === "Order Cancelled" || title === "Time Expired" || title === "Invalid Link" || title === "Order Not Found") {
        document.getElementById('msgTitle').style.color = 'var(--danger)';
    } else if (title === "Payment Sent" || title === "Payment Confirmed") {
        document.getElementById('msgTitle').style.color = '#10b981'; // Success Green
    }

    document.getElementById('messageState').style.display = 'block';
}

function toggleModal(show) {
    const modal = document.getElementById('qrModal');
    if(show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

// Close modal if clicking outside the box
window.onclick = function(event) {
    const modal = document.getElementById('qrModal');
    if (event.target == modal) {
        toggleModal(false);
    }
}

// Boot
window.onload = () => setTimeout(init, 500);
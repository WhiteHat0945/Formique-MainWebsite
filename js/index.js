// ==========================================
// HOME PAGE - FIREBASE INTEGRATION (FIXED)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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

let heroImages = [];
let currentSlide = 0;
let slideInterval;

async function initHome() {
    try {
        // 1. Fetch CMS Data (Announcement & Hero Details)
        const cmsDoc = await getDoc(doc(db, "cms", "storefront"));
        if (cmsDoc.exists()) {
            const c = cmsDoc.data();
            
            // Setup Announcement Bar
            if(c.announcement_active) {
                const bar = document.getElementById('announcementBar');
                if (bar) {
                    bar.innerText = c.announcement_text;
                    bar.style.display = 'block';
                }
            }
            
            // Setup Hero Section Content (Using EXACT IDs from your index.html)
            const titleEl = document.getElementById('heroTitle');
            const subEl = document.getElementById('heroSub');
            const btnEl = document.getElementById('heroBtn');
            
            if (titleEl) titleEl.innerText = c.hero_title || "Formique";
            if (subEl) subEl.innerText = c.hero_subtitle || c.hero_sub || "Elevating Modern Essentials";
            
            if(btnEl && (c.hero_button_text || c.hero_btn)) {
                btnEl.innerText = c.hero_button_text || c.hero_btn;
                btnEl.style.display = 'inline-block';
            }
            
            // Hero Images Processing
            if (c.hero_images && c.hero_images.length > 0) {
                heroImages = c.hero_images;
            } else if (c.hero_image_url) {
                try { 
                    heroImages = c.hero_image_url.startsWith('[') ? JSON.parse(c.hero_image_url) : [c.hero_image_url]; 
                } catch(e) { 
                    heroImages = [c.hero_image_url]; 
                }
            } else {
                // Fallbacks if database has no image
                heroImages = [
                    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000",
                    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2000"
                ];
            }
            buildHeroSlider();
        }

        // 2. Fetch Products for Home Grids
        const querySnapshot = await getDocs(collection(db, "products"));
        window.productsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a,b) => (b.created_at || 0) - (a.created_at || 0));

        // 3. Trigger global UI and render grids
        if (typeof window.populateMegaMenu === 'function') window.populateMegaMenu();
        renderHomeGrids();
        
        if (typeof window.updateBagUI === 'function') window.updateBagUI();
        if (typeof window.updateWishlistUI === 'function') window.updateWishlistUI();

    } catch (error) {
        console.error("Error initializing home page:", error);
    }
}

function buildHeroSlider() {
    // Looks specifically for <div id="heroBg">
    const heroBg = document.getElementById('heroBg');
    if(!heroBg || heroImages.length === 0) return;
    
    heroBg.style.backgroundImage = `url('${heroImages[0]}')`;
    
    if(heroImages.length > 1) {
        if(slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % heroImages.length;
            heroBg.style.backgroundImage = `url('${heroImages[currentSlide]}')`;
        }, 5000);
    }
}

function renderHomeGrids() {
    const newArrivals = window.productsList.slice(0, 4);
    
    // Find items specifically marked as bestseller, otherwise fallback to top 8
    let bestsellers = window.productsList.filter(p => p.bestseller === true || String(p.bestseller) === "true");
    if(bestsellers.length === 0) {
        bestsellers = window.productsList.slice(0, 8); 
    }
    
    const renderCards = (containerId, items) => {
        const container = document.getElementById(containerId);
        if(!container) return; // Silent fail if the ID doesn't exist on the page
        
        container.innerHTML = items.map(p => {
            // Find global index for the shared openProduct function in main.js
            const originalIndex = window.productsList.findIndex(item => item.id === p.id);
            const isLiked = window.wishlist.some(id => String(id) === String(p.id)) ? 'liked' : '';
            const stockStr = String(p.stock).toLowerCase().trim();
            const isOutOfStock = stockStr === '0' || stockStr === 'out of stock' || stockStr === 'none' || stockStr === 'null' || stockStr === 'undefined';
            
            // Render using your EXACT original HTML structure and class names
            return `
            <div class="product-card ${isOutOfStock ? 'out-of-stock-card' : ''}" onclick="if(typeof window.openProduct === 'function') window.openProduct(${originalIndex})">
                <div class="product-image">
                    ${isOutOfStock ? `<div class="out-of-stock-label">Out of Stock</div>` : ''}
                    <button class="btn-like ${isLiked}" data-id="${p.id}" onclick="if(typeof window.toggleLike === 'function') window.toggleLike(event, '${p.id}')" style="${isOutOfStock ? 'z-index: 20; pointer-events: auto;' : ''}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                    <img src="${p.thumbnail || ''}" alt="${p.name}">
                </div>
                <div class="product-info">
                    <span class="product-name">${p.name}</span>
                    <span class="product-price">₱${parseFloat(p.price || 0).toLocaleString()}</span>
                </div>
            </div>`;
        }).join('');
    };

    // These IDs now perfectly match your index.html
    renderCards('newArrivalsGrid', newArrivals);
    renderCards('featuredGrid', bestsellers);
}

// Ensures the page is completely loaded before attempting to fill the grids
document.addEventListener('DOMContentLoaded', initHome);
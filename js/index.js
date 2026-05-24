// ==========================================
// HOME PAGE SPECIFIC LOGIC
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
        // 1. Fetch CMS (Announcement & Hero Details)
        const cmsDoc = await getDoc(doc(db, "cms", "storefront"));
        if (cmsDoc.exists()) {
            const cms = cmsDoc.data();
            
            if(cms.announcement_active) {
                const bar = document.getElementById('announcementBar');
                if (bar) {
                    bar.innerText = cms.announcement_text;
                    bar.style.display = 'block';
                }
            }

            if(cms.hero_images && cms.hero_images.length > 0) {
                heroImages = cms.hero_images;
                const heroOverlay = document.querySelector('.hero-overlay');
                if (heroOverlay) {
                    heroOverlay.innerHTML = `
                        <h1 class="hero-title">${cms.hero_title || 'Fall Collection 2026'}</h1>
                        <p class="hero-subtitle">${cms.hero_subtitle || 'Discover the new standard of modern elegance.'}</p>
                        <button class="btn-primary" onclick="window.location.href='shop.html'">${cms.hero_button_text || 'Shop the Collection'}</button>
                    `;
                }
                renderHero();
                startHeroSlider();
            }
        }

        // 2. Fetch Live Products
        const querySnapshot = await getDocs(collection(db, "products"));
        window.productsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a,b) => (b.created_at || 0) - (a.created_at || 0));

        // 3. Render Homepage Features
        renderHomeGrids();

        // 4. Fire Global Updates (Connecting to main.js UI)
        if (typeof window.populateMegaMenu === 'function') window.populateMegaMenu();
        if (typeof window.updateBagUI === 'function') window.updateBagUI();
        if (typeof window.updateWishlistUI === 'function') window.updateWishlistUI();

    } catch (err) {
        console.error("Error initializing home page:", err);
    }
}

function renderHero() {
    const heroSection = document.getElementById('heroSection');
    if(!heroSection || heroImages.length === 0) return;
    heroSection.style.backgroundImage = `url('${heroImages[currentSlide]}')`;
}

function startHeroSlider() {
    if(heroImages.length <= 1) return;
    slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % heroImages.length;
        renderHero();
    }, 5000);
}

function renderHomeGrids() {
    const bestsellerGrid = document.getElementById('bestsellerGrid');
    const featuredGrid = document.getElementById('featuredGrid');
    const newArrivalsGrid = document.getElementById('newArrivalsGrid');

    // Filter for bestsellers, fallback to latest products
    let bestsellers = window.productsList.filter(p => String(p.bestseller) === "true" || p.bestseller === true);
    if (bestsellers.length === 0) bestsellers = window.productsList.slice(0, 4);

    const newArrivals = window.productsList.slice(0, 4);

    if (bestsellerGrid) bestsellerGrid.innerHTML = bestsellers.map(p => createCardHTML(p)).join('');
    if (featuredGrid) featuredGrid.innerHTML = bestsellers.map(p => createCardHTML(p)).join('');
    if (newArrivalsGrid) newArrivalsGrid.innerHTML = newArrivals.map(p => createCardHTML(p)).join('');
}

function createCardHTML(p) {
    const originalIndex = window.productsList.findIndex(item => item.id === p.id);
    const wishlist = JSON.parse(localStorage.getItem('formique_likes')) || [];
    const isLiked = wishlist.some(id => String(id) === String(p.id)) ? 'liked' : '';
    const stockStr = String(p.stock).toLowerCase().trim();
    const isOutOfStock = stockStr === '0' || stockStr === 'out of stock' || stockStr === 'none' || stockStr === 'null' || stockStr === 'undefined';

    return `
    <div class="bestseller-card ${isOutOfStock ? 'out-of-stock-card' : ''}" onclick="if(typeof window.openProduct === 'function') window.openProduct(${originalIndex})">
        <div class="bestseller-image" style="aspect-ratio: 3/4;">
            ${isOutOfStock ? `<div class="out-of-stock-label">Out of Stock</div>` : ''}
            <button class="btn-like ${isLiked}" data-id="${p.id}" onclick="if(typeof window.toggleLike === 'function') window.toggleLike(event, '${p.id}')" style="${isOutOfStock ? 'z-index: 20; pointer-events: auto;' : ''}">
                <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
            <img src="${p.thumbnail || ''}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div class="bestseller-info">
            <div class="bestseller-text">
                <span class="bestseller-name">${p.name}</span>
                <span class="bestseller-cat">${p.category}</span>
            </div>
            <span class="bestseller-price">₱${parseFloat(p.price).toLocaleString()}</span>
        </div>
    </div>
    `;
}

window.onload = () => setTimeout(initHome, 300);
// ==========================================
// HERO BTN SCROLL HELPER
// ==========================================
function scrollToShop() {
    const target = document.getElementById('shopTarget');
    if (target) {
        const navHeight = document.getElementById('navbar').offsetHeight;
        const topPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: topPos, behavior: 'smooth' });
    }
    
    // Update Mobile Nav Active State
    document.querySelectorAll('.m-nav-item').forEach(el => el.classList.remove('active'));
    const firstNav = document.querySelectorAll('.m-nav-item')[0];
    if(firstNav) firstNav.classList.add('active');
}


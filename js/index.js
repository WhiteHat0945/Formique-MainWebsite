// ==========================================
// HOME PAGE - FIREBASE INTEGRATION
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
        // 1. Fetch CMS
        const cmsDoc = await getDoc(doc(db, "cms", "storefront"));
        if (cmsDoc.exists()) {
            const cms = cmsDoc.data();
            
            // Announcement
            if(cms.announcement_active) {
                const bar = document.getElementById('announcementBar');
                if (bar) { bar.innerText = cms.announcement_text; bar.style.display = 'block'; }
            }

            // Hero
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

        // 2. Fetch Products
        const querySnapshot = await getDocs(collection(db, "products"));
        window.productsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a,b) => (b.created_at || 0) - (a.created_at || 0));

        // 3. Render
        renderHomeGrids();

    } catch (err) {
        console.error("Error initializing home page:", err);
    }
}

function renderHero() {
    const heroSection = document.getElementById('heroSection');
    if(!heroSection) return;
    heroSection.style.backgroundImage = `url('${heroImages[currentSlide]}')`;
    heroSection.style.backgroundSize = "cover";
    heroSection.style.backgroundPosition = "center";
}

function startHeroSlider() {
    if(heroImages.length <= 1) return;
    if(slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % heroImages.length;
        renderHero();
    }, 5000);
}

function renderHomeGrids() {
    const bestsellerGrid = document.getElementById('bestsellerGrid');
    const featuredGrid = document.getElementById('featuredGrid');
    const newArrivalsGrid = document.getElementById('newArrivalsGrid');

    if (!bestsellerGrid && !featuredGrid && !newArrivalsGrid) return;

    let bestsellers = window.productsList.filter(p => p.bestseller === true || String(p.bestseller) === "true");
    if (bestsellers.length === 0) bestsellers = window.productsList.slice(0, 4);

    const cardsHTML = window.productsList.slice(0, 4).map(p => createCardHTML(p)).join('');
    
    if (bestsellerGrid) bestsellerGrid.innerHTML = bestsellers.map(p => createCardHTML(p)).join('');
    if (featuredGrid) featuredGrid.innerHTML = cardsHTML;
    if (newArrivalsGrid) newArrivalsGrid.innerHTML = cardsHTML;
}

function createCardHTML(p) {
    const originalIndex = window.productsList.findIndex(item => item.id === p.id);
    return `
    <div class="bestseller-card" onclick="if(typeof window.openProduct === 'function') window.openProduct(${originalIndex})">
        <div class="bestseller-image" style="aspect-ratio: 3/4; overflow:hidden;">
            <img src="${p.thumbnail || ''}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div class="bestseller-info">
            <span class="bestseller-name">${p.name}</span>
            <span class="bestseller-price">₱${parseFloat(p.price || 0).toLocaleString()}</span>
        </div>
    </div>`;
}

// Ensure init runs when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initHome);
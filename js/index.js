// ==========================================
// HOME PAGE SPECIFIC LOGIC
// ==========================================

let heroImages = [];
let currentSlide = 0;
let slideInterval;

async function initHome() {
    try {
        // 1. Fetch CMS Data (Announcement & Hero Details)
        // We use the global 'supabaseClient' variable from main.js!
        const { data: cms, error: cmsError } = await supabaseClient.from('cms').select('*').limit(1);
        
        if (!cmsError && cms && cms[0]) {
            const c = cms[0];
            
            // Setup Announcement Bar
            if(c.announcement_active) {
                const bar = document.getElementById('announcementBar');
                if (bar) {
                    bar.innerText = c.announcement_text;
                    bar.style.display = 'block';
                }
            }
            
            // Setup Hero Section Content
            const titleEl = document.getElementById('heroTitle');
            const subEl = document.getElementById('heroSub');
            const btnEl = document.getElementById('heroBtn');
            
            if (titleEl) titleEl.innerText = c.hero_title || "Formique";
            if (subEl) subEl.innerText = c.hero_sub || "Elevating Modern Essentials";
            
            if(btnEl && c.hero_btn) {
                btnEl.innerText = c.hero_btn;
                btnEl.style.display = 'inline-block';
            }
            
            // Hero Images Processing (Handles both arrays and single strings)
            if(c.hero_image_url) {
                try { 
                    heroImages = c.hero_image_url.startsWith('[') ? JSON.parse(c.hero_image_url) : [c.hero_image_url]; 
                } catch(e) { 
                    heroImages = [c.hero_image_url]; 
                }
                buildHeroSlider();
            } else {
                // Fallbacks if database has no image
                heroImages = [
                    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000",
                    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2000"
                ];
                buildHeroSlider();
            }
        }

        // 2. Fetch Products for Home Grids, Mega Menu, and Search
        const { data: prods, error: prodsError } = await supabaseClient.from('products').select('*').order('id', { ascending: false });

        if (!prodsError && prods) {
            productsList = prods; // Update the global array in main.js
            populateMegaMenu();   // Trigger function from main.js
            renderHomeGrids();
        }
        
        // 3. Update UI states
        updateBagUI();
        updateWishlistUI();

    } catch (err) { 
        console.error("Home initialization error:", err); 
    }
}

// ==========================================
// HERO SLIDER LOGIC
// ==========================================
function buildHeroSlider() {
    const container = document.getElementById('heroSliderContainer');
    const controls = document.getElementById('sliderControls');
    if(!container || !controls) return;
    
    container.innerHTML = ''; 
    controls.innerHTML = '';
    
    if(heroImages.length === 0) return;
    
    heroImages.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src; 
        img.className = `hero-slide ${i === 0 ? 'active' : ''}`;
        container.appendChild(img);
        
        if(heroImages.length > 1) {
            const dot = document.createElement('div');
            dot.className = `dot ${i === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(i);
            controls.appendChild(dot);
        }
    });
    
    // Start auto-slider if there is more than 1 image
    if(heroImages.length > 1) { 
        slideInterval = setInterval(nextSlide, 6000); 
    }
}

function nextSlide() { 
    goToSlide((currentSlide + 1) % heroImages.length); 
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    if(slides.length === 0) return;
    
    slides[currentSlide].classList.remove('active');
    if(dots.length > 0) dots[currentSlide].classList.remove('active');
    
    currentSlide = index;
    
    slides[currentSlide].classList.add('active');
    if(dots.length > 0) dots[currentSlide].classList.add('active');
    
    // Reset the interval timer when manually clicked
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 6000);
}

// ==========================================
// PRODUCT GRID RENDERING
// ==========================================
function renderHomeGrids() {
    const bestsellersGrid = document.getElementById('productGrid');
    const newArrivalsGrid = document.getElementById('newArrivalsGrid');
    const featuredGrid = document.getElementById('featuredGrid');

    if(productsList.length === 0) {
         const emptyHtml = "<p style='color: var(--muted); padding: 2rem; width: 100%; text-align: center; grid-column: 1/-1;'>No products found.</p>";
         if(bestsellersGrid) bestsellersGrid.innerHTML = emptyHtml;
         if(newArrivalsGrid) newArrivalsGrid.innerHTML = emptyHtml;
         if(featuredGrid) featuredGrid.innerHTML = emptyHtml;
         return;
    }

    // Reusable Card Generator Function
    const generateCards = (items, isBestSeller = false) => {
        return items.map((p) => {
            const originalIndex = productsList.findIndex(item => item.id === p.id);
            const isLiked = wishlist.some(id => String(id) === String(p.id)) ? 'liked' : '';
            const badgeHtml = (isBestSeller && p.bestseller) ? `<span class="product-badge">Best Seller</span>` : '';
            
            // Bulletproof stock check
            const stockStr = String(p.stock).toLowerCase().trim();
            const isOutOfStock = stockStr === '0' || stockStr === 'out of stock' || stockStr === 'none' || stockStr === 'null' || stockStr === 'undefined';
            
            return `
            <div class="bestseller-card ${isOutOfStock ? 'out-of-stock-card' : ''}" onclick="openProduct(${originalIndex})">
                <div class="bestseller-image">
                    ${isOutOfStock ? `<div class="out-of-stock-label">Out of Stock</div>` : ''}
                    ${badgeHtml}
                    <button class="btn-like ${isLiked}" data-id="${p.id}" onclick="toggleLike(event, '${p.id}')" style="${isOutOfStock ? 'z-index: 20; pointer-events: auto;' : ''}">
                        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                    <img src="${p.thumbnail || ''}" alt="${p.name}">
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
        }).join('');
    };

    // 1. Render Bestsellers (Items 5-8 if available, otherwise 1-4)
    if(bestsellersGrid) {
        const bestsellers = productsList.length > 4 ? productsList.slice(4, 8) : productsList.slice(0, 4);
        bestsellersGrid.innerHTML = generateCards(bestsellers, true);
    }

    // 2. Render New Arrivals (First 4 items)
    if(newArrivalsGrid) {
        const newArrivals = productsList.slice(0, 4);
        newArrivalsGrid.innerHTML = generateCards(newArrivals, false);
    }

    // 3. Render Featured (Randomized 3 items)
    if(featuredGrid) {
        const shuffled = [...productsList].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);
        featuredGrid.innerHTML = generateCards(selected, false);
    }
}

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

// Run script safely after slight delay to ensure DOM is ready
window.onload = () => setTimeout(initHome, 300);
        const supabaseUrl = 'https://mckfmkzcrpwnypxgqsuj.supabase.co'; 
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ja2Zta3pjcnB3bnlweGdxc3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTUyOTYsImV4cCI6MjA5MjA3MTI5Nn0.pRc3Bf8pPu3JDIkMdXjbILVUHYn7Z34OqRxjnnjxigE'; 

        let productsList = [];
        let cart = JSON.parse(localStorage.getItem('elites_bag')) || [];
        let wishlist = JSON.parse(localStorage.getItem('formique_likes')) || [];
        
        let heroImages = [];
        let currentSlide = 0;
        let slideInterval;

        window.addEventListener('scroll', () => {
            const nav = document.getElementById('navbar');
            const menu = document.getElementById('megaMenu');
            const search = document.getElementById('searchOverlay');
            const isProductPage = document.getElementById('productPageView').style.display === 'block';
            
            // Top Nav Glass Effect
            if (window.scrollY > 50 || (menu && menu.classList.contains('active')) || (search && search.classList.contains('active')) || isProductPage) { 
                nav.classList.add('glass'); 
            } else { 
                nav.classList.remove('glass'); 
            }

            // Mobile Bottom Nav Fade-In Logic
            const bottomNav = document.querySelector('.mobile-bottom-nav');
            if (bottomNav) {
                // Fade in when scrolled past ~30% of the viewport
                if (window.scrollY > window.innerHeight * 0.3 || isProductPage) {
                    bottomNav.classList.add('scrolled-down');
                } else {
                    // Always close the menu if the user scrolls back to the very top hero section
                    if(menu && menu.classList.contains('active')) {
                        menu.classList.remove('active');
                    }
                    bottomNav.classList.remove('scrolled-down');
                }
            }
        });

        function scrollToShop() { 
            const target = document.getElementById('shopTarget');
            const navHeight = document.getElementById('navbar').offsetHeight;
            const topPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
            window.scrollTo({ top: topPos, behavior: 'smooth' });
            
            // Update Mobile Nav Active State
            document.querySelectorAll('.m-nav-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.m-nav-item')[0].classList.add('active');
        }

        async function init() {
            try {
                const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

                const { data: cms } = await supabase.from('cms').select('*').limit(1);
                if (cms && cms[0]) {
                    const c = cms[0];
                    if(c.announcement_active) {
                        document.getElementById('announcementBar').innerText = c.announcement_text;
                        document.getElementById('announcementBar').style.display = 'block';
                    }
                    document.getElementById('heroTitle').innerText = c.hero_title || "Formique";
                    document.getElementById('heroSub').innerText = c.hero_sub || "Elevating Modern Essentials";
                    if(c.hero_btn) {
                        document.getElementById('heroBtn').innerText = c.hero_btn;
                        document.getElementById('heroBtn').style.display = 'inline-block';
                    }
                    if(c.hero_image_url) {
                        try { heroImages = c.hero_image_url.startsWith('[') ? JSON.parse(c.hero_image_url) : [c.hero_image_url]; } 
                        catch(e) { heroImages = [c.hero_image_url]; }
                        buildHeroSlider();
                    }
                }

                const { data: prods } = await supabase.from('products').select('*').order('id', { ascending: false });
                if (prods) {
                    productsList = prods;
                    renderGrid();
                    renderFeatured();
                    populateMegaMenu(); 
                }
                updateBagUI();
                updateWishlistUI();

            } catch (err) { console.error("Initialization error:", err); }
        }

        function toggleMegaMenu(e) {
            if(e) e.stopPropagation();
            const menu = document.getElementById('megaMenu');
            const nav = document.getElementById('navbar');
            
            menu.classList.toggle('active');
            if (menu.classList.contains('active') || window.scrollY > 50) {
                nav.classList.add('glass');
            } else {
                nav.classList.remove('glass');
            }
            
            // Update Mobile Nav Active State
            document.querySelectorAll('.m-nav-item').forEach(el => el.classList.remove('active'));
            if(menu.classList.contains('active')) {
                document.querySelectorAll('.m-nav-item')[1].classList.add('active');
            } else {
                document.querySelectorAll('.m-nav-item')[0].classList.add('active');
            }
        }

        function scrollToSection(id) {
            const target = document.getElementById(id);
            if(target) {
                const navHeight = document.getElementById('navbar').offsetHeight;
                const topPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
                window.scrollTo({ top: topPos, behavior: 'smooth' });
            }
            const menu = document.getElementById('megaMenu');
            menu.classList.remove('active');
            if (window.scrollY <= 50) document.getElementById('navbar').classList.remove('glass');
            
            // Update Mobile Nav Active State
            document.querySelectorAll('.m-nav-item').forEach(el => el.classList.remove('active'));
            if(id === 'footerSection') {
                document.querySelectorAll('.m-nav-item')[2].classList.add('active');
            } else {
                document.querySelectorAll('.m-nav-item')[0].classList.add('active');
            }
        }

        document.addEventListener('click', function(event) {
            const nav = document.getElementById('navbar');
            const menu = document.getElementById('megaMenu');
            const search = document.getElementById('searchOverlay');
            const isProductPage = document.getElementById('productPageView').style.display === 'block';
            
            if (menu && menu.classList.contains('active') && !event.target.closest('.nav-item-wrap') && !event.target.closest('.m-nav-item')) {
                menu.classList.remove('active');
                document.querySelectorAll('.m-nav-item').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.m-nav-item')[0].classList.add('active');
            }
            if (search && search.classList.contains('active') && !event.target.closest('#searchOverlay') && !event.target.closest('.nav-icon') && !event.target.closest('.m-nav-item')) {
                search.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
            if (window.scrollY <= 50 && (!menu || !menu.classList.contains('active')) && (!search || !search.classList.contains('active')) && !isProductPage) {
                nav.classList.remove('glass');
            }
        });

        function populateMegaMenu() {
            const container = document.getElementById('megaMenuProducts');
            if(!container || productsList.length === 0) return;
            const shuffled = [...productsList].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3);
            
            container.innerHTML = selected.map(p => {
                const originalIndex = productsList.findIndex(item => item.id === p.id);
                
                // Bulletproof Check
                const stockStr = String(p.stock).toLowerCase().trim();
                const isOutOfStock = stockStr === '0' || stockStr === 'out of stock' || stockStr === 'none' || stockStr === 'null' || stockStr === 'undefined';

                // Notice the updated onclick here!
                return `
                <div class="mega-card ${isOutOfStock ? 'out-of-stock-card' : ''}" onclick="openProduct(${originalIndex}); document.getElementById('megaMenu').classList.remove('active');">
                    <div class="mega-img-wrap" style="position: relative;">
                        ${isOutOfStock ? `<div class="out-of-stock-label" style="width: 90%; font-size: 0.65rem; padding: 0.5rem;">Out of Stock</div>` : ''}
                        <img src="${p.thumbnail || ''}" alt="${p.name}">
                    </div>
                    <span class="mega-name">${p.name}</span>
                    <span class="mega-price">₱${parseFloat(p.price).toLocaleString()}</span>
                </div>`;
            }).join('');
        }

        function toggleSearch() {
            const overlay = document.getElementById('searchOverlay');
            const nav = document.getElementById('navbar');
            
            overlay.classList.toggle('active');
            if(overlay.classList.contains('active')) {
                nav.classList.add('glass'); 
                setTimeout(() => document.getElementById('searchInput').focus(), 100);
                document.getElementById('searchInput').value = '';
                document.getElementById('searchHeading').innerText = "Suggested for you";
                const shuffled = [...productsList].sort(() => 0.5 - Math.random());
                renderSearchResults(shuffled.slice(0, 4));
                document.body.style.overflow = 'hidden'; 
            } else {
                document.body.style.overflow = 'auto';
                if (window.scrollY <= 50 && !document.getElementById('megaMenu').classList.contains('active')) {
                    nav.classList.remove('glass');
                }
            }
        }

        function performSearch(e) {
            const query = e.target.value.toLowerCase().trim();
            if(e.key === 'Enter') {
                if(query) window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                return;
            }
            if(!query) {
                document.getElementById('searchHeading').innerText = "Suggested for you";
                const shuffled = [...productsList].sort(() => 0.5 - Math.random());
                renderSearchResults(shuffled.slice(0, 4));
                return;
            }
            document.getElementById('searchHeading').innerText = "Top Results";
            const filtered = productsList.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
            renderSearchResults(filtered.slice(0, 8));
        }

        function renderSearchResults(items) {
            const container = document.getElementById('searchResults');
            if(items.length === 0) {
                container.innerHTML = `<p class="search-msg">No products found for that search. Try another keyword.</p>`;
                return;
            }
            
            container.innerHTML = items.map(p => {
                const originalIndex = productsList.findIndex(item => item.id === p.id);
                
                // Bulletproof Check
                const stockStr = String(p.stock).toLowerCase().trim();
                const isOutOfStock = stockStr === '0' || stockStr === 'out of stock' || stockStr === 'none' || stockStr === 'null' || stockStr === 'undefined';

                // Notice the updated onclick here!
                return `
                <div class="mega-card ${isOutOfStock ? 'out-of-stock-card' : ''}" onclick="openProduct(${originalIndex}); document.getElementById('searchOverlay').classList.remove('active'); document.body.style.overflow = 'auto';">
                    <div class="mega-img-wrap" style="position: relative;">
                        ${isOutOfStock ? `<div class="out-of-stock-label" style="width: 90%; font-size: 0.65rem; padding: 0.5rem;">Out of Stock</div>` : ''}
                        <img src="${p.thumbnail || ''}" alt="${p.name}">
                    </div>
                    <span class="mega-name">${p.name}</span>
                    <span class="mega-price">₱${parseFloat(p.price).toLocaleString()}</span>
                </div>`;
            }).join('');
        }

        function buildHeroSlider() {
            const container = document.getElementById('heroSliderContainer');
            const controls = document.getElementById('sliderControls');
            container.innerHTML = ''; controls.innerHTML = '';
            if(heroImages.length === 0) return;

            heroImages.forEach((src, i) => {
                const img = document.createElement('img');
                img.src = src; img.className = `hero-slide ${i === 0 ? 'active' : ''}`;
                container.appendChild(img);
                if(heroImages.length > 1) {
                    const dot = document.createElement('div');
                    dot.className = `dot ${i === 0 ? 'active' : ''}`;
                    dot.onclick = () => goToSlide(i);
                    controls.appendChild(dot);
                }
            });
            if(heroImages.length > 1) { slideInterval = setInterval(nextSlide, 6000); }
        }

        function nextSlide() { goToSlide((currentSlide + 1) % heroImages.length); }
        function goToSlide(index) {
            const slides = document.querySelectorAll('.hero-slide');
            const dots = document.querySelectorAll('.dot');
            slides[currentSlide].classList.remove('active');
            if(dots.length > 0) dots[currentSlide].classList.remove('active');
            currentSlide = index;
            slides[currentSlide].classList.add('active');
            if(dots.length > 0) dots[currentSlide].classList.add('active');
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 6000);
        }

        function toggleLike(e, productId) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            const idStr = String(productId);
            const index = wishlist.findIndex(id => String(id) === idStr);
            if (index > -1) { wishlist.splice(index, 1); } else { wishlist.push(idStr); }
            localStorage.setItem('formique_likes', JSON.stringify(wishlist));
            document.querySelectorAll(`.btn-like[data-id="${idStr}"]`).forEach(btn => {
                if (index > -1) { btn.classList.remove('liked'); } else { btn.classList.add('liked'); }
            });
            updateWishlistUI();
        }

        function toggleWishlist() { 
            document.getElementById('wishlistSidebar').classList.toggle('active'); 
        }

        function updateWishlistUI() {
            document.getElementById('wishlistCount').innerText = wishlist.length;
            const container = document.getElementById('wishlistItems');
            if(wishlist.length === 0) {
                container.innerHTML = "<p style='color:var(--muted); font-size:0.95rem; margin-top:2rem; text-align:center;'>You haven't saved any items yet.</p>";
                return;
            }
            container.innerHTML = wishlist.map(id => {
                const p = productsList.find(item => String(item.id) === String(id));
                if(!p) return ''; 
                const originalIndex = productsList.findIndex(item => String(item.id) === String(id));
                return `
                <div class="bag-item" style="align-items: flex-start; padding-bottom: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border);">
                    <img src="${p.thumbnail || ''}" style="cursor:pointer; width: 90px; aspect-ratio: 3/4; object-fit: cover;" onclick="openProduct(${originalIndex}); toggleWishlist();">
                    <div style="flex-grow:1; display: flex; flex-direction: column; justify-content: space-between; height: 120px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="cursor:pointer;" onclick="openProduct(${originalIndex}); toggleWishlist();">
                                <div style="font-weight: 500; font-size: 0.95rem; margin-bottom: 4px; color: var(--text);">${p.name}</div>
                                <div style="color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">${p.category}</div>
                            </div>
                            <span onclick="toggleLike(event, '${p.id}')" style="cursor:pointer; color: var(--muted); font-size: 1.8rem; line-height: 0.8; padding-left: 10px;" title="Remove">×</span>
                        </div>
                        <div style="font-weight: 500; font-size: 1.05rem;">₱${parseFloat(p.price).toLocaleString()}</div>
                    </div>
                </div>`;
            }).join('');
        }

        function renderFeatured() {
            const grid = document.getElementById('featuredGrid');
            if (!grid || productsList.length === 0) return;
            const shuffled = [...productsList].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3);
            grid.innerHTML = selected.map(p => {
                const originalIndex = productsList.findIndex(item => item.id === p.id);
                const isLiked = wishlist.some(id => String(id) === String(p.id)) ? 'liked' : '';
                
                // Bulletproof Check
                const stockStr = String(p.stock).toLowerCase().trim();
                const isOutOfStock = stockStr === '0' || stockStr === 'out of stock' || stockStr === 'none' || stockStr === 'null' || stockStr === 'undefined';

                return `
                <div class="bestseller-card ${isOutOfStock ? 'out-of-stock-card' : ''}" onclick="openProduct(${originalIndex})">
                    <div class="bestseller-image">
                        ${isOutOfStock ? `<div class="out-of-stock-label">Out of Stock</div>` : ''}
                        <button class="btn-like ${isLiked}" data-id="${p.id}" onclick="toggleLike(event, '${p.id}')" style="${isOutOfStock ? 'z-index: 20; pointer-events: auto;' : ''}">
                            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        </button>
                        <img src="${p.thumbnail || ''}">
                    </div>
                    <div class="bestseller-info">
                        <div class="bestseller-text">
                            <span class="bestseller-name">${p.name}</span>
                            <span class="bestseller-cat">${p.category}</span>
                        </div>
                        <span class="bestseller-price">₱${parseFloat(p.price).toLocaleString()}</span>
                    </div>
                </div>
            `}).join('');
        }

        function renderGrid() {
            const bestsellersGrid = document.getElementById('productGrid');
            const newArrivalsGrid = document.getElementById('newArrivalsGrid');
            if(productsList.length === 0) { 
                if(bestsellersGrid) bestsellersGrid.innerHTML = "<p>No products found.</p>"; 
                if(newArrivalsGrid) newArrivalsGrid.innerHTML = "<p>No products found.</p>"; 
                return; 
            }
            const newArrivals = productsList.slice(0, 4);
            const bestsellers = productsList.length > 4 ? productsList.slice(4, 8) : productsList.slice(0, 4);
            
            const generateCards = (items, isBestSeller = false) => {
                return items.map((p) => {
                    const originalIndex = productsList.findIndex(item => item.id === p.id);
                    const isLiked = wishlist.some(id => String(id) === String(p.id)) ? 'liked' : '';
                    const badgeHtml = isBestSeller ? `<span class="product-badge">Best Seller</span>` : '';
                    
                    // Bulletproof Check
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
                            <img src="${p.thumbnail || ''}">
                        </div>
                        <div class="bestseller-info">
                            <div class="bestseller-text">
                                <span class="bestseller-name">${p.name}</span>
                                <span class="bestseller-cat">${p.category}</span>
                            </div>
                            <span class="bestseller-price">₱${parseFloat(p.price).toLocaleString()}</span>
                        </div>
                    </div>
                `}).join('');
            };
            if(bestsellersGrid) bestsellersGrid.innerHTML = generateCards(bestsellers, true);
            if(newArrivalsGrid) newArrivalsGrid.innerHTML = generateCards(newArrivals, false);
        }

        function getCSSColor(colorStr) {
            if (!colorStr) return '#000';
            if (colorStr.startsWith('#') || colorStr.startsWith('rgb')) return colorStr;
            const cMap = {
                "navy blue": "#000080", "light blue": "#add8e6", "olive green": "#556b2f", "mustard": "#ffdb58",
                "maroon": "#800000", "charcoal": "#36454F", "cream": "#FFFDD0", "peach": "#FFE5B4",
                "teal": "#008080", "rust": "#b7410e", "khaki": "#c3b091", "off white": "#faf9f6"
            };
            let c = colorStr.toLowerCase().trim();
            return cMap[c] ? cMap[c] : c.replace(/\s/g, ''); 
        }

        function openProduct(index) {
            const p = productsList[index];
            if (!p) return;
            
            document.getElementById('homeView').style.display = 'none';
            document.getElementById('productPageView').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'instant' });
            document.getElementById('navbar').classList.add('glass');
            
            const isLiked = wishlist.some(id => String(id) === String(p.id)) ? 'liked' : '';

            // Bulletproof Check
            const stockStr = String(p.stock).toLowerCase().trim();
            const isOutOfStock = stockStr === '0' || stockStr === 'out of stock' || stockStr === 'none' || stockStr === 'null' || stockStr === 'undefined';

            let colorsHTML = '';
            if (p.colors && p.colors.length > 0) {
                colorsHTML = `<div class="opt-group"><span class="opt-label">Color</span><div class="chip-box">`;
                colorsHTML += p.colors.map((c, idx) => {
                    let colorName = c.name ? c.name : c;
                    let bgColor = c.hex ? c.hex : getCSSColor(colorName);
                    return `<div class="color-dot ${idx===0?'selected':''}" style="background-color: ${bgColor};" title="${colorName}" onclick="selectOption(this, 'color')"></div>`;
                }).join('');
                colorsHTML += `</div></div>`;
            }

            const standardSizes = ['S', 'M', 'L', 'XL', 'XXL'];
            const availableSizes = (p.sizes || []).map(s => String(s).toUpperCase());
            
            let sizesHTML = `<div class="opt-group"><span class="opt-label">Size</span><div class="chip-box">`;
            let firstAvailableFound = false;
            
            sizesHTML += standardSizes.map((s) => {
                const isAvailable = availableSizes.includes(s);
                let selectedClass = '';
                
                if (isAvailable && !firstAvailableFound) {
                    selectedClass = 'selected';
                    firstAvailableFound = true;
                }
                
                return `<div class="chip-item ${isAvailable ? '' : 'disabled'} ${selectedClass}" ${isAvailable ? `onclick="selectOption(this, 'size')"` : ''}>${s}</div>`;
            }).join('');
            sizesHTML += `</div></div>`;

            let galleryHTML = `<img src="${p.thumbnail}" class="active" onclick="swapMainImage(this)">`;
            if(p.gallery && p.gallery.length > 0) {
                galleryHTML += p.gallery.map(img => `<img src="${img}" onclick="swapMainImage(this)">`).join('');
            }

            // 2. DYNAMIC BUTTON AND STOCK TEXT (MATCHING YOUR SCREENSHOT)
            const actionButtonHTML = isOutOfStock 
                ? `<button class="pp-btn-add" style="background: #e2e2e2; color: #888; cursor: not-allowed; font-weight: 600; text-transform: uppercase;" disabled>Out of Stock</button>`
                : `<button class="pp-btn-add" onclick="addToBag(${index})">Add to Bag</button>`;

            const stockTextHTML = isOutOfStock
                ? `<span style="color: #ff4444; margin-right: 8px; font-size: 1.2rem; vertical-align: middle;">●</span> <span style="color: var(--muted);">Out of Stock</span>`
                : `<span style="color: #27ae60; margin-right: 8px; font-size: 1.2rem; vertical-align: middle;">●</span> ${p.stock || 'In Stock'}`;

            document.getElementById('ppContainer').innerHTML = `
                <div class="pp-image-container">
                    <div class="thumb-strip-vertical">${galleryHTML}</div>
                    <div class="pp-image-wrap">
                        <img id="mainView" src="${p.thumbnail || ''}" alt="${p.name}">
                    </div>
                </div>
                
                <div class="pp-details">
                    <div class="pp-breadcrumbs">Home / ${p.category} / ${p.name}</div>
                    <h1 class="pp-title">${p.name}</h1>
                    <div class="pp-price">₱${parseFloat(p.price).toLocaleString()}</div>
                    <p class="pp-desc">${p.description || 'Elevate your wardrobe with this signature piece from the Formique collection, crafted for ultimate sophistication and comfort.'}</p>
                    
                    <div class="options-row">
                        ${colorsHTML}
                        ${sizesHTML}
                    </div>
                    
                    <p style="font-size:0.8rem; margin-bottom:1.5rem; color:var(--muted);">
                        ${stockTextHTML}
                    </p>

                    <div class="pp-actions">
                        ${actionButtonHTML}
                        <button class="pp-btn-wish btn-like ${isLiked}" data-id="${p.id}" onclick="toggleLike(event, '${p.id}')">
                            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        </button>
                    </div>
                </div>
            `;
            
            renderSuggestedProducts(p.id);
            
            const bottomNav = document.querySelector('.mobile-bottom-nav');
            if (bottomNav) { bottomNav.classList.add('scrolled-down'); }
        }

        function closeProductPage() {
            document.getElementById('productPageView').style.display = 'none';
            document.getElementById('homeView').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'instant' });
            if (window.scrollY <= 50) {
                document.getElementById('navbar').classList.remove('glass');
            }
            // Hide bottom nav when returning to top
            const bottomNav = document.querySelector('.mobile-bottom-nav');
            if (bottomNav) {
                bottomNav.classList.remove('scrolled-down');
            }
        }

        function swapMainImage(el) {
            document.getElementById('mainView').src = el.src;
            document.querySelectorAll('.thumb-strip-vertical img').forEach(img => img.classList.remove('active'));
            el.classList.add('active');
        }

        function selectOption(el, type) {
            const siblings = el.parentElement.querySelectorAll(type === 'size' ? '.chip-item' : '.color-dot');
            siblings.forEach(s => s.classList.remove('selected'));
            el.classList.add('selected');
        }

        function renderSuggestedProducts(currentId) {
            const grid = document.getElementById('ppSuggestedGrid');
            const shuffled = [...productsList].filter(p => String(p.id) !== String(currentId)).sort(() => 0.5 - Math.random());
            const suggested = shuffled.slice(0, 4);
            grid.innerHTML = suggested.map(p => {
                const originalIndex = productsList.findIndex(item => item.id === p.id);
                const isLiked = wishlist.some(id => String(id) === String(p.id)) ? 'liked' : '';
                
                // Bulletproof Check
                const stockStr = String(p.stock).toLowerCase().trim();
                const isOutOfStock = stockStr === '0' || stockStr === 'out of stock' || stockStr === 'none' || stockStr === 'null' || stockStr === 'undefined';

                return `
                <div class="bestseller-card ${isOutOfStock ? 'out-of-stock-card' : ''}" onclick="openProduct(${originalIndex})">
                    <div class="bestseller-image" style="aspect-ratio: 3/4;">
                        ${isOutOfStock ? `<div class="out-of-stock-label">Out of Stock</div>` : ''}
                        <button class="btn-like ${isLiked}" data-id="${p.id}" onclick="toggleLike(event, '${p.id}')" style="${isOutOfStock ? 'z-index: 20; pointer-events: auto;' : ''}">
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
            }).join('');
        }

        function addToBag(index) {
            const p = productsList[index];
            let selectedSize = "Default";
            let selectedColor = "Default";
            const sizeEl = document.querySelector('.chip-item.selected');
            const colorEl = document.querySelector('.color-dot.selected');
            
            if(sizeEl) selectedSize = sizeEl.innerText;
            if(colorEl) selectedColor = colorEl.getAttribute('title');

            cart.push({ 
            id: p.id,
            name: p.name, 
            price: p.price, 
            img: p.thumbnail, 
            variant: `${selectedColor} / ${selectedSize}`, 
            qty: 1 
            });
            localStorage.setItem('elites_bag', JSON.stringify(cart));
            
            updateBagUI(); 
            toggleBag();
        }

        function updateBagUI() {
            document.getElementById('bagCount').innerText = cart.length;

            const items = document.getElementById('bagItems');
            let total = 0;
            items.innerHTML = cart.map((item, i) => {
                total += parseFloat(item.price);
                return `
                <div class="bag-item">
                    <img src="${item.img}">
                    <div style="flex-grow:1; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="font-weight: 500; font-size: 0.95rem; margin-bottom: 4px;">${item.name}</div>
                            <div style="color: var(--muted); font-size: 0.8rem;">${item.variant}</div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                            <span style="font-weight: 500;">₱${parseFloat(item.price).toLocaleString()}</span>
                            <span onclick="removeItem(${i})" style="cursor:pointer; color: var(--muted); font-size: 1.5rem; line-height: 1;">×</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
            document.getElementById('bagTotal').innerText = `₱${total.toLocaleString()}`;
        }

        function removeItem(i) { cart.splice(i, 1); localStorage.setItem('elites_bag', JSON.stringify(cart)); updateBagUI(); }
        
        function toggleBag() { 
            document.getElementById('bagSidebar').classList.toggle('active'); 
        }

        function openCheckout() {
            if(cart.length === 0) return;
            const modal = document.getElementById('checkoutModal');
            const total = cart.reduce((s, i) => s + parseFloat(i.price), 0);
            document.getElementById('checkoutContent').innerHTML = `
                <div class="checkout-container">
                    <h1 style="margin-bottom:1rem; letter-spacing:-1px; font-size:2.5rem; font-weight: 600;">Checkout</h1>
                    <p style="margin-bottom:2.5rem; color: var(--muted); font-size: 1.1rem;">Total amount: <span style="color:var(--accent); font-weight: 600;">₱${total.toLocaleString()}</span></p>
                    <form id="orderForm">
                        <span class="opt-label">Contact Information</span>
                        <input type="email" id="oEmail" placeholder="Email Address" required>
                        <span class="opt-label" style="margin-top: 1rem;">Shipping Address</span>
                        <input type="text" id="oName" placeholder="Full Name" required>
                        <input type="text" id="oAddr" placeholder="Complete Address" required>
                        <span class="opt-label" style="margin-top: 1rem;">Payment Method</span>
                        <select id="oPay">
                            <option value="GCash">GCash (Manual Transfer)</option>
                            <option value="Maya">Maya (Manual Transfer)</option>
                            <option value="COD">Cash on Delivery</option>
                        </select>
                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1.5rem;">Complete Secure Purchase</button>
                    </form>
                </div>
            `;
            modal.style.display = 'block';
            toggleBag(); 
            
            document.getElementById('orderForm').onsubmit = async (e) => {
            e.preventDefault();
            const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            const btn = e.target.querySelector('button');
            btn.innerText = "Processing & Sending Email...";
            btn.disabled = true;
    
            const customerEmail = document.getElementById('oEmail').value;
            const customerName = document.getElementById('oName').value;

            const { data, error } = await supabase.from('orders').insert([{
            customer_name: customerName,
            customer_email: customerEmail,
            customer_address: document.getElementById('oAddr').value,
            payment_method: document.getElementById('oPay').value,
            items: cart,
            total_price: total,
            status: 'pending_email_confirmation' 
            }]).select();

        if(!error) {
            const orderId = data[0].id;
            const shortOrderId = orderId.substring(0,8).toUpperCase();

        const templateParams = {
            to_email: customerEmail,
            to_name: customerName,
            order_id: shortOrderId,
            order_total: `₱${total.toLocaleString()}`,
            confirmation_link: `https://formique.vercel.app/confirm.html?order=${orderId}` 
        };

        try {
            // Call your new secure Vercel backend
            const emailResponse = await fetch('/api/send-order-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templateParams)
            });

            if (!emailResponse.ok) throw new Error("Backend failed to send email");

            // Success UI
            document.getElementById('checkoutContent').innerHTML = `
                <div class="checkout-container" style="text-align: center; padding: 4rem 0;">
                    <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; margin-bottom: 1rem;">Action Required</h2>
                    <p style="color: var(--muted); line-height: 1.8; margin-bottom: 2rem;">
                        We have reserved your items and sent a verification email to <strong>${customerEmail}</strong>.<br>
                        Please check your inbox to confirm your transaction and proceed to the verification step.
                    </p>
                    <button class="btn-primary btn-white" style="border: 1px solid var(--border);" onclick="closeAll(); location.reload();">Return to Store</button>
                </div>
            `;
            cart = []; 
            localStorage.removeItem('elites_bag');
            updateBagUI();

        } catch (emailError) {
            console.error("Serverless Email Error:", emailError);
            alert("Order saved, but we couldn't send the confirmation email. Please contact support.");
        }

        } else {
            alert("Order processing failed: " + error.message);
            btn.innerText = "Complete Secure Purchase";
            btn.disabled = false;
        }
            };
        }

        function closeAll() {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
            document.getElementById('bagSidebar').classList.remove('active');
            document.getElementById('wishlistSidebar').classList.remove('active');
            document.body.style.overflow = 'auto';
            document.querySelectorAll('.m-nav-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.m-nav-item')[0].classList.add('active');
        }

        window.onload = () => setTimeout(init, 300);
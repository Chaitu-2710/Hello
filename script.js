/* ============================================
   FBS EBOOKS — Main JavaScript
   ALL Buttons & Interactions are WORKING
   ============================================ */

'use strict';

/* ==================================================
   CART STATE (in-memory, persisted to sessionStorage)
   ================================================== */
const Cart = {
  _items: JSON.parse(sessionStorage.getItem('fbs_cart') || '[]'),

  add(id, title, price) {
    const existing = this._items.find(i => i.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      this._items.push({ id, title, price, qty: 1 });
    }
    this._save();
    this._updateBadge();
  },

  remove(id) {
    this._items = this._items.filter(i => i.id !== id);
    this._save();
    this._updateBadge();
  },

  count() {
    return this._items.reduce((s, i) => s + i.qty, 0);
  },

  total() {
    return this._items.reduce((s, i) => s + i.price * i.qty, 0);
  },

  _save() {
    sessionStorage.setItem('fbs_cart', JSON.stringify(this._items));
  },

  _updateBadge() {
    const count = this.count();

    // Desktop header badge
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }

    // Mobile bottom nav cart dot
    const mobDot = document.getElementById('mob-cart-dot');
    if (mobDot) {
      mobDot.textContent = count;
      mobDot.style.display = count > 0 ? 'flex' : 'none';
    }

    // Update nav cart link text
    const cartLink = document.getElementById('nav-cart');
    if (cartLink) {
      cartLink.innerHTML = count > 0
        ? `🛒 Cart <span style="background:var(--red-main);color:#fff;font-size:0.65rem;padding:1px 6px;border-radius:50px;margin-left:3px;">${count}</span>`
        : '🛒 Cart';
    }
  },
};

/* ==================================================
   WISHLIST STATE
   ================================================== */
const Wishlist = {
  _items: JSON.parse(sessionStorage.getItem('fbs_wishlist') || '[]'),

  toggle(id, title) {
    const idx = this._items.indexOf(id);
    if (idx === -1) {
      this._items.push(id);
      sessionStorage.setItem('fbs_wishlist', JSON.stringify(this._items));
      showToast(`"${title}" added to wishlist ❤️`, 'success');
    } else {
      this._items.splice(idx, 1);
      sessionStorage.setItem('fbs_wishlist', JSON.stringify(this._items));
      showToast(`"${title}" removed from wishlist`, 'info');
    }
    // Update heart icons
    document.querySelectorAll(`.wish-btn[data-id="${id}"]`).forEach(btn => {
      btn.textContent = this._items.includes(id) ? '❤️' : '🤍';
    });
  },

  has(id) {
    return this._items.includes(id);
  },
};

/* ==================================================
   TOAST NOTIFICATION
   ================================================== */
function showToast(message, type = 'info', duration = 3200) {
  // Remove existing toasts of same type to avoid stacking
  document.querySelectorAll(`.toast-${type}`).forEach(t => t.remove());

  const icons = { success: '✅', error: '❌', info: '💙' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '💡'}</span><span>${message}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

/* ==================================================
   PARTICLE SYSTEM
   ================================================== */
function initParticles() {
  const container = document.querySelector('.particles');
  if (!container) return;

  // Blue/Green/White particles to match new color system
  const colors = [
    'rgba(21, 101, 192, 0.65)',
    'rgba(30,136,229, 0.50)',
    'rgba(46,125,50, 0.55)',
    'rgba(67,160,71, 0.40)',
    'rgba(187,222,251, 0.30)',
  ];

  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 7 + 2;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${Math.random() * 14 + 9}s;
      animation-delay: ${Math.random() * 10}s;
      border-radius: ${Math.random() > 0.5 ? '50%' : '3px'};
    `;
    container.appendChild(p);
  }
}

/* ==================================================
   HAMBURGER / SIDEBAR TOGGLE
   ================================================== */
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebar-overlay');

  if (!hamburger || !sidebar) return;

  function openSidebar() {
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    sidebar.classList.add('open');
    if (overlay) { overlay.classList.add('show'); }
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    sidebar.classList.remove('open');
    if (overlay) { overlay.classList.remove('show'); }
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  if (overlay) overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });
}

/* ==================================================
   ACTIVE NAV LINK
   ================================================== */
function setActiveNavLink() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header-nav a, .sidebar-menu a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === page) {
      link.classList.add('active');
    }
  });
}

/* ==================================================
   HEADER SEARCH BAR (WORKING)
   ================================================== */
function initSearch() {
  const searchInput = document.getElementById('header-search-input');
  const searchBtn   = document.getElementById('header-search-btn');

  if (!searchInput) return;

  function doSearch() {
    const q = searchInput.value.trim();
    if (!q) {
      showToast('Please type something to search.', 'error');
      searchInput.focus();
      return;
    }
    filterBooks(q);
    showToast(`Showing results for "${q}" 🔍`, 'info');
  }

  searchBtn?.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });
}

/* Search/Filter books */
function filterBooks(query) {
  const q = query.toLowerCase().trim();
  const cards = document.querySelectorAll('.book-card');
  let found = 0;

  cards.forEach(card => {
    const title  = card.querySelector('.book-title')?.textContent.toLowerCase() || '';
    const author = card.querySelector('.book-author')?.textContent.toLowerCase() || '';
    const cat    = card.dataset.category || '';
    const match  = !q || title.includes(q) || author.includes(q) || cat.includes(q);
    card.style.display = match ? '' : 'none';
    if (match) found++;
  });

  // Update section titles with count
  document.querySelectorAll('.section-title').forEach(t => {
    if (q) {
      t.dataset.original = t.dataset.original || t.textContent;
      t.textContent = found > 0 ? `🔍 "${query}" — ${found} result${found !== 1 ? 's' : ''}` : `🔍 No results for "${query}"`;
    } else {
      if (t.dataset.original) { t.textContent = t.dataset.original; delete t.dataset.original; }
    }
  });
}

/* ==================================================
   CATEGORY SIDEBAR (WORKING FILTER)
   ================================================== */
function initCategoryFilter() {
  const catLinks = document.querySelectorAll('#category-menu a');
  if (!catLinks.length) return;

  catLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      // Update active state
      catLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');

      const catId  = this.id;   // e.g. "cat-fiction"
      const label  = this.textContent.trim();

      // Map IDs to data-category values
      const catMap = {
        'cat-all':        'all',
        'cat-fiction':    'fiction',
        'cat-nonfiction': 'nonfiction',
        'cat-sci':        'science',
        'cat-tech':       'technology',
        'cat-selfhelp':   'selfhelp',
        'cat-history':    'history',
        'cat-business':   'business',
        'cat-kids':       'kids',
      };

      const targetCat = catMap[catId] || 'all';
      filterByCategory(targetCat, label);

      // On mobile close sidebar after selecting
      if (window.innerWidth <= 860) {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('show');
        document.getElementById('hamburger')?.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });
}

function filterByCategory(cat, label) {
  const cards = document.querySelectorAll('.book-card');
  let shown = 0;

  cards.forEach(card => {
    const cardCat = card.dataset.category || '';
    const show    = cat === 'all' || cardCat === cat;
    card.style.display   = show ? '' : 'none';
    card.style.animation = show ? 'fadeInUp 0.4s ease-out' : '';
    if (show) shown++;
  });

  // Update section titles
  document.querySelectorAll('.section-title').forEach(t => {
    t.dataset.original = t.dataset.original || t.textContent;
    if (cat === 'all') {
      if (t.dataset.original) t.textContent = t.dataset.original;
    } else {
      const first = !t.textContent.includes(label);
      if (first) {
        t.dataset.original = t.textContent;
        t.textContent = `${label} — ${shown} Book${shown !== 1 ? 's' : ''}`;
      }
    }
  });

  if (cat !== 'all') {
    showToast(`Showing ${shown} ${label} book${shown !== 1 ? 's' : ''}`, 'info');
  } else {
    // Reset all section titles
    document.querySelectorAll('.section-title').forEach(t => {
      if (t.dataset.original) { t.textContent = t.dataset.original; delete t.dataset.original; }
    });
  }
}

/* ==================================================
   QUICK LINKS (Bestsellers, New Arrivals, Deals, Free, Wishlist)
   ================================================== */
function initQuickLinks() {
  const linkMap = {
    'link-bestsellers': () => { showToast('Showing Bestsellers 🏆', 'info'); filterBooks(''); resetSections(); scrollToMain(); },
    'link-new':         () => { showToast('Showing New Arrivals 🆕', 'info'); scrollToSection('new-arrivals-title'); },
    'link-deals':       () => { showToast('Showing Hot Deals 🔥', 'info');   scrollToSection('featured-title'); },
    'link-free':        () => { showToast('Free books coming soon! 🎁', 'info'); },
    'link-wishlist':    () => { showWishlistModal(); },
  };

  Object.entries(linkMap).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { e.preventDefault(); fn(); });
  });
}

function scrollToMain() {
  document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToSection(titleId) {
  document.getElementById(titleId)?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetSections() {
  document.querySelectorAll('.book-card').forEach(c => c.style.display = '');
  document.querySelectorAll('.section-title').forEach(t => {
    if (t.dataset.original) { t.textContent = t.dataset.original; delete t.dataset.original; }
  });
  document.querySelectorAll('#category-menu a').forEach(l => l.classList.remove('active'));
  document.querySelector('#cat-all')?.classList.add('active');
}

/* ==================================================
   SECTION "View All" LINKS
   ================================================== */
function initViewAllLinks() {
  const viewAllFeatured = document.getElementById('view-all-featured-link');
  const viewAllNew      = document.getElementById('view-all-new-link');

  viewAllFeatured?.addEventListener('click', e => {
    e.preventDefault();
    showToast('Loading all featured books...', 'info');
    scrollToSection('featured-title');
  });

  viewAllNew?.addEventListener('click', e => {
    e.preventDefault();
    showToast('Loading all new arrivals...', 'info');
    scrollToSection('new-arrivals-title');
  });
}

/* ==================================================
   HERO BUTTONS
   ================================================== */
function initHeroButtons() {
  const exploreBtn = document.getElementById('hero-btn-explore');
  const joinBtn    = document.getElementById('hero-btn-join');

  // "Explore Now" → smooth scroll to featured books
  exploreBtn?.addEventListener('click', e => {
    e.preventDefault();
    scrollToSection('featured-title');
  });

  // "Join for Free" → navigate to signup modal / page
  joinBtn?.addEventListener('click', e => {
    e.preventDefault();
    openSignupModal();
  });
}

/* ==================================================
   BOOK CARDS — Add to Cart & Wishlist
   ================================================== */
function initBookCards() {
  document.querySelectorAll('.book-card').forEach(card => {
    const addBtn  = card.querySelector('.book-add-btn');
    const wishBtn = card.querySelector('.wish-btn');

    // Initialise heart
    if (wishBtn) {
      const id = card.id;
      wishBtn.textContent = Wishlist.has(id) ? '❤️' : '🤍';
      wishBtn.addEventListener('click', e => {
        e.stopPropagation();
        const title = card.querySelector('.book-title')?.textContent || 'Book';
        Wishlist.toggle(id, title);
      });
    }

    // Add to cart button
    if (addBtn) {
      addBtn.addEventListener('click', e => {
        e.stopPropagation();
        const id    = card.id;
        const title = card.querySelector('.book-title')?.textContent || 'Book';
        const priceText = card.querySelector('.book-price')?.textContent || '₹0';
        const price = parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;

        Cart.add(id, title, price);
        showToast(`"${title}" added to cart! 🛒`, 'success');

        // Bounce animation
        addBtn.textContent = '✅ Added!';
        addBtn.style.background = 'linear-gradient(135deg,#1B5E20,#2E7D32)';
        setTimeout(() => {
          addBtn.textContent = '+ Add to Cart';
          addBtn.style.background = '';
        }, 1400);
      });
    }

    // Card click → show quick view
    card.addEventListener('click', function () {
      const title  = this.querySelector('.book-title')?.textContent || 'Book';
      const author = this.querySelector('.book-author')?.textContent || '';
      const price  = this.querySelector('.book-price')?.textContent || '';
      openQuickView(this.id, title, author, price, this.querySelector('.book-cover img')?.src || '');
    });
  });

  // Update cart badge on load
  Cart._updateBadge();
}

/* ==================================================
   QUICK VIEW MODAL
   ================================================== */
function openQuickView(id, title, author, price, imgSrc) {
  let modal = document.getElementById('quick-view-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quick-view-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal('quick-view-modal');
    });
  }

  const imgHtml = imgSrc
    ? `<img src="${imgSrc}" alt="${title}" style="width:100%;height:200px;object-fit:cover;border-radius:12px;margin-bottom:16px;">`
    : `<div style="height:160px;background:linear-gradient(135deg,var(--blue-main),var(--blue-light));border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:64px;margin-bottom:16px;">📚</div>`;

  modal.innerHTML = `
    <div class="modal-box">
      ${imgHtml}
      <h2 class="modal-title">${title}</h2>
      <p class="modal-body">by ${author}<br>
        <strong style="color:var(--green-light);font-size:1.2rem;">${price}</strong>
      </p>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModal('quick-view-modal')" type="button">✕ Close</button>
        <button class="btn btn-danger"  onclick="wishlistFromModal('${id}','${title}')" type="button" id="qv-wish-btn">
          ${Wishlist.has(id) ? '❤️ Wishlisted' : '🤍 Wishlist'}
        </button>
        <button class="btn btn-success" onclick="cartFromModal('${id}','${title}','${price}')" type="button">🛒 Add to Cart</button>
      </div>
    </div>
  `;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function cartFromModal(id, title, priceStr) {
  const price = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0;
  Cart.add(id, title, price);
  showToast(`"${title}" added to cart! 🛒`, 'success');
  closeModal('quick-view-modal');
}

function wishlistFromModal(id, title) {
  Wishlist.toggle(id, title);
  const btn = document.getElementById('qv-wish-btn');
  if (btn) btn.textContent = Wishlist.has(id) ? '❤️ Wishlisted' : '🤍 Wishlist';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* ==================================================
   WISHLIST MODAL
   ================================================== */
function showWishlistModal() {
  let modal = document.getElementById('wishlist-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wishlist-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal('wishlist-modal');
    });
  }

  const items = Wishlist._items;
  let listHtml = items.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:16px 0;">Your wishlist is empty.<br>❤️ Heart some books to save them here!</p>'
    : items.map(id => {
        const card  = document.getElementById(id);
        const title = card?.querySelector('.book-title')?.textContent || id;
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--glass-border);">
          <span style="font-size:0.9rem;">${title}</span>
          <button class="btn btn-danger" style="padding:6px 14px;font-size:0.75rem;" onclick="removeFromWishlistModal('${id}','${title}')" type="button">Remove</button>
        </div>`;
      }).join('');

  modal.innerHTML = `
    <div class="modal-box">
      <h2 class="modal-title">❤️ Your Wishlist (${items.length})</h2>
      <div class="modal-body">${listHtml}</div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModal('wishlist-modal')" type="button">Close</button>
      </div>
    </div>
  `;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function removeFromWishlistModal(id, title) {
  Wishlist.toggle(id, title); // toggles it off
  showWishlistModal();         // refresh modal
}

/* ==================================================
   SIGN UP MODAL (since signup.html doesn't exist yet)
   ================================================== */
function openSignupModal() {
  let modal = document.getElementById('signup-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'signup-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal('signup-modal');
    });
  }

  modal.innerHTML = `
    <div class="modal-box">
      <h2 class="modal-title" style="font-family:'Playfair Display',serif;">✨ Join FBS eBooks</h2>
      <p class="modal-body">Create your free account and unlock 12,000+ books at up to 90% off!</p>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
        <input type="text"  id="su-name"  class="form-input" placeholder="Full Name" style="padding:11px 14px;">
        <input type="email" id="su-email" class="form-input" placeholder="Email Address" style="padding:11px 14px;">
        <input type="password" id="su-pass" class="form-input" placeholder="Password (min 6 chars)" style="padding:11px 14px;">
      </div>
      <div class="modal-actions" style="flex-direction:column;gap:10px;">
        <button class="btn btn-success" onclick="handleSignup()" type="button" style="width:100%;justify-content:center;">
          🚀 Create Free Account
        </button>
        <button class="btn btn-outline"  onclick="closeModal('signup-modal')" type="button" style="width:100%;justify-content:center;">
          Cancel
        </button>
      </div>
    </div>
  `;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function handleSignup() {
  const name  = document.getElementById('su-name')?.value.trim();
  const email = document.getElementById('su-email')?.value.trim();
  const pass  = document.getElementById('su-pass')?.value;
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // RED = error/danger feedback
  if (!name)              { showToast('❌ Please enter your name.', 'error'); return; }
  if (!emailRx.test(email||'')) { showToast('❌ Please enter a valid email.', 'error'); return; }
  if ((pass||'').length < 6) { showToast('❌ Password must be at least 6 characters.', 'error'); return; }

  // GREEN = success
  closeModal('signup-modal');
  showToast(`🎉 Welcome to FBS, ${name}! Account created!`, 'success', 4000);
}

/* ==================================================
   CART MODAL (nav Cart button)
   ================================================== */
function openCartModal() {
  let modal = document.getElementById('cart-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cart-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal('cart-modal');
    });
  }

  const items = Cart._items;
  let listHtml = items.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:20px 0;">🛒 Your cart is empty.<br>Add some books to get started!</p>'
    : items.map(item => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--glass-border);">
          <div>
            <div style="font-size:0.88rem;font-weight:600;">${item.title}</div>
            <div style="font-size:0.75rem;color:var(--green-light);">₹${item.price} × ${item.qty}</div>
          </div>
          <button class="btn btn-danger" style="padding:5px 12px;font-size:0.72rem;" onclick="removeCartItem('${item.id}')" type="button">✕</button>
        </div>
      `).join('');

  const total = Cart.total();
  modal.innerHTML = `
    <div class="modal-box">
      <h2 class="modal-title">🛒 Your Cart (${Cart.count()} item${Cart.count()!==1?'s':''})</h2>
      <div class="modal-body" style="max-height:260px;overflow-y:auto;">${listHtml}</div>
      ${items.length > 0 ? `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;font-weight:700;font-size:1rem;border-top:1px solid var(--glass-border);">
          <span>Total:</span>
          <span style="color:var(--green-light);">₹${total}</span>
        </div>
      ` : ''}
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModal('cart-modal')" type="button">Continue Shopping</button>
        ${items.length > 0 ? `<button class="btn btn-success" onclick="handleCheckout()" type="button">Checkout →</button>` : ''}
      </div>
    </div>
  `;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function removeCartItem(id) {
  Cart.remove(id);
  openCartModal(); // refresh
}

function handleCheckout() {
  closeModal('cart-modal');
  showToast('🎉 Order placed! Thank you for shopping with FBS!', 'success', 4000);
  Cart._items = [];
  Cart._save();
  Cart._updateBadge();
}

/* ==================================================
   OFFER ITEMS (click to see deal)
   ================================================== */
function initOfferItems() {
  const messages = {
    'offer-1': ['Flash Sale active! Use code FLASH90 at checkout 💰', 'success'],
    'offer-2': ['Student Offer: Verify your .edu email to unlock 20% extra off 🎓', 'info'],
    'offer-3': ['Bundle Deal: Add 3 books to cart and the 4th is FREE! 📦', 'success'],
  };

  Object.entries(messages).forEach(([id, [msg, type]]) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => showToast(msg, type, 4000));
    }
  });
}

/* ==================================================
   NEWSLETTER (RIGHT SIDEBAR)
   ================================================== */
function newsletterSubmit() {
  const input = document.getElementById('newsletter-email');
  const email = input?.value.trim() || '';
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRx.test(email)) {
    showToast('❌ Please enter a valid email address.', 'error');
    return;
  }
  // GREEN = success/positive
  showToast('🎉 Subscribed! Welcome to the FBS family!', 'success', 4000);
  if (input) input.value = '';
}

/* ==================================================
   SCROLL REVEAL
   ================================================== */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    }),
    { threshold: 0.06 }
  );

  document.querySelectorAll('.book-card, .sidebar-card, .offer-item').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.04}s, transform 0.5s ease ${i * 0.04}s`;
    observer.observe(el);
  });
}

/* ==================================================
   LOGIN FORM
   ================================================== */
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const emailInput    = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const toggleBtn     = document.getElementById('toggle-password');
  const submitBtn     = document.getElementById('login-submit');

  // Password toggle
  toggleBtn?.addEventListener('click', () => {
    const hidden = passwordInput.type === 'password';
    passwordInput.type = hidden ? 'text' : 'password';
    toggleBtn.textContent = hidden ? '🙈' : '👁️';
  });

  // Live validation
  emailInput?.addEventListener('blur',  () => validateEmail(emailInput));
  emailInput?.addEventListener('input', () => clearFieldState(emailInput));
  passwordInput?.addEventListener('blur',  () => validatePassword(passwordInput));
  passwordInput?.addEventListener('input', () => clearFieldState(passwordInput));

  // Submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const emailOk = validateEmail(emailInput);
    const passOk  = validatePassword(passwordInput);
    if (!emailOk || !passOk) {
      // RED toast = error
      showToast('❌ Please fix the errors above.', 'error');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1600));
    setLoading(false);

    // GREEN toast = success
    showToast('🎉 Welcome back to FBS eBooks!', 'success', 4000);
    setTimeout(() => { window.location.href = 'index.html'; }, 1800);
  });

  function validateEmail(input) {
    const val = input.value.trim();
    const err = getError(input);
    if (!val)                                 { setError(input, err, 'Email is required.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setError(input, err, 'Enter a valid email address.'); return false; }
    setSuccess(input, err);
    return true;
  }

  function validatePassword(input) {
    const val = input.value;
    const err = getError(input);
    if (!val)          { setError(input, err, 'Password is required.'); return false; }
    if (val.length < 6){ setError(input, err, 'Password must be at least 6 characters.'); return false; }
    setSuccess(input, err);
    return true;
  }

  function getError(input) { return input.closest('.form-group')?.querySelector('.field-error'); }
  function setError(input, err, msg) {
    input.classList.add('error'); input.classList.remove('success');
    if (err) { err.textContent = msg; err.classList.add('show'); }
  }
  function setSuccess(input, err) {
    input.classList.remove('error'); input.classList.add('success');
    if (err) err.classList.remove('show');
  }
  function clearFieldState(input) {
    input.classList.remove('error');
    const err = getError(input);
    if (err) err.classList.remove('show');
  }
  function setLoading(on) {
    if (!submitBtn) return;
    const spinner = submitBtn.querySelector('.spinner');
    const text    = submitBtn.querySelector('.btn-text');
    submitBtn.disabled = on;
    if (spinner) spinner.style.display = on ? 'block' : 'none';
    if (text)    text.style.display    = on ? 'none'  : 'block';
  }
}

/* ==================================================
   SOCIAL & FORGOT PASSWORD (login page)
   ================================================== */
function initSocialLogin() {
  document.querySelectorAll('.btn-social').forEach(btn => {
    btn.addEventListener('click', function () {
      const provider = this.dataset.provider || 'Social';
      showToast(`${provider} login coming soon! 🔜`, 'info');
    });
  });
}

function initForgotPassword() {
  document.querySelector('.forgot-link')?.addEventListener('click', e => {
    e.preventDefault();
    showToast('📧 Password reset email sent! Check your inbox.', 'info');
  });
}

/* ==================================================
   WIRE NAV BUTTONS (Cart & Signup in header)
   ================================================== */
function initNavButtons() {
  const cartLink   = document.getElementById('nav-cart');
  const signupLink = document.getElementById('nav-signup');

  cartLink?.addEventListener('click', e => {
    e.preventDefault();
    openCartModal();
  });

  signupLink?.addEventListener('click', e => {
    e.preventDefault();
    openSignupModal();
  });
}

/* ==================================================
   MOBILE BOTTOM NAV — Categories button
   ================================================== */
function initMobileBottomNav() {
  const catBtn = document.getElementById('mob-categories-btn');
  if (catBtn) {
    catBtn.addEventListener('click', () => {
      // Open the sidebar from the hamburger button
      const sidebar   = document.getElementById('sidebar');
      const hamburger = document.getElementById('hamburger');
      const overlay   = document.getElementById('sidebar-overlay');
      if (sidebar && !sidebar.classList.contains('open')) {
        sidebar.classList.add('open');
        hamburger?.classList.add('open');
        hamburger?.setAttribute('aria-expanded', 'true');
        overlay?.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    });
  }
}

/* ==================================================
   GLOBAL INIT
   ================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initHamburger();
  setActiveNavLink();
  initSearch();
  initCategoryFilter();
  initQuickLinks();
  initViewAllLinks();
  initHeroButtons();
  initBookCards();
  initOfferItems();
  initScrollReveal();
  initLoginForm();
  initSocialLogin();
  initForgotPassword();
  initNavButtons();
  initMobileBottomNav();

  document.body.classList.add('page-fade-in');
});


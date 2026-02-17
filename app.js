// ========== Image Data ==========
// Maps category keys to their image folder and display name
const categories = {
  engagements: { folder: 'images/engagements', title: 'Engagements', images: [] },
  bridals:     { folder: 'images/bridals',     title: 'Bridals',     images: [] },
  temple:      { folder: 'images/temple',      title: 'Temple Photos', images: [] },
  ceremony:    { folder: 'images/ceremony',     title: 'Wedding Ceremony', images: [] },
  reception:   { folder: 'images/reception',    title: 'Reception',   images: [] },
  family:      { folder: 'images/family',       title: 'Family Photos', images: [] },
  creative:    { folder: 'images/creative',     title: 'Creative Photoshoots', images: [] },
};

// This will be populated by the build script (images.js)
// Each category gets an array of filenames

// ========== Nav scroll effect ==========
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 80);
});

// ========== Gallery ==========
let currentImages = [];
let currentIndex = 0;

function openGallery(category) {
  const cat = categories[category];
  if (!cat || cat.images.length === 0) return;

  const modal = document.getElementById('gallery-modal');
  const title = document.getElementById('modal-title');
  const gallery = document.getElementById('modal-gallery');

  title.textContent = cat.title;
  gallery.innerHTML = '';

  currentImages = cat.images.map(img => `${cat.folder}/${img}`);

  currentImages.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = cat.title;
    img.loading = 'lazy';
    img.onclick = () => openLightbox(i);
    gallery.appendChild(img);
  });

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeGallery() {
  document.getElementById('gallery-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function openLightbox(index) {
  currentIndex = index;
  const lb = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = currentImages[currentIndex];
  lb.classList.remove('hidden');
}

function closeLightbox(e) {
  if (e) e.stopPropagation();
  document.getElementById('lightbox').classList.add('hidden');
}

function prevImage(e) {
  e.stopPropagation();
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  document.getElementById('lightbox-img').src = currentImages[currentIndex];
}

function nextImage(e) {
  e.stopPropagation();
  currentIndex = (currentIndex + 1) % currentImages.length;
  document.getElementById('lightbox-img').src = currentImages[currentIndex];
}

// Keyboard nav for lightbox
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  const modal = document.getElementById('gallery-modal');

  if (!lb.classList.contains('hidden')) {
    if (e.key === 'Escape') closeLightbox(e);
    if (e.key === 'ArrowLeft') prevImage(e);
    if (e.key === 'ArrowRight') nextImage(e);
  } else if (!modal.classList.contains('hidden')) {
    if (e.key === 'Escape') closeGallery();
  }
});

// Wire up category cards
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', () => {
    const cat = card.dataset.category;
    openGallery(cat);
  });
});

// ========== Pricing Logic ==========
let discountActive = false;
let receptionType = 'indoor';

function applyDiscount() {
  const input = document.getElementById('discount-input');
  const msg = document.getElementById('discount-msg');
  const code = input.value.trim().toUpperCase();

  if (code === 'HOMIES') {
    discountActive = true;
    msg.textContent = 'Code applied! You get the homie rate.';
    msg.className = 'discount-msg success';
    updateAllPrices();
  } else {
    discountActive = false;
    msg.textContent = 'Invalid code. Try again.';
    msg.className = 'discount-msg error';
    updateAllPrices();
  }
}

function setReceptionType(type) {
  receptionType = type;
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  updateReceptionPrice();
}

function getReceptionBasePrice() {
  if (discountActive) {
    return receptionType === 'indoor' ? 1400 : 1050;
  }
  return receptionType === 'indoor' ? 2000 : 1500;
}

function getPhotoAdjustment() {
  const count = parseInt(document.getElementById('photo-slider').value);
  const base = 700;
  const diff = count - base;

  if (diff === 0) return 0;
  if (diff > 0) {
    // $2 per extra photo above 700
    return Math.round(diff * 2);
  } else {
    // Bigger savings per photo when discounted
    const perPhoto = discountActive ? 2 : 1.5;
    return Math.round(diff * perPhoto);
  }
}

function updatePhotoCount() {
  const slider = document.getElementById('photo-slider');
  const count = parseInt(slider.value);
  document.getElementById('photo-count').textContent = count;

  const adj = getPhotoAdjustment();
  const el = document.getElementById('slider-adjust');

  if (adj > 0) {
    el.textContent = `+$${adj} for extra photos`;
    el.style.color = '#d9534f';
  } else if (adj < 0) {
    el.textContent = `-$${Math.abs(adj)} savings for fewer photos`;
    el.style.color = '#5cb85c';
  } else {
    el.textContent = 'Base rate (700 photos)';
    el.style.color = 'var(--text-muted)';
  }

  updateReceptionPrice();
}

function updateReceptionPrice() {
  const base = getReceptionBasePrice();
  const adj = getPhotoAdjustment();
  let total = base + adj;
  if (total < 300) total = 300; // minimum

  const priceEl = document.querySelector('.reception-price');

  if (discountActive) {
    // Show discounted price (not "included" — reception is still separate)
    const fullBase = receptionType === 'indoor' ? 2000 : 1500;
    const fullTotal = fullBase + adj;
    priceEl.innerHTML = `<span class="original">$${fullTotal.toLocaleString()}</span> $${total.toLocaleString()}`;
    priceEl.classList.add('discounted');
  } else {
    priceEl.textContent = `$${total.toLocaleString()}`;
    priceEl.classList.remove('discounted');
  }
}

function updateAllPrices() {
  // Update individual card prices
  document.querySelectorAll('.price-card:not(.reception-card)').forEach(card => {
    const el = card.querySelector('.price');
    const base = parseInt(el.dataset.base);
    const isBridals = card.querySelector('h3') && card.querySelector('h3').textContent === 'Bridals';

    if (discountActive) {
      if (isBridals) {
        // Bridals included with HOMIES code
        el.innerHTML = `<span class="original">$${base}</span> Included`;
        el.classList.add('discounted');
      } else {
        const discounted = Math.round(base * 0.5);
        el.innerHTML = `<span class="original">$${base}</span> $${discounted}`;
        el.classList.add('discounted');
      }
    } else {
      el.textContent = `$${base}`;
      el.classList.remove('discounted');
    }
  });

  // Update reception
  updateReceptionPrice();

  // Update package price
  const packageEl = document.getElementById('package-price');
  if (discountActive) {
    packageEl.innerHTML = '<span class="original">$4,000</span> $2,000';
    packageEl.classList.add('discounted');
  } else {
    packageEl.textContent = '$4,000';
    packageEl.classList.remove('discounted');
  }

  // Update discount badge in total
  const badge = document.getElementById('discount-applied');
  badge.classList.toggle('hidden', !discountActive);
}

// ========== Set Preview Images ==========
function setPreviewImages() {
  Object.keys(categories).forEach(key => {
    const cat = categories[key];
    if (cat.images.length > 0) {
      const preview = document.getElementById(`preview-${key}`);
      if (preview) {
        preview.style.backgroundImage = `url('${cat.folder}/${cat.images[0]}')`;
      }
    }
  });
}

// ========== Hero Slideshow ==========
const heroImages = [
  'images/hero-08.jpg', // bridalsfin-68 (your favorite - starts first)
  'images/hero-01.jpg', // amyandcarson-96
  'images/hero-02.jpg', // kaylee-196
  'images/hero-03.jpg', // kaylee-300
  'images/hero-04.jpg', // cossetteandbrigham-111
  'images/hero-05.jpg', // davideden-2
  'images/hero-06.jpg', // firstlook-67
  'images/hero-07.jpg', // bridalsfin-40
  'images/hero-09.jpg', // bridalsfin-115
  'images/hero-10.jpg', // bridalsfin-165
  'images/hero-11.jpg', // catieandramon-091
  'images/hero-12.jpg', // bridalsfin-63
  'images/hero-13.jpg', // annelizandben-61
  'images/hero-14.jpg', // olivia ty-76
  'images/hero-15.jpg', // olivia ty-41
  'images/hero-16.jpg', // jenandriley-146
  'images/hero-17.jpg', // hayleeandlincoln-138
  'images/hero-18.jpg', // hayleeandlincoln-8
  'images/hero-19.jpg', // ashtonandsummer-26
  'images/hero-20.jpg', // addaboymason-161
  'images/hero-21.jpg', // ashton and summer-27
  'images/hero-22.jpg', // _DSC9076-Edit-21
  'images/hero-23.jpg', // engaged-140
  'images/hero-24.jpg', // amyandcarson-129
  'images/hero-25.jpg', // engagementsdone-44
  'images/hero-26.jpg', // ld-export
  'images/hero-27.jpg', // DSC01813-Edit-2
  'images/hero-28.jpg', // carlsfam-102
  'images/hero-29.jpg', // lotts-40
  'images/hero-30.jpg', // carsonandamy-281
  'images/hero-31.jpg', // carsonandamy-287
];

let currentSlide = 0;

function initHeroSlideshow() {
  const container = document.getElementById('hero-slideshow');

  heroImages.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
    slide.style.backgroundImage = `url('${src}')`;
    container.appendChild(slide);
  });

  // Rotate every 5 seconds
  setInterval(() => {
    const slides = container.querySelectorAll('.hero-slide');
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, 5000);
}

// ========== Init ==========
function init() {
  // Load image manifest if it exists
  const script = document.createElement('script');
  script.src = 'images.js';
  script.onload = () => {
    // images.js will call registerImages()
    setPreviewImages();
  };
  script.onerror = () => {
    console.log('No images.js found - run the build script to generate it.');
  };
  document.head.appendChild(script);

  // Init slider
  updatePhotoCount();

  // Init hero slideshow
  initHeroSlideshow();
}

// Called from images.js
function registerImages(data) {
  Object.keys(data).forEach(key => {
    if (categories[key]) {
      categories[key].images = data[key];
    }
  });
}

init();

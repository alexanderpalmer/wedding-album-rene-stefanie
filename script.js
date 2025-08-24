// Wedding Album - build gallery, filtering, and lightbox
(async function () {
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // Load manifest
  let manifest = [];
  try {
    const res = await fetch('assets/manifest.json');
    manifest = await res.json();
  } catch (e) {
    console.error('Manifest konnte nicht geladen werden', e);
  }

  // Build cards
  const gallery = $('#gallery');
  const fragment = document.createDocumentFragment();

  manifest.forEach((item, idx) => {
    const fig = document.createElement('figure');
    fig.className = 'card';
    fig.dataset.tags = (item.tags || []).join(' ');
    fig.dataset.index = idx;

    const link = document.createElement('a');
    link.href = item.full_jpg;
    link.setAttribute('data-index', idx);

    // <picture> for webp + jpg
    const picture = document.createElement('picture');

    const srcWebp = document.createElement('source');
    srcWebp.type = 'image/webp';
    srcWebp.sizes = '(min-width: 1200px) 25vw, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw';
    srcWebp.srcset = item.srcset_webp.join(', ');

    const srcJpg = document.createElement('source');
    srcJpg.type = 'image/jpeg';
    srcJpg.sizes = srcWebp.sizes;
    srcJpg.srcset = item.srcset_jpg.join(', ');

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = item.alt || '';
    img.src = item.thumb_jpg;
    img.width = item.width;
    img.height = item.height;
    img.style.backgroundImage = `url(${item.placeholder})`;
    img.style.backgroundSize = 'cover';
    img.style.filter = 'blur(0px)'; // kept for future progressive blur upgrades

    picture.append(srcWebp, srcJpg, img);
    link.appendChild(picture);

    const cap = document.createElement('figcaption');
    cap.className = 'caption';
    cap.textContent = item.title || '';

    fig.append(link, cap);
    fragment.appendChild(fig);
  });

  gallery.appendChild(fragment);

  // Generate dynamic filters from manifest tags
  const filtersContainer = $('.filters');
  const allTags = new Set();
  manifest.forEach(item => {
    if (item.tags && item.tags.length > 0) {
      item.tags.forEach(tag => allTags.add(tag));
    }
  });

  // Create filter buttons
  const filterFragment = document.createDocumentFragment();
  
  // "Alle" button
  const allBtn = document.createElement('button');
  allBtn.className = 'filter is-active';
  allBtn.dataset.filter = '*';
  allBtn.textContent = 'Alle';
  filterFragment.appendChild(allBtn);

  // Create buttons in specific order
  const tagMapping = {
    '1-vorbereitungen': 'Vorbereitungen',
    '2-eintreffen-der-gaste': 'Eintreffen der Gäste', 
    '3-trauuung': 'Trauung',
    '4-apero': 'Apéro',
    '5-fotos-mit-den-hochzeitsgasten': 'Fotos mit den Hochzeitsgästen',
    '6-fest-am-abend': 'Fest am Abend',
    '7-fotobox': 'Fotobox'
  };

  // Define the desired order
  const tagOrder = [
    '1-vorbereitungen',
    '2-eintreffen-der-gaste', 
    '3-trauuung',
    '4-apero',
    '5-fotos-mit-den-hochzeitsgasten',
    '6-fest-am-abend',
    '7-fotobox'
  ];

  tagOrder.forEach(tag => {
    if (allTags.has(tag)) {
      const btn = document.createElement('button');
      btn.className = 'filter';
      btn.dataset.filter = tag;
      btn.textContent = tagMapping[tag] || tag;
      filterFragment.appendChild(btn);
    }
  });

  filtersContainer.appendChild(filterFragment);

  // Store original card order for restoration
  const originalCards = [...$$('.card', gallery)];
  
  // Filtering
  const filters = $$('.filter');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const token = btn.dataset.filter;
    
    // Clear gallery first
    gallery.innerHTML = '';
    
    if (token === '*') {
      // Show all cards in original order
      originalCards.forEach(card => {
        card.style.display = 'block';
        gallery.appendChild(card);
      });
    } else {
      // Filter manifest items by tag and sort by image number
      const filteredManifest = manifest
        .filter(item => (item.tags || []).includes(token))
        .sort((a, b) => {
          const numA = parseInt(a.slug.match(/-(\d+)$/)?.[1] || '0', 10);
          const numB = parseInt(b.slug.match(/-(\d+)$/)?.[1] || '0', 10);
          return numA - numB;
        });
      
      // Find corresponding cards and add them in sorted order
      filteredManifest.forEach(item => {
        const cardIndex = manifest.findIndex(m => m.slug === item.slug);
        const card = originalCards[cardIndex];
        if (card) {
          card.style.display = 'block';
          gallery.appendChild(card);
        }
      });
    }
  }));

  // Lightbox
  const lb = $('#lightbox');
  const lbPic = $('.lb-picture', lb);
  const lbCaption = $('.lb-caption', lb);
  const closeInlineBtn = $('.lb-close-inline', lb);
  const prevBtn = $('.lb-prev', lb);
  const nextBtn = $('.lb-next', lb);
  const downloadBtn = $('.lb-download', lb);

  let current = 0;
  const open = (index) => {
    current = index;
    const item = manifest[current];
    // Clear only the image content, keep download button
    const existingPicture = lbPic.querySelector('picture:not(.lb-download)');
    if (existingPicture) existingPicture.remove();
    
    const picture = document.createElement('picture');
    const srcWebp = document.createElement('source');
    srcWebp.type = 'image/webp';
    srcWebp.srcset = item.srcset_webp.join(', ');
    srcWebp.sizes = '90vw';
    const srcJpg = document.createElement('source');
    srcJpg.type = 'image/jpeg';
    srcJpg.srcset = item.srcset_jpg.join(', ');
    srcJpg.sizes = '90vw';
    const img = document.createElement('img');
    img.src = item.full_jpg;
    img.alt = item.alt || '';
    img.decoding = 'async';
    picture.append(srcWebp, srcJpg, img);
    lbPic.insertBefore(picture, lbPic.firstChild);
    lbCaption.textContent = item.title || '';
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Preload neighbors
    [current-1, current+1].forEach(i => {
      if (i >=0 && i < manifest.length) {
        const preload = new Image();
        preload.src = manifest[i].full_jpg;
      }
    });
  };

  const close = () => {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  const next = () => open((current + 1) % manifest.length);
  const prev = () => open((current - 1 + manifest.length) % manifest.length);

  closeInlineBtn.addEventListener('click', close);
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  downloadBtn.addEventListener('click', () => {
    const item = manifest[current];
    const link = document.createElement('a');
    link.href = item.full_jpg;
    link.download = `${item.title}.jpg`;
    link.click();
  });
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // Open on click
  gallery.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    const idx = parseInt(a.getAttribute('data-index'), 10);
    open(idx);
  });

  // Basic swipe support
  let startX = 0;
  lb.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true});
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
  });
})();

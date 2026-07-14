(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Page loader
  const loader = $('#pageLoader');
  const hideLoader = () => loader?.classList.add('is-hidden');
  window.addEventListener('load', () => window.setTimeout(hideLoader, 350), { once: true });
  window.setTimeout(hideLoader, 3500);

  // Opening envelope experience. It is shown once per browser session.
  const openingIntro = $('#openingIntro');
  const openingButton = $('#openingButton');
  const openingSkip = $('#openingSkip');
  const introStorageKey = 'john-hazil-story-opened';

  function readSessionFlag() {
    try {
      return sessionStorage.getItem(introStorageKey) === 'yes';
    } catch {
      return false;
    }
  }

  function saveSessionFlag() {
    try {
      sessionStorage.setItem(introStorageKey, 'yes');
    } catch {
      // The site still works when storage is unavailable.
    }
  }

  function finishOpening({ animate = true } = {}) {
    if (!openingIntro || openingIntro.classList.contains('is-hidden')) return;
    saveSessionFlag();

    if (animate && !prefersReducedMotion) {
      openingIntro.classList.add('opening');
      window.setTimeout(() => {
        openingIntro.classList.add('is-hidden');
        document.body.classList.remove('intro-open');
        $('.nav-brand')?.focus({ preventScroll: true });
      }, 1050);
    } else {
      openingIntro.classList.add('is-hidden');
      document.body.classList.remove('intro-open');
    }
  }

  if (openingIntro) {
    if (readSessionFlag()) {
      openingIntro.classList.add('is-hidden');
    } else {
      document.body.classList.add('intro-open');
    }
    openingButton?.addEventListener('click', () => finishOpening({ animate: true }));
    openingSkip?.addEventListener('click', () => finishOpening({ animate: false }));
  }

  // Header, progress, active navigation, and back-to-top button.
  const header = $('#siteHeader');
  const progress = $('#scrollProgress');
  const navToggle = $('#navToggle');
  const navMenu = $('#navMenu');
  const backToTop = $('#backToTop');
  let scrollFrame = 0;

  function updateScrollUI() {
    scrollFrame = 0;
    const top = window.scrollY || document.documentElement.scrollTop;
    header?.classList.toggle('scrolled', top > 35);
    backToTop?.classList.toggle('visible', top > 700);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? (top / max) * 100 : 0}%`;
  }

  function requestScrollUI() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(updateScrollUI);
  }

  updateScrollUI();
  window.addEventListener('scroll', requestScrollUI, { passive: true });
  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));

  function closeNav({ restoreFocus = false } = {}) {
    navMenu?.classList.remove('open');
    navToggle?.classList.remove('active');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('nav-open');
    if (restoreFocus) navToggle?.focus();
  }

  navToggle?.addEventListener('click', () => {
    const isOpen = navMenu?.classList.toggle('open') ?? false;
    navToggle.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('nav-open', isOpen);
    if (isOpen) $('#navMenu a')?.focus();
  });

  $$('#navMenu a').forEach(link => link.addEventListener('click', () => closeNav()));
  document.addEventListener('click', event => {
    if (!navMenu?.classList.contains('open')) return;
    if (navMenu.contains(event.target) || navToggle?.contains(event.target)) return;
    closeNav();
  });

  const navLinks = $$('#navMenu a[href^="#"]');
  const observedSections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && observedSections.length) {
    const activeObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach(link => {
        const active = link.getAttribute('href') === `#${visible.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-25% 0px -58% 0px', threshold: [0, .15, .35, .65] });
    observedSections.forEach(section => activeObserver.observe(section));
  }

  // Reveal animation
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -35px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('visible'));
  }

  // Live relationship counters using the visitor's local calendar date.
  const MS_PER_DAY = 86400000;
  const relationshipStart = new Date(2023, 1, 25);
  const proposalDate = new Date(2024, 8, 15);
  const weddingDate = new Date(2026, 5, 26);

  function wholeDaysSince(date) {
    const today = new Date();
    const startUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.max(0, Math.floor((todayUtc - startUtc) / MS_PER_DAY));
  }

  function calendarDuration(startDate, endDate = new Date()) {
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    if (end < start) return { years: 0, months: 0, days: 0 };

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years, months, days };
  }

  function animateNumber(element, value) {
    if (!element) return;
    if (prefersReducedMotion || value < 30) {
      element.textContent = value.toLocaleString();
      return;
    }
    const start = performance.now();
    const duration = 950;
    const step = now => {
      const progressValue = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progressValue, 3);
      element.textContent = Math.round(value * eased).toLocaleString();
      if (progressValue < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const togetherTotal = wholeDaysSince(relationshipStart);
  const proposalTotal = wholeDaysSince(proposalDate);
  const marriedTotal = wholeDaysSince(weddingDate);
  const duration = calendarDuration(relationshipStart);
  animateNumber($('#togetherDays'), togetherTotal);
  animateNumber($('#proposalDays'), proposalTotal);
  animateNumber($('#marriedDays'), marriedTotal);
  const durationElement = $('#togetherDuration');
  if (durationElement) durationElement.textContent = `${duration.years}y · ${duration.months}m · ${duration.days}d`;

  // Toast helper
  const toast = $('#toast');
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // Share website
  $('#shareButton')?.addEventListener('click', async () => {
    const shareData = {
      title: 'John Phillip & Hazil | Our Wedding Story',
      text: 'From February 25, 2023, through our proposal on September 15, 2024, to our wedding day on June 26, 2026.',
      url: location.href.split('#')[0]
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        showToast('Website link copied');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('Unable to share right now');
    }
  });

  // Video helpers
  const saveDateVideo = $('#saveDateVideo');
  if ('IntersectionObserver' in window && saveDateVideo) {
    const filmObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting && !saveDateVideo.paused) saveDateVideo.pause();
      });
    }, { threshold: .08 });
    filmObserver.observe(saveDateVideo);
  }

  const earlyStoryReels = [
    { title: 'A night to remember', text: 'One of the early little memories we chose to keep.' },
    { title: 'A candid moment', text: 'A brief piece of life, saved because it was ours.' },
    { title: 'Dancing into our story', text: 'A playful moment from the chapter that led us to forever.' },
    { title: 'Just us being us', text: 'The laughter and silliness that made ordinary days special.' },
    { title: 'A sunny afternoon', text: 'A tiny glimpse of one of our days together.' },
    { title: 'Our quiet kind of joy', text: 'Simple moments became some of our favorite memories.' },
    { title: 'Picnic memories', text: 'A day outdoors, a little sunshine, and time together.' },
    { title: 'Slow days together', text: 'Love also lives in the calm, unhurried moments.' },
    { title: 'A day worth replaying', text: 'A longer candid memory from our journey together.' },
    { title: 'A blink of happiness', text: 'Some memories are only a second long and still worth keeping.' },
    { title: 'Laughter at home', text: 'The fun, imperfect, real moments that made us who we are.' }
  ].map((item, index) => ({
    ...item,
    chapter: 'Our journey',
    video: `assets/videos/story/story-${String(index + 1).padStart(2, '0')}.mp4`,
    poster: `assets/images/posters/story-${String(index + 1).padStart(2, '0')}.jpg`
  }));

  const proposalTitles = [
    'The proposal afternoon begins',
    'Our first photo after yes',
    'Side by side, newly engaged',
    'A smile we will always remember',
    'Flowers between us',
    'A quiet portrait together',
    'The happiness after yes',
    'Our first engaged selfie',
    'Holding our promise close',
    'A sunlit moment together',
    'Flowers, smiles, and our little companion',
    'The joy in the details',
    'A bouquet for forever',
    'The promise in her hands',
    'Love in full bloom',
    'The afternoon she said yes'
  ];

  const proposalReels = proposalTitles.map((title, index) => ({
    title,
    text: 'A moving glimpse from September 15, 2024—the afternoon Hazil said yes to forever.',
    chapter: 'Our proposal',
    video: `assets/videos/proposal/proposal-${String(index + 1).padStart(2, '0')}.mp4`,
    poster: `assets/images/posters/proposal/proposal-${String(index + 1).padStart(2, '0')}.jpg`
  }));

  const laterStoryReels = [
    {
      title: 'An evening together',
      text: 'A later chapter from August 26, 2025—another ordinary memory made special because we shared it.',
      chapter: 'After the proposal',
      video: 'assets/videos/story/story-12.mp4',
      poster: 'assets/images/posters/story-12.jpg'
    },
    {
      title: 'Another chapter together',
      text: 'A memory from January 24, 2026, as our wedding day moved closer.',
      chapter: 'Wedding season',
      video: 'assets/videos/story/story-13.mp4',
      poster: 'assets/images/posters/story-13.jpg'
    }
  ];

  const storyReels = [...earlyStoryReels, ...proposalReels, ...laterStoryReels]
    .map((item, index) => ({ ...item, number: index + 1 }));
  const mainReelIndexes = [
    ...earlyStoryReels.map((_, index) => index),
    storyReels.length - 2,
    storyReels.length - 1
  ];
  const proposalReelIndexes = proposalReels.map((_, index) => earlyStoryReels.length + index);

  function revealDynamicCards(container) {
    const cards = $$('.reel-card', container);
    if ('IntersectionObserver' in window && !prefersReducedMotion) {
      const observer = new IntersectionObserver((entries, cardObserver) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          cardObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08 });
      cards.forEach(card => observer.observe(card));
    } else {
      cards.forEach(card => card.classList.add('visible'));
    }
  }

  function renderReelCards(container, reelIndexes) {
    if (!container) return;
    const fragment = document.createDocumentFragment();
    reelIndexes.forEach(reelIndex => {
      const reel = storyReels[reelIndex];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'reel-card reveal';
      card.setAttribute('aria-label', `Play ${reel.title}`);
      card.innerHTML = `
        <img src="${reel.poster}" alt="" loading="lazy" decoding="async">
        <span class="reel-play" aria-hidden="true">▶</span>
        <span class="reel-info">
          <small>${reel.chapter} · ${String(reel.number).padStart(2, '0')}</small>
          <strong>${reel.title}</strong>
        </span>`;
      card.addEventListener('click', () => openVideoModal(reelIndex));
      fragment.appendChild(card);
    });
    container.appendChild(fragment);
    revealDynamicCards(container);
  }

  renderReelCards($('#reelsGrid'), mainReelIndexes);
  renderReelCards($('#proposalReelsGrid'), proposalReelIndexes);

  const videoModal = $('#videoModal');
  const storyVideo = $('#storyVideo');
  const videoTitle = $('#videoModalTitle');
  const videoText = $('#videoModalText');
  const videoNumber = $('#videoModalNumber');
  let currentReelIndex = 0;
  let videoLastFocused = null;
  let lockedScrollY = 0;

  function lockModalPage() {
    lockedScrollY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.width = '100%';
  }

  function unlockModalPage() {
    document.body.classList.remove('modal-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, lockedScrollY);
  }

  function loadStoryReel(index, { autoplay = true } = {}) {
    const total = storyReels.length;
    currentReelIndex = (index + total) % total;
    const reel = storyReels[currentReelIndex];
    if (!reel || !storyVideo) return;
    storyVideo.pause();
    storyVideo.poster = reel.poster;
    storyVideo.src = reel.video;
    if (videoTitle) videoTitle.textContent = reel.title;
    if (videoText) videoText.textContent = reel.text;
    if (videoNumber) videoNumber.textContent = `${reel.chapter} · memory ${String(reel.number).padStart(2, '0')} of ${total}`;
    storyVideo.load();
    if (autoplay) window.setTimeout(() => storyVideo.play().catch(() => {}), 120);
  }

  function openVideoModal(index) {
    if (!videoModal || !storyVideo) return;
    videoLastFocused = document.activeElement;
    saveDateVideo?.pause();
    loadStoryReel(index);
    videoModal.classList.add('open');
    videoModal.setAttribute('aria-hidden', 'false');
    lockModalPage();
    $('.modal-close', videoModal)?.focus();
  }

  function closeVideoModal() {
    if (!videoModal || !storyVideo || !videoModal.classList.contains('open')) return;
    storyVideo.pause();
    storyVideo.removeAttribute('src');
    storyVideo.load();
    videoModal.classList.remove('open');
    videoModal.setAttribute('aria-hidden', 'true');
    unlockModalPage();
    videoLastFocused?.focus?.({ preventScroll: true });
  }

  $('#videoPrev')?.addEventListener('click', () => loadStoryReel(currentReelIndex - 1));
  $('#videoNext')?.addEventListener('click', () => loadStoryReel(currentReelIndex + 1));
  $$('[data-close-video]').forEach(button => button.addEventListener('click', closeVideoModal));

  let videoTouchStartX = null;
  videoModal?.addEventListener('touchstart', event => {
    videoTouchStartX = event.changedTouches[0]?.clientX ?? null;
  }, { passive: true });
  videoModal?.addEventListener('touchend', event => {
    if (videoTouchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? videoTouchStartX;
    const distance = endX - videoTouchStartX;
    if (Math.abs(distance) > 65) loadStoryReel(currentReelIndex + (distance < 0 ? 1 : -1));
    videoTouchStartX = null;
  }, { passive: true });

  // Proposal and wedding galleries share one accessible lightbox.
  const photoCollections = {
    wedding: {
      key: 'wedding',
      total: 126,
      pad: 3,
      label: 'Wedding memory',
      title: 'John Phillip & Hazil Wedding Memory',
      downloadPrefix: 'john-hazil-wedding',
      path(index, size = 'full') {
        return `assets/images/gallery/${size}/wedding-${String(index + 1).padStart(3, '0')}.webp`;
      }
    },
    proposal: {
      key: 'proposal',
      total: 23,
      pad: 2,
      label: 'Proposal day memory',
      title: 'John Phillip & Hazil Proposal Memory',
      downloadPrefix: 'john-hazil-proposal',
      path(index, size = 'full') {
        return `assets/images/proposal/${size}/proposal-${String(index + 1).padStart(3, '0')}.webp`;
      }
    }
  };

  const galleryGrid = $('#galleryGrid');
  const loadMoreButton = $('#loadMoreGallery');
  const galleryCount = $('#galleryCount');
  const proposalGalleryGrid = $('#proposalGalleryGrid');
  const loadMoreProposal = $('#loadMoreProposal');
  const proposalGalleryCount = $('#proposalGalleryCount');
  let visibleWeddingPhotos = 0;
  let visibleProposalPhotos = 0;
  let currentPhotoIndex = 0;
  let activePhotoCollection = photoCollections.wedding;
  let lightboxLastFocused = null;

  function makeGalleryButton(index, collection, className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('aria-label', `Open ${collection.label.toLowerCase()} ${index + 1} of ${collection.total}`);
    const image = document.createElement('img');
    image.src = collection.path(index, 'thumbs');
    image.alt = `John Phillip and Hazil ${collection.label.toLowerCase()} ${index + 1}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => button.remove(), { once: true });
    button.appendChild(image);
    button.addEventListener('click', () => openLightbox(index, collection.key));
    return button;
  }

  function renderWeddingGalleryBatch() {
    if (!galleryGrid) return;
    const collection = photoCollections.wedding;
    const end = Math.min(visibleWeddingPhotos + 24, collection.total);
    const fragment = document.createDocumentFragment();
    for (let index = visibleWeddingPhotos; index < end; index += 1) {
      fragment.appendChild(makeGalleryButton(index, collection, 'gallery-item'));
    }
    galleryGrid.appendChild(fragment);
    visibleWeddingPhotos = end;
    if (galleryCount) galleryCount.textContent = `Showing ${visibleWeddingPhotos} of ${collection.total}`;
    if (loadMoreButton) loadMoreButton.hidden = visibleWeddingPhotos >= collection.total;
  }

  function renderProposalGalleryBatch() {
    if (!proposalGalleryGrid) return;
    const collection = photoCollections.proposal;
    const end = Math.min(visibleProposalPhotos + 8, collection.total);
    const fragment = document.createDocumentFragment();
    for (let index = visibleProposalPhotos; index < end; index += 1) {
      fragment.appendChild(makeGalleryButton(index, collection, 'proposal-gallery-item'));
    }
    proposalGalleryGrid.appendChild(fragment);
    visibleProposalPhotos = end;
    if (proposalGalleryCount) proposalGalleryCount.textContent = `Showing ${visibleProposalPhotos} of ${collection.total}`;
    if (loadMoreProposal) loadMoreProposal.hidden = visibleProposalPhotos >= collection.total;
  }

  renderWeddingGalleryBatch();
  renderProposalGalleryBatch();
  loadMoreButton?.addEventListener('click', renderWeddingGalleryBatch);
  loadMoreProposal?.addEventListener('click', renderProposalGalleryBatch);
  $$('.mosaic-item').forEach(button => {
    button.addEventListener('click', () => openLightbox(Number(button.dataset.galleryIndex || 0), 'wedding'));
  });
  $$('[data-proposal-index]').forEach(button => {
    button.addEventListener('click', () => openLightbox(Number(button.dataset.proposalIndex || 0), 'proposal'));
  });

  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightboxImage');
  const lightboxCounter = $('#lightboxCounter');
  const lightboxLoader = $('#lightboxLoader');
  let lightboxRequest = 0;

  function preloadAdjacentPhotos() {
    [-1, 1].forEach(offset => {
      const preload = new Image();
      const index = (currentPhotoIndex + offset + activePhotoCollection.total) % activePhotoCollection.total;
      preload.src = activePhotoCollection.path(index, 'full');
    });
  }

  function updateLightbox(index) {
    if (!lightboxImage) return;
    const collection = activePhotoCollection;
    currentPhotoIndex = (index + collection.total) % collection.total;
    const requestId = ++lightboxRequest;
    lightboxImage.classList.remove('loaded');
    lightboxLoader?.classList.remove('hidden');
    if (lightboxCounter) {
      lightboxCounter.textContent = `${collection.label} · ${String(currentPhotoIndex + 1).padStart(collection.pad, '0')} / ${collection.total}`;
    }

    const nextImage = new Image();
    nextImage.onload = () => {
      if (requestId !== lightboxRequest) return;
      lightboxImage.src = nextImage.src;
      lightboxImage.alt = `John Phillip and Hazil ${collection.label.toLowerCase()} ${currentPhotoIndex + 1}`;
      requestAnimationFrame(() => lightboxImage.classList.add('loaded'));
      lightboxLoader?.classList.add('hidden');
      preloadAdjacentPhotos();
    };
    nextImage.onerror = () => {
      if (requestId !== lightboxRequest) return;
      lightboxLoader?.classList.add('hidden');
      showToast('This photo could not be loaded');
    };
    nextImage.src = collection.path(currentPhotoIndex, 'full');
  }

  function openLightbox(index, collectionKey = 'wedding') {
    if (!lightbox) return;
    activePhotoCollection = photoCollections[collectionKey] || photoCollections.wedding;
    lightboxLastFocused = document.activeElement;
    saveDateVideo?.pause();
    updateLightbox(index);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    lockModalPage();
    $('.lightbox-close', lightbox)?.focus();
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains('open')) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    unlockModalPage();
    lightboxLastFocused?.focus?.({ preventScroll: true });
    window.setTimeout(() => {
      if (!lightbox.classList.contains('open')) lightboxImage?.removeAttribute('src');
    }, 320);
  }

  $('#lightboxPrev')?.addEventListener('click', () => updateLightbox(currentPhotoIndex - 1));
  $('#lightboxNext')?.addEventListener('click', () => updateLightbox(currentPhotoIndex + 1));
  $$('[data-close-lightbox]').forEach(button => button.addEventListener('click', closeLightbox));

  $('#lightboxShare')?.addEventListener('click', async () => {
    const collection = activePhotoCollection;
    const url = new URL(collection.path(currentPhotoIndex, 'full'), location.href).href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: collection.title,
          text: `${collection.label} ${currentPhotoIndex + 1}`,
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Photo link copied');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('Unable to share this photo');
    }
  });

  $('#lightboxDownload')?.addEventListener('click', () => {
    const collection = activePhotoCollection;
    const link = document.createElement('a');
    link.href = collection.path(currentPhotoIndex, 'full');
    link.download = `${collection.downloadPrefix}-${String(currentPhotoIndex + 1).padStart(3, '0')}.webp`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  let lightboxTouchStartX = null;
  lightbox?.addEventListener('touchstart', event => {
    lightboxTouchStartX = event.changedTouches[0]?.clientX ?? null;
  }, { passive: true });
  lightbox?.addEventListener('touchend', event => {
    if (lightboxTouchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? lightboxTouchStartX;
    const distance = endX - lightboxTouchStartX;
    if (Math.abs(distance) > 55) updateLightbox(currentPhotoIndex + (distance < 0 ? 1 : -1));
    lightboxTouchStartX = null;
  }, { passive: true });

  // Focus trapping and keyboard controls for dialogs and navigation.
  function trapFocus(event, container) {
    const focusable = $$('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])', container)
      .filter(element => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (lightbox?.classList.contains('open')) closeLightbox();
      else if (videoModal?.classList.contains('open')) closeVideoModal();
      else if (navMenu?.classList.contains('open')) closeNav({ restoreFocus: true });
      else if (openingIntro && !openingIntro.classList.contains('is-hidden')) finishOpening({ animate: false });
    }

    if (lightbox?.classList.contains('open')) {
      if (event.key === 'ArrowLeft') updateLightbox(currentPhotoIndex - 1);
      if (event.key === 'ArrowRight') updateLightbox(currentPhotoIndex + 1);
      if (event.key === 'Tab') trapFocus(event, lightbox);
    } else if (videoModal?.classList.contains('open')) {
      if (event.key === 'ArrowLeft') loadStoryReel(currentReelIndex - 1);
      if (event.key === 'ArrowRight') loadStoryReel(currentReelIndex + 1);
      if (event.key === 'Tab') trapFocus(event, videoModal);
    } else if (navMenu?.classList.contains('open') && event.key === 'Tab') {
      trapFocus(event, navMenu);
    }
  });

  // Letter envelope
  const envelopeStage = $('.envelope-stage');
  const envelopeButton = $('#envelopeButton');
  envelopeButton?.addEventListener('click', () => {
    const isOpen = envelopeStage?.classList.toggle('open') ?? false;
    envelopeButton.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      window.setTimeout(() => $('#letterPaper')?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center'
      }), prefersReducedMotion ? 0 : 700);
    }
  });

  // Guest message form. FormSubmit is retained, with mailto as a transparent fallback.
  const messageForm = $('#messageForm');
  const messageSubmit = $('#messageSubmit');
  const formStatus = $('#formStatus');

  messageForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const name = $('#guestName')?.value.trim() || '';
    const relationship = $('#guestRelationship')?.value.trim() || '';
    const message = $('#guestMessage')?.value.trim() || '';

    if (!message) {
      if (formStatus) {
        formStatus.textContent = 'Please write a message first.';
        formStatus.classList.add('error');
      }
      $('#guestMessage')?.focus();
      return;
    }

    formStatus?.classList.remove('error');
    if (formStatus) formStatus.textContent = 'Sending your message…';
    if (messageSubmit) messageSubmit.disabled = true;

    const formData = new FormData();
    formData.append('_subject', `Wedding memory${name ? ` from ${name}` : ''}`);
    formData.append('_captcha', 'false');
    formData.append('_template', 'box');
    formData.append('name', name || 'Anonymous Guest');
    formData.append('relationship', relationship || 'Not specified');
    formData.append('message', message);

    try {
      const response = await fetch('https://formsubmit.co/ajax/353ca3c40cfb00f4ec196d6340cb71ab', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      });
      if (!response.ok) throw new Error('Message service unavailable');
      if (formStatus) formStatus.textContent = `Thank you${name ? `, ${name}` : ''}. Your message was sent with love.`;
      messageForm.reset();
      showToast('Your message was sent');
    } catch {
      if (formStatus) {
        formStatus.textContent = 'The message service is unavailable. Your email app will open instead.';
        formStatus.classList.add('error');
      }
      const subject = encodeURIComponent(`Wedding memory${name ? ` from ${name}` : ''}`);
      const body = encodeURIComponent(`${name ? `From: ${name}\n` : ''}${relationship ? `Relationship: ${relationship}\n` : ''}\n${message}`);
      window.setTimeout(() => { location.href = `mailto:jpbebora@gmail.com?subject=${subject}&body=${body}`; }, 900);
    } finally {
      if (messageSubmit) messageSubmit.disabled = false;
    }
  });

  // Closing actions and footer year.
  const footerYear = $('#footerYear');
  if (footerYear) footerYear.textContent = String(new Date().getFullYear());

  $('#replayFilm')?.addEventListener('click', () => {
    saveDateVideo?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    saveDateVideo?.play().catch(() => {
      showToast('Press play to watch our film');
    });
  });
})();

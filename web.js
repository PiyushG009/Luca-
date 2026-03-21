// State Engine
let viewTracks = [];
let playQueue = [];
let playIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 'off';

// Pagination & Query Engine
let currentQuery = '';
let currentPage = 1;
let isFetching = false;
let isHomeRender = true;

// Auth Engine
let currentUser = null;

// DOM refs
const audio = document.getElementById('audio');
const coverEl = document.getElementById('cover');
const trackTitleEl = document.getElementById('trackTitle');
const trackArtistEl = document.getElementById('trackArtist');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressContainer = document.getElementById('progressContainer');
const progressEl = document.getElementById('progress');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const volumeInput = document.getElementById('volume');
const muteBtn = document.getElementById('muteBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const nowPlayingLikeBtn = document.getElementById('nowPlayingLikeBtn');

const playlistList = document.getElementById('playlistList');
const searchInput = document.getElementById('searchInput');
const loadingIndicator = document.getElementById('loadingIndicator');
const bottomLoader = document.getElementById('bottomLoader');
const contentScroll = document.getElementById('contentScroll');

const homeView = document.getElementById('homeView');
const searchView = document.getElementById('searchView');
const posterGrid = document.getElementById('posterGrid');
const homeTitle = document.getElementById('homeTitle');

const authOverlay = document.getElementById('authOverlay');
const authForm = document.getElementById('authForm');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const googleAuthBtn = document.getElementById('googleAuthBtn');
const userProfile = document.getElementById('userProfile');
const userInitial = document.getElementById('userInitial');

let coverTween;

// --- AUTH SYSTEM ---
function checkAuth() {
  let stored = null;
  try {
    stored = localStorage.getItem('luca_currentUser');
  } catch(e) {
    console.warn('LocalStorage not available');
  }

  if (stored) {
    currentUser = JSON.parse(stored);
    authOverlay.style.display = 'none';
    userInitial.textContent = currentUser.name.charAt(0).toUpperCase();
    initApp();
  } else {
    authOverlay.style.display = 'flex';
  }
}

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  currentUser = { 
    name: authName.value || "User",
    email: authEmail.value, 
    likedSongs: [], 
    history: [] 
  };
  saveUser();
  authOverlay.style.display = 'none';
  userInitial.textContent = currentUser.name.charAt(0).toUpperCase();
  initApp();
});

googleAuthBtn.addEventListener('click', (e) => {
  e.preventDefault();
  currentUser = { 
    name: "Google User", 
    email: "user@google.com", 
    likedSongs: [], 
    history: [] 
  };
  saveUser();
  authOverlay.style.display = 'none';
  userInitial.textContent = currentUser.name.charAt(0).toUpperCase();
  initApp();
});

userProfile.addEventListener('click', () => {
  if (confirm("Log out of Luca?")) {
    try {
      localStorage.removeItem('luca_currentUser');
    } catch(e) {}
    location.reload();
  }
});

function saveUser() {
  if(currentUser) {
    try {
      localStorage.setItem('luca_currentUser', JSON.stringify(currentUser));
    } catch(e) {
      console.warn("Unable to save to localStorage.");
    }
  }
}

// --- INIT APP ---
function initApp() {
  attachEvents();
  audio.volume = Number(volumeInput.value);
  updatePlayButton();

  gsap.from(".sidebar", { x: -50, opacity: 0, duration: 0.8, ease: "power3.out" });
  gsap.from(".player-bar", { y: 100, opacity: 0, duration: 0.8, delay: 0.2, ease: "power3.out" });
  gsap.from(".top-bar", { y: -30, opacity: 0, duration: 0.6, delay: 0.4, ease: "power2.out" });

  coverTween = gsap.to(coverEl, {
    scale: 1.05,
    boxShadow: "0 10px 20px rgba(0, 242, 254, 0.4)",
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    paused: true
  });

  fetchSongs("latest hits hindi english punjabi", true, "Trending Now");
}

checkAuth();

// --- DATA FETCHING & UI RENDER ---

async function fetchSongs(query, isHome = true, customTitle = "Hits", page = 1) {
  if (isFetching) return;
  isFetching = true;
  
  if (page === 1) {
    currentQuery = query;
    currentPage = 1;
    viewTracks = [];
    isHomeRender = isHome;
    if (isHome) {
      homeView.style.display = 'block'; searchView.style.display = 'none';
      posterGrid.innerHTML = ''; homeTitle.textContent = customTitle;
    } else {
      homeView.style.display = 'none'; searchView.style.display = 'block';
      playlistList.innerHTML = ''; document.getElementById('searchTitle').textContent = customTitle;
    }
    loadingIndicator.style.display = 'block';
  } else {
    bottomLoader.style.display = 'block';
  }

  if (query === "!LIKED!") {
    viewTracks = currentUser ? [...currentUser.likedSongs] : [];
    finishRender(page, isHome, viewTracks.length === 0 ? "You haven't liked any songs yet." : "");
    return;
  }
  if (query === "!HISTORY!") {
    viewTracks = currentUser ? [...currentUser.history] : [];
    finishRender(page, isHome, viewTracks.length === 0 ? "No recently played songs." : "");
    return;
  }

  try {
    const res = await fetch("https://saavn.sumit.co/api/search/songs?query=" + encodeURIComponent(query) + "&page=" + page + "&limit=30");
    const json = await res.json();
    if(json.success && json.data.results.length > 0) {
      const newTracks = json.data.results.map(song => {
        let audUrl = song.downloadUrl.find(q => q.quality === "320kbps") || song.downloadUrl[song.downloadUrl.length-1];
        let imgUrl = song.image.find(q => q.quality === "500x500") || song.image[song.image.length-1];
        return {
          id: song.id,
          src: audUrl.url,
          title: song.name,
          artist: song.artists.primary[0]?.name || song.artists.all[0]?.name || "Unknown",
          cover: imgUrl.url,
          duration: song.duration
        };
      });
      viewTracks.push(...newTracks);
      finishRender(page, isHome, "");
    } else {
      if (page === 1) finishRender(page, isHome, "No results found");
    }
  } catch(e) {
    if(page === 1) finishRender(page, isHome, "Error connecting to servers.");
  }
}

function finishRender(page, isHome, emptyMsg) {
  isFetching = false;
  loadingIndicator.style.display = 'none';
  bottomLoader.style.display = 'none';

  if (emptyMsg) {
    if(isHome) posterGrid.innerHTML = '<div style="text-align:center; padding: 20px; color:#a7a7a7;">' + emptyMsg + '</div>';
    else playlistList.innerHTML = '<div style="text-align:center; padding: 20px; color:#a7a7a7;">' + emptyMsg + '</div>';
    return;
  }

  if (isHome) buildPostersUI(page > 1);
  else buildPlaylistUI(page > 1);
}

function isLiked(track) {
  if(!currentUser) return false;
  return currentUser.likedSongs.some(t => t.id === track.id || t.src === track.src);
}

function toggleLikeTrack(track, heartEl) {
  if(!currentUser) return;
  const idx = currentUser.likedSongs.findIndex(t => t.id === track.id || t.src === track.src);
  if (idx > -1) {
    currentUser.likedSongs.splice(idx, 1);
    heartEl.classList.remove('active');
    heartEl.textContent = '🤍';
  } else {
    currentUser.likedSongs.push(track);
    heartEl.classList.add('active');
    heartEl.textContent = '❤️';
  }
  saveUser();
  updateNowPlayingLikeBtn();
}

function updateNowPlayingLikeBtn() {
  if (!playQueue[playIndex]) return;
  const track = playQueue[playIndex];
  if(isLiked(track)) {
    nowPlayingLikeBtn.classList.add('active');
    nowPlayingLikeBtn.textContent = '❤️';
  } else {
    nowPlayingLikeBtn.classList.remove('active');
    nowPlayingLikeBtn.textContent = '🤍';
  }
}

function recordHistory(track) {
  if(!currentUser) return;
  currentUser.history = currentUser.history.filter(t => t.id !== track.id && t.src !== track.src);
  currentUser.history.unshift(track);
  if (currentUser.history.length > 50) currentUser.history.pop();
  saveUser();
}

function fmtTime(sec) {
  if (!isFinite(sec) || sec === 0) return '0:00';
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return m + ":" + String(s).padStart(2, '0');
}

function buildPlaylistUI(pageAppended) {
  if(!pageAppended) playlistList.innerHTML = '';
  const startIndex = pageAppended ? (currentPage - 1) * 30 : 0;
  
  for(let i = startIndex; i < viewTracks.length; i++) {
    const t = viewTracks[i];
    const div = document.createElement('div');
    const isPlayingThis = (playQueue === viewTracks && playIndex === i);
    div.className = 'track-item' + (isPlayingThis ? ' active' : '');
    div.dataset.index = i;
    
    const liked = isLiked(t);
    const likeActive = liked ? 'active' : '';
    const likeIcon = liked ? '❤️' : '🤍';
    
    div.innerHTML = '<div class="ti-index">' + (i + 1) + '</div>' +
      '<div class="ti-info">' +
        '<img src="' + (t.cover || 'https://picsum.photos/50') + '" class="ti-cover" alt="cover"/>' +
        '<div class="ti-title">' + t.title + '</div>' +
      '</div>' +
      '<div class="ti-artist">' + t.artist + '</div>' +
      '<button class="like-btn ' + likeActive + '" title="Like">' + likeIcon + '</button>' +
      '<div class="ti-time">' + (fmtTime(t.duration) || '—:—') + '</div>';
    
    div.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      activateQueueAndPlay(i);
    });

    const heart = div.querySelector('.like-btn');
    heart.addEventListener('click', () => toggleLikeTrack(t, heart));

    playlistList.appendChild(div);
  }

  if (!pageAppended) {
    gsap.from(".track-item", { x: 20, opacity: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" });
  }
}

function buildPostersUI(pageAppended) {
  if(!pageAppended) posterGrid.innerHTML = '';
  const startIndex = pageAppended ? (currentPage - 1) * 30 : 0;

  for(let i = startIndex; i < viewTracks.length; i++) {
    const t = viewTracks[i];
    const card = document.createElement('div');
    card.className = 'poster-card';
    card.dataset.index = i;
    
    const liked = isLiked(t);
    const likeActive = liked ? 'active' : '';
    const likeIcon = liked ? '❤️' : '🤍';
    
    card.innerHTML = '<div class="glare"></div>' +
      '<button class="like-btn card-like-btn ' + likeActive + '" title="Like">' + likeIcon + '</button>' +
      '<img src="' + t.cover + '" class="poster-img" alt="cover" crossorigin="anonymous" />' +
      '<div class="poster-title">' + t.title + '</div>' +
      '<div class="poster-artist">' + t.artist + '</div>' +
      '<div class="play-btn-overlay">▶</div>';

    const glare = card.querySelector('.glare');
    card.addEventListener('mouseenter', () => { gsap.to(glare, { opacity: 1, duration: 0.3 }); });
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const rotateX = ((y - rect.height/2) / (rect.height/2)) * -12;
      const rotateY = ((x - rect.width/2) / (rect.width/2)) * 12;
      gsap.to(card, { rotateX: rotateX, rotateY: rotateY, transformPerspective: 1000, scale: 1.05, duration: 0.4, ease: "power2.out" });
      glare.style.background = "radial-gradient(circle at " + ((x / rect.width)*100) + "% " + ((y / rect.height)*100) + "%, rgba(255,255,255,0.2), transparent 50%)";
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.5, ease: "power2.out" });
      gsap.to(glare, { opacity: 0, duration: 0.5 });
    });

    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      activateQueueAndPlay(i);
    });

    const heart = card.querySelector('.like-btn');
    heart.addEventListener('click', () => toggleLikeTrack(t, heart));

    posterGrid.appendChild(card);
  }

  if (!pageAppended) {
    gsap.from(".poster-card", { y: 20, opacity: 0, duration: 0.5, stagger: 0.05, ease: "back.out(1.5)" });
  }
}

function activateQueueAndPlay(index) {
  playQueue = [...viewTracks];
  playIndex = index;
  loadTrack(playIndex);
  play();
  
  if(!isHomeRender) {
    Array.from(playlistList.children).forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });
  }
}

function loadTrack(index) {
  if (index < 0 || index >= playQueue.length) return;
  playIndex = index;
  const track = playQueue[index];
  
  recordHistory(track);
  updateNowPlayingLikeBtn();

  gsap.to(coverEl, { opacity: 0.5, scale: 0.95, duration: 0.3, ease: "power2.out", onComplete: () => {
    coverEl.src = track.cover || 'https://picsum.photos/400';
    gsap.to(coverEl, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" });
  }});
  
  audio.src = track.src;
  trackTitleEl.textContent = track.title;
  trackArtistEl.textContent = track.artist;
  
  progressEl.style.width = '0%';
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = '0:00';
  audio.load();
}

function play() {
  audio.play().then(() => {
    isPlaying = true;
    updatePlayButton();
    if(coverTween) coverTween.play();
  }).catch(err => { console.error('Playback failed:', err); });
}
function pause() {
  audio.pause();
  isPlaying = false;
  updatePlayButton();
  if(coverTween) coverTween.pause();
}
function togglePlay() {
  if (isPlaying) pause(); else play();
}
function updatePlayButton() {
  playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
}

function nextTrack() {
  if (playQueue.length === 0) return;
  if (isShuffle) {
    let next;
    if (playQueue.length === 1) next = 0;
    else { do { next = Math.floor(Math.random() * playQueue.length); } while (next === playIndex); }
    loadTrack(next); play(); return;
  }
  if (playIndex < playQueue.length - 1) { loadTrack(playIndex + 1); play(); }
  else {
    if (repeatMode === 'all') { loadTrack(0); play(); }
    else { pause(); audio.currentTime = 0; }
  }
}
function prevTrack() {
  if (playQueue.length === 0) return;
  if (audio.currentTime > 5) { audio.currentTime = 0; return; }
  if (playIndex > 0) { loadTrack(playIndex - 1); play(); }
  else { audio.currentTime = 0; }
}

function attachEvents() {
  contentScroll.addEventListener('scroll', () => {
    if (contentScroll.scrollTop + contentScroll.clientHeight >= contentScroll.scrollHeight - 60) {
      if (!isFetching && currentQuery && currentQuery !== '!LIKED!' && currentQuery !== '!HISTORY!') {
        currentPage++;
        fetchSongs(currentQuery, isHomeRender, homeTitle.textContent || document.getElementById('searchTitle').textContent, currentPage);
      }
    }
  });

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = e.target.value.trim();
      if(q.length > 2) fetchSongs(q, false, 'Search Results for "' + q + '"');
      else if(q.length === 0) fetchSongs("latest hits hindi english punjabi", true, "Trending Now");
    }, 800);
  });

  document.querySelectorAll('.sidebar-playlists p').forEach(p => {
    p.addEventListener('click', () => {
      searchInput.value = '';
      fetchSongs(p.textContent, true, p.textContent);
    });
  });

  document.getElementById('homeBtn').addEventListener('click', () => {
    searchInput.value = ''; fetchSongs("latest hits hindi english punjabi", true, "Trending Now");
  });
  document.getElementById('searchBtn').addEventListener('click', () => {
    searchInput.focus();
  });
  document.getElementById('likedSongsBtn').addEventListener('click', () => {
    fetchSongs("!LIKED!", false, "Liked Songs");
  });
  document.getElementById('historyBtn').addEventListener('click', () => {
    fetchSongs("!HISTORY!", true, "Recently Played");
  });

  nowPlayingLikeBtn.addEventListener('click', () => {
    if (playQueue[playIndex]) toggleLikeTrack(playQueue[playIndex], nowPlayingLikeBtn);
    if (isHomeRender) buildPostersUI(false); else buildPlaylistUI(false);
  });

  audio.addEventListener('loadedmetadata', () => { durationEl.textContent = fmtTime(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100 || 0;
    progressEl.style.width = pct + "%";
    currentTimeEl.textContent = fmtTime(audio.currentTime);
  });
  audio.addEventListener('ended', () => {
    if (repeatMode === 'one') { audio.currentTime = 0; play(); }
    else { nextTrack(); }
  });

  playPauseBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', prevTrack);
  nextBtn.addEventListener('click', nextTrack);

  let isSeeking = false;
  function seekFromEvent(e) {
    const rect = progressContainer.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const MathMax = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = MathMax * (audio.duration || 0);
  }
  progressContainer.addEventListener('click', seekFromEvent);
  progressContainer.addEventListener('pointerdown', (e) => { isSeeking = true; progressContainer.setPointerCapture(e.pointerId); seekFromEvent(e); });
  progressContainer.addEventListener('pointermove', (e) => { if (isSeeking) seekFromEvent(e); });
  progressContainer.addEventListener('pointerup', (e) => { isSeeking = false; try { progressContainer.releasePointerCapture(e.pointerId); } catch(_) {} });
  progressContainer.addEventListener('pointercancel', () => isSeeking = false);

  volumeInput.addEventListener('input', () => {
    audio.volume = Number(volumeInput.value);
    if (audio.volume > 0) { muteBtn.textContent = '🔈'; lastVolume = audio.volume; }
    else { muteBtn.textContent = '🔇'; }
  });
  muteBtn.addEventListener('click', () => {
    if (audio.volume > 0) { lastVolume = audio.volume; audio.volume = 0; volumeInput.value = 0; muteBtn.textContent = '🔇'; }
    else { audio.volume = lastVolume || 0.8; volumeInput.value = audio.volume; muteBtn.textContent = '🔈'; }
  });

  shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle; 
    if(isShuffle) shuffleBtn.classList.add('active-state');
    else shuffleBtn.classList.remove('active-state');
  });
  
  repeatBtn.addEventListener('click', () => {
    if (repeatMode === 'off') { 
      repeatMode = 'all'; 
      repeatBtn.classList.add('active-state'); 
      repeatBtn.textContent = '🔁'; 
    }
    else if (repeatMode === 'all') { 
      repeatMode = 'one'; 
      repeatBtn.classList.add('active-state'); 
      repeatBtn.textContent = '🔂'; 
    }
    else { 
      repeatMode = 'off'; 
      repeatBtn.classList.remove('active-state'); 
      repeatBtn.textContent = '🔁'; 
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (e.code === 'ArrowRight') nextTrack();
    else if (e.code === 'ArrowLeft') prevTrack();
  });
  audio.addEventListener('error', (e) => { console.error('Audio error', e); nextTrack(); });
}

// ══════════════════════════════════════════════════════════
//  LUCAVERSE — app.js  |  Ultimate Beast Edition
//  Fixes: !HISTORY! handler, duplicate scroll, renderProfile
//         merge, fetchSuggestions race, avatar compress,
//         prompt/confirm → custom modals, inline-style → CSS
// ══════════════════════════════════════════════════════════

const HOME_CATEGORIES = [
  { id:'cat_greeting',   title:'__GREETING__',             query:'__DAILY_TRENDING__' },
  { id:'cat_trending',   title:'🔥 Trending Now',          query:'trending hindi 2026' },
  { id:'cat_new',        title:'🆕 New Releases',           query:'new release 2026 hindi' },
  { id:'cat_hindi',      title:'🎵 Top Hindi Hits',         query:'hindi superhit 2026' },
  { id:'cat_punjabi',    title:'💛 Punjabi Hits',           query:'punjabi top 2026' },
  { id:'cat_global',     title:'🌍 Top Global',             query:'global hits 2026' },
  { id:'cat_hiphop',     title:'🎤 Desi Hip-Hop',           query:'desi hiphop 2026' },
  { id:'cat_viral',      title:'📱 Viral Bangers',          query:'viral songs 2026 india' },
  { id:'cat_sad',        title:'💔 Sad Vibes',              query:'sad emotional hindi 2026' },
  { id:'cat_party',      title:'🎉 Party Anthems',          query:'party bollywood 2026' },
  { id:'cat_romantic',   title:'💕 Romantic',               query:'romantic hindi 2026' },
  { id:'cat_lofi',       title:'🌙 Lofi Beats',             query:'lofi chill 2025' },
  { id:'cat_workout',    title:'💪 Workout / Gym',          query:'gym workout songs 2025' },
  { id:'cat_pop',        title:'🎸 Pop Hits',               query:'pop english hit 2025' },
  { id:'cat_nostalgia',  title:'📼 2000s Classics',         query:'2000s bollywood hit' },
]

const POPULAR_ARTISTS = [
  { name: 'Arijit Singh',     query: 'arijit singh hits 2026',    genre: 'Bollywood'   },
  { name: 'A.R. Rahman',      query: 'ar rahman hindi songs',     genre: 'Legend'      },
  { name: 'Sidhu Moose Wala', query: 'sidhu moose wala best',     genre: 'Punjabi'     },
  { name: 'Karan Aujla',      query: 'karan aujla hits 2026',     genre: 'Punjabi'     },
  { name: 'Diljit Dosanjh',   query: 'diljit dosanjh 2026',       genre: 'Punjabi'     },
  { name: 'Shubh',            query: 'shubh songs hits',          genre: 'Punjabi'     },
  { name: 'Kishore Kumar',    query: 'kishore kumar hit songs',   genre: 'Legacy'      },
  { name: 'Lata Mangeshkar',  query: 'lata mangeshkar hits',      genre: 'Legacy'      },
  { name: 'Mohd Rafi',        query: 'mohd rafi hindi songs',     genre: 'Legacy'      },
  { name: 'Sonu Nigam',       query: 'sonu nigam hits 2000s',     genre: 'Playback'    },
  { name: 'Atif Aslam',       query: 'atif aslam songs',          genre: 'Playback'    },
  { name: 'Shreya Ghoshal',   query: 'shreya ghoshal hits',       genre: 'Playback'    },
  { name: 'Sunidhi Chauhan',  query: 'sunidhi chauhan songs',     genre: 'Playback'    },
  { name: 'Badshah',          query: 'badshah hip hop 2026',      genre: 'Hip-Hop'     },
  { name: 'AP Dhillon',       query: 'ap dhillon songs 2026',     genre: 'Punjabi Pop' },
  { name: 'Honey Singh',      query: 'yo yo honey singh GLORY',   genre: 'Hip-Hop'     },
  { name: 'Raftaar',          query: 'raftaar hits 2026',         genre: 'Hip-Hop'     },
  { name: 'Emiway Bantai',    query: 'emiway bantai 2026',        genre: 'Hip-Hop'     },
  { name: 'Darshan Raval',    query: 'darshan raval latest',      genre: 'Romantic'    },
  { name: 'Armaan Malik',     query: 'armaan malik 2026',         genre: 'Romantic'    },
  { name: 'Jubin Nautiyal',   query: 'jubin nautiyal hits',       genre: 'Romantic'    },
  { name: 'Neha Kakkar',      query: 'neha kakkar songs 2026',    genre: 'Pop'         },
  { name: 'The Weeknd',       query: 'the weeknd hits 2025',      genre: 'Global'      },
  { name: 'Taylor Swift',     query: 'taylor swift songs 2025',   genre: 'Global'      },
  { name: 'Drake',            query: 'drake the best songs',      genre: 'Global'      },
  { name: 'Justin Bieber',    query: 'justin bieber hits',        genre: 'Global'      },
  { name: 'Billie Eilish',    query: 'billie eilish top',         genre: 'Global'      },
  { name: 'Post Malone',      query: 'post malone songs',         genre: 'Global'      },
  { name: 'Ed Sheeran',       query: 'ed sheeran hits',           genre: 'Global'      },
  { name: 'Dua Lipa',         query: 'dua lipa top 2025',         genre: 'Global'      },
  { name: 'Bruno Mars',       query: 'bruno mars hits',           genre: 'Global'      },
  { name: 'Travis Scott',     query: 'travis scott best',         genre: 'Global'      },
]

let homeData = {}

// ── State ─────────────────────────────────────────────────
let currentUser       = null
let viewTracks        = []
let playQueue         = []
let playIndex         = 0
let isPlaying         = false
let isShuffle         = false
let repeatMode        = 'off'
let lastVolume        = 0.8
let currentQuery      = ''
let currentPage       = 1
let isFetching        = false
let isHomeRender      = true
let currentFetchType  = 'songs'
let currentSeeAllMode = ''
let currentPlaylistId = null
let songToAdd         = null
let coverTween        = null
let lastScrollPos     = 0
let recommendationsRefreshTimer = null
let lastRecommendationSeed = ''
// FIX: race-condition guard for fetchSuggestions
let _suggestionAbortId = null

// ── API CONFIG ─────────────────────────────────────────────
const API_CONFIG = {
  PRIMARY: 'https://luca-jiosaavn-api.vercel.app',
  BACKUP:  'https://saavn.sumit.co'
}

async function lucaFetch(path, options = {}) {
  const primaryUrl = `${API_CONFIG.PRIMARY}${path}`
  const backupUrl  = `${API_CONFIG.BACKUP}${path}`
  const timeout    = options.timeout || 7000
  try {
    const res = await fetch(primaryUrl, { ...options, signal: AbortSignal.timeout(timeout) })
    if (res.ok) return await res.json()
    if (res.status === 429 || res.status >= 500) throw new Error(`Primary API Error: ${res.status}`)
    const errData = await res.json().catch(() => ({}))
    return { success: false, data: null, error: errData.message || 'API Error' }
  } catch (err) {
    console.warn('API Failover Triggered:', err.message)
    try {
      const res = await fetch(backupUrl, { ...options, signal: AbortSignal.timeout(timeout) })
      if (!res.ok) throw new Error(`Backup API Error: ${res.status}`)
      return await res.json()
    } catch (err2) {
      console.error('All API mirrors failed:', err2.message)
      return { success: false, data: null, error: 'Network Error' }
    }
  }
}

// ── DOM Refs ──────────────────────────────────────────────
const audio             = document.getElementById('audio')
const coverEl           = document.getElementById('cover')
const trackTitleEl      = document.getElementById('trackTitle')
const trackArtistEl     = document.getElementById('trackArtist')
const playPauseBtn      = document.getElementById('playPauseBtn')
const prevBtn           = document.getElementById('prevBtn')
const nextBtn           = document.getElementById('nextBtn')
const progressContainer = document.getElementById('progressContainer')
const progressEl        = document.getElementById('progress')
const currentTimeEl     = document.getElementById('currentTime')
const durationEl        = document.getElementById('duration')
const volumeInput       = document.getElementById('volume')
const muteBtn           = document.getElementById('muteBtn')
const shuffleBtn        = document.getElementById('shuffleBtn')
const repeatBtn         = document.getElementById('repeatBtn')
const nowPlayingLikeBtn = document.getElementById('nowPlayingLikeBtn')
const playlistList      = document.getElementById('playlistList')
const searchInput       = document.getElementById('searchInput')
const loadingIndicator  = document.getElementById('loadingIndicator')
const bottomLoader      = document.getElementById('bottomLoader')
const contentScroll     = document.getElementById('contentScroll')
const homeView          = document.getElementById('homeView')
const searchView        = document.getElementById('searchView')
const profileView       = document.getElementById('profileView')
const playlistDetailView= document.getElementById('playlistDetailView')
const posterGrid        = document.getElementById('posterGrid')
const homeTitle         = document.getElementById('homeTitle')
const userProfileBtn    = document.getElementById('userProfile')
const sidebarUser       = document.getElementById('sidebarUser')
const suAvatar          = document.getElementById('suAvatar')
const suName            = document.getElementById('suName')
const suAction          = document.getElementById('suAction')
const sidebarPlaylists  = document.getElementById('sidebarPlaylists')
const newPlaylistBtn    = document.getElementById('newPlaylistBtn')
const playlistModal     = document.getElementById('playlistModal')
const modalPlaylistList = document.getElementById('modalPlaylistList')
const newPlaylistInput  = document.getElementById('newPlaylistInput')
const mainView          = document.querySelector('.main-view')

const SKELETON_CARD_COUNT = 12
const LUCA_VINYL_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00f2fe"/>
        <stop offset="100%" stop-color="#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect width="320" height="320" rx="36" fill="url(#bg)"/>
    <circle cx="160" cy="160" r="108" fill="#050816" stroke="url(#ring)" stroke-width="8"/>
    <circle cx="160" cy="160" r="62" fill="#111827" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
    <circle cx="160" cy="160" r="16" fill="#f8fafc"/>
    <path d="M226 82a100 100 0 0 1 12 144" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="8" stroke-linecap="round"/>
    <text x="160" y="286" text-anchor="middle" fill="#e2e8f0" font-family="Outfit,Arial,sans-serif" font-size="26" font-weight="700">Luca Vinyl</text>
  </svg>
`)}` 

let vibeFrameId = 0

function getPreferredImageUrl(images) {
  return images?.[2]?.url || ''
}

function getSafeImageUrl(images) {
  return getPreferredImageUrl(images) || LUCA_VINYL_PLACEHOLDER
}

function applyLucaImageFallback(img) {
  if (!img || img.dataset.lucaFallbackApplied === 'true') return
  img.dataset.lucaFallbackApplied = 'true'
  img.src = LUCA_VINYL_PLACEHOLDER
  img.classList.add('is-fallback-art')
}

function setMarqueeText(el, text) {
  if (!el) return
  const value = text || 'Unknown'
  el.replaceChildren()
  if (value.length <= 28) {
    el.classList.remove('marquee')
    el.textContent = value
    return
  }
  el.classList.add('marquee')
  const lead = document.createElement('span')
  const tail = document.createElement('span')
  lead.textContent = value
  tail.textContent = value
  el.append(lead, tail)
}

function setPlayerMeta(title, artist) {
  setMarqueeText(trackTitleEl, title)
  trackArtistEl.textContent = artist || 'Unknown'
}

function renderCardSkeletons(count = SKELETON_CARD_COUNT, { circular = false, compact = false } = {}) {
  return Array.from({ length: count }, () => `
    <div class="poster-card skel${circular ? ' circular-skeleton' : ''}${compact ? ' compact-skeleton' : ''}">
      <div class="sk-img${circular ? ' is-circle' : ''}"></div>
      <div class="sk-line l1"></div>
      <div class="sk-line l2"></div>
    </div>
  `).join('')
}

function renderTrackListSkeleton(count = 10) {
  return Array.from({ length: count }, (_, idx) => `
    <div class="track-item track-item-skeleton" aria-hidden="true">
      <span class="ti-index">${idx + 1}</span>
      <div class="ti-info">
        <div class="ti-cover sk-block"></div>
        <div class="ti-text-skeleton">
          <span class="sk-line l1"></span>
          <span class="sk-line l2"></span>
        </div>
      </div>
      <span class="ti-artist sk-line l2"></span>
      <div class="ti-like"></div>
      <span class="ti-time sk-line l2"></span>
    </div>
  `).join('')
}

function renderItemsInBatches(container, items, renderItem, { batchSize = 16, reset = true } = {}) {
  if (!container) return
  if (reset) container.innerHTML = ''
  let index = 0
  const appendBatch = () => {
    const fragment = document.createDocumentFragment()
    const end = Math.min(index + batchSize, items.length)
    while (index < end) {
      const node = renderItem(items[index], index)
      if (node) fragment.appendChild(node)
      index += 1
    }
    container.appendChild(fragment)
    if (index < items.length) requestAnimationFrame(appendBatch)
  }
  requestAnimationFrame(appendBatch)
}

function pickDominantColor(img) {
  const canvas = document.createElement('canvas')
  canvas.width = 24
  canvas.height = 24
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return [0, 242, 254]
  ctx.drawImage(img, 0, 0, 24, 24)
  const data = ctx.getImageData(0, 0, 24, 24).data
  let totalR = 0, totalG = 0, totalB = 0, samples = 0
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = (r + g + b) / 3
    if (brightness < 18) continue
    totalR += r
    totalG += g
    totalB += b
    samples += 1
  }
  if (!samples) return [0, 242, 254]
  return [
    Math.min(255, Math.round(totalR / samples)),
    Math.min(255, Math.round(totalG / samples)),
    Math.min(255, Math.round(totalB / samples)),
  ]
}

function applyVibeColor([r, g, b]) {
  document.documentElement.style.setProperty('--vibe-rgb', `${r}, ${g}, ${b}`)
  document.documentElement.style.setProperty('--vibe-rgb-soft', `${Math.max(0, Math.round(r * 0.6))}, ${Math.max(0, Math.round(g * 0.6))}, ${Math.max(0, Math.round(b * 0.6))}`)
}

function refreshVibeBackground(imageUrl) {
  const myFrame = ++vibeFrameId
  if (!imageUrl || imageUrl === LUCA_VINYL_PLACEHOLDER) {
    applyVibeColor([0, 242, 254])
    return
  }
  const probe = new Image()
  probe.crossOrigin = 'anonymous'
  probe.referrerPolicy = 'no-referrer'
  probe.onload = () => {
    if (myFrame !== vibeFrameId) return
    try {
      applyVibeColor(pickDominantColor(probe))
    } catch (_) {
      applyVibeColor([0, 242, 254])
    }
  }
  probe.onerror = () => {
    if (myFrame !== vibeFrameId) return
    applyVibeColor([0, 242, 254])
  }
  probe.src = imageUrl
}

window.LUCA_VINYL_PLACEHOLDER = LUCA_VINYL_PLACEHOLDER
window.applyLucaImageFallback = applyLucaImageFallback
window.refreshVibeBackground = refreshVibeBackground

document.addEventListener('error', (event) => {
  const target = event.target
  if (target instanceof HTMLImageElement) applyLucaImageFallback(target)
}, true)

// ══════════════════════════════════════════════════════════
//  LYRIC CACHE (IndexedDB)
// ══════════════════════════════════════════════════════════
let _lyricDb = null
const LYRIC_CACHE_DB = 'LucaVerseLib'
const LYRIC_STORE    = 'lyrics'

function initLyricCache() {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(LYRIC_CACHE_DB, 1)
      request.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains(LYRIC_STORE)) db.createObjectStore(LYRIC_STORE, { keyPath: 'id' })
      }
      request.onsuccess = (e) => { _lyricDb = e.target.result; resolve(true) }
      request.onerror = () => resolve(false)
    } catch (e) { resolve(false) }
  })
}

function getLyricFromCache(id) {
  return new Promise((resolve) => {
    if (!_lyricDb) return resolve(null)
    try {
      const trans = _lyricDb.transaction([LYRIC_STORE], 'readonly')
      const store = trans.objectStore(LYRIC_STORE)
      const req   = store.get(id)
      req.onsuccess = () => {
        const res = req.result
        if (res && (Date.now() - res.ts < 86400000 * 7)) resolve(res.payload)
        else resolve(null)
      }
      req.onerror = () => resolve(null)
    } catch (e) { resolve(null) }
  })
}

function setLyricToCache(id, payload) {
  if (!_lyricDb || !payload) return
  try {
    const trans = _lyricDb.transaction([LYRIC_STORE], 'readwrite')
    const store = trans.objectStore(LYRIC_STORE)
    store.put({ id, payload, ts: Date.now() })
  } catch (e) {}
}

// ══════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════
function showToast(msg, type = 'info', duration = 7000) {
  const container = document.getElementById('toastContainer')
  const icons = { info: 'ℹ️', success: '✓', error: '✕', heart: '❤️' }
  const toast = document.createElement('div')
  toast.className = 'toast ' + type
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`
  container.appendChild(toast)
  setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 350) }, duration)
}

// ══════════════════════════════════════════════════════════
//  CUSTOM CONFIRM MODAL (replaces confirm())
// ══════════════════════════════════════════════════════════
function showConfirm(title, message, onOk) {
  document.getElementById('confirmTitle').textContent   = title
  document.getElementById('confirmMessage').textContent = message
  document.getElementById('confirmOkBtn').onclick = () => { closeConfirmModal(); onOk() }
  document.getElementById('confirmModal').style.display = 'flex'
}
function closeConfirmModal() {
  document.getElementById('confirmModal').style.display = 'none'
}

function openSyncModal() {
  const modal = document.getElementById('syncModal')
  if (!modal) return
  const codeInput = document.getElementById('syncRoomCode')
  const status = document.getElementById('syncRoomStatus')
  if (codeInput) codeInput.value = ''
  if (status) status.textContent = 'Room sync foundation is ready.'
  modal.style.display = 'flex'
  setTimeout(() => codeInput?.focus(), 60)
}

function closeSyncModal() {
  const modal = document.getElementById('syncModal')
  if (modal) modal.style.display = 'none'
}

function createSyncRoom() {
  const code = `LUCA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const room = {
    code,
    createdAt: Date.now(),
    hostTrackId: playQueue[playIndex]?.id || null,
    hostTrackTitle: playQueue[playIndex]?.title || null,
  }
  localStorage.setItem('luca_sync_room', JSON.stringify(room))
  const status = document.getElementById('syncRoomStatus')
  if (status) status.textContent = `Room created: ${code}`
  const codeInput = document.getElementById('syncRoomCode')
  if (codeInput) codeInput.value = code
  showToast(`Room ${code} is ready to share`, 'success')
}

function joinSyncRoom() {
  const input = document.getElementById('syncRoomCode')
  const status = document.getElementById('syncRoomStatus')
  const code = input?.value.trim().toUpperCase()
  if (!code) {
    showToast('Enter a room code first', 'error')
    return
  }
  localStorage.setItem('luca_sync_joined_room', code)
  if (status) status.textContent = `Joined room: ${code}`
  showToast(`Joined ${code}. Real-time sync hooks are ready.`, 'success')
}

// ══════════════════════════════════════════════════════════
//  CUSTOM NEW PLAYLIST MODAL (replaces prompt())
// ══════════════════════════════════════════════════════════
let _newPlaylistCallback = null

function openNewPlaylistModal(callback) {
  _newPlaylistCallback = callback
  const modal = document.getElementById('newPlaylistModal')
  const input = document.getElementById('newPlaylistNameInput')
  if (!modal || !input) return
  input.value = ''
  modal.style.display = 'flex'
  setTimeout(() => input.focus(), 80)
}
function closeNewPlaylistModal() {
  document.getElementById('newPlaylistModal').style.display = 'none'
  _newPlaylistCallback = null
}
async function confirmNewPlaylist() {
  const name = document.getElementById('newPlaylistNameInput').value.trim()
  if (!name) return
  closeNewPlaylistModal()
  if (_newPlaylistCallback) _newPlaylistCallback(name)
}

// ══════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════
async function initAuth() {
  const { data: { session } } = await db.auth.getSession()
  currentUser = session?.user || null
  updateUserUI()
  db.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null
    updateUserUI()
    await loadSidebarPlaylists()
  })
}

function updateUserUI() {
  const name = currentUser?.user_metadata?.full_name
             || currentUser?.user_metadata?.name
             || currentUser?.email?.split('@')[0]
             || localStorage.getItem('luca_guest_name')
             || 'Guest'
  const init = name.charAt(0).toUpperCase()
  userProfileBtn.textContent = init
  suAvatar.textContent       = init
  suName.textContent         = name
  suAction.textContent       = currentUser ? 'View Profile' : 'Sign in for more ↗'
  renderGreeting()
}

// ══════════════════════════════════════════════════════════
//  LIKED SONGS
// ══════════════════════════════════════════════════════════
async function fetchLikedIds() {
  if (!currentUser) {
    const arr = JSON.parse(localStorage.getItem('luca_liked') || '[]')
    return new Set(arr.map(t => t.song_id))
  }
  const { data } = await db.from('liked_songs').select('song_id')
  return new Set((data || []).map(r => r.song_id))
}
let likedIdsCache = new Set()
async function refreshLikedCache() { likedIdsCache = await fetchLikedIds() }
function isLiked(track) { return likedIdsCache.has(track.id || track.song_id) }

async function toggleLike(track, btnEl) {
  const id    = track.id || track.song_id
  const liked = likedIdsCache.has(id)
  if (liked) {
    likedIdsCache.delete(id)
    if (btnEl) { btnEl.textContent = '🤍'; btnEl.classList.remove('active') }
    if (!currentUser) {
      const arr = JSON.parse(localStorage.getItem('luca_liked') || '[]')
      localStorage.setItem('luca_liked', JSON.stringify(arr.filter(t => t.song_id !== id)))
    } else {
      await db.from('liked_songs').delete().eq('user_id', currentUser.id).eq('song_id', id)
    }
    showToast('Removed from Liked Songs', 'info')
  } else {
    likedIdsCache.add(id)
    if (btnEl) { btnEl.textContent = '❤️'; btnEl.classList.add('active') }
    const entry = { song_id: id, title: track.title, artist: track.artist, cover: track.cover, src: track.src, duration: track.duration || 0 }
    if (!currentUser) {
      const arr = JSON.parse(localStorage.getItem('luca_liked') || '[]')
      if (!arr.find(t => t.song_id === id)) arr.unshift({ ...entry, liked_at: new Date().toISOString() })
      localStorage.setItem('luca_liked', JSON.stringify(arr))
    } else {
      await db.from('liked_songs').upsert({ user_id: currentUser.id, ...entry })
    }
    showToast('Added to Liked Songs ❤️', 'heart')
  }
  updateNowPlayingLikeBtn()
}

function updateNowPlayingLikeBtn() {
  const track = playQueue[playIndex]; if (!track) return
  const liked = isLiked(track)
  nowPlayingLikeBtn.textContent = liked ? '❤️' : '🤍'
  nowPlayingLikeBtn.classList.toggle('active', liked)
}

// ══════════════════════════════════════════════════════════
//  HISTORY
// ══════════════════════════════════════════════════════════
async function recordHistory(track) {
  const entry = { song_id: track.id, title: track.title, artist: track.artist, cover: track.cover, src: track.src, duration: track.duration || 0 }
  if (!currentUser) {
    const arr = JSON.parse(localStorage.getItem('luca_history') || '[]')
    arr.unshift({ ...entry, played_at: new Date().toISOString() })
    localStorage.setItem('luca_history', JSON.stringify(arr.slice(0, 100)))
  } else {
    await db.from('listening_history').insert({ user_id: currentUser.id, ...entry })
  }
}

// ══════════════════════════════════════════════════════════
//  PLAYLISTS
// ══════════════════════════════════════════════════════════
let userPlaylists = []

async function loadSidebarPlaylists() {
  if (!currentUser) {
    sidebarPlaylists.innerHTML = '<p class="playlist-empty-msg">Sign in to create playlists</p>'
    userPlaylists = []; return
  }
  const { data } = await db.from('playlists').select('*').order('created_at', { ascending: false })
  userPlaylists = data || []
  renderSidebarPlaylists()
}

function renderSidebarPlaylists() {
  sidebarPlaylists.innerHTML = userPlaylists.length === 0
    ? '<p class="playlist-empty-msg">No playlists yet. Hit + to create one.</p>'
    : userPlaylists.map(pl => `<p data-pid="${pl.id}" onclick="openPlaylistDetail('${pl.id}')">${pl.name}</p>`).join('')
}

async function createPlaylist(name) {
  if (!currentUser) { showToast('Sign in to create playlists', 'error'); return null }
  const { data, error } = await db.from('playlists').insert({ user_id: currentUser.id, name }).select().single()
  if (error) { showToast('Error creating playlist', 'error'); return null }
  userPlaylists.unshift(data); renderSidebarPlaylists()
  showToast(`Playlist "${name}" created`, 'success')
  return data
}

async function openPlaylistDetail(playlistId) {
  currentPlaylistId = playlistId
  const playlist = userPlaylists.find(p => p.id === playlistId); if (!playlist) return
  showView('playlistDetail')
  document.getElementById('pdName').textContent  = playlist.name
  document.getElementById('pdCount').textContent = 'Loading…'
  const { data: songs } = await db.from('playlist_songs').select('*').eq('playlist_id', playlistId).order('position', { ascending: true })
  viewTracks   = (songs || []).map(s => ({ ...s, id: s.song_id }))
  isHomeRender = false
  document.getElementById('pdCount').textContent = `${viewTracks.length} song${viewTracks.length !== 1 ? 's' : ''}`
  if (viewTracks[0]?.cover) document.getElementById('pdCover').innerHTML = `<img src="${viewTracks[0].cover}" alt=""/>`
  buildPlaylistDetailUI()
}

function buildPlaylistDetailUI() {
  const list = document.getElementById('pdTrackList'); list.innerHTML = ''
  viewTracks.forEach((t, i) => {
    const item = document.createElement('div'); item.className = 'track-item'
    item.innerHTML = `
      <span class="ti-index">${i + 1}</span>
      <div class="ti-info"><img class="ti-cover" src="${t.cover || ''}" alt="" loading="lazy"/><span class="ti-title">${t.title}</span></div>
      <span class="ti-artist">${t.artist}</span>
      <div class="ti-like"><button class="like-btn ${isLiked(t) ? 'active' : ''}" onclick="event.stopPropagation();toggleLike(viewTracks[${i}],this)">${isLiked(t) ? '❤️' : '🤍'}</button></div>
      <span class="ti-time">${fmtTime(t.duration)}</span>
    `
    item.addEventListener('click', () => activateQueueAndPlay(i))
    list.appendChild(item)
  })
}

function playPlaylist() { if (viewTracks.length) activateQueueAndPlay(0) }

// FIX: replaced confirm() with showConfirm()
function deleteCurrentPlaylist() {
  if (!currentPlaylistId) return
  showConfirm('Delete Playlist', 'This action cannot be undone. Are you sure?', async () => {
    await db.from('playlists').delete().eq('id', currentPlaylistId)
    userPlaylists = userPlaylists.filter(p => p.id !== currentPlaylistId)
    renderSidebarPlaylists()
    showToast('Playlist deleted', 'info')
    currentPlaylistId = null
    loadHomeCategories()
  })
}

function openAddToPlaylistModal(track) {
  songToAdd = track
  if (!currentUser) { showToast('Sign in to save to playlists', 'error'); return }
  document.getElementById('modalTitle').textContent = `Add "${track.title}"`
  newPlaylistInput.value = ''
  modalPlaylistList.innerHTML = userPlaylists.length === 0
    ? '<p style="color:var(--muted2);font-size:14px;padding:8px 0">No playlists yet.</p>'
    : userPlaylists.map(pl => `<div class="modal-playlist-item" onclick="addSongToExistingPlaylist('${pl.id}','${pl.name}')">${pl.name}</div>`).join('')
  playlistModal.style.display = 'flex'
}
function closeModal() { playlistModal.style.display = 'none'; songToAdd = null }

async function addSongToExistingPlaylist(playlistId, playlistName) {
  if (!songToAdd) return; closeModal()
  const pos = await db.from('playlist_songs').select('id', { count: 'exact', head: true }).eq('playlist_id', playlistId)
  await db.from('playlist_songs').insert({
    playlist_id: playlistId, song_id: songToAdd.id, title: songToAdd.title,
    artist: songToAdd.artist, cover: songToAdd.cover, src: songToAdd.src,
    duration: songToAdd.duration || 0, position: pos.count || 0
  })
  showToast(`Added to "${playlistName}"`, 'success')
}

async function createPlaylistFromModal() {
  const name = newPlaylistInput.value.trim(); if (!name) return
  const playlist = await createPlaylist(name)
  if (playlist && songToAdd) await addSongToExistingPlaylist(playlist.id, playlist.name)
  closeModal()
}

// ══════════════════════════════════════════════════════════
//  API FETCH
// ══════════════════════════════════════════════════════════
async function fetchFromMirrors(query, page = 1, limit = 50, type = 'songs') {
  const apiPage = page > 0 ? page - 1 : 0
  const endpoint = `/api/search/${type}?query=${encodeURIComponent(query)}&page=${apiPage}&limit=${limit}`
  try {
    const json = await lucaFetch(endpoint)
    if (json) return json
    throw new Error('Empty response')
  } catch (e) {
    return await lucaFetch(`${API_CONFIG.BACKUP}/api/search/songs?query=${encodeURIComponent(query)}&page=${apiPage}`)
  }
}

function extractResults(json) {
  if (!json) return []
  if (json?.data?.results)               return json.data.results
  if (json?.data?.songs?.results)        return json.data.songs.results
  if (json?.data?.albums?.results)       return json.data.albums.results
  if (json?.data?.playlists?.results)    return json.data.playlists.results
  if (Array.isArray(json?.data))         return json.data
  if (Array.isArray(json))               return json
  return []
}

function normalizeLyricsPayload(root) {
  const source = Array.isArray(root) ? root[0] : root
  if (!source) return null
  const lyr = source.lyrics || source
  const synced = lyr.syncedLyrics || lyr.synced || source.syncedLyrics || source.synced
  if (Array.isArray(synced) && synced.length) return { type: 'synced_array', data: synced }

  const timestampCandidates = [
    lyr.lyrics,
    lyr.text,
    lyr.plainLyrics,
    lyr.syncedLyricsText,
    source.plainLyrics,
    source.syncedLyrics,
    source.plain,
  ].filter(v => typeof v === 'string' && v.trim().length > 0)

  for (const candidate of timestampCandidates) {
    if (/\[\d{1,2}:\d{2}(?:[.:]\d{2,3})?\]/.test(candidate)) return { type: 'lrc', data: candidate }
  }

  const plain = timestampCandidates.find(v => v.trim().length > 10)
  if (plain) return { type: 'plain', data: plain }
  return null
}

async function fetchLrclibLyrics(track) {
  const cleanTitle = (track.title || '').replace(/\(.*?\)|\[.*?\]|from.*$/i, '').trim()
  const artistCandidates = [
    (track.artist || '').trim(),
    (track.artist || '').split(',')[0]?.trim(),
    (track.artist || '').split('&')[0]?.trim(),
  ].filter(Boolean)
  const titleCandidates = [cleanTitle, (track.title || '').trim()].filter(Boolean)

  for (const title of titleCandidates) {
    for (const artist of artistCandidates) {
      try {
        const res = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`, {
          signal: AbortSignal.timeout(8000)
        })
        if (!res.ok) continue
        const rows = await res.json()
        const best = Array.isArray(rows) ? rows.find(r => r.syncedLyrics || r.plainLyrics) : null
        if (!best) continue
        if (best.syncedLyrics) return { type: 'lrc', data: best.syncedLyrics }
        if (best.plainLyrics) return { type: 'plain', data: best.plainLyrics }
      } catch (_) {}
    }
  }
  for (const title of titleCandidates) {
    try {
      const res = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}`, {
        signal: AbortSignal.timeout(8000)
      })
      if (!res.ok) continue
      const rows = await res.json()
      const best = Array.isArray(rows) ? rows.find(r => r.syncedLyrics || r.plainLyrics) : null
      if (!best) continue
      if (best.syncedLyrics) return { type: 'lrc', data: best.syncedLyrics }
      if (best.plainLyrics) return { type: 'plain', data: best.plainLyrics }
    } catch (_) {}
  }
  return null
}

async function fetchLyricsPayload(track) {
  if (!track) return null

  try {
    const cached = await getLyricFromCache(track.id)
    if (cached) return cached
  } catch (_) {}

  const attempts = []
  if (track.id) attempts.push(() => lucaFetch(`/api/songs/${track.id}?lyrics=true`, { timeout: 8000 }))
  attempts.push(async () => {
    const q = encodeURIComponent(`${track.title} ${track.artist}`)
    const searchJson = await lucaFetch(`/api/search/songs?query=${q}&page=1&limit=5`, { timeout: 7000 })
    const results = extractResults(searchJson)
    for (const candidate of results) {
      const payload = normalizeLyricsPayload(candidate)
      if (payload) return { data: candidate }
      if (candidate?.id) {
        const lyrJson = await lucaFetch(`/api/songs/${candidate.id}?lyrics=true`, { timeout: 7000 })
        const parsed = normalizeLyricsPayload(lyrJson?.data)
        if (parsed) return { parsed }
      }
    }
    return null
  })

  for (const attempt of attempts) {
    try {
      const result = await attempt()
      const payload = result?.parsed || normalizeLyricsPayload(result?.data)
      if (payload) {
        setLyricToCache(track.id, payload)
        return payload
      }
    } catch (_) {}
  }

  const lrclibPayload = await fetchLrclibLyrics(track)
  if (lrclibPayload) {
    setLyricToCache(track.id, lrclibPayload)
    return lrclibPayload
  }

  try {
    const artist = encodeURIComponent(track.artist.replace(/[^a-zA-Z0-9 ]/g, '').trim())
    const title = encodeURIComponent(track.title.replace(/[^\w\s]/g, '').trim())
    const res = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`, { signal: AbortSignal.timeout(6000) })
    if (res.ok) {
      const json = await res.json()
      if (json?.lyrics?.trim().length > 20) {
        const payload = { type: 'plain', data: json.lyrics }
        setLyricToCache(track.id, payload)
        return payload
      }
    }
  } catch (_) {}

  return null
}

window.fetchLyricsPayload = fetchLyricsPayload

function buildTrackObj(song) {
  const dur = Number(song.duration) || 0
  if (dur > 0 && dur < 45) return null
  const audioObj = song.downloadUrl?.[4] || song.downloadUrl?.[song.downloadUrl.length - 1]
  if (!audioObj) return null
  const coverUrl = getSafeImageUrl(song.image)
  return {
    id: song.id,
    src: audioObj.url,
    title: song.name || song.title || 'Unknown',
    artist: song.artists?.primary?.[0]?.name || song.artists?.all?.[0]?.name || 'Unknown',
    album: song.album?.name || 'Single',
    cover: coverUrl,
    duration: dur,
    hasLyrics: !!song.hasLyrics
  }
}
function filterTracks(songs) { return songs.map(buildTrackObj).filter(Boolean) }

// ── Time-Based Trending ─────────────────────────────────
function getTimeBasedGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return { text: 'Good Morning',   emoji: '☀️',  vibe: 'morning'   }
  if (h >= 12 && h < 17) return { text: 'Good Afternoon', emoji: '🌤️', vibe: 'afternoon' }
  if (h >= 17 && h < 21) return { text: 'Good Evening',   emoji: '🌆',  vibe: 'evening'   }
  return                         { text: 'Good Night',     emoji: '🌙',  vibe: 'night'     }
}

function getDailyTrendingQuery() {
  const doy  = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  const pools = {
    morning:   ['fresh hindi songs 2026', 'new bollywood morning 2026', 'upbeat hindi latest', 'trending new 2026 hindi'],
    afternoon: ['top bollywood hits 2026', 'hindi superhit 2026 popular', 'number one song india 2026'],
    evening:   ['party bollywood 2026 trending', 'punjabi party 2026', 'dj bollywood night 2026'],
    night:     ['lofi chill hindi 2025', 'sad emotional hindi night', 'lofi bollywood slow night'],
  }
  const g = getTimeBasedGreeting()
  const pool = pools[g.vibe]
  return pool[doy % pool.length]
}

function getTimeBasedFirstRow() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return { id: 'cat_morning',   title: '🌅 Morning Fresh',    query: 'new fresh hindi songs 2026'       }
  if (h >= 12 && h < 17) return { id: 'cat_afternoon', title: '☀️ Afternoon Hits',   query: 'top bollywood 2026 popular'       }
  if (h >= 17 && h < 21) return { id: 'cat_evening',   title: '🌆 Evening Bangers',  query: 'party punjabi bollywood 2026'     }
  return                         { id: 'cat_night',     title: '🌙 Night Vibes',      query: 'lofi sad hindi chill 2025'        }
}

const SOUTH_SCRIPT_RANGE = /[\u0C00-\u0C7F\u0C80-\u0CFF\u0B80-\u0BFF]/
function isMainstreamTrack(track) {
  return !SOUTH_SCRIPT_RANGE.test((track.title || '') + ' ' + (track.artist || ''))
}

// ══════════════════════════════════════════════════════════
//  POPULAR ARTISTS
// ══════════════════════════════════════════════════════════
async function loadArtistsRow() {
  const container = document.getElementById('homeRowsContainer')
  if (!container) return
  const existing = document.getElementById('artists-section')
  if (existing) existing.remove()

  const section = document.createElement('div')
  section.className = 'artists-section'
  section.id = 'artists-section'
  section.innerHTML = `
    <div class="artists-section-header">
      <h2 class="artists-section-title">🎤 Popular Artists</h2>
      <button class="see-all-link" onclick="renderSeeAllArtists()">See All →</button>
    </div>
    <div class="artists-scroll" id="artistsScroll">
      ${POPULAR_ARTISTS.map(() => `
        <div class="artist-card skel">
          <div class="artist-img-wrap"></div>
          <div class="artist-name">Loading…</div>
          <div class="artist-genre">···</div>
        </div>
      `).join('')}
    </div>
  `
  container.insertBefore(section, container.firstChild)

  const homeArtists = [...POPULAR_ARTISTS]
  const results = await Promise.allSettled(homeArtists.map(artist => fetchArtistImage(artist)))

  const scroll = document.getElementById('artistsScroll')
  if (!scroll) return
  scroll.innerHTML = ''
  results.forEach((result, i) => {
    const artist = homeArtists[i]
    const imgSrc = result.status === 'fulfilled' ? result.value : null
    scroll.appendChild(buildArtistCard(artist, imgSrc))
  })

  if (window.gsap) {
    gsap.from('#artists-section .artist-card', { y: 24, opacity: 0, duration: 0.55, stagger: 0.06, ease: 'back.out(1.4)' })
  }
}

async function fetchArtistImage(artist) {
  try {
    const json = await lucaFetch(`/api/search/songs?query=${encodeURIComponent(artist.query)}&page=1&limit=3`, { timeout: 6000 })
    const results = extractResults(json)
    if (!results?.length) return null
    for (const track of results) {
      const cover = getPreferredImageUrl(track.image)
      if (cover && typeof cover === 'string' && cover.startsWith('http')) return cover
    }
  } catch (_) {}
  return null
}

// FIX: removed inline styles — use .artist-circular CSS class instead
function buildArtistCard(artist, imgSrc) {
  const card = document.createElement('div')
  card.className = 'poster-card artist-card'
  const finalSrc = imgSrc || LUCA_VINYL_PLACEHOLDER
  card.innerHTML = `
    <div class="poster-img-container artist-circular">
      <img src="${finalSrc}" alt="${artist.name}" class="artist-img" loading="lazy">
      <div class="poster-play-btn">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
    <div class="poster-title artist-name-label">${artist.name}</div>
    <div class="poster-subtitle artist-genre-label">${artist.genre || 'Artist'}</div>
  `
  card.onclick = () => {
    if (artist.id) fetchArtistDetail(artist.id, artist.name)
    else fetchSongs(artist.name, false, `🎤 ${artist.name}`, 'songs')
  }
  return card
}

// ══════════════════════════════════════════════════════════
//  HOME CATEGORIES — Netflix rows
// ══════════════════════════════════════════════════════════
async function loadHomeCategories() {
  currentQuery = ''; isHomeRender = true; showView('home')
  document.getElementById('homeRowsContainer').style.display = 'block'
  document.getElementById('gridContainer').style.display     = 'none'
  renderGreeting()

  const today = new Date().toISOString().slice(0, 10)
  const lastLoadDate = localStorage.getItem('luca_home_date')
  if (lastLoadDate !== today || Object.keys(homeData).length === 0) {
    homeData = {}
    localStorage.setItem('luca_home_date', today)
  }

  loadArtistsRow()

  if (Object.keys(homeData).length > 0) {
    const container = document.getElementById('homeRowsContainer')
    container.querySelectorAll('.home-row').forEach(r => r.remove())
    HOME_CATEGORIES.forEach(cat => {
      if (homeData[cat.id]?.length) {
        const row = document.createElement('div')
        row.className = 'home-row'; row.id = `row_${cat.id}`
        const dt = cat.title === '__GREETING__'
          ? (() => { const g = getTimeBasedGreeting(); return `${g.emoji} ${g.text} — Top Picks` })()
          : cat.title
        row.innerHTML = `
          <div class="row-header">
            <h2 class="home-row-title">${dt}</h2>
            <button class="see-all-link" onclick="renderSeeAllCategory('${cat.id}')">See All →</button>
          </div>
          <div class="home-row-cards" id="cards_${cat.id}"></div>`
        container.appendChild(row)
        renderRow(cat.id, homeData[cat.id])
      }
    })
    loadRecommendedRow()
    return
  }

  const container = document.getElementById('homeRowsContainer')
  container.querySelectorAll('.home-row').forEach(r => r.remove())

  HOME_CATEGORIES.forEach(cat => {
    homeData[cat.id] = []
    const row = document.createElement('div')
    row.className = 'home-row'; row.id = `row_${cat.id}`
    const displayTitle = cat.title === '__GREETING__'
      ? (() => { const g = getTimeBasedGreeting(); return `${g.emoji} ${g.text} — Top Picks` })()
      : cat.title
    row.innerHTML = `
      <div class="row-header">
        <h2 class="home-row-title">${displayTitle}</h2>
        <button class="see-all-link" onclick="renderSeeAllCategory('${cat.id}')">See All →</button>
      </div>
      <div class="home-row-cards" id="cards_${cat.id}">
        ${'<div class="poster-card skel"><div class="sk-img"></div><div class="sk-line l1"></div><div class="sk-line l2"></div></div>'.repeat(8)}
      </div>
    `
    container.appendChild(row)
  })

  let i = 0
  async function worker() {
    while (i < HOME_CATEGORIES.length) {
      const cat = HOME_CATEGORIES[i++]
      try {
        let resolvedQuery = cat.query
        if (cat.id === 'cat_greeting') {
          const tRow = getTimeBasedFirstRow()
          resolvedQuery = tRow.query
          const titleEl = document.querySelector(`#row_${cat.id} .home-row-title`)
          if (titleEl) titleEl.textContent = tRow.title
        } else if (cat.query === '__DAILY_TRENDING__') {
          resolvedQuery = getDailyTrendingQuery()
        }
        const json = await fetchFromMirrors(resolvedQuery, 1, 50)
        const results = extractResults(json)
        if (results.length) {
          let tracks = filterTracks(results)
          if (cat.id === 'cat_trending') tracks = tracks.filter(isMainstreamTrack)
          tracks = await enrichCategoryTracks(cat, tracks)
          for (let k = tracks.length - 1; k > 0; k--) {
            const j = Math.floor(Math.random() * (k + 1));[tracks[k], tracks[j]] = [tracks[j], tracks[k]]
          }
          homeData[cat.id] = tracks
          renderRow(cat.id, homeData[cat.id])
        } else {
          const el = document.getElementById(`row_${cat.id}`)
          if (el) el.style.display = 'none'
        }
      } catch (e) {
        const el = document.getElementById(`row_${cat.id}`)
        if (el) el.style.display = 'none'
      }
    }
  }
  const workers = []; for (let w = 0; w < 6; w++) workers.push(worker())
  await Promise.all(workers)
  loadRecommendedRow()
}

function renderRow(catId, items) {
  const container = document.getElementById(`cards_${catId}`); if (!container) return
  container.innerHTML = ''
  const displayItems = items.slice(0, 24)
  if (!displayItems.length) {
    const rowEl = document.getElementById(`row_${catId}`)
    if (rowEl) rowEl.style.display = 'none'
    return
  }
  displayItems.forEach((item, i) => {
    const card = createPosterElement(item, () => playFromRow(catId, i))
    if (card) container.appendChild(card)
  })
}

function mergeUniqueTracks(primary = [], fallback = []) {
  const seen = new Set()
  return [...primary, ...fallback].filter((track) => {
    const key = track?.id || `${track?.title}|${track?.artist}`
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function enrichCategoryTracks(cat, tracks) {
  if ((tracks?.length || 0) >= 8) return tracks
  const fallbackQueryMap = {
    cat_viral: 'viral hindi songs 2026 india hits',
    cat_sad: 'sad hindi emotional songs jukebox',
    cat_party: 'bollywood party songs nonstop mix',
    cat_romantic: 'romantic hindi songs all time hits',
    cat_lofi: 'lofi hindi chill mix',
    cat_workout: 'workout gym songs hindi punjabi',
    cat_pop: 'english pop songs playlist hits',
    cat_nostalgia: '90s 2000s bollywood classics'
  }
  const fallbackQuery = fallbackQueryMap[cat.id] || cat.query
  try {
    const json = await fetchFromMirrors(fallbackQuery, 1, 40)
    const fallbackTracks = filterTracks(extractResults(json))
    return mergeUniqueTracks(tracks, fallbackTracks)
  } catch (_) {
    return tracks
  }
}

async function loadRecommendedRow(forceTrack = null) {
  const container = document.getElementById('homeRowsContainer')
  if (!container) return
  document.getElementById('row_recommended')?.remove()

  const row = document.createElement('div')
  row.className = 'home-row'
  row.id = 'row_recommended'
  row.innerHTML = `
    <div class="row-header">
      <h2 class="home-row-title">Recommended For Today</h2>
      <button class="see-all-link" onclick="openRecommendationsSeeAll()">Show All</button>
    </div>
    <div class="home-row-cards" id="cards_recommended">
      ${renderCardSkeletons(8)}
    </div>
  `
  container.insertBefore(row, container.children[1] || null)

  const baseTrack = forceTrack || playQueue[playIndex] || JSON.parse(localStorage.getItem('luca_history') || '[]')[0] || homeData.cat_greeting?.[0]
  const query = baseTrack?.title
    ? `${baseTrack.title} ${baseTrack.artist || ''}`
    : 'recommended hindi songs 2026'
  const recommendationSeed = `${baseTrack?.id || ''}|${query}`
  if (lastRecommendationSeed === recommendationSeed && homeData.recommended?.length) {
    const cards = document.getElementById('cards_recommended')
    if (cards) {
      cards.innerHTML = ''
      homeData.recommended.slice(0, 24).forEach((track, i) => {
        const card = createPosterElement(track, () => {
          playQueue = [...homeData.recommended]
          playIndex = i
          loadTrack(i)
          play()
          renderQueue()
        })
        if (card) cards.appendChild(card)
      })
    }
    return
  }

  try {
    let tracks = []
    if (baseTrack?.id) {
      const json = await lucaFetch(`/api/songs/${baseTrack.id}/suggestions?limit=25`, { timeout: 8000 })
      tracks = filterTracks(extractResults(json))
    }
    if (!tracks.length) {
      const json = await fetchFromMirrors(query, 1, 30, 'songs')
      tracks = filterTracks(extractResults(json))
    }
    homeData.recommended = tracks
    lastRecommendationSeed = recommendationSeed
    const cards = document.getElementById('cards_recommended')
    if (!cards) return
    cards.innerHTML = ''
    tracks.slice(0, 24).forEach((track, i) => {
      const card = createPosterElement(track, () => {
        playQueue = [...tracks]
        playIndex = i
        loadTrack(i)
        play()
        renderQueue()
      })
      if (card) cards.appendChild(card)
    })
  } catch (_) {
    const cards = document.getElementById('cards_recommended')
    if (cards) cards.innerHTML = '<div class="discovery-empty-msg">Recommendations will appear after a few plays.</div>'
  }
}

function openRecommendationsSeeAll() {
  const tracks = homeData.recommended || []
  if (!tracks.length) return
  renderSeeAllGrid('songs', tracks, 'Recommended For Today', 'recommended')
  currentQuery = playQueue[playIndex]?.title
    ? `${playQueue[playIndex].title} ${playQueue[playIndex].artist || ''}`
    : 'recommended hindi songs 2026'
  currentFetchType = 'songs'
  currentSeeAllMode = 'recommendations'
  currentPage = 1
}

function createGenericPoster(item, type) {
  const card = document.createElement('div'); card.className = 'poster-card'
  const imgUrl  = getSafeImageUrl(item.image)
  const title   = item.name || item.title || 'Untitled'
  const subtitle = item.artists?.primary?.[0]?.name || item.description || (type === 'albums' ? item.year : '') || ''
  card.innerHTML = `
    <div class="image-wrapper${type === 'artist' ? ' artist-circular' : ''}">
      <img src="${imgUrl}" class="poster-img${type === 'artist' ? ' artist-img' : ''}" loading="lazy">
      <div class="play-btn-overlay">
        <svg fill="#000" viewBox="0 0 24 24" width="30" height="30"><path d="M8 5v14l11-7z"></path></svg>
      </div>
    </div>
    <div class="poster-title" title="${title}">${title}</div>
    <div class="poster-artist" title="${subtitle}">${subtitle}</div>
  `
  card.onclick = () => {
    const itemType = item.type || type
    if (itemType === 'album')          fetchAlbumDetail(item.id, title)
    else if (itemType === 'playlist')  fetchPlaylistDetail(item.id, title)
    else if (itemType === 'artist')    fetchArtistDetail(item.id, title)
    else if (item.downloadUrl) {
      const t = buildTrackObj(item)
      if (t) { playQueue = [t]; playIndex = 0; loadTrack(0); play(); renderQueue() }
    }
  }
  return card
}

function createPosterElement(t, onClick) {
  const card = document.createElement('div'); card.className = 'poster-card'
  card.innerHTML = `
    <div class="image-wrapper">
      <img src="${t.cover || LUCA_VINYL_PLACEHOLDER}" class="poster-img" alt="${t.title}" loading="lazy" crossorigin="anonymous"/>
      <button class="card-add-btn" title="Add to Playlist">+</button>
      <button class="card-like-btn like-btn ${isLiked(t) ? 'active' : ''}">${isLiked(t) ? '❤️' : '🤍'}</button>
      <div class="play-btn-overlay"><svg fill="#000" viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z"></path></svg></div>
    </div>
    <div class="poster-title" title="${t.title}">${t.title}</div>
    <div class="poster-artist" title="${t.artist}">${t.artist}</div>
  `
  card.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.classList.contains('like-btn')) return
    onClick()
  })
  card.querySelector('.card-like-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleLike(t, e.currentTarget) })
  card.querySelector('.card-add-btn').addEventListener('click',  (e) => { e.stopPropagation(); openAddToPlaylistModal(t) })
  return card
}

// ── See All ─────────────────────────────────────────────
function renderSeeAllCategory(catId) {
  const tracks = homeData[catId]
  if (!tracks || !tracks.length) return
  const cat = HOME_CATEGORIES.find(c => c.id === catId)
  const title = (catId === 'cat_greeting')
    ? document.querySelector(`#row_${catId} .home-row-title`).textContent
    : cat.title
  renderSeeAllGrid('songs', tracks, title, catId)
  currentFetchType = 'songs'
  currentSeeAllMode = 'category'
  currentPage = 1
  currentQuery = cat?.query === '__DAILY_TRENDING__' ? getDailyTrendingQuery() : (cat?.query || '')
}

function renderSeeAllArtists() {
  currentQuery = ''
  currentFetchType = 'artists'
  currentSeeAllMode = 'artists'
  currentPage = 1
  renderSeeAllGrid('artists', POPULAR_ARTISTS, '🎤 Popular Artists')
}

function renderSeeAllGrid(type, data, title, catId = null) {
  lastScrollPos = contentScroll.scrollTop
  currentQuery = currentQuery || ''
  currentFetchType = type
  isHomeRender = true
  showView('home')
  document.getElementById('homeRowsContainer').style.display = 'none'
  document.getElementById('gridContainer').style.display = 'block'
  document.getElementById('multiGridContainer').style.display = 'none'
  document.getElementById('homeTitle').textContent = title
  posterGrid.innerHTML = ''
  posterGrid.dataset.type = type
  posterGrid.dataset.catId = catId || ''

  if (type === 'songs') {
    viewTracks = [...data]
    buildPostersUI(false)
  } else if (type === 'artists') {
    posterGrid.innerHTML = renderCardSkeletons(SKELETON_CARD_COUNT, { circular: true })
    Promise.all(data.map(async (artist) => [artist, await fetchArtistImage(artist)]))
      .then((pairs) => renderItemsInBatches(posterGrid, pairs, ([artist, src]) => buildArtistCard(artist, src), { batchSize: 12 }))
  } else {
    renderItemsInBatches(posterGrid, data, (item) => createGenericPoster(item, type))
  }

  gsap.from('.poster-card', { y: 20, opacity: 0, duration: .5, stagger: 0.02, ease: 'back.out(1.4)' })
  contentScroll.scrollTo({ top: 0, behavior: 'instant' })
}

async function fetchGlobalDiscovery(query) {
  if (!query) return
  lastScrollPos = contentScroll.scrollTop
  showView('home')
  document.getElementById('homeRowsContainer').style.display = 'none'
  document.getElementById('gridContainer').style.display = 'none'
  document.getElementById('multiGridContainer').style.display = 'block'
  document.getElementById('discoveryTitle').textContent = `Discovery: ${query}`

  const grids = ['albumGrid', 'artistGrid', 'playlistGrid']
  grids.forEach(id => {
    const circular = id === 'artistGrid'
    document.getElementById(id).innerHTML = renderCardSkeletons(circular ? 10 : 12, { circular })
  })

  try {
    const json = await lucaFetch(`/api/search?query=${encodeURIComponent(query)}`)
    const d = json.data
    if (d.songs?.results?.length) {
      const topTracks = filterTracks(d.songs.results)
      if (topTracks.length) {
        viewTracks = topTracks
        showView('search')
        document.getElementById('searchTitle').textContent = `Top Results: ${query}`
        buildPlaylistUI(false)
        return
      }
    }
    renderDiscoveryGrid('albumGrid',   d.albums?.results,    'album')
    renderDiscoveryGrid('artistGrid',  d.artists?.results,   'artist')
    renderDiscoveryGrid('playlistGrid',d.playlists?.results, 'playlist')
    contentScroll.scrollTo({ top: 0, behavior: 'instant' })
  } catch (e) {
    showToast('Discovery failed. Try again.', 'error')
  }
}

function renderDiscoveryGrid(gridId, results, type) {
  const container = document.getElementById(gridId)
  container.innerHTML = ''
  if (!results?.length) {
    container.innerHTML = '<p class="discovery-empty-msg">No results found.</p>'
    return
  }
  renderItemsInBatches(container, results, (item) => {
    const card = document.createElement('div')
    card.className = type === 'artist' ? 'poster-card artist-circular-card' : 'poster-card'
    card.innerHTML = `
      <div class="image-wrapper${type === 'artist' ? ' artist-circular' : ''}">
        <img src="${getSafeImageUrl(item.image)}" class="poster-img${type === 'artist' ? ' artist-img' : ''}"/>
        <div class="play-btn-overlay"><svg fill="#000" viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z"></path></svg></div>
      </div>
      <div class="poster-title">${item.name || item.title}</div>
      <div class="poster-artist">${item.artists?.primary?.[0]?.name || (item.songCount ? item.songCount + ' Songs' : '')}</div>
    `
    card.onclick = () => {
      if (type === 'album') fetchAlbumDetail(item.id, item.name)
      else if (type === 'artist') fetchArtistDetail(item.id, item.name)
      else fetchSongs(item.name || item.title, true, item.name || item.title)
    }
    return card
  }, { batchSize: 18 })
}

async function fetchAlbumDetail(id, name) {
  showView('search'); document.getElementById('searchTitle').textContent = `Album: ${name}`
  playlistList.innerHTML = renderTrackListSkeleton()
  try {
    const json = await lucaFetch(`/api/albums?id=${id}`)
    const tracks = filterTracks(json?.data?.songs || [])
    viewTracks = tracks; buildPlaylistUI(false)
  } catch (_) { showToast('Could not load album', 'error') }
}

async function fetchArtistDetail(id, name) {
  showView('search'); document.getElementById('searchTitle').textContent = `Artist: ${name}`
  playlistList.innerHTML = renderTrackListSkeleton()
  try {
    const json = await lucaFetch(`/api/artists/${id}/top-songs`)
    const tracks = filterTracks(json?.data || [])
    viewTracks = tracks; buildPlaylistUI(false)
  } catch (_) { showToast('Could not load artist', 'error') }
}

function playFromRow(catId, index) {
  playQueue = [...homeData[catId]]; playIndex = index
  loadTrack(playIndex); play(); renderQueue()
}

// ══════════════════════════════════════════════════════════
//  FETCH SONGS (search / liked / history)
// ══════════════════════════════════════════════════════════
async function fetchSongs(query, isHome = false, title = '', type = 'songs', page = 1) {
  if (isFetching) return
  isFetching = true

  if (page === 1) {
    currentQuery = query; currentPage = 1; viewTracks = []; isHomeRender = isHome; currentFetchType = type
    showView(isHome ? 'home' : 'search')
    if (isHome) {
      document.getElementById('homeRowsContainer').style.display = 'none'
      document.getElementById('gridContainer').style.display = 'block'
      posterGrid.innerHTML = renderCardSkeletons(SKELETON_CARD_COUNT, { circular: type === 'artists' })
      homeTitle.textContent = title
      posterGrid.dataset.type = type
    } else {
      playlistList.innerHTML = renderTrackListSkeleton()
      document.getElementById('searchTitle').textContent = title
    }
    loadingIndicator.style.display = isHome ? 'none' : 'block'
  } else {
    bottomLoader.style.display = 'block'
  }

  // FIX: !LIKED! — special handler
  if (query === '!LIKED!') {
    let tracks = !currentUser
      ? JSON.parse(localStorage.getItem('luca_liked') || '[]').map(t => ({ ...t, id: t.song_id }))
      : (await db.from('liked_songs').select('*').eq('user_id', currentUser.id).order('liked_at', { ascending: false })).data?.map(t => ({ ...t, id: t.song_id })) || []
    viewTracks = tracks
    finishRender(page, isHome, tracks.length === 0 ? 'No liked songs yet. Start liking songs ❤️' : '', 'songs')
    return
  }

  // FIX: !HISTORY! — was missing, now properly handled
  if (query === '!HISTORY!') {
    let tracks = !currentUser
      ? JSON.parse(localStorage.getItem('luca_history') || '[]').map(t => ({ ...t, id: t.song_id }))
      : (await db.from('listening_history').select('*').eq('user_id', currentUser.id).order('played_at', { ascending: false }).limit(100)).data?.map(t => ({ ...t, id: t.song_id })) || []
    viewTracks = tracks
    finishRender(page, isHome, tracks.length === 0 ? 'No listening history yet. Start playing songs!' : '', 'songs')
    return
  }

  try {
    const json = await fetchFromMirrors(query, page, 50, type)
    const results = extractResults(json)
    if (results.length) {
      if (type === 'songs') {
        const tracks = filterTracks(results)
        if (tracks.length) {
          viewTracks.push(...tracks)
          finishRender(page, isHome, '', 'songs')
        } else if (page === 1) {
          finishRender(page, isHome, 'No full-length tracks found.', 'songs')
        }
      } else {
        viewTracks.push(...results)
        finishRender(page, isHome, '', type)
      }
    } else if (page === 1) {
      finishRender(page, isHome, 'No results found.', type)
    }
  } catch (e) {
    console.error('Fetch Error:', e)
    if (page === 1) finishRender(page, isHome, 'Connection error.', type)
  } finally {
    isFetching = false
    hideLoading()
  }
}

function hideLoading() {
  loadingIndicator.style.display = 'none'
  bottomLoader.style.display = 'none'
}

function finishRender(page, isHome, emptyMsg, type = 'songs') {
  isFetching = false; hideLoading()
  if (emptyMsg) {
    const msg = `<div style="text-align:center;padding:40px;color:var(--muted2);">${emptyMsg}</div>`
    isHome ? posterGrid.innerHTML = msg : playlistList.innerHTML = msg; return
  }
  isHome ? buildPostersUI(page > 1, type) : buildPlaylistUI(page > 1)
}

function showView(view) {
  homeView.style.display = searchView.style.display = profileView.style.display = playlistDetailView.style.display = 'none'
  if (view === 'home')           homeView.style.display = 'block'
  else if (view === 'search')    searchView.style.display = 'block'
  else if (view === 'profile')   { profileView.style.display = 'block'; renderProfileView() }
  else if (view === 'playlistDetail') playlistDetailView.style.display = 'block'
}

function buildPostersUI(append, type = 'songs') {
  const start = append ? posterGrid.children.length : 0
  if (!append) { posterGrid.innerHTML = ''; posterGrid.dataset.type = type }
  const currentType = type || posterGrid.dataset.type || 'songs'
  renderItemsInBatches(
    posterGrid,
    viewTracks.slice(start),
    (item, relIdx) => {
      const i = start + relIdx
      if (currentType === 'songs' && item.src) return createPosterElement(item, () => activateQueueAndPlay(i))
      return createGenericPoster(item, currentType)
    },
    { batchSize: append ? 20 : 16, reset: !append }
  )
  if (!append) gsap.from('.poster-card', { y: 20, opacity: 0, duration: .5, stagger: .04, ease: 'back.out(1.4)' })
}

function buildPlaylistUI(append) {
  const start = append ? playlistList.children.length : 0
  if (!append) playlistList.innerHTML = ''
  viewTracks.slice(start).forEach((t, relIdx) => {
    const i = start + relIdx; const item = document.createElement('div'); item.className = 'track-item'
    item.innerHTML = `
      <span class="ti-index">${i + 1}</span>
      <div class="ti-info"><img class="ti-cover" src="${t.cover || LUCA_VINYL_PLACEHOLDER}" alt="" loading="lazy"/>
      <span class="ti-title">${t.title}</span></div>
      <span class="ti-artist">${t.artist}</span>
      <div class="ti-like" style="display:flex;align-items:center;gap:6px;">
        <button class="like-btn ${isLiked(t) ? 'active' : ''}" onclick="event.stopPropagation();toggleLike(viewTracks[${i}],this)">${isLiked(t) ? '❤️' : '🤍'}</button>
        <button class="ti-add-btn" onclick="event.stopPropagation();openAddToPlaylistModal(viewTracks[${i}])">+</button>
      </div>
      <span class="ti-time">${fmtTime(t.duration)}</span>
    `
    item.addEventListener('click', () => activateQueueAndPlay(i))
    playlistList.appendChild(item)
  })
}

// ══════════════════════════════════════════════════════════
//  PLAYBACK ENGINE
// ══════════════════════════════════════════════════════════
function activateQueueAndPlay(index) {
  playQueue = [...viewTracks]; playIndex = index; loadTrack(playIndex); play(); renderQueue()
  if (!isHomeRender) Array.from(playlistList.children).forEach((el, i) => el.classList.toggle('active', i === index))
}

function loadTrack(index) {
  if (index < 0 || index >= playQueue.length) return
  playIndex = index; const track = playQueue[index]
  recordHistory(track); refreshLikedCache().then(updateNowPlayingLikeBtn)
  gsap.to(coverEl, { opacity: .5, scale: .95, duration: .25, onComplete: () => {
    coverEl.src = track.cover || LUCA_VINYL_PLACEHOLDER
    gsap.to(coverEl, { opacity: 1, scale: 1, duration: .35 })
  }})
  audio.src = track.src
  setPlayerMeta(track.title, track.artist)
  refreshVibeBackground(track.cover)
  clearTimeout(recommendationsRefreshTimer)
  recommendationsRefreshTimer = setTimeout(() => {
    if (document.getElementById('homeView')?.style.display !== 'none') loadRecommendedRow(track)
  }, 1200)
  progressEl.style.width = '0%'; currentTimeEl.textContent = '0:00'; durationEl.textContent = '0:00'
  audio.load(); renderQueue()
  saveSession()

  // FIX: prevent stale suggestions from corrupting queue
  if (track.id) fetchSuggestions(track.id)

  // Sync Now Playing overlay if open
  if (window.syncNowPlayingUI) syncNowPlayingUI()

  // Auto-refresh lyrics if panel is open
  if (lyricsVisible && track) {
    document.getElementById('lyricsSongTitle').textContent  = track.title
    document.getElementById('lyricsArtistName').textContent = track.artist
    if (track.id !== currentLyricsSongId) fetchLyrics(track)
  }
}

// FIX: race condition prevention — only accept suggestions from the most recent track
async function fetchSuggestions(trackId) {
  const myId = trackId
  _suggestionAbortId = myId
  try {
    const json = await lucaFetch(`/api/songs/${trackId}/suggestions?limit=15`)
    if (_suggestionAbortId !== myId) return   // stale — user skipped track
    const results = extractResults(json)
    if (results.length) {
      const suggestedTracks = filterTracks(results)
      suggestedTracks.forEach(st => {
        if (!playQueue.find(q => q.id === st.id)) playQueue.push(st)
      })
      renderQueue()
    }
  } catch (_) {}
}

// ── Persistent Session ────────────────────────────────────
function saveSession() {
  try {
    localStorage.setItem('luca_session', JSON.stringify({
      queue: playQueue,
      index: playIndex,
      pos: Math.floor(audio.currentTime || 0)
    }))
  } catch (_) {}
}

function restoreSession() {
  try {
    const raw = localStorage.getItem('luca_session')
    if (!raw) return
    const s = JSON.parse(raw)
    if (!s.queue?.length) return
    playQueue = s.queue
    playIndex = Math.min(s.index || 0, playQueue.length - 1)
    const track = playQueue[playIndex]
    coverEl.src = track.cover || LUCA_VINYL_PLACEHOLDER
    setPlayerMeta(track.title, track.artist)
    refreshVibeBackground(track.cover)
    audio.src = track.src
    audio.load()
    audio.addEventListener('loadedmetadata', () => {
      if (s.pos && s.pos < audio.duration - 2) audio.currentTime = s.pos
    }, { once: true })
    refreshLikedCache().then(updateNowPlayingLikeBtn)
    renderQueue()
    showToast(`▶ Resume: ${track.title}`, 'info', 3500)
  } catch (_) {}
}

function play() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
  audio.play()
    .then(() => { isPlaying = true; updatePlayButton(); if (coverTween) coverTween.play(); initAudioContext() })
    .catch(err => console.error('Playback error:', err))
}
function pause() { audio.pause(); isPlaying = false; updatePlayButton(); if (coverTween) coverTween.pause() }
function togglePlay() { isPlaying ? pause() : play() }
function updatePlayButton() {
  playPauseBtn.textContent = isPlaying ? '⏸' : '▶'
  if (window.updateNpPlayBtn) updateNpPlayBtn()
}

function nextTrack() {
  if (!playQueue.length) return
  if (isShuffle) {
    let next = playIndex
    if (playQueue.length > 1) do { next = Math.floor(Math.random() * playQueue.length) } while (next === playIndex)
    loadTrack(next); play(); return
  }
  if (playIndex < playQueue.length - 1) { loadTrack(playIndex + 1); play() }
  else if (repeatMode === 'all') { loadTrack(0); play() }
  else { pause(); audio.currentTime = 0 }
}
function prevTrack() {
  if (!playQueue.length) return
  if (audio.currentTime > 4) { audio.currentTime = 0; return }
  if (playIndex > 0) { loadTrack(playIndex - 1); play() } else audio.currentTime = 0
}

function renderQueue() {
  const list = document.getElementById('queueList'); list.innerHTML = ''
  playQueue.forEach((t, i) => {
    const item = document.createElement('div')
    item.className = 'queue-item' + (i === playIndex ? ' active' : '')
    item.innerHTML = `
      <span class="queue-item-num">${i === playIndex ? '▶' : i + 1}</span>
      <img class="queue-item-cover" src="${t.cover || LUCA_VINYL_PLACEHOLDER}" alt="" loading="lazy"/>
      <div class="queue-item-info">
        <div class="queue-item-title">${t.title}</div>
        <div class="queue-item-artist">${t.artist}</div>
      </div>
    `
    item.addEventListener('click', () => { loadTrack(i); play() })
    list.appendChild(item)
  })
  setTimeout(() => list.children[playIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 100)
}

function toggleQueue() {
  const panel = document.getElementById('queuePanel'), overlay = document.getElementById('queueOverlay')
  const open = panel.classList.toggle('open'); overlay.classList.toggle('show', open)
}

// ══════════════════════════════════════════════════════════
//  PROFILE — merged, no more monkey-patch
// ══════════════════════════════════════════════════════════
async function renderProfileView() {
  const metaName = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name
  const name  = metaName || localStorage.getItem('luca_guest_name') || currentUser?.email?.split('@')[0] || 'Guest'
  const email = currentUser?.email || 'Not signed in'
  const init  = name.charAt(0).toUpperCase()

  const savedAvatar = currentUser?.user_metadata?.avatar_url
    || (!currentUser ? localStorage.getItem('luca_guest_avatar') : null)
  const avatarEl = document.getElementById('profileAvatarBig')
  if (savedAvatar) {
    avatarEl.style.backgroundImage = `url('${savedAvatar}')`
    avatarEl.textContent = ''
    suAvatar.style.backgroundImage = `url('${savedAvatar}')`
    suAvatar.textContent = ''
  } else {
    avatarEl.style.backgroundImage = ''
    avatarEl.textContent = init
    suAvatar.style.backgroundImage = ''
    suAvatar.textContent = init
  }

  document.getElementById('profileNameEl').textContent  = name
  document.getElementById('profileEmailEl').textContent = email

  // Populate all settings fields (was previously broken monkey-patch)
  const nameInput   = document.getElementById('editProfileName')
  const emailInput  = document.getElementById('editEmail')
  const ageInput    = document.getElementById('editAge')
  const phoneInput  = document.getElementById('editPhone')
  const genderInput = document.getElementById('editGender')
  const passInput   = document.getElementById('editPassword')

  if (nameInput)   nameInput.value   = metaName || localStorage.getItem('luca_guest_name') || ''
  if (emailInput)  emailInput.value  = currentUser?.email || ''
  if (ageInput)    ageInput.value    = currentUser?.user_metadata?.age    || ''
  if (phoneInput)  phoneInput.value  = currentUser?.user_metadata?.phone  || ''
  if (genderInput) genderInput.value = currentUser?.user_metadata?.gender || ''
  if (passInput)   passInput.value   = ''

  document.getElementById('profileSignInBtn').style.display = currentUser ? 'none'  : 'block'
  document.getElementById('profileLogoutBtn').style.display = currentUser ? 'block' : 'none'

  // Stats
  let likedCount = 0, playedCount = 0, plCount = 0
  if (!currentUser) {
    likedCount  = JSON.parse(localStorage.getItem('luca_liked')   || '[]').length
    playedCount = JSON.parse(localStorage.getItem('luca_history') || '[]').length
  } else {
    const [l, h, p] = await Promise.all([
      db.from('liked_songs').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
      db.from('listening_history').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
      db.from('playlists').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
    ])
    likedCount = l.count || 0; playedCount = h.count || 0; plCount = p.count || 0
  }
  document.getElementById('pstatLiked').textContent     = likedCount
  document.getElementById('pstatPlaylists').textContent = plCount
  document.getElementById('pstatPlayed').textContent    = playedCount

  // Restore active theme button
  const currentTheme = localStorage.getItem('luca_theme') || 'luca'
  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'))
  document.getElementById('theme_' + currentTheme)?.classList.add('active')
}

async function handleLogout() {
  await db.auth.signOut()
  showToast('Logged out. See you soon!', 'info')
  setTimeout(() => window.location.href = 'index.html', 1200)
}

// FIX: compress avatar to 120x120 JPEG (~5-10KB) before storing
// This prevents Supabase user_metadata overflow (was sending raw 3MB base64)
async function handleAvatarUpload(e) {
  const file = e.target.files[0]; if (!file) return
  if (file.size > 5000000) { showToast('Image must be under 5MB', 'error'); return }

  const img    = new Image()
  const reader = new FileReader()
  reader.onload = ev => {
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 120; canvas.height = 120
      const ctx = canvas.getContext('2d')
      // Crop to square from center
      const size = Math.min(img.width, img.height)
      const sx   = (img.width  - size) / 2
      const sy   = (img.height - size) / 2
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 120, 120)
      const b64 = canvas.toDataURL('image/jpeg', 0.82)   // ~5-10KB

      document.getElementById('profileAvatarBig').style.backgroundImage = `url('${b64}')`
      document.getElementById('profileAvatarBig').textContent = ''
      suAvatar.style.backgroundImage = `url('${b64}')`
      suAvatar.style.backgroundSize  = 'cover'
      suAvatar.textContent = ''

      if (currentUser) {
        await db.auth.updateUser({ data: { avatar_url: b64 } })
        showToast('Avatar updated!', 'success')
      } else {
        localStorage.setItem('luca_guest_avatar', b64)
        showToast('Avatar saved locally', 'success')
      }
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
}

async function updateProfileName() {
  const newName = document.getElementById('editProfileName').value.trim(); if (!newName) return
  if (currentUser) {
    await db.auth.updateUser({ data: { full_name: newName } })
    document.getElementById('profileNameEl').textContent = newName
    suName.textContent = newName
    showToast('Profile updated!', 'success')
  } else {
    localStorage.setItem('luca_guest_name', newName)
    document.getElementById('profileNameEl').textContent = newName
    suName.textContent = newName
    showToast('Profile updated locally', 'success')
  }
}

async function updateUserPassword() {
  if (!currentUser) { showToast('Sign in to set a password', 'error'); return }
  const newPass = document.getElementById('editPassword').value
  if (newPass.length < 6) { showToast('Password must be 6+ chars', 'error'); return }
  const { error } = await db.auth.updateUser({ password: newPass })
  if (error) showToast(error.message, 'error')
  else { showToast('Password changed!', 'success'); document.getElementById('editPassword').value = '' }
}

async function updateProfileData() {
  if (!currentUser) { showToast('Must be signed in', 'error'); return }
  const pName   = document.getElementById('editProfileName').value.trim()
  const pAge    = document.getElementById('editAge').value.trim()
  const pPhone  = document.getElementById('editPhone').value.trim()
  const pGender = document.getElementById('editGender').value
  const btn = document.querySelector('.settings-btn')
  const oldText = btn.textContent; btn.textContent = 'Saving...'; btn.disabled = true
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
  try {
    const { data, error } = await Promise.race([
      db.auth.updateUser({ data: { full_name: pName, age: pAge, phone: pPhone, gender: pGender } }),
      timeout
    ])
    if (error) throw error
    currentUser = data.user
    document.getElementById('profileNameEl').textContent = pName || 'User'
    showToast('Details saved!', 'success')
  } catch (err) {
    showToast('Saved to browser (cloud sync failed)', 'info')
    localStorage.setItem('luca_user_meta_fallback', JSON.stringify({ full_name: pName, age: pAge, phone: pPhone, gender: pGender }))
  } finally {
    btn.textContent = oldText; btn.disabled = false
  }
}

function submitFeedback() {
  const t = document.getElementById('feedbackText').value.trim()
  if (!t) { showToast('Please write something first!', 'error'); return }
  const senderEmail = currentUser?.email || 'anonymous'
  const subject = encodeURIComponent('LucaVerse Feedback')
  const body    = encodeURIComponent(`Feedback from: ${senderEmail}\n\n${t}`)
  const link = document.getElementById('feedbackLink')
  if (link) link.href = `mailto:varungupta31009@gmail.com?subject=${subject}&body=${body}`
  document.getElementById('feedbackText').value = ''
  showToast('Opening your Email App...', 'success', 3000)
}

document.addEventListener('input', (e) => {
  if (e.target.id === 'feedbackText') {
    const t = e.target.value.trim()
    const senderEmail = currentUser?.email || 'anonymous'
    const subject = encodeURIComponent('LucaVerse Feedback')
    const body    = encodeURIComponent(`Feedback from: ${senderEmail}\n\n${t}`)
    const link = document.getElementById('feedbackLink')
    if (link) link.href = `mailto:varungupta31009@gmail.com?subject=${subject}&body=${body}`
  }
})

// ══════════════════════════════════════════════════════════
//  THEME ENGINE
// ══════════════════════════════════════════════════════════
const themes = {
  default: { a1: '#00f2fe', a2: '#8b5cf6' },
  matrix:  { a1: '#bcff00', a2: '#1db954' },
  crimson: { a1: '#ff0f7b', a2: '#f89b29' },
  gold:    { a1: '#ffc837', a2: '#ff8008' },
}
function setTheme(id) {
  const t = themes[id]; if (!t) return
  document.documentElement.style.setProperty('--accent-1', t.a1)
  document.documentElement.style.setProperty('--accent-2', t.a2)
  localStorage.setItem('luca_theme', id)
  document.querySelectorAll('.swatch').forEach(el => el.classList.remove('active'))
  const map = { default: 'cyan-purple', matrix: 'neon-green', crimson: 'crimson-red', gold: 'gold-amber' }
  document.querySelector(`.swatch.${map[id]}`)?.classList.add('active')
}

function setThemeSettings(themeName) {
  document.documentElement.classList.remove('theme-glass', 'theme-spotify')
  if (themeName === 'glass')   document.documentElement.classList.add('theme-glass')
  else if (themeName === 'spotify') document.documentElement.classList.add('theme-spotify')
  localStorage.setItem('luca_theme', themeName)
  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'))
  document.getElementById('theme_' + themeName)?.classList.add('active')
  showToast(`Theme updated to ${themeName}`, 'success')
}

// ══════════════════════════════════════════════════════════
//  WEB AUDIO VISUALIZER + FX
// ══════════════════════════════════════════════════════════
let audioCtx = null, analyser = null, sourceNode = null, bassFilter = null, midFilter = null, trebleFilter = null, compressorNode = null, gainNode = null
let audioConnected = false, fxBarVisible = false, activeFX = 'normal'

const FX_PRESETS = {
  normal: { bass: 0,  mid: 0,  treble: 0,  gain: 1.0  },
  bass:   { bass: 6,  mid: 1,  treble: -1, gain: 1.03 },
  treble: { bass: -1, mid: 1,  treble: 5,  gain: 1.0  },
  vocal:  { bass: -2, mid: 4,  treble: 2,  gain: 1.02 },
  lofi:   { bass: 2,  mid: -1, treble: -5, gain: 0.95 },
  loud:   { bass: 4,  mid: 2,  treble: 3,  gain: 1.08 },
}

function initAudioContext() {
  if (audioConnected) return
  try {
    audioCtx  = new (window.AudioContext || window.webkitAudioContext)()
    analyser  = audioCtx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.82
    bassFilter   = audioCtx.createBiquadFilter(); bassFilter.type = 'lowshelf';  bassFilter.frequency.value = 200;  bassFilter.gain.value = 0
    midFilter    = audioCtx.createBiquadFilter(); midFilter.type = 'peaking'; midFilter.frequency.value = 1400; midFilter.Q.value = 1; midFilter.gain.value = 0
    trebleFilter = audioCtx.createBiquadFilter(); trebleFilter.type = 'highshelf'; trebleFilter.frequency.value = 4000; trebleFilter.gain.value = 0
    compressorNode = audioCtx.createDynamicsCompressor()
    compressorNode.threshold.value = -18
    compressorNode.knee.value = 12
    compressorNode.ratio.value = 3
    compressorNode.attack.value = 0.01
    compressorNode.release.value = 0.22
    gainNode     = audioCtx.createGain(); gainNode.gain.value = 1.0
    sourceNode   = audioCtx.createMediaElementSource(audio)
    sourceNode.connect(bassFilter)
    bassFilter.connect(midFilter)
    midFilter.connect(trebleFilter)
    trebleFilter.connect(compressorNode)
    compressorNode.connect(gainNode)
    gainNode.connect(analyser)
    gainNode.connect(audioCtx.destination)
    audioConnected = true
    const saved = localStorage.getItem('luca_fx') || 'normal'
    activeFX = saved; applyFXValues(FX_PRESETS[saved] || FX_PRESETS.normal)
    document.querySelectorAll('.fx-btn').forEach(b => b.classList.remove('active', 'bass-active'))
    const savedBtn = document.getElementById(`fxbtn_${saved}`)
    if (savedBtn) savedBtn.classList.add(saved === 'bass' || saved === 'loud' ? 'bass-active' : 'active')
    startVisualizer()
  } catch (e) { console.warn('Web Audio API unavailable:', e) }
}

function applyFXValues(preset) {
  if (!audioConnected || !preset) return
  const now = audioCtx.currentTime
  bassFilter.gain.cancelScheduledValues(now)
  midFilter.gain.cancelScheduledValues(now)
  trebleFilter.gain.cancelScheduledValues(now)
  gainNode.gain.cancelScheduledValues(now)
  bassFilter.gain.setTargetAtTime(preset.bass, now, 0.18)
  midFilter.gain.setTargetAtTime(preset.mid, now, 0.18)
  trebleFilter.gain.setTargetAtTime(preset.treble, now, 0.18)
  gainNode.gain.setTargetAtTime(preset.gain, now, 0.18)
}

function applyFX(key) {
  const preset = FX_PRESETS[key]; if (!preset) return
  activeFX = key; if (audioConnected) applyFXValues(preset)
  document.querySelectorAll('.fx-btn').forEach(b => b.classList.remove('active', 'bass-active'))
  const btn = document.getElementById(`fxbtn_${key}`)
  if (btn) btn.classList.add(key === 'bass' || key === 'loud' ? 'bass-active' : 'active')
  localStorage.setItem('luca_fx', key)
  const labels = { normal: 'Normal', bass: '🔊 Bass Boost', treble: '✨ Treble', vocal: '🎙 Vocals', lofi: '📻 Lo-Fi', loud: '💥 Loud' }
  showToast(`${labels[key]} applied`, 'success', 1800)
}

function toggleFXBar() {
  fxBarVisible = !fxBarVisible
  document.getElementById('fxBar').classList.toggle('visible', fxBarVisible)
  document.getElementById('fxToggleBtn').classList.toggle('active', fxBarVisible)
}

function startVisualizer() {
  const wrap = document.getElementById('vizWrap')
  if (wrap) wrap.style.display = 'none'
}

// ══════════════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════════════
function attachEvents() {
  // FIX: Only ONE scroll listener here (removed duplicate initInfiniteScroll)
  contentScroll.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = contentScroll
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      if (!isFetching && currentQuery && !['!LIKED!', '!HISTORY!'].includes(currentQuery)) {
        currentPage++
        fetchSongs(
          currentQuery,
          isHomeRender,
          homeTitle.textContent || document.getElementById('searchTitle').textContent,
          posterGrid.dataset.type || 'songs',
          currentPage
        )
      }
    }
  })

  let debTimer
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debTimer); debTimer = setTimeout(() => {
      const q = e.target.value.trim()
      if (q.length > 2) fetchSongs(q, false, `Results for "${q}"`)
      else if (q.length === 0) loadHomeCategories()
    }, 700)
  })

  document.getElementById('homeBtn').addEventListener('click', () => { setActiveNav('homeBtn'); searchInput.value = ''; loadHomeCategories() })
  document.getElementById('searchBtn').addEventListener('click', () => searchInput.focus())
  document.getElementById('historyBtn').addEventListener('click', () => { setActiveNav('historyBtn'); fetchSongs('!HISTORY!', false, '🕒 Recently Played') })
  document.getElementById('likedSongsBtn').addEventListener('click', () => { setActiveNav('likedSongsBtn'); fetchSongs('!LIKED!', false, '❤️ Liked Songs') })

  sidebarUser.addEventListener('click', () => {
    if (!currentUser) { window.location.href = 'auth.html'; return }
    showView('profile')
  })
  userProfileBtn.addEventListener('click', () => showView('profile'))

  // FIX: replaced prompt() with custom modal
  newPlaylistBtn.addEventListener('click', () => {
    if (!currentUser) { showToast('Sign in to create playlists', 'error'); return }
    openNewPlaylistModal(name => createPlaylist(name))
  })

  // Enter key on new playlist modal
  document.getElementById('newPlaylistNameInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmNewPlaylist()
  })

  // Enter key for search
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fetchGlobalDiscovery(searchInput.value.trim())
  })

  nowPlayingLikeBtn.addEventListener('click', () => { const t = playQueue[playIndex]; if (t) toggleLike(t, nowPlayingLikeBtn) })

  audio.addEventListener('loadedmetadata', () => durationEl.textContent = fmtTime(audio.duration))
  audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100 || 0
    progressEl.style.width = pct + '%'; currentTimeEl.textContent = fmtTime(audio.currentTime)
    if (lyricsVisible) _sbSyncFrame()
  })
  audio.addEventListener('ended', () => { if (repeatMode === 'one') { audio.currentTime = 0; play() } else nextTrack() })
  audio.addEventListener('error', () => nextTrack())

  playPauseBtn.addEventListener('click', togglePlay)
  prevBtn.addEventListener('click', prevTrack)
  nextBtn.addEventListener('click', nextTrack)

  let isSeeking = false
  function seekAt(e) {
    const r = progressContainer.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left
    audio.currentTime = Math.max(0, Math.min(1, x / r.width)) * (audio.duration || 0)
  }
  progressContainer.addEventListener('click', seekAt)
  progressContainer.addEventListener('pointerdown', (e) => { isSeeking = true; progressContainer.setPointerCapture(e.pointerId); seekAt(e) })
  progressContainer.addEventListener('pointermove', (e) => { if (isSeeking) seekAt(e) })
  progressContainer.addEventListener('pointerup',   (e) => { isSeeking = false; try { progressContainer.releasePointerCapture(e.pointerId) } catch (_) {} })

  volumeInput.addEventListener('input', () => {
    audio.volume = Number(volumeInput.value)
    lastVolume = audio.volume > 0 ? audio.volume : lastVolume
    muteBtn.textContent = audio.volume > 0 ? '🔈' : '🔇'
  })
  muteBtn.addEventListener('click', () => {
    if (audio.volume > 0) { lastVolume = audio.volume; audio.volume = 0; volumeInput.value = 0; muteBtn.textContent = '🔇' }
    else { audio.volume = lastVolume || 0.8; volumeInput.value = audio.volume; muteBtn.textContent = '🔈' }
  })

  shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle
    shuffleBtn.classList.toggle('active-state', isShuffle)
    showToast(isShuffle ? 'Shuffle on' : 'Shuffle off', 'info')
    if (window.syncNpControlStates) syncNpControlStates()
  })
  repeatBtn.addEventListener('click', () => {
    if (repeatMode === 'off')      { repeatMode = 'all'; repeatBtn.classList.add('active-state');    repeatBtn.textContent = '🔁'; showToast('Repeat all', 'info') }
    else if (repeatMode === 'all') { repeatMode = 'one';                                             repeatBtn.textContent = '🔂'; showToast('Repeat one', 'info') }
    else                           { repeatMode = 'off'; repeatBtn.classList.remove('active-state'); repeatBtn.textContent = '🔁'; showToast('Repeat off', 'info') }
    if (window.syncNpControlStates) syncNpControlStates()
  })

  document.getElementById('queueToggleBtn').addEventListener('click', toggleQueue)
  document.getElementById('listenTogetherBtn')?.addEventListener('click', openSyncModal)
  document.getElementById('listenTogetherPlayerBtn')?.addEventListener('click', openSyncModal)

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return
    if (e.code === 'Space')       { e.preventDefault(); togglePlay() }
    else if (e.code === 'ArrowRight') nextTrack()
    else if (e.code === 'ArrowLeft')  prevTrack()
    else if (e.code === 'KeyM')       muteBtn.click()
    else if (e.code === 'KeyF')       toggleFXBar()
    else if (e.code === 'Escape') {
      if (document.getElementById('confirmModal').style.display === 'flex') closeConfirmModal()
      else if (document.getElementById('newPlaylistModal').style.display === 'flex') closeNewPlaylistModal()
      else if (document.getElementById('syncModal').style.display === 'flex') closeSyncModal()
    }
  })

  playlistModal.addEventListener('click', (e) => { if (e.target === playlistModal) closeModal() })
  document.getElementById('syncModal')?.addEventListener('click', (e) => { if (e.target.id === 'syncModal') closeSyncModal() })
  document.getElementById('syncRoomCode')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinSyncRoom() })

  // Lyrics sidebar panel button
  const lyrBtn = document.getElementById('lyricsBtn')
  if (lyrBtn) lyrBtn.addEventListener('click', toggleLyrics)
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'))
  document.getElementById(id)?.classList.add('active')
}

function fmtTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

// ══════════════════════════════════════════════════════════
//  GREETING
// ══════════════════════════════════════════════════════════
function renderGreeting() {
  const g = getTimeBasedGreeting()
  const name = currentUser?.user_metadata?.full_name
             || currentUser?.user_metadata?.name
             || currentUser?.email?.split('@')[0]
             || null
  const greetEl = document.getElementById('homeGreeting')
  if (!greetEl) return
  greetEl.textContent = name
    ? `${g.emoji} ${g.text}, ${name.split(' ')[0]}!`
    : `${g.emoji} ${g.text}!`
}

// ══════════════════════════════════════════════════════════
//  LYRICS ENGINE (Sidebar panel)
// ══════════════════════════════════════════════════════════
let lyricsVisible = false
let currentLyricsSongId = null

function toggleLyrics() {
  const panel = document.getElementById('lyricsPanel')
  if (!panel) return
  lyricsVisible = !lyricsVisible
  panel.classList.toggle('open', lyricsVisible)
  const btn = document.getElementById('lyricsBtn')
  if (btn) btn.classList.toggle('active-state', lyricsVisible)
  if (lyricsVisible) {
    const track = playQueue[playIndex]
    if (track && track.id !== currentLyricsSongId) {
      fetchLyrics(track)
    } else if (_sbSyncedLyrics.length > 0) {
      _sbStartRaf()
      setTimeout(() => _sbSyncFrame(), 50)
    }
  } else {
    _sbStopRaf()
  }
}

let _sbSyncedLyrics  = []
let _sbLastActiveIdx = -1
let _sbLyricsRafId   = null

async function fetchLyrics(track) {
  const body = document.getElementById('lyricsPanelBody')
  if (!body) return

  document.getElementById('lyricsSongTitle').textContent  = track.title
  document.getElementById('lyricsArtistName').textContent = track.artist
  body.innerHTML = '<div class="lyrics-loading"><div class="lyr-spinner"></div><p>Fetching lyrics…</p></div>'
  currentLyricsSongId = track.id
  _sbSyncedLyrics = []; _sbLastActiveIdx = -1; _sbStopRaf()

  const payload = await fetchLyricsPayload(track)

  if (!payload) {
    body.innerHTML = '<div class="lyrics-empty"><span>😶</span><p>Lyrics not found for this track.</p></div>'
    return
  }
  _sbRenderLyrics(body, payload)
}

function _sbClean(text) {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
             .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
}
function _sbEsc(str) { return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function _sbParseLRC(lrc) {
  const result = [], rx = /\[(\d+):(\d{2})(?:[.:](\d{2,3}))?\]/g
  for (const line of lrc.split('\n')) {
    rx.lastIndex = 0; const ts = []; let m
    while ((m = rx.exec(line)) !== null) {
      const msRaw = m[3] ? parseInt(m[3], 10) : 0
      ts.push(parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + (m[3] ? (m[3].length === 3 ? msRaw / 1000 : msRaw / 100) : 0))
    }
    const text = line.replace(/\[\d+:\d{2}(?:[.:]\d{2,3})?\]/g, '').trim()
    if (text && ts.length) for (const t of ts) result.push({ time: t, text })
  }
  return result.sort((a, b) => a.time - b.time)
}

function _sbRenderLyrics(container, payload) {
  const { type, data } = payload
  if (type === 'synced_array') {
    _sbSyncedLyrics = data.map(item => {
      let t = item.time
      if (typeof t === 'string') { const p = t.split(':'); t = (parseFloat(p[0]) || 0) * 60 + (parseFloat(p[1]) || 0) }
      else t = Number(t) || 0
      return { time: t, text: (item.text || '').trim() }
    }).filter(l => l.text).sort((a, b) => a.time - b.time)
  } else if (type === 'lrc') {
    _sbSyncedLyrics = _sbParseLRC(typeof data === 'string' ? _sbClean(data) : '')
  } else {
    _sbSyncedLyrics = []
  }
  _sbLastActiveIdx = -1

  if (_sbSyncedLyrics.length > 0) {
    container.innerHTML = `<div class="lyrics-text synced">${
      _sbSyncedLyrics.map((l, i) => `<p class="lyric-line-synced sb-ln" id="sb-ln-${i}" data-time="${l.time}">${_sbEsc(l.text)}</p>`).join('')
    }</div>`
    _sbStartRaf()
  } else {
    const clean = typeof data === 'string' ? _sbClean(data) : ''
    container.innerHTML = `<div class="lyrics-text">${
      clean.split('\n').map(l => l.trim() === '' ? '<br>' : `<p>${_sbEsc(l)}</p>`).join('')
    }</div>`
  }
}

function _sbStartRaf() {
  _sbStopRaf()
  if (!lyricsVisible) return
  _sbLyricsRafId = setTimeout(() => {
    _sbLyricsRafId = null
    _sbSyncFrame()
  }, 0)
}
function _sbStopRaf() {
  if (_sbLyricsRafId) { clearTimeout(_sbLyricsRafId); _sbLyricsRafId = null }
}
function _sbSyncFrame() {
  if (!_sbSyncedLyrics.length) return
  const aud = document.getElementById('audio'); if (!aud) return
  const curTime = aud.currentTime
  let lo = 0, hi = _sbSyncedLyrics.length - 1, activeIdx = -1
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (_sbSyncedLyrics[mid].time <= curTime) { activeIdx = mid; lo = mid + 1 } else hi = mid - 1 }
  if (activeIdx === _sbLastActiveIdx) return
  _sbLastActiveIdx = activeIdx
  document.querySelectorAll('.sb-ln').forEach((el, i) => {
    el.classList.toggle('active', i === activeIdx); el.classList.toggle('prev', i === activeIdx - 1)
  })
  if (activeIdx >= 0) {
    const line = document.getElementById(`sb-ln-${activeIdx}`), cont = document.getElementById('lyricsPanelBody')
    if (line && cont) cont.scrollTo({ top: Math.max(0, line.offsetTop - cont.clientHeight / 2.5), behavior: 'smooth' })
  }
}

// ══════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════
async function boot() {
  setTheme(localStorage.getItem('luca_theme') || 'default')
  await initLyricCache()
  await initAuth()
  await refreshLikedCache()
  await loadSidebarPlaylists()
  audio.volume = Number(volumeInput.value)
  coverEl.src = LUCA_VINYL_PLACEHOLDER
  refreshVibeBackground(LUCA_VINYL_PLACEHOLDER)
  const loadingGrid = loadingIndicator.querySelector('.skeleton-grid')
  if (loadingGrid) loadingGrid.innerHTML = renderCardSkeletons(SKELETON_CARD_COUNT)
  updatePlayButton()
  attachEvents()  // single call — scroll listener lives only here
  gsap.from('.sidebar',    { x: -40, opacity: 0, duration: .7, ease: 'power3.out' })
  gsap.from('.player-bar', { y: 80,  opacity: 0, duration: .7, delay: .15, ease: 'power3.out' })
  gsap.from('.top-bar',    { y: -20, opacity: 0, duration: .5, delay: .25, ease: 'power2.out' })
  coverTween = gsap.to(coverEl, { scale: 1.04, boxShadow: '0 10px 20px rgba(0,242,254,.3)', duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true })
  restoreSession()
  setInterval(() => { if (isPlaying) saveSession() }, 5000)
  loadHomeCategories()
}
boot()

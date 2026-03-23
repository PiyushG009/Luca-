// ══════════════════════════════════════════════════════════
//  LUCA — app.js  |  Complete Version
// ══════════════════════════════════════════════════════════

// Queries are tuned for 2026 charts — sorted by freshness & popularity
const HOME_CATEGORIES = [
  { id:'cat_trending',   title:'🔥 Trending Now',          query:'__DAILY_TRENDING__' },
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
  { id:'cat_haryanvi',   title:'🌾 Haryanvi Hits',          query:'haryanvi 2026' },
  { id:'cat_pop',        title:'🎸 Pop Hits',               query:'pop english hit 2025' },
  { id:'cat_sufi',       title:'🕌 Sufi & Ghazal',          query:'sufi ghazal 2025' },
  { id:'cat_edm',        title:'🎧 EDM & Dance',            query:'edm dance 2025' },
  { id:'cat_indie',      title:'🌿 Indie Essentials',       query:'indie hindi 2025' },
  { id:'cat_devotional', title:'🙏 Devotional',             query:'bhakti devotional top' },
  { id:'cat_nostalgia',  title:'📼 2000s Classics',         query:'2000s bollywood hit' },
  { id:'cat_acoustic',   title:'🎸 Unplugged',              query:'unplugged acoustic hindi' },
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
let currentPlaylistId = null
let songToAdd         = null
let coverTween        = null

// ── API Mirrors ───────────────────────────────────────────
const API_MIRRORS = [
  'https://saavn.sumit.co',
  'https://jiosaavn-api-js.vercel.app',
  'https://jiosaavn-api.netlify.app'
]

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

// ══════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════
function showToast(msg, type = 'info', duration = 2800) {
  const container = document.getElementById('toastContainer')
  const icons = { info:'ℹ️', success:'✓', error:'✕', heart:'❤️' }
  const toast = document.createElement('div')
  toast.className = 'toast ' + type
  toast.innerHTML = `<span>${icons[type]||''}</span><span>${msg}</span>`
  container.appendChild(toast)
  setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 350) }, duration)
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
      <span class="ti-index">${i+1}</span>
      <div class="ti-info"><img class="ti-cover" src="${t.cover||''}" alt="" loading="lazy"/><span class="ti-title">${t.title}</span></div>
      <span class="ti-artist">${t.artist}</span>
      <div class="ti-like"><button class="like-btn ${isLiked(t)?'active':''}" onclick="event.stopPropagation();toggleLike(viewTracks[${i}],this)">${isLiked(t)?'❤️':'🤍'}</button></div>
      <span class="ti-time">${fmtTime(t.duration)}</span>
    `
    item.addEventListener('click', () => activateQueueAndPlay(i))
    list.appendChild(item)
  })
}

function playPlaylist() { if (viewTracks.length) activateQueueAndPlay(0) }

async function deleteCurrentPlaylist() {
  if (!currentPlaylistId || !confirm('Delete this playlist?')) return
  await db.from('playlists').delete().eq('id', currentPlaylistId)
  userPlaylists = userPlaylists.filter(p => p.id !== currentPlaylistId)
  renderSidebarPlaylists(); showToast('Playlist deleted', 'info')
  currentPlaylistId = null; loadHomeCategories()
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
  const pos = await db.from('playlist_songs').select('id', { count:'exact', head:true }).eq('playlist_id', playlistId)
  await db.from('playlist_songs').insert({
    playlist_id: playlistId, song_id: songToAdd.id, title: songToAdd.title,
    artist: songToAdd.artist, cover: songToAdd.cover, src: songToAdd.src,
    duration: songToAdd.duration||0, position: pos.count||0
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
async function fetchFromMirrors(query, page, limit = 30) {
  for (const mirror of API_MIRRORS) {
    try {
      const res  = await fetch(`${mirror}/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
      if (!res.ok) continue
      const json = await res.json()
      if (json.success && json.data?.results?.length) return json
    } catch (_) {}
  }
  return null
}

function buildTrackObj(song) {
  const dur = Number(song.duration) || 0
  // Reject short promos, ringtones, and interludes (under 2 minutes)
  if (dur > 0 && dur < 120) return null
  const a = song.downloadUrl.find(q => q.quality === '320kbps') || song.downloadUrl[song.downloadUrl.length-1]
  const i = song.image.find(q => q.quality === '500x500') || song.image[song.image.length-1]
  return { id: song.id, src: a.url, title: song.name, artist: song.artists.primary[0]?.name || song.artists.all[0]?.name || 'Unknown', cover: i.url, duration: dur }
}
function filterTracks(songs) {
  return songs.map(buildTrackObj).filter(Boolean)
}

// ── Daily Trending Pool ──────────────────────────────────
// Rotates through mainstream Hindi/Punjabi/Bollywood queries daily
// so the Trending Now row always feels fresh and stays on-target
const TRENDING_POOL = [
  'top bollywood hits 2026',
  'hindi punjabi superhit 2026',
  'latest hindi songs 2026 popular',
  'top charting hindi songs 2026',
  'bollywood trending 2026 hit',
  'punjabi bollywood mix top 2026',
  'number one hindi song 2026',
  'viral hindi trending 2026',
]
function getDailyTrendingQuery() {
  // Pick a query from the pool based on day-of-year so it rotates daily
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return TRENDING_POOL[doy % TRENDING_POOL.length]
}

// Allowed scripts: Latin (a-z), Devanagari (Hindi/Marathi), and common symbols
// This keeps mainstream songs while filtering out pure Kannada/Telugu/Tamil scripts
const SOUTH_SCRIPT_RANGE = /[\u0C00-\u0C7F\u0C80-\u0CFF\u0B80-\u0BFF]/  // Telugu, Kannada, Tamil
function isMainstreamTrack(track) {
  const combined = (track.title || '') + ' ' + (track.artist || '')
  return !SOUTH_SCRIPT_RANGE.test(combined)
}

// ══════════════════════════════════════════════════════════
//  HOME CATEGORIES — Netflix rows (no hero)
// ══════════════════════════════════════════════════════════
async function loadHomeCategories() {
  currentQuery = ''; isHomeRender = true; showView('home')
  document.getElementById('homeRowsContainer').style.display = 'block'
  document.getElementById('gridContainer').style.display     = 'none'
  // Daily auto-refresh: clear cached songs when date changes
  const today = new Date().toISOString().slice(0, 10)   // e.g. "2026-03-23"
  const lastLoadDate = localStorage.getItem('luca_home_date')
  if (lastLoadDate !== today || Object.keys(homeData).length === 0) {
    homeData = {}
    localStorage.setItem('luca_home_date', today)
  }
  // If same day and data exists, just re-render the cached rows
  if (Object.keys(homeData).length > 0) {
    const container = document.getElementById('homeRowsContainer')
    container.innerHTML = ''
    HOME_CATEGORIES.forEach(cat => {
      if (homeData[cat.id]?.length) {
        const row = document.createElement('div')
        row.className = 'home-row'; row.id = `row_${cat.id}`
        row.innerHTML = `<h2 class="home-row-title">${cat.title}</h2><div class="home-row-cards" id="cards_${cat.id}"></div>`
        container.appendChild(row)
        renderRow(cat.id, homeData[cat.id])
      }
    })
    return
  }

  const container = document.getElementById('homeRowsContainer')
  container.innerHTML = ''

  HOME_CATEGORIES.forEach(cat => {
    homeData[cat.id] = []
    const row = document.createElement('div')
    row.className = 'home-row'; row.id = `row_${cat.id}`
    row.innerHTML = `
      <h2 class="home-row-title">${cat.title}</h2>
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
        // Resolve the rotating daily query for the trending row
        const resolvedQuery = cat.query === '__DAILY_TRENDING__' ? getDailyTrendingQuery() : cat.query
        const json = await fetchFromMirrors(resolvedQuery, 1, 50)
        if (json?.data?.results) {
          // Use filterTracks to strip out short clips, then shuffle
          let tracks = filterTracks(json.data.results)
          // Extra guard for Trending Now: only mainstream (Hindi/Punjabi/English) songs
          if (cat.id === 'cat_trending') tracks = tracks.filter(isMainstreamTrack)
          for (let k = tracks.length-1; k > 0; k--) {
            const j = Math.floor(Math.random()*(k+1));[tracks[k],tracks[j]]=[tracks[j],tracks[k]]
          }
          homeData[cat.id] = tracks
          renderRow(cat.id, tracks)
        } else {
          const el = document.getElementById(`row_${cat.id}`)
          if (el) el.style.display = 'none'
        }
      } catch(e) {
        const el = document.getElementById(`row_${cat.id}`)
        if (el) el.style.display = 'none'
      }
    }
  }
  const workers = []; for (let w=0; w<4; w++) workers.push(worker())
  await Promise.all(workers)
}

function renderRow(catId, tracks) {
  const container = document.getElementById(`cards_${catId}`); if (!container) return
  container.innerHTML = ''
  if (!tracks.length) { document.getElementById(`row_${catId}`).style.display='none'; return }
  tracks.forEach((t, i) => {
    const card = document.createElement('div'); card.className = 'poster-card'
    card.innerHTML = `
      <div class="image-wrapper">
        <img src="${t.cover||''}" class="poster-img" alt="" loading="lazy" crossorigin="anonymous"/>
        <button class="card-add-btn" title="Add to Playlist">+</button>
        <button class="card-like-btn like-btn ${isLiked(t)?'active':''}">${isLiked(t)?'❤️':'🤍'}</button>
        <div class="play-btn-overlay"><svg fill="#000" viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z"></path></svg></div>
      </div>
      <div class="poster-title">${t.title}</div>
      <div class="poster-artist">${t.artist}</div>
    `
    card.addEventListener('click', (e) => { if (e.target.tagName==='BUTTON') return; playFromRow(catId,i) })
    card.querySelector('.card-like-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleLike(t,e.currentTarget) })
    card.querySelector('.card-add-btn').addEventListener('click',  (e) => { e.stopPropagation(); openAddToPlaylistModal(t) })
    attachCardTilt(card)
    container.appendChild(card)
  })
}

// ── GSAP Premium 3D Tilt ────────────────────────────────
function attachCardTilt(card) {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left   // 0..rect.width
    const y = e.clientY - rect.top    // 0..rect.height
    const cx = rect.width  / 2
    const cy = rect.height / 2
    const rotX = ((y - cy) / cy) * -8   // max ±8deg
    const rotY = ((x - cx) / cx) *  8
    gsap.to(card, {
      rotationX: rotX, rotationY: rotY,
      transformPerspective: 800,
      ease: 'power1.out', duration: 0.25,
      overwrite: true
    })
  })
  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      rotationX: 0, rotationY: 0,
      ease: 'elastic.out(1, 0.5)', duration: 0.8,
      overwrite: true
    })
  })
}

function playFromRow(catId, index) {
  playQueue = [...homeData[catId]]; playIndex = index
  loadTrack(playIndex); play(); renderQueue()
}

// ══════════════════════════════════════════════════════════
//  FETCH SONGS (search / liked / history)
// ══════════════════════════════════════════════════════════
async function fetchSongs(query, isHome=true, customTitle='Trending Now', page=1) {
  if (isFetching) return; isFetching = true
  if (page === 1) {
    currentQuery=query; currentPage=1; viewTracks=[]; isHomeRender=isHome
    showView(isHome?'home':'search')
    if (isHome) {
      document.getElementById('homeRowsContainer').style.display='none'
      document.getElementById('gridContainer').style.display='block'
      posterGrid.innerHTML=''; homeTitle.textContent=customTitle
    } else {
      playlistList.innerHTML=''
      document.getElementById('searchTitle').textContent=customTitle
    }
    loadingIndicator.style.display='block'
  } else { bottomLoader.style.display='block' }

  if (query==='!LIKED!') {
    let tracks = !currentUser
      ? JSON.parse(localStorage.getItem('luca_liked')||'[]').map(t=>({...t,id:t.song_id}))
      : (await db.from('liked_songs').select('*').order('liked_at',{ascending:false})).data?.map(t=>({...t,id:t.song_id}))||[]
    viewTracks=tracks; finishRender(page,false,tracks.length===0?"No liked songs yet. Hit ❤️ on any song!":''); return
  }
  if (query==='!HISTORY!') {
    let tracks = !currentUser
      ? JSON.parse(localStorage.getItem('luca_history')||'[]').map(t=>({...t,id:t.song_id}))
      : (await db.from('listening_history').select('*').order('played_at',{ascending:false}).limit(100)).data?.map(t=>({...t,id:t.song_id}))||[]
    viewTracks=tracks; finishRender(page,true,tracks.length===0?"Nothing played yet. Start listening!":''); return
  }

  try {
    const json = await fetchFromMirrors(query, page)
    if (json?.data?.results?.length) {
      const tracks = filterTracks(json.data.results)
      if (tracks.length) { viewTracks.push(...tracks); finishRender(page,isHome,'') }
      else if (page===1) finishRender(page,isHome,'No full-length tracks found. Try another search!')
    }
    else if (page===1) finishRender(page,isHome,'No results found.')
  } catch(e) { if(page===1) finishRender(page,isHome,'Connection error. Try again.') }
}

function finishRender(page, isHome, emptyMsg) {
  isFetching=false; loadingIndicator.style.display='none'; bottomLoader.style.display='none'
  if (emptyMsg) {
    const msg=`<div style="text-align:center;padding:40px;color:var(--muted2);">${emptyMsg}</div>`
    isHome ? posterGrid.innerHTML=msg : playlistList.innerHTML=msg; return
  }
  isHome ? buildPostersUI(page>1) : buildPlaylistUI(page>1)
}

function showView(view) {
  homeView.style.display=searchView.style.display=profileView.style.display=playlistDetailView.style.display='none'
  if (view==='home')           homeView.style.display='block'
  else if (view==='search')    searchView.style.display='block'
  else if (view==='profile')   { profileView.style.display='block'; renderProfileView() }
  else if (view==='playlistDetail') playlistDetailView.style.display='block'
}

function buildPostersUI(append) {
  const start = append ? posterGrid.children.length : 0
  if (!append) posterGrid.innerHTML=''
  viewTracks.slice(start).forEach((t,relIdx) => {
    const i=start+relIdx; const card=document.createElement('div'); card.className='poster-card'
    card.innerHTML=`
      <div class="image-wrapper">
        <img src="${t.cover||''}" class="poster-img" alt="" loading="lazy" crossorigin="anonymous"/>
        <button class="card-add-btn">+</button>
        <button class="card-like-btn like-btn ${isLiked(t)?'active':''}">${isLiked(t)?'❤️':'🤍'}</button>
        <div class="play-btn-overlay"><svg fill="#000" viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z"></path></svg></div>
      </div>
      <div class="poster-title">${t.title}</div>
      <div class="poster-artist">${t.artist}</div>
    `
    card.addEventListener('click',(e)=>{if(e.target.tagName==='BUTTON')return;activateQueueAndPlay(i)})
    card.querySelector('.card-like-btn').addEventListener('click',(e)=>{e.stopPropagation();toggleLike(t,e.currentTarget)})
    card.querySelector('.card-add-btn').addEventListener('click',(e)=>{e.stopPropagation();openAddToPlaylistModal(t)})
    attachCardTilt(card)
    posterGrid.appendChild(card)
  })
  if (!append) gsap.from('.poster-card',{y:20,opacity:0,duration:.5,stagger:.04,ease:'back.out(1.4)'})
}

function buildPlaylistUI(append) {
  const start=append?playlistList.children.length:0
  if (!append) playlistList.innerHTML=''
  viewTracks.slice(start).forEach((t,relIdx) => {
    const i=start+relIdx; const item=document.createElement('div'); item.className='track-item'
    item.innerHTML=`
      <span class="ti-index">${i+1}</span>
      <div class="ti-info"><img class="ti-cover" src="${t.cover||''}" alt="" loading="lazy"/><span class="ti-title">${t.title}</span></div>
      <span class="ti-artist">${t.artist}</span>
      <div class="ti-like" style="display:flex;align-items:center;gap:6px;">
        <button class="like-btn ${isLiked(t)?'active':''}" onclick="event.stopPropagation();toggleLike(viewTracks[${i}],this)">${isLiked(t)?'❤️':'🤍'}</button>
        <button class="ti-add-btn" onclick="event.stopPropagation();openAddToPlaylistModal(viewTracks[${i}])">+</button>
      </div>
      <span class="ti-time">${fmtTime(t.duration)}</span>
    `
    item.addEventListener('click',()=>activateQueueAndPlay(i))
    playlistList.appendChild(item)
  })
}

// ══════════════════════════════════════════════════════════
//  PLAYBACK ENGINE
// ══════════════════════════════════════════════════════════
function activateQueueAndPlay(index) {
  playQueue=[...viewTracks]; playIndex=index; loadTrack(playIndex); play(); renderQueue()
  if (!isHomeRender) Array.from(playlistList.children).forEach((el,i)=>el.classList.toggle('active',i===index))
}

function loadTrack(index) {
  if (index<0||index>=playQueue.length) return
  playIndex=index; const track=playQueue[index]
  recordHistory(track); refreshLikedCache().then(updateNowPlayingLikeBtn)
  gsap.to(coverEl,{opacity:.5,scale:.95,duration:.25,onComplete:()=>{
    coverEl.src=track.cover||'https://picsum.photos/400'
    gsap.to(coverEl,{opacity:1,scale:1,duration:.35})
  }})
  audio.src=track.src; trackTitleEl.textContent=track.title; trackArtistEl.textContent=track.artist
  progressEl.style.width='0%'; currentTimeEl.textContent='0:00'; durationEl.textContent='0:00'
  audio.load(); renderQueue()
  // Save session so refresh restores this exact track
  saveSession()
}

// ── Persistent Session ────────────────────────────────────
function saveSession() {
  try {
    localStorage.setItem('luca_session', JSON.stringify({
      queue: playQueue,
      index: playIndex,
      pos:   Math.floor(audio.currentTime || 0)
    }))
  } catch(_) {}
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
    // Restore track info in the player bar without auto-playing
    coverEl.src = track.cover || 'https://picsum.photos/400'
    trackTitleEl.textContent  = track.title
    trackArtistEl.textContent = track.artist
    audio.src = track.src
    audio.load()
    // Seek to last position once metadata is ready
    audio.addEventListener('loadedmetadata', () => {
      if (s.pos && s.pos < audio.duration - 2) audio.currentTime = s.pos
    }, { once: true })
    refreshLikedCache().then(updateNowPlayingLikeBtn)
    renderQueue()
    showToast(`▶ Resume: ${track.title}`, 'info', 3500)
  } catch(_) {}
}

function play() {
  if (audioCtx && audioCtx.state==='suspended') audioCtx.resume()
  audio.play().then(()=>{ isPlaying=true; updatePlayButton(); if(coverTween)coverTween.play(); initAudioContext() })
    .catch(err=>console.error('Playback error:',err))
}
function pause() { audio.pause(); isPlaying=false; updatePlayButton(); if(coverTween)coverTween.pause() }
function togglePlay() { isPlaying?pause():play() }
function updatePlayButton() { playPauseBtn.textContent=isPlaying?'⏸':'▶' }

function nextTrack() {
  if (!playQueue.length) return
  if (isShuffle) {
    let next=playIndex
    if (playQueue.length>1) do{next=Math.floor(Math.random()*playQueue.length)}while(next===playIndex)
    loadTrack(next);play();return
  }
  if (playIndex<playQueue.length-1){loadTrack(playIndex+1);play()}
  else if (repeatMode==='all'){loadTrack(0);play()}
  else {pause();audio.currentTime=0}
}
function prevTrack() {
  if (!playQueue.length) return
  if (audio.currentTime>4){audio.currentTime=0;return}
  if (playIndex>0){loadTrack(playIndex-1);play()} else audio.currentTime=0
}

function renderQueue() {
  const list=document.getElementById('queueList'); list.innerHTML=''
  playQueue.forEach((t,i)=>{
    const item=document.createElement('div')
    item.className='queue-item'+(i===playIndex?' active':'')
    item.innerHTML=`
      <span class="queue-item-num">${i===playIndex?'▶':i+1}</span>
      <img class="queue-item-cover" src="${t.cover||''}" alt="" loading="lazy"/>
      <div class="queue-item-info"><div class="queue-item-title">${t.title}</div><div class="queue-item-artist">${t.artist}</div></div>
    `
    item.addEventListener('click',()=>{loadTrack(i);play()})
    list.appendChild(item)
  })
  setTimeout(()=>list.children[playIndex]?.scrollIntoView({block:'nearest',behavior:'smooth'}),100)
}

function toggleQueue() {
  const panel=document.getElementById('queuePanel'), overlay=document.getElementById('queueOverlay')
  const open=panel.classList.toggle('open'); overlay.classList.toggle('show',open)
}

// ── Profile ───────────────────────────────────────────────
async function renderProfileView() {
  const metaName=currentUser?.user_metadata?.full_name||currentUser?.user_metadata?.name
  const name=metaName||localStorage.getItem('luca_guest_name')||currentUser?.email?.split('@')[0]||'Guest'
  const email=currentUser?.email||'Not signed in'; const init=name.charAt(0).toUpperCase()

  const savedAvatar=currentUser?.user_metadata?.avatar_url||(!currentUser?localStorage.getItem('luca_guest_avatar'):null)
  const avatarEl=document.getElementById('profileAvatarBig')
  if (savedAvatar) { avatarEl.style.backgroundImage=`url('${savedAvatar}')`; avatarEl.textContent=''; suAvatar.style.backgroundImage=`url('${savedAvatar}')`; suAvatar.textContent='' }
  else { avatarEl.style.backgroundImage=''; avatarEl.textContent=init; suAvatar.style.backgroundImage=''; suAvatar.textContent=init }

  document.getElementById('profileNameEl').textContent=name
  document.getElementById('profileEmailEl').textContent=email
  const ni=document.getElementById('editProfileName'); if(ni) ni.value=metaName||localStorage.getItem('luca_guest_name')||''
  document.getElementById('profileSignInBtn').style.display=currentUser?'none':'block'
  document.getElementById('profileLogoutBtn').style.display=currentUser?'block':'none'

  let likedCount=0, playedCount=0, plCount=0
  if (!currentUser) {
    likedCount=JSON.parse(localStorage.getItem('luca_liked')||'[]').length
    playedCount=JSON.parse(localStorage.getItem('luca_history')||'[]').length
  } else {
    const [l,h,p]=await Promise.all([
      db.from('liked_songs').select('id',{count:'exact',head:true}).eq('user_id',currentUser.id),
      db.from('listening_history').select('id',{count:'exact',head:true}).eq('user_id',currentUser.id),
      db.from('playlists').select('id',{count:'exact',head:true}).eq('user_id',currentUser.id)
    ])
    likedCount=l.count||0; playedCount=h.count||0; plCount=p.count||0
  }
  document.getElementById('pstatLiked').textContent=likedCount
  document.getElementById('pstatPlaylists').textContent=plCount
  document.getElementById('pstatPlayed').textContent=playedCount
}

async function handleLogout() {
  await db.auth.signOut(); showToast('Logged out. See you soon!','info')
  setTimeout(()=>window.location.href='index.html',1200)
}

async function handleAvatarUpload(e) {
  const file=e.target.files[0]; if(!file) return
  if(file.size>3000000){showToast('Image must be under 3MB','error');return}
  const reader=new FileReader()
  reader.onload=async(ev)=>{
    const b64=ev.target.result
    document.getElementById('profileAvatarBig').style.backgroundImage=`url('${b64}')`
    document.getElementById('profileAvatarBig').textContent=''
    suAvatar.style.backgroundImage=`url('${b64}')`; suAvatar.style.backgroundSize='cover'; suAvatar.textContent=''
    if(currentUser){await db.auth.updateUser({data:{avatar_url:b64}});showToast('Avatar updated!','success')}
    else{localStorage.setItem('luca_guest_avatar',b64);showToast('Avatar saved locally','success')}
  }
  reader.readAsDataURL(file)
}

async function updateProfileName() {
  const newName=document.getElementById('editProfileName').value.trim(); if(!newName) return
  if(currentUser){await db.auth.updateUser({data:{full_name:newName}});document.getElementById('profileNameEl').textContent=newName;suName.textContent=newName;showToast('Profile updated!','success')}
  else{localStorage.setItem('luca_guest_name',newName);document.getElementById('profileNameEl').textContent=newName;suName.textContent=newName;showToast('Profile updated locally','success')}
}

async function updateUserPassword() {
  if(!currentUser){showToast('Sign in to set a password','error');return}
  const newPass=document.getElementById('editPassword').value
  if(newPass.length<6){showToast('Password must be 6+ chars','error');return}
  const{error}=await db.auth.updateUser({password:newPass})
  if(error)showToast(error.message,'error')
  else{showToast('Password changed!','success');document.getElementById('editPassword').value=''}
}

// ══════════════════════════════════════════════════════════
//  THEME ENGINE
// ══════════════════════════════════════════════════════════
const themes={default:{a1:'#00f2fe',a2:'#8b5cf6'},matrix:{a1:'#bcff00',a2:'#1db954'},crimson:{a1:'#ff0f7b',a2:'#f89b29'},gold:{a1:'#ffc837',a2:'#ff8008'}}
function setTheme(id) {
  const t=themes[id]; if(!t) return
  document.documentElement.style.setProperty('--accent-1',t.a1)
  document.documentElement.style.setProperty('--accent-2',t.a2)
  localStorage.setItem('luca_theme',id)
  document.querySelectorAll('.swatch').forEach(el=>el.classList.remove('active'))
  const map={default:'cyan-purple',matrix:'neon-green',crimson:'crimson-red',gold:'gold-amber'}
  document.querySelector(`.swatch.${map[id]}`)?.classList.add('active')
}

// ══════════════════════════════════════════════════════════
//  WEB AUDIO VISUALIZER + FX
// ══════════════════════════════════════════════════════════
let audioCtx=null, analyser=null, sourceNode=null, bassFilter=null, trebleFilter=null, gainNode=null
let audioConnected=false, fxBarVisible=false, activeFX='normal'

const FX_PRESETS={
  normal: {bass:0,  treble:0,  gain:1.0},
  bass:   {bass:9,  treble:-2, gain:1.1},
  treble: {bass:-2, treble:8,  gain:1.0},
  vocal:  {bass:-3, treble:4,  gain:1.0},
  lofi:   {bass:5,  treble:-6, gain:0.9},
  loud:   {bass:6,  treble:6,  gain:1.25},
}

function initAudioContext() {
  if (audioConnected) return
  try {
    audioCtx=new (window.AudioContext||window.webkitAudioContext)()
    analyser=audioCtx.createAnalyser(); analyser.fftSize=256; analyser.smoothingTimeConstant=0.82
    bassFilter=audioCtx.createBiquadFilter(); bassFilter.type='lowshelf'; bassFilter.frequency.value=200; bassFilter.gain.value=0
    trebleFilter=audioCtx.createBiquadFilter(); trebleFilter.type='highshelf'; trebleFilter.frequency.value=4000; trebleFilter.gain.value=0
    gainNode=audioCtx.createGain(); gainNode.gain.value=1.0
    sourceNode=audioCtx.createMediaElementSource(audio)
    sourceNode.connect(bassFilter); bassFilter.connect(trebleFilter); trebleFilter.connect(gainNode)
    gainNode.connect(analyser); gainNode.connect(audioCtx.destination); analyser.connect(audioCtx.destination)
    audioConnected=true
    // Apply saved FX
    const saved=localStorage.getItem('luca_fx')||'normal'
    activeFX=saved; applyFXValues(FX_PRESETS[saved]||FX_PRESETS.normal)
    // Update button state
    document.querySelectorAll('.fx-btn').forEach(b=>b.classList.remove('active','bass-active'))
    const savedBtn=document.getElementById(`fxbtn_${saved}`)
    if(savedBtn) savedBtn.classList.add(saved==='bass'||saved==='loud'?'bass-active':'active')
    startVisualizer()
  } catch(e){console.warn('Web Audio API unavailable:',e)}
}

function applyFXValues(preset) {
  if (!audioConnected||!preset) return
  bassFilter.gain.value=preset.bass; trebleFilter.gain.value=preset.treble; gainNode.gain.value=preset.gain
}

function applyFX(key) {
  const preset=FX_PRESETS[key]; if(!preset) return
  activeFX=key; if(audioConnected) applyFXValues(preset)
  document.querySelectorAll('.fx-btn').forEach(b=>b.classList.remove('active','bass-active'))
  const btn=document.getElementById(`fxbtn_${key}`)
  if(btn) btn.classList.add(key==='bass'||key==='loud'?'bass-active':'active')
  localStorage.setItem('luca_fx',key)
  const labels={normal:'Normal',bass:'🔊 Bass Boost',treble:'✨ Treble',vocal:'🎙 Vocals',lofi:'📻 Lo-Fi',loud:'💥 Loud'}
  showToast(`${labels[key]} applied`,'success',1800)
}

function toggleFXBar() {
  fxBarVisible=!fxBarVisible
  document.getElementById('fxBar').classList.toggle('visible',fxBarVisible)
  document.getElementById('fxToggleBtn').classList.toggle('active',fxBarVisible)
}

function startVisualizer() {
  const wrap=document.getElementById('vizWrap'), canvas=document.getElementById('vizCanvas')
  if (!canvas||!analyser) return
  const ctx=canvas.getContext('2d'), BAR_COUNT=44, dataArr=new Uint8Array(analyser.frequencyBinCount)

  function draw() {
    requestAnimationFrame(draw)
    if (!isPlaying){ ctx.clearRect(0,0,canvas.width,canvas.height); if(wrap)wrap.classList.remove('visible'); return }
    if (wrap) wrap.classList.add('visible')
    const W=canvas.offsetWidth, H=canvas.offsetHeight
    if (canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
    analyser.getByteFrequencyData(dataArr); ctx.clearRect(0,0,W,H)
    const s=getComputedStyle(document.documentElement)
    const a1=s.getPropertyValue('--accent-1').trim()||'#00f2fe'
    const a2=s.getPropertyValue('--accent-2').trim()||'#8b5cf6'
    const barW=(W/BAR_COUNT)-1.5
    for (let i=0;i<BAR_COUNT;i++){
      const val=dataArr[Math.floor(i*dataArr.length/BAR_COUNT)]
      const barH=(val/255)*H*0.9, x=i*(barW+1.5), y=H-barH
      const grad=ctx.createLinearGradient(x,H,x,y); grad.addColorStop(0,a1); grad.addColorStop(1,a2)
      ctx.shadowBlur=val>170?10:3; ctx.shadowColor=a1; ctx.fillStyle=grad
      const r=Math.min(barW/2,3)
      ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+barW-r,y); ctx.quadraticCurveTo(x+barW,y,x+barW,y+r)
      ctx.lineTo(x+barW,H); ctx.lineTo(x,H); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); ctx.fill()
      ctx.globalAlpha=0.1; ctx.shadowBlur=0; ctx.fillRect(x,H,barW,barH*0.28); ctx.globalAlpha=1
    }
    ctx.shadowBlur=0
  }
  draw()
}

// ══════════════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════════════
function attachEvents() {
  contentScroll.addEventListener('scroll',()=>{
    if(contentScroll.scrollTop+contentScroll.clientHeight>=contentScroll.scrollHeight-80){
      if(!isFetching&&currentQuery&&!['!LIKED!','!HISTORY!'].includes(currentQuery)){
        currentPage++; fetchSongs(currentQuery,isHomeRender,homeTitle.textContent||document.getElementById('searchTitle').textContent,currentPage)
      }
    }
  })

  let debTimer
  searchInput.addEventListener('input',(e)=>{
    clearTimeout(debTimer); debTimer=setTimeout(()=>{
      const q=e.target.value.trim()
      if(q.length>2) fetchSongs(q,false,`Results for "${q}"`)
      else if(q.length===0) loadHomeCategories()
    },700)
  })

  document.getElementById('homeBtn').addEventListener('click',()=>{ setActiveNav('homeBtn'); searchInput.value=''; loadHomeCategories() })
  document.getElementById('searchBtn').addEventListener('click',()=>searchInput.focus())
  document.getElementById('historyBtn').addEventListener('click',()=>{ setActiveNav('historyBtn'); fetchSongs('!HISTORY!',true,'Recently Played') })
  document.getElementById('likedSongsBtn').addEventListener('click',()=>{ setActiveNav('likedSongsBtn'); fetchSongs('!LIKED!',false,'Liked Songs') })
  sidebarUser.addEventListener('click',()=>{ if(!currentUser){window.location.href='auth.html';return} showView('profile') })
  userProfileBtn.addEventListener('click',()=>showView('profile'))
  newPlaylistBtn.addEventListener('click',async()=>{
    if(!currentUser){showToast('Sign in to create playlists','error');return}
    const name=prompt('Playlist name:'); if(name?.trim()) createPlaylist(name.trim())
  })
  nowPlayingLikeBtn.addEventListener('click',()=>{ const t=playQueue[playIndex]; if(t) toggleLike(t,nowPlayingLikeBtn) })

  audio.addEventListener('loadedmetadata',()=>durationEl.textContent=fmtTime(audio.duration))
  audio.addEventListener('timeupdate',()=>{
    const pct=(audio.currentTime/audio.duration)*100||0
    progressEl.style.width=pct+'%'; currentTimeEl.textContent=fmtTime(audio.currentTime)
  })
  audio.addEventListener('ended',()=>{ if(repeatMode==='one'){audio.currentTime=0;play()}else nextTrack() })
  audio.addEventListener('error',()=>nextTrack())

  playPauseBtn.addEventListener('click',togglePlay)
  prevBtn.addEventListener('click',prevTrack)
  nextBtn.addEventListener('click',nextTrack)

  let isSeeking=false
  function seekAt(e){const r=progressContainer.getBoundingClientRect();const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;audio.currentTime=Math.max(0,Math.min(1,x/r.width))*(audio.duration||0)}
  progressContainer.addEventListener('click',seekAt)
  progressContainer.addEventListener('pointerdown',(e)=>{isSeeking=true;progressContainer.setPointerCapture(e.pointerId);seekAt(e)})
  progressContainer.addEventListener('pointermove',(e)=>{if(isSeeking)seekAt(e)})
  progressContainer.addEventListener('pointerup',(e)=>{isSeeking=false;try{progressContainer.releasePointerCapture(e.pointerId)}catch(_){}})

  volumeInput.addEventListener('input',()=>{ audio.volume=Number(volumeInput.value); lastVolume=audio.volume>0?audio.volume:lastVolume; muteBtn.textContent=audio.volume>0?'🔈':'🔇' })
  muteBtn.addEventListener('click',()=>{
    if(audio.volume>0){lastVolume=audio.volume;audio.volume=0;volumeInput.value=0;muteBtn.textContent='🔇'}
    else{audio.volume=lastVolume||0.8;volumeInput.value=audio.volume;muteBtn.textContent='🔈'}
  })

  shuffleBtn.addEventListener('click',()=>{ isShuffle=!isShuffle; shuffleBtn.classList.toggle('active-state',isShuffle); showToast(isShuffle?'Shuffle on':'Shuffle off','info') })
  repeatBtn.addEventListener('click',()=>{
    if(repeatMode==='off'){repeatMode='all';repeatBtn.classList.add('active-state');repeatBtn.textContent='🔁';showToast('Repeat all','info')}
    else if(repeatMode==='all'){repeatMode='one';repeatBtn.textContent='🔂';showToast('Repeat one','info')}
    else{repeatMode='off';repeatBtn.classList.remove('active-state');repeatBtn.textContent='🔁';showToast('Repeat off','info')}
  })

  document.getElementById('queueToggleBtn').addEventListener('click',toggleQueue)

  document.addEventListener('keydown',(e)=>{
    if(e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if(e.code==='Space'){e.preventDefault();togglePlay()}
    else if(e.code==='ArrowRight') nextTrack()
    else if(e.code==='ArrowLeft')  prevTrack()
    else if(e.code==='KeyM')       muteBtn.click()
    else if(e.code==='KeyF')       toggleFXBar()
  })

  playlistModal.addEventListener('click',(e)=>{if(e.target===playlistModal)closeModal()})
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-links li').forEach(li=>li.classList.remove('active'))
  document.getElementById(id)?.classList.add('active')
}

function fmtTime(sec) {
  if(!sec||isNaN(sec)) return '0:00'
  return `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`
}

// ══════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════
async function boot() {
  setTheme(localStorage.getItem('luca_theme')||'default')
  await initAuth(); await refreshLikedCache(); await loadSidebarPlaylists()
  audio.volume=Number(volumeInput.value); updatePlayButton(); attachEvents()
  gsap.from('.sidebar',{x:-40,opacity:0,duration:.7,ease:'power3.out'})
  gsap.from('.player-bar',{y:80,opacity:0,duration:.7,delay:.15,ease:'power3.out'})
  gsap.from('.top-bar',{y:-20,opacity:0,duration:.5,delay:.25,ease:'power2.out'})
  coverTween=gsap.to(coverEl,{scale:1.04,boxShadow:'0 10px 20px rgba(0,242,254,.3)',duration:2,repeat:-1,yoyo:true,ease:'sine.inOut',paused:true})
  // Restore last session (track stays paused — user taps play to resume)
  restoreSession()
  // Auto-save position every 5 seconds while playing
  setInterval(() => { if (isPlaying) saveSession() }, 5000)
  loadHomeCategories()
}
boot()

// ══════════════════════════════════════════════════════════
//  BEAST MODE PROFILE API
// ══════════════════════════════════════════════════════════
function setThemeSettings(themeName) {
  // Clear existing theme classes
  document.documentElement.classList.remove('theme-glass', 'theme-spotify');
  
  if (themeName === 'glass') document.documentElement.classList.add('theme-glass');
  else if (themeName === 'spotify') document.documentElement.classList.add('theme-spotify');
  
  // Persist locally
  localStorage.setItem('luca_theme', themeName);
  
  // Update UI Swatches
  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('theme_' + themeName)?.classList.add('active');
  
  showToast(`Theme updated to ${themeName}`, 'success');
}

async function updateProfileData() {
  if (!currentUser) { showToast('Must be signed in', 'error'); return; }
  
  const pName = document.getElementById('editProfileName').value.trim();
  const pAge = document.getElementById('editAge').value.trim();
  const pPhone = document.getElementById('editPhone').value.trim();
  const pGender = document.getElementById('editGender').value;

  const btn = document.querySelector('.settings-btn');
  const oldText = btn.textContent;
  btn.textContent = 'Saving...';
  btn.disabled = true;
  
  console.log('Attempting profile update...', { pName, pAge, pPhone, pGender });
  
  if (typeof db === 'undefined') {
    showToast('Offline Mode: Saved locally only', 'warning');
    saveProfileLocally(pName, pAge, pPhone, pGender);
    btn.textContent = oldText; btn.disabled = false; return;
  }

  // Create a timeout promise to prevent 10min hangs
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request Timeout')), 8000));

  try {
    const updatePromise = db.auth.updateUser({
      data: { full_name: pName, age: pAge, phone: pPhone, gender: pGender }
    });

    // Race timeout vs real request
    const { data, error } = await Promise.race([updatePromise, timeout]);

    if (error) throw error;

    currentUser = data.user;
    if (document.getElementById('profileNameEl')) document.getElementById('profileNameEl').textContent = pName || 'User';
    showToast('Details Saved to Cloud!', 'success');
  } catch (err) {
    console.error('Save Error:', err);
    showToast('Saved to browser (Cloud Sync failed)', 'info');
    saveProfileLocally(pName, pAge, pPhone, pGender);
  } finally {
    btn.textContent = oldText;
    btn.disabled = false;
  }
}

function saveProfileLocally(n, a, p, g) {
  const localData = { full_name: n, age: a, phone: p, gender: g };
  localStorage.setItem('luca_user_meta_fallback', JSON.stringify(localData));
}

function submitFeedback() {
  const t = document.getElementById('feedbackText').value.trim();
  if (!t) { showToast('Please write something first!', 'error'); return; }
  
  const mailtoLink = `mailto:varungupta31009@gmail.com?subject=${subject}&body=${body}`;
  
  // Directly point the anchor tag to the mailto link
  const link = document.getElementById('feedbackLink');
  if (link) {
    link.href = mailtoLink;
    // We don't even need to call window.location, the browser handles the click on <a>
  }
  
  document.getElementById('feedbackText').value = '';
  showToast('Opening your Email App...', 'success', 3000);
}

// Add event listener to feedback box to update the link as user types
document.addEventListener('input', (e) => {
  if (e.target.id === 'feedbackText') {
    const t = e.target.value.trim();
    const senderEmail = currentUser?.email || 'anonymous';
    const subject = encodeURIComponent('LucaVerse Feedback');
    const body    = encodeURIComponent(`Feedback from: ${senderEmail}\n\n${t}`);
    const link = document.getElementById('feedbackLink');
    if (link) link.href = `mailto:varungupta31009@gmail.com?subject=${subject}&body=${body}`;
  }
});


// Ensure the renderProfileView hydrates these fields appropriately when opening modal
const _oldRenderProfileView = window.renderProfileView || function(){};
window.renderProfileView = function() {
  _oldRenderProfileView();
  if (currentUser) {
    document.getElementById('editAge').value = currentUser.user_metadata?.age || '';
    document.getElementById('editPhone').value = currentUser.user_metadata?.phone || '';
    document.getElementById('editEmail').value = currentUser.email || '';
    document.getElementById('editGender').value = currentUser.user_metadata?.gender || '';
    document.getElementById('editProfileName').value = currentUser.user_metadata?.full_name || '';
  }
  
  const currentTheme = localStorage.getItem('luca_theme') || 'luca';
  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('theme_' + currentTheme)?.classList.add('active');
};
// ══════════════════════════════════════════════════════════
//  LUCA — nowplaying.js  |  Ultra-Premium Popup Player v2
// ══════════════════════════════════════════════════════════

let npOpen = false
let npLyricsOpen = false
let npLyricsSongId = null

// ── Open / Close Now Playing Overlay ─────────────────────
function openNowPlaying() {
  const overlay = document.getElementById('nowPlayingOverlay')
  const pBar = document.getElementById('playerBar')
  if (!overlay) return
  npOpen = true
  overlay.classList.add('open')
  if (pBar) {
    pBar.style.display = 'none' // Absolute hide
    pBar.classList.add('hidden')
  }
  document.body.classList.add('np-active-fullscreen')
  syncNowPlayingUI()
  initSonicGlow()
  if (typeof initAudioContext === 'function') initAudioContext()
}

function closeNowPlaying() {
  const overlay = document.getElementById('nowPlayingOverlay')
  const pBar = document.getElementById('playerBar')
  if (!overlay) return
  npOpen = false
  overlay.classList.remove('open')
  overlay.classList.remove('lyrics-active')
  npLyricsOpen = false
  if (pBar) {
    pBar.style.display = 'flex'
    pBar.classList.remove('hidden')
  }
  document.body.classList.remove('np-active-fullscreen')
}

// ── Sync NP UI with current track ───────────────────────
function syncNowPlayingUI() {
  const track = playQueue[playIndex]
  if (!track) return

  // Cover art
  const coverImg = document.getElementById('npCoverImg')
  if (coverImg) {
    coverImg.onerror = () => {
      coverImg.onerror = null
      if (window.applyLucaImageFallback) applyLucaImageFallback(coverImg)
    }
    coverImg.src = track.cover || window.LUCA_VINYL_PLACEHOLDER || ''
    coverImg.onload = () => updateSonicGlowColor(coverImg)
  }

  // Blurred background
  const bgBlur = document.getElementById('npBgBlur')
  if (bgBlur) bgBlur.style.backgroundImage = `url('${track.cover || window.LUCA_VINYL_PLACEHOLDER || ''}')`

  // Song info
  const titleEl  = document.getElementById('npSongTitle')
  const artistEl = document.getElementById('npSongArtist')
  const albumEl  = document.getElementById('npAlbumName')
  if (titleEl)  titleEl.textContent  = track.title  || 'Unknown'
  if (artistEl) artistEl.textContent = track.artist || 'Unknown'
  if (albumEl)  albumEl.textContent  = track.album  || 'Single'
  if (window.refreshVibeBackground) window.refreshVibeBackground(track.cover)

  updateNpLikeBtn()
  updateNpPlayBtn()
  syncNpControlStates()

  // Auto-load lyrics if panel open & track changed
  if (npLyricsOpen && track.id !== npLyricsSongId) loadNpLyrics(track)
}

function initSonicGlow() {
  const glow = document.getElementById('npSonicGlow')
  const img  = document.getElementById('npCoverImg')
  if (!glow || !img) return
  if (img.complete && img.naturalWidth !== 0) updateSonicGlowColor(img)
  else glow.style.background = 'radial-gradient(circle at center, rgba(255,255,255,0.05), transparent)'
}

function updateSonicGlowColor(img) {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = 30; canvas.height = 30
    ctx.drawImage(img, 0, 0, 30, 30)
    const data = ctx.getImageData(0, 0, 30, 30).data
    
    // Extract 3 distinct points for mesh effect
    const getRGB = (idx) => `rgb(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`
    
    const glow = document.getElementById('npSonicGlow')
    if (glow) {
      glow.style.setProperty('--glow-c1', getRGB(400)) // Middle-ish
      glow.style.setProperty('--glow-c2', getRGB(1200)) // Bottom-ish
      glow.style.setProperty('--glow-c3', getRGB(2000)) // Another point
    }
    
    // Also update legacy blur just in case
    const bgBlur = document.getElementById('npBgBlur')
    if (bgBlur) bgBlur.style.backgroundColor = getRGB(400)
    
  } catch(e) {
    console.warn("Sonic Glow Error:", e)
  }
}

// ── Like button ──────────────────────────────────────────
function updateNpLikeBtn() {
  const btn   = document.getElementById('npLikeBtn')
  const track = playQueue[playIndex]
  if (!btn || !track) return
  const liked = isLiked(track)
  btn.innerHTML = liked
    ? `<svg viewBox="0 0 24 24" fill="#ff3355"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
  btn.classList.toggle('np-liked', liked)
}

function npToggleLike() {
  const track = playQueue[playIndex]
  if (!track) return
  toggleLike(track, null)
  setTimeout(updateNpLikeBtn, 80)
}

// ── Play/Pause button ────────────────────────────────────
function updateNpPlayBtn() {
  const btn = document.getElementById('npPlayPauseBtn')
  if (!btn) return
  btn.innerHTML = isPlaying
    ? `<svg class="np-pbtn-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
    : `<svg class="np-pbtn-icon" viewBox="0 0 24 24" fill="currentColor" style="margin-left:3px"><path d="M8 5v14l11-7z"/></svg>`
}

// ── Shuffle / Repeat state ───────────────────────────────
function syncNpControlStates() {
  const sBtn = document.getElementById('npShuffleBtn')
  const rBtn = document.getElementById('npRepeatBtn')
  if (sBtn) sBtn.classList.toggle('np-ctrl-active', isShuffle)
  if (rBtn) rBtn.classList.toggle('np-ctrl-active', repeatMode !== 'off')

  if (rBtn) {
    const badge = rBtn.querySelector('.np-repeat-badge')
    if (badge) badge.style.display = repeatMode === 'one' ? 'flex' : 'none'
  }
}

// ── Progress sync ────────────────────────────────────────
function updateNpProgress() {
  if (!npOpen) return
  const audio = document.getElementById('audio')
  if (!audio || !audio.duration) return
  const pct = (audio.currentTime / audio.duration) * 100 || 0

  const fill      = document.getElementById('npProgress')
  const curEl     = document.getElementById('npCurrentTime')
  const durEl     = document.getElementById('npDuration')
  const thumbEl   = document.getElementById('npThumb')
  if (fill)    fill.style.width = pct + '%'
  if (thumbEl) thumbEl.style.left = pct + '%'
  if (curEl)   curEl.textContent = fmtTime(audio.currentTime)
  if (durEl)   durEl.textContent = fmtTime(audio.duration)
}

// ── NP Progress seek ─────────────────────────────────────
function initNpProgress() {
  const bar   = document.getElementById('npProgressContainer')
  const audio = document.getElementById('audio')
  if (!bar || !audio) return

  let seeking = false
  function seekAt(e) {
    const r = bar.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left
    audio.currentTime = Math.max(0, Math.min(1, x / r.width)) * (audio.duration || 0)
  }
  bar.addEventListener('click', seekAt)
  bar.addEventListener('pointerdown', e => { seeking = true; bar.setPointerCapture(e.pointerId); seekAt(e) })
  bar.addEventListener('pointermove', e => { if (seeking) seekAt(e) })
  bar.addEventListener('pointerup',   e => { seeking = false; try { bar.releasePointerCapture(e.pointerId) } catch(_){} })
}

// ── NP Volume slider ─────────────────────────────────────
function initNpVolume() {
  const npVol   = document.getElementById('npVolume')
  const mainVol = document.getElementById('volume')
  const audio   = document.getElementById('audio')
  if (!npVol || !mainVol || !audio) return

  npVol.value = mainVol.value

  npVol.addEventListener('input', () => {
    audio.volume = Number(npVol.value)
    mainVol.value = npVol.value
    const muteBtn = document.getElementById('muteBtn')
    if (muteBtn) muteBtn.textContent = audio.volume > 0 ? '🔈' : '🔇'
    updateNpVolIcon()
  })
  mainVol.addEventListener('input', () => { npVol.value = mainVol.value; updateNpVolIcon() })
}

function updateNpVolIcon() {
  const audio   = document.getElementById('audio')
  const iconEl  = document.getElementById('npVolIcon')
  if (!iconEl || !audio) return
  iconEl.innerHTML = audio.volume === 0
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`
}

// ══════════════════════════════════════════════════════════
//  LYRICS ENGINE — Multi-Source with Fallback
// ══════════════════════════════════════════════════════════

// Toggle lyrics panel visibility (inside NP overlay)
function toggleNpLyrics() {
  const lyrPanel = document.getElementById('npLyricsPanel')
  const npOverlay = document.getElementById('nowPlayingOverlay')
  if (!lyrPanel) return

  npLyricsOpen = !npLyricsOpen
  lyrPanel.classList.toggle('np-lyrics-visible', npLyricsOpen)
  if (npOverlay) npOverlay.classList.toggle('lyrics-active', npLyricsOpen)

  const btn = document.getElementById('npLyricsBtn')
  if (btn) btn.classList.toggle('np-action-active', npLyricsOpen)

  if (npLyricsOpen) {
    const track = playQueue[playIndex]
    if (track && track.id !== npLyricsSongId) {
      loadNpLyrics(track)  // rAF started after render
    } else if (syncedLyrics.length > 0) {
      startLyricsRaf()     // resume rAF if already loaded
      setTimeout(() => _syncLyricsFrame(), 50)
    }
  } else {
    stopLyricsRaf()
  }
}

function closeNpLyrics() {
  const lyrPanel = document.getElementById('npLyricsPanel')
  if (lyrPanel) lyrPanel.classList.remove('np-lyrics-visible')
  npLyricsOpen = false
  stopLyricsRaf()
  const btn = document.getElementById('npLyricsBtn')
  if (btn) btn.classList.remove('np-action-active')
}

// ── Helpers: extract lyrics from API response ─────────────
function extractLyricsPayload(data) {
  // data is json.data[0] or json.data
  const root = Array.isArray(data) ? data[0] : data
  if (!root) return null

  // Priority 1: structured syncedLyrics array [{time, text}]
  const synced = root?.lyrics?.syncedLyrics
              || root?.syncedLyrics
              || root?.lyrics?.synced
  if (Array.isArray(synced) && synced.length > 0) return { type: 'synced_array', data: synced }

  // Priority 2: LRC text (contains [MM:SS.xx] timestamps)
  const lrcText = root?.lyrics?.lyrics || root?.lyrics
  if (typeof lrcText === 'string' && lrcText.trim().length > 10) {
    const isLRC = /\[\d{2}:\d{2}[.:.]\d{2}/.test(lrcText)
    return { type: isLRC ? 'lrc' : 'plain', data: lrcText }
  }
  return null
}

// Main lyrics fetcher with 3 sources
async function loadNpLyrics(track) {
  const body = document.getElementById('npLyricsBody')
  if (!body) return

  body.innerHTML = `<div class="lyrics-loading"><div class="lyr-spinner"></div><p>Loading lyrics…</p></div>`
  npLyricsSongId = track.id
  const payload = window.fetchLyricsPayload ? await window.fetchLyricsPayload(track) : null

  if (payload) {
    renderLyrics(body, payload)
    return
  }

  body.innerHTML = `
    <div class="lyrics-empty">
      <span>🎵</span>
      <p>Lyrics not available for this track.</p>
      <small>Try a more popular song or check back later.</small>
    </div>`
}

let syncedLyrics   = []
let _lastActiveIdx = -1
let _lyricsRafId   = null

// ── renderLyrics: accepts structured payload OR legacy string ────
function renderLyrics(container, payload) {
  let type, data

  if (typeof payload === 'string') {
    // Legacy plain-string path (e.g. from lyrics.ovh fallback)
    const clean = cleanLyricsHtml(payload)
    const parsed = parseLRC(clean)
    if (parsed.length > 0) {
      type = 'lrc'; data = parsed
    } else {
      type = 'plain'; data = clean
    }
  } else {
    type = payload.type; data = payload.data
  }

  if (type === 'synced_array') {
    // API returned [{time:"MM:SS.xx"|number, text:"…"}]
    syncedLyrics = data.map(item => {
      let t = item.time
      if (typeof t === 'string') {
        const parts = t.split(':')
        const m = parseFloat(parts[0]) || 0
        const s = parseFloat(parts[1]) || 0
        t = m * 60 + s
      } else {
        t = Number(t) || 0
      }
      return { time: t, text: (item.text || '').trim() }
    }).filter(l => l.text).sort((a, b) => a.time - b.time)
  } else if (type === 'lrc') {
    // If data is already parsed array (from legacy path), use directly
    syncedLyrics = Array.isArray(data) ? data : parseLRC(typeof data === 'string' ? cleanLyricsHtml(data) : '')
  } else {
    // Plain text — no timestamps
    syncedLyrics = []
  }

  _lastActiveIdx = -1

  if (syncedLyrics.length > 0) {
    container.innerHTML = `<div class="np-lyrics-text synced" id="lyricContainer">${
      syncedLyrics.map((l, i) =>
        `<p class="lyric-line-synced" id="ln-${i}" data-time="${l.time}">${escLyricsHtml(l.text)}</p>`
      ).join('')
    }</div>`
    startLyricsRaf()
  } else {
    const clean = typeof data === 'string' ? cleanLyricsHtml(data) : ''
    container.innerHTML = `<div class="np-lyrics-text">${
      clean.split('\n').map(l =>
        l.trim() === '' ? '<br>' : `<p class="lyric-line">${escLyricsHtml(l)}</p>`
      ).join('')
    }</div>`
    stopLyricsRaf()
  }
}

function cleanLyricsHtml(text) {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .trim()
}

function escLyricsHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── LRC parser — handles [MM:SS.xx], [MM:SS:xx], [MM:SS.xxx] ─────
function parseLRC(lrc) {
  const lines  = lrc.split('\n')
  const result = []
  // Matches [M+:SS.xx], [M+:SS:xx], optional fractional part
  const timeRx = /\[(\d+):(\d{2})(?:[.:](\d{2,3}))?\]/g

  for (const line of lines) {
    timeRx.lastIndex = 0
    const timestamps = []
    let match
    while ((match = timeRx.exec(line)) !== null) {
      const min   = parseInt(match[1], 10)
      const sec   = parseInt(match[2], 10)
      const msRaw = match[3] ? parseInt(match[3], 10) : 0
      // 2-digit → centiseconds (/100), 3-digit → milliseconds (/1000)
      const ms    = match[3] ? (match[3].length === 3 ? msRaw / 1000 : msRaw / 100) : 0
      timestamps.push(min * 60 + sec + ms)
    }
    const text = line.replace(/\[\d+:\d{2}(?:[.:]\d{2,3})?\]/g, '').trim()
    if (text && timestamps.length > 0) {
      for (const t of timestamps) result.push({ time: t, text })
    }
  }
  return result.sort((a, b) => a.time - b.time)
}

// ── rAF loop — frame-perfect highlight ───────────────────────────
function startLyricsRaf() {
  stopLyricsRaf()
  if (!npOpen || !npLyricsOpen) return
  _lyricsRafId = setTimeout(() => {
    _lyricsRafId = null
    _syncLyricsFrame()
  }, 0)
}

function stopLyricsRaf() {
  if (_lyricsRafId) { clearTimeout(_lyricsRafId); _lyricsRafId = null }
}

// Called every rAF frame (and also on timeupdate from event listener)
function _syncLyricsFrame() {
  if (syncedLyrics.length === 0) return
  const audio = document.getElementById('audio')
  if (!audio) return

  const curTime = audio.currentTime

  // Binary search: O(log n) active-line lookup
  let lo = 0, hi = syncedLyrics.length - 1, activeIdx = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (syncedLyrics[mid].time <= curTime) { activeIdx = mid; lo = mid + 1 }
    else hi = mid - 1
  }

  // Skip DOM update if the active line hasn't changed
  if (activeIdx === _lastActiveIdx) return
  _lastActiveIdx = activeIdx

  document.querySelectorAll('.lyric-line-synced').forEach((el, i) => {
    el.classList.toggle('active', i === activeIdx)
    el.classList.toggle('prev',   i === activeIdx - 1)
  })

  if (activeIdx >= 0) {
    const activeLine = document.getElementById(`ln-${activeIdx}`)
    const container  = document.getElementById('npLyricsBody')
    if (activeLine && container) {
      const offset = activeLine.offsetTop - container.clientHeight / 2.5
      container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' })
    }
  }
}

// Keep legacy name working (called from timeupdate in initNowPlayingOverlay)
function syncLyricsWithAudio() {
  if (!npOpen || !npLyricsOpen) return
  _syncLyricsFrame()
}

// ══════════════════════════════════════════════════════════
//  EQ PANEL — Inside the NP overlay
// ══════════════════════════════════════════════════════════
function toggleNpEQ() {
  const panel = document.getElementById('npEQPanel')
  if (!panel) return
  const visible = panel.classList.toggle('np-eq-visible')
  const btn = document.getElementById('npEQBtn')
  if (btn) btn.classList.toggle('np-action-active', visible)
}

function applyNpFX(key) {
  applyFX(key) // delegate to app.js applyFX
  // Update active state on NP EQ buttons
  document.querySelectorAll('.np-eq-btn').forEach(b => b.classList.remove('active'))
  document.getElementById(`npfx_${key}`)?.classList.add('active')
}

// ══════════════════════════════════════════════════════════
//  BOOT — Hook into app.js events
// ══════════════════════════════════════════════════════════
function initNowPlayingOverlay() {
  const audio     = document.getElementById('audio')
  const clickable = document.getElementById('nowPlayingClickable')

  // Open on clicking player bar track info
  if (clickable) {
    clickable.addEventListener('click', () => {
      const title = document.getElementById('trackTitle')?.textContent
      if (title && title !== 'Track Title') openNowPlaying()
    })
    clickable.style.cursor = 'pointer'
  }

  // Escape to close
  document.addEventListener('keydown', e => {
    if (e.code === 'Escape' && npOpen) closeNowPlaying()
  })

  // Progress & Lyrics sync
  if (audio) {
    audio.addEventListener('timeupdate', () => {
      updateNpProgress()
      syncLyricsWithAudio()
      updateWaveform()
    })
    audio.addEventListener('loadedmetadata', updateNpProgress)
  }

  initNpProgress()
  initNpVolume()
  initWaveform()

  // Swipe down to close on mobile
  const overlay = document.getElementById('nowPlayingOverlay')
  if (overlay) {
    let sy = 0
    overlay.addEventListener('touchstart', e => { sy = e.touches[0].clientY }, { passive: true })
    overlay.addEventListener('touchend',   e => { if (e.changedTouches[0].clientY - sy > 90) closeNowPlaying() }, { passive: true })
  }
}

// ── BASS REACTIVE WAVEFORM ──────────────────────────────
function initWaveform() {
  const container = document.getElementById('npWaveform')
  if (!container) return
  container.innerHTML = ''
  for(let i=0; i<8; i++) {
    const bar = document.createElement('div')
    bar.className = 'wave-bar'
    bar.style.height = '4px'
    container.appendChild(bar)
  }
}

function updateWaveform() {
  if (!npOpen || !analyser) return
  const data = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(data)
  
  const bars = document.querySelectorAll('.wave-bar')
  bars.forEach((bar, i) => {
    // Focus on lower frequencies (bass range)
    const val = data[i * 2] || 0
    const h = Math.max(4, (val / 255) * 30)
    bar.style.height = h + 'px'
    bar.style.opacity = 0.4 + (val / 255) * 0.6
  })
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initNowPlayingOverlay, 600)
})

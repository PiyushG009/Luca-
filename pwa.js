let deferredInstallPrompt = null
window.lucaInstallHelp = ''
const lucaCanInstallNatively =
  window.isSecureContext ||
  ['localhost', '127.0.0.1'].includes(window.location.hostname)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch((error) => {
      console.warn('Service worker registration failed:', error)
    })
  })
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferredInstallPrompt = event
  window.dispatchEvent(new CustomEvent('lucaverse:pwa-ready'))
})

window.addEventListener('load', () => {
  setTimeout(() => {
    if (deferredInstallPrompt) return
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (standalone) return
    if (!lucaCanInstallNatively) {
      window.lucaInstallHelp = 'Install prompt needs HTTPS or localhost. Deploy LucaVerse on HTTPS or open it on localhost to get the real install flow.'
    } else {
      window.lucaInstallHelp = 'Open your browser menu and choose Add to Home screen or Install app.'
    }
    window.dispatchEvent(new CustomEvent('lucaverse:pwa-manual'))
  }, 1400)
})

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null
  window.dispatchEvent(new CustomEvent('lucaverse:pwa-installed'))
})

window.triggerLucaInstall = async function triggerLucaInstall() {
  if (!deferredInstallPrompt) return false
  deferredInstallPrompt.prompt()
  const choice = await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  return choice?.outcome === 'accepted'
}

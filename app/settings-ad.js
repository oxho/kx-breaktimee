function mountSettingsAd (container, api) {
  if (!container || !api) return
  let active = null
  let stopped = false
  let generation = 0
  let observer

  const clear = () => {
    observer?.disconnect()
    observer = undefined
    container.replaceChildren()
    container.hidden = true
    active = null
  }

  const refresh = async () => {
    if (stopped) return
    const expected = ++generation
    try {
      const placement = await api.load()
      if (stopped || expected !== generation) return
      if (placement && active === placement.id) return
      clear()
      if (!placement) return

      const image = new window.Image()
      image.alt = ''
      image.src = placement.artwork
      await image.decode()
      if (stopped || expected !== generation || image.naturalWidth <= image.naturalHeight) return

      active = placement.id
      const report = type => {
        if (active === placement.id) api.interact(placement.id, type).catch(() => {})
      }
      const open = document.createElement('button')
      open.type = 'button'
      open.className = 'kx-ad-open'
      const caption = document.createElement('span')
      caption.textContent = `广告 · ${placement.title}`
      open.append(image, caption)
      open.addEventListener('click', () => report('click'))

      const dismiss = document.createElement('button')
      dismiss.type = 'button'
      dismiss.textContent = '关闭'
      dismiss.setAttribute('aria-label', '关闭此广告')
      dismiss.addEventListener('click', () => {
        report('dismiss')
        stopped = true
        clearInterval(timer)
        clear()
      })
      container.append(open, dismiss)
      container.hidden = false
      observer = new window.IntersectionObserver((entries) => {
        if (entries.some(({ isIntersecting }) => isIntersecting)) {
          report('impression')
          observer?.disconnect()
        }
      }, { threshold: 0.5 })
      observer.observe(container)
    } catch {
      if (expected === generation) clear()
    }
  }

  const timer = setInterval(refresh, 60000)
  refresh()
  return () => {
    stopped = true
    clearInterval(timer)
    clear()
  }
}

export { mountSettingsAd }

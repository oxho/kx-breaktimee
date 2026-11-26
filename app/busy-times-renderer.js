export async function mountBusyTimes (api) {
  const root = document.querySelector('#kx-busy-times')
  const form = root.querySelector('form')
  const list = root.querySelector('ul')
  const status = root.querySelector('[role="status"]')
  const repeat = form.elements.repeat
  const date = form.elements.date
  const label = { daily: '每天', weekdays: '工作日', once: '单次' }

  let entries = await api.load()
  repeat.addEventListener('change', () => {
    date.disabled = repeat.value !== 'once'
    date.required = !date.disabled
    date.parentElement.hidden = date.disabled
  })

  function render () {
    list.replaceChildren()
    for (const [index, row] of entries.entries()) {
      const item = document.createElement('li')
      const description = document.createElement('span')
      description.textContent = `${row.title} · ${row.date || label[row.repeat]} ${row.start}–${row.end}`
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.textContent = '删除'
      remove.disabled = false
      remove.addEventListener('click', () => save(entries.filter((_, position) => position !== index)))
      item.append(description, remove)
      list.append(item)
    }
    if (!entries.length) {
      const item = document.createElement('li')
      item.textContent = '还没有设置时段。'
      list.append(item)
    }
  }

  let saving = false
  async function save (next) {
    if (saving) return false
    saving = true
    try {
      entries = await api.save(next)
      status.textContent = '已保存。'
      render()
      return true
    } catch {
      status.textContent = '保存失败，请检查时段，最多可保存 30 条。'
      return false
    } finally {
      saving = false
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault()
    const row = Object.fromEntries(new FormData(form))
    if (await save([...entries, row])) {
      form.reset()
      repeat.dispatchEvent(new Event('change'))
    }
  })
  render()
}

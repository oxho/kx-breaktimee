class VersionChecker {
  latest () {
    return fetch(
      'https://api.github.com/repos/oxho/kx-breaktimee/releases/latest',
      {
        method: 'GET',
        headers: { 'User-Agent': 'oxho/kx-breaktimee' },
        mode: 'cors',
        cache: 'default'
      })
      .then(response => response.text())
      .then(body => JSON.parse(body).tag_name)
      .catch(() => {})
  }
}

export default VersionChecker

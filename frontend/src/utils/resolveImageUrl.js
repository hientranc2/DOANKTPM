const API_URL = import.meta.env.VITE_API_URL || 'https://doanktpm.onrender.com'

export function resolveImageUrl(img) {
  if (!img) return ''

  // Full URL
  if (img.startsWith('https://')) return img
  if (img.startsWith('http://')) return img.replace('http://', 'https://')

  // /images/xxx.png
  if (img.startsWith('/')) return `${API_URL}${img}`

  // images/xxx.png
  if (img.startsWith('images/')) return `${API_URL}/${img}`

  // filename only: product_xxx.png
  return `${API_URL}/images/${img}`
}

const normalizeBaseUrl = (url) => {
  if (!url) {
    return ''
  }
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const DEFAULT_API_BASE_URL = 'http://localhost:4000'

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
)

const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url)

export const resolveImageUrl = (imagePath) => {
  if (!imagePath) {
    return ''
  }
  if (isAbsoluteUrl(imagePath)) {
    return imagePath
  }
  const normalizedPath = imagePath.startsWith('/')
    ? imagePath
    : `/${imagePath}`
  if (!API_BASE_URL) {
    return normalizedPath
  }
  return `${API_BASE_URL}${normalizedPath}`
}

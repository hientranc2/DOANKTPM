const normalizeBaseUrl = (url) => {
  if (!url) {
    return ''
  }
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const DEFAULT_API_BASE_URL = 'http://localhost:4000'

export const API_BASE_URL = normalizeBaseUrl(
  process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL
)

const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url)

export const resolveImageUrl = (imagePath) => {
  if (!imagePath) {
    return ''
  }
  if (isAbsoluteUrl(imagePath)) {
    return imagePath
  }
  if (imagePath.startsWith('/assets/')) {
    return imagePath
  }
  if (imagePath.startsWith('/')) {
    return API_BASE_URL ? `${API_BASE_URL}${imagePath}` : imagePath
  }
  return API_BASE_URL ? `${API_BASE_URL}/${imagePath}` : imagePath
}

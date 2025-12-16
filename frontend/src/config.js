const normalizeBaseUrl = (url) => {
  if (!url) {
    return ''
  }
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const DEFAULT_API_BASE_URL = 'http://localhost:4000'

// Ưu tiên REACT_APP_API_URL (theo yêu cầu), fallback REACT_APP_API_BASE_URL rồi tới mặc định.
export const API_URL = normalizeBaseUrl(
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  DEFAULT_API_BASE_URL
)
// Giữ API_BASE_URL để tương thích với các import cũ.
export const API_BASE_URL = API_URL

const getDefaultAdminPortalUrl = () => {
  if (typeof window === 'undefined') {
    return '/admin'
  }

  const { protocol, hostname } = window.location
  return `${protocol}//${hostname}:5173`
}

export const ADMIN_PORTAL_URL = normalizeBaseUrl(
  process.env.REACT_APP_ADMIN_PORTAL_URL || getDefaultAdminPortalUrl()
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
    return API_URL ? `${API_URL}${imagePath}` : imagePath
  }
  return API_URL ? `${API_URL}/${imagePath}` : imagePath
}

import {
  API_URL,
  ADMIN_PORTAL_URL,
  resolveImageUrl
} from '../config'

describe('config.js', () => {
  describe('API_URL', () => {
    const OLD_ENV = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...OLD_ENV }
    })

    afterAll(() => {
      process.env = OLD_ENV
    })

    test('ưu tiên REACT_APP_API_URL và normalize', () => {
      process.env.REACT_APP_API_URL = 'http://example.test/'
      jest.resetModules()
      const { API_URL } = require('../config')
      expect(API_URL).toBe('http://example.test')
    })

    test('fallback REACT_APP_API_BASE_URL', () => {
      delete process.env.REACT_APP_API_URL
      process.env.REACT_APP_API_BASE_URL = 'http://localhost:9999/'
      jest.resetModules()
      const { API_URL } = require('../config')
      expect(API_URL).toBe('http://localhost:9999')
    })

    test('fallback default http://localhost:4000', () => {
      delete process.env.REACT_APP_API_URL
      delete process.env.REACT_APP_API_BASE_URL
      jest.resetModules()
      const { API_URL } = require('../config')
      expect(API_URL).toBe('http://localhost:4000')
    })
  })

  describe('resolveImageUrl', () => {
    test('falsy input → empty string', () => {
      expect(resolveImageUrl('')).toBe('')
    })

    test('absolute url giữ nguyên', () => {
      expect(resolveImageUrl('https://a.com/img.png'))
        .toBe('https://a.com/img.png')
    })

    test('/assets giữ nguyên', () => {
      expect(resolveImageUrl('/assets/a.png'))
        .toBe('/assets/a.png')
    })

    test('path bắt đầu / → ghép API_URL', () => {
      expect(resolveImageUrl('/uploads/a.png'))
        .toBe(`${API_URL}/uploads/a.png`)
    })

    test('path thường → ghép API_URL/', () => {
      expect(resolveImageUrl('uploads/a.png'))
        .toBe(`${API_URL}/uploads/a.png`)
    })
  })
})

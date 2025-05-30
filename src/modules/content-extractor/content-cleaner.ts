import { CleaningOptions } from './types'

export class ContentCleaner {
  private defaultOptions: CleaningOptions = {
    removeAds: true,
    removeNavigation: true,
    removeComments: true,
    removeRelated: true,
    removeFooters: true,
    removeSidebars: true,
    preserveImages: true,
    preserveVideos: true,
    preserveIframes: false
  }

  private removeSelectors = {
    ads: [
      '.advertisement', '.ad', '.ads', '[class*="ad-"]', '[id*="ad-"]',
      '.sponsored', '.promo', '[class*="sponsor"]', 'ins.adsbygoogle',
      '[id*="google_ads"]', '.banner-ad', '.text-ad'
    ],
    navigation: [
      'nav', '.navigation', '.nav', '.menu', '#menu', '.navbar',
      '.header-menu', '.main-menu', '.site-navigation'
    ],
    comments: [
      '#comments', '.comments', '.comment-section', '.disqus',
      '#disqus_thread', '.fb-comments', '[id*="comments"]'
    ],
    related: [
      '.related', '.related-posts', '.recommended', '.more-stories',
      '.you-might-like', '.suggested', '.popular-posts'
    ],
    footers: [
      'footer', '.footer', '#footer', '.site-footer', '.page-footer',
      '.copyright', '.footer-widgets'
    ],
    sidebars: [
      'aside', '.sidebar', '#sidebar', '.widget-area', '.side-column',
      '.rail', '[class*="sidebar"]', '[id*="sidebar"]'
    ],
    social: [
      '.social-share', '.share-buttons', '.social-media', '.sharing',
      '.share-icons', '.social-links', '.share-bar'
    ],
    popups: [
      '.popup', '.modal', '.overlay', '.lightbox', '.dialog',
      '[class*="popup"]', '[class*="modal"]', '.newsletter-signup'
    ]
  }

  clean(doc: Document, options?: Partial<CleaningOptions>): Document {
    const opts = { ...this.defaultOptions, ...options }
    const cleanDoc = doc.cloneNode(true) as Document

    // Remove unwanted elements
    if (opts.removeAds) this.removeElements(cleanDoc, this.removeSelectors.ads)
    if (opts.removeNavigation) this.removeElements(cleanDoc, this.removeSelectors.navigation)
    if (opts.removeComments) this.removeElements(cleanDoc, this.removeSelectors.comments)
    if (opts.removeRelated) this.removeElements(cleanDoc, this.removeSelectors.related)
    if (opts.removeFooters) this.removeElements(cleanDoc, this.removeSelectors.footers)
    if (opts.removeSidebars) this.removeElements(cleanDoc, this.removeSelectors.sidebars)

    // Always remove these
    this.removeElements(cleanDoc, this.removeSelectors.social)
    this.removeElements(cleanDoc, this.removeSelectors.popups)

    // Clean attributes
    this.cleanAttributes(cleanDoc)

    // Handle media
    if (!opts.preserveImages) {
      this.removeElements(cleanDoc, ['img', 'picture', 'figure'])
    }
    if (!opts.preserveVideos) {
      this.removeElements(cleanDoc, ['video', 'audio'])
    }
    if (!opts.preserveIframes) {
      this.removeElements(cleanDoc, ['iframe', 'embed', 'object'])
    }

    // Remove empty elements
    this.removeEmptyElements(cleanDoc)

    // Remove hidden elements
    this.removeHiddenElements(cleanDoc)

    return cleanDoc
  }

  private removeElements(doc: Document, selectors: string[]) {
    selectors.forEach(selector => {
      try {
        doc.querySelectorAll(selector).forEach(el => el.remove())
      } catch (e) {
        // Invalid selector, skip
      }
    })
  }

  private cleanAttributes(doc: Document) {
    const allowedAttributes = [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'data-src', 'data-srcset', 'width', 'height'
    ]

    doc.querySelectorAll('*').forEach(element => {
      const attributes = Array.from(element.attributes)

      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name)) {
          element.removeAttribute(attr.name)
        }
      })

      // Clean classes
      if (element.classList.length > 0) {
        const cleanClasses = Array.from(element.classList)
          .filter(cls => !this.isJunkClass(cls))

        element.className = cleanClasses.join(' ')
      }
    })
  }

  private isJunkClass(className: string): boolean {
    const junkPatterns = [
      /^js-/, /^is-/, /^has-/, /^wp-/, /^post-\d+$/,
      /^id-\d+$/, /^item-\d+$/, /^node-\d+$/
    ]

    return junkPatterns.some(pattern => pattern.test(className))
  }

  private removeEmptyElements(doc: Document) {
    let changed = true

    while (changed) {
      changed = false

      doc.querySelectorAll('div, span, p, section, article').forEach(element => {
        const text = element.textContent?.trim() || ''
        const hasImages = element.querySelector('img, video, iframe')

        if (text.length === 0 && !hasImages) {
          element.remove()
          changed = true
        }
      })
    }
  }

  private removeHiddenElements(doc: Document) {
    doc.querySelectorAll('[style*="display:none"], [style*="display: none"], [hidden]').forEach(el => {
      el.remove()
    })

    // Remove elements with hidden classes
    const hiddenClasses = ['hidden', 'hide', 'invisible', 'visually-hidden', 'sr-only']
    hiddenClasses.forEach(cls => {
      doc.querySelectorAll(`.${cls}`).forEach(el => el.remove())
    })
  }
}
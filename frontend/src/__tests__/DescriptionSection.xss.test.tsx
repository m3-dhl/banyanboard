import { render } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import DescriptionSection from '../components/DescriptionSection'

// NOTE: react-markdown is intentionally NOT mocked in this file.
// The purpose of these tests is to verify that the real react-markdown library
// sanitizes HTML by construction — i.e., it never renders raw HTML elements
// or event-handler attributes from user-supplied Markdown content.

const noop = vi.fn().mockResolvedValue(undefined)

describe('DescriptionSection — XSS safety (real react-markdown)', () => {
  it('does not inject a <script> element when description contains a script tag', () => {
    render(
      <DescriptionSection
        description='<script>alert(1)</script>'
        offline={false}
        onSave={noop}
      />
    )
    expect(document.querySelectorAll('script').length).toBe(0)
  })

  it('does not preserve onerror attribute when description contains an inline event handler', () => {
    render(
      <DescriptionSection
        description='<img src=x onerror="alert(1)">'
        offline={false}
        onSave={noop}
      />
    )
    expect(document.querySelector('[onerror]')).toBeNull()
  })

  it('renders normal Markdown content without throwing', () => {
    const { container } = render(
      <DescriptionSection
        description={'**bold** text\n\n- list item'}
        offline={false}
        onSave={noop}
      />
    )
    // The rendered output must be non-empty and contain some markup
    expect(container.querySelector('.description-view')).not.toBeNull()
    expect(container.querySelector('.markdown-body')).not.toBeNull()
  })
})

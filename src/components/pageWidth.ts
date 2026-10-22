/**
 * How wide a page's content gets on laptops and PCs (lg and up), where the app fills the
 * window next to the sidebar. Phones and tablets keep the single app column.
 */
export const PAGE_WIDTH = {
  /** Forms and short flows: log in, sign up, onboarding. */
  narrow: 'lg:mx-auto lg:w-full lg:max-w-md lg:pt-6',
  /** Reading and settings: comfortable line length. */
  reading: 'lg:mx-auto lg:w-full lg:max-w-2xl lg:pt-6',
  /** Overviews with room for two columns. */
  wide: 'lg:mx-auto lg:w-full lg:max-w-4xl lg:pt-6',
} as const;

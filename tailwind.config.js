/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F6F5F2',
        paper: '#FFFFFF',
        stonehairline: '#D6D3CD',
        charcoal: '#141413',
        mutedink: '#57534E',
        slateteal: {
          DEFAULT: '#0F4C5C',
          hover: '#0A3743',
          light: '#E6EFF1'
        },
        status: {
          localBg: '#F3F4F6',
          localBorder: '#9CA3AF',
          localText: '#374151',
          pendingBg: '#FEF3C7',
          pendingBorder: '#D97706',
          pendingText: '#92400E',
          syncedBg: '#DCFCE7',
          syncedBorder: '#15803D',
          syncedText: '#14532D',
          conflictBg: '#FEE2E2',
          conflictBorder: '#B91C1C',
          conflictText: '#7F1D1D'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'Consolas', 'monospace']
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '4px'
      }
    },
  },
  plugins: [],
}

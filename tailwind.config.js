/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--s1)',
        surface2: 'var(--s2)',
        text: 'var(--t)',
        muted: 'var(--t2)',
        hint: 'var(--t3)',
        accent: 'var(--acc)',
        purple: 'var(--pur)',
        green: 'var(--grn)',
        red: 'var(--red)',
        amber: 'var(--amb)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // 标题/展示字体 - Fraunces (温暖有机的衬线字体)
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        // 正文字体 - Source Sans 3 (温暖友好的无衬线)
        body: ['var(--font-source-sans)', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        // 数据/统计字体 - JetBrains Mono (清晰醒目的等宽字体)
        data: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
        // 中文字体回退
        chinese: ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
    },
  },
  plugins: [],
}

export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        navy: {
          DEFAULT: '#14243A',
          950: '#0B1625',
          900: '#14243A',
          800: '#1D3150',
          700: '#2A4266',
          600: '#3B5680',
        },
        accent: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          strong: '#C2410C',
          soft: '#FFF3EA',
        },
        canvas: '#F5F7FA',
        line: {
          DEFAULT: '#E3E8EF',
          strong: '#CBD3DE',
        },
        ink: {
          DEFAULT: '#101C2E',
          muted: '#556274',
          subtle: '#7D889A',
        },
        success: {
          DEFAULT: '#15803D',
          soft: '#E8F6EE',
          light: '#86EFAC',
        },
        warning: {
          DEFAULT: '#B45309',
          soft: '#FEF5E6',
        },
        danger: {
          DEFAULT: '#DC2626',
          hover: '#B91C1C',
          soft: '#FDECEC',
        },
        info: {
          DEFAULT: '#2563EB',
          soft: '#EAF1FE',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 28, 46, 0.04), 0 1px 3px rgba(16, 28, 46, 0.06)',
        pop: '0 16px 40px -12px rgba(16, 28, 46, 0.25), 0 2px 6px rgba(16, 28, 46, 0.06)',
      },
    },
  },
}

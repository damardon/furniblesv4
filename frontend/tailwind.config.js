/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // shadcn/ui system colors (mantenemos existentes)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // FURNIBLES Brand Colors - Sistema de marca específico
        furnibles: {
          // Primary (Warm Wood) - Color principal de marca
          wood: {
            50: '#fdf7f3',
            100: '#fbeee6',
            200: '#f6dac6',
            300: '#efc09e',
            400: '#e59c6b',
            500: '#d17943', // Color principal
            600: '#c36537',
            700: '#a3512f',
            800: '#834127',
            900: '#6a3622',
            950: '#3a1c11',
          },
          
          // Secondary (Forest) - Verde natural
          forest: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#359360', // Color principal
            600: '#26764c',
            700: '#205e3e',
            800: '#1d4d34',
            900: '#1a3f2b',
            950: '#0a2315',
          },
          
          // Accent (Gold) - Dorado cálido
          gold: {
            50: '#fefbf3',
            100: '#fef5e6',
            200: '#fde8c0',
            300: '#fcd694',
            400: '#f9bf5a',
            500: '#ffad2b', // Color principal
            600: '#f59115',
            700: '#cc7310',
            800: '#a05a14',
            900: '#824b16',
            950: '#462409',
          },
          
          // Neutral (Gray) - Grises cálidos
          warm: {
            50: '#fafaf9',
            100: '#f5f5f4',
            200: '#e7e5e4',
            300: '#d6d3d1',
            400: '#a8a29e',
            500: '#9c988c', // Color principal
            600: '#827e72',
            700: '#6b675e',
            800: '#57534e',
            900: '#44403c',
            950: '#292524',
          }
        },
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      // Tipografía FURNIBLES
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      
      // Animaciones personalizadas para assets
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'particles-move': 'particlesMove 10s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        particlesMove: {
          '0%': { transform: 'translateX(-100vw)' },
          '100%': { transform: 'translateX(100vw)' },
        },
      },
      
      // Espaciado consistente
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Breakpoints personalizados para marketplace
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
}
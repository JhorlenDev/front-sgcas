/**
 * PMT 2026 — preset do Tailwind
 * ---------------------------------------------------------------------------
 * Espelha os tokens do sistema nas utilities do Tailwind. Com ele,
 * `bg-primary`, `text-muted`, `font-heading` e `max-w-shell` passam a existir
 * e a apontar para as MESMAS custom properties do dist/pmt.css — trocar de
 * tema continua trocando tudo de uma vez.
 *
 * Uso (tailwind.config.js|ts do seu projeto):
 *
 *   import pmt from '@pmt/design/integracoes/tailwind/pmt.preset.js'
 *   export default {
 *     presets: [pmt],
 *     content: ['./app/**\/*.{ts,tsx}', './components/**\/*.{ts,tsx}'],
 *   }
 *
 * E no seu CSS de entrada, ANTES das diretivas do Tailwind:
 *
 *   @import '@pmt/design/dist/pmt-sem-reset.css';
 *   @tailwind base;
 *   @tailwind components;
 *   @tailwind utilities;
 *
 * A ordem importa: o pmt vem primeiro para que as utilities do Tailwind
 * vencam empates de especificidade. Use `pmt-sem-reset.css` porque o
 * preflight do Tailwind ja faz o reset.
 *
 * Compatibilidade com shadcn/ui: as chaves `background`, `foreground`,
 * `primary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring` sao
 * exatamente as que os componentes do shadcn esperam. Um projeto shadcn herda
 * a identidade sem editar nenhum componente — desde que
 * integracoes/next/globals.css esteja carregado (ele faz a ponte de nomes).
 */

/** @type {import('tailwindcss').Config} */
const preset = {
  // A identidade e exclusivamente clara — nao ha tema escuro (ver DESIGN.md,
  // secao 9). A estrategia `class` PRECISA ficar aqui mesmo assim: sem ela o
  // Tailwind cai no padrao `media` e qualquer `dark:` remanescente em
  // componente de terceiro dispara sozinho para quem usa o SO no escuro.
  darkMode: ['class'],

  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.5rem', lg: '1.5rem' },
      // Aqui o valor e o BREAKPOINT em que o container ganha max-width, e a
      // largura vem do `maxWidth.shell` abaixo. Os dois batem com o
      // `.pmt-shell` do CSS puro.
      screens: { xl: '1180px', '2xl': '1180px' },
    },

    screens: {
      xs: '480px',
      sm: '650px',
      md: '800px',
      lg: '1000px',
      xl: '1100px',
      '2xl': '1400px',
    },

    extend: {
      fontFamily: {
        sans: ['var(--pmt-font-body)'],
        heading: ['var(--pmt-font-heading)'],
        mono: ['var(--pmt-font-mono)'],
      },

      colors: {
        // --- Nomes do sistema PMT ---------------------------------------
        ink: 'var(--pmt-color-fg)',
        paper: 'var(--pmt-color-bg)',
        surface: 'var(--pmt-color-surface)',
        elevated: 'var(--pmt-color-elevated)',
        line: 'var(--pmt-color-line)',
        'line-strong': 'var(--pmt-color-line-strong)',
        dark: 'var(--pmt-color-dark)',
        darker: 'var(--pmt-color-darker)',

        // --- Nomes esperados pelo shadcn/ui -----------------------------
        background: 'var(--pmt-color-bg)',
        foreground: 'var(--pmt-color-fg)',
        border: 'var(--pmt-color-line)',
        input: 'var(--pmt-color-line)',
        ring: 'var(--pmt-color-ring)',

        card: {
          DEFAULT: 'var(--pmt-color-elevated)',
          foreground: 'var(--pmt-color-fg)',
        },
        popover: {
          DEFAULT: 'var(--pmt-color-elevated)',
          foreground: 'var(--pmt-color-fg)',
        },
        primary: {
          DEFAULT: 'var(--pmt-color-primary)',
          foreground: 'var(--pmt-color-primary-fg)',
          hover: 'var(--pmt-color-primary-hover)',
          soft: 'var(--pmt-color-primary-soft)',
        },
        secondary: {
          DEFAULT: 'var(--pmt-color-surface)',
          foreground: 'var(--pmt-color-fg-2)',
        },
        muted: {
          DEFAULT: 'var(--pmt-color-surface)',
          foreground: 'var(--pmt-color-fg-muted)',
        },
        accent: {
          DEFAULT: 'var(--pmt-color-accent)',
          foreground: 'var(--pmt-color-accent-fg)',
        },
        destructive: {
          DEFAULT: 'var(--pmt-color-danger)',
          foreground: 'var(--pmt-color-danger-fg)',
        },
        success: {
          DEFAULT: 'var(--pmt-color-success)',
          foreground: 'var(--pmt-color-success-fg)',
        },
        warning: {
          DEFAULT: 'var(--pmt-color-warning)',
          foreground: 'var(--pmt-color-warning-fg)',
        },
        chart: {
          1: 'var(--pmt-chart-1)',
          2: 'var(--pmt-chart-2)',
          3: 'var(--pmt-chart-3)',
          4: 'var(--pmt-chart-4)',
          5: 'var(--pmt-chart-5)',
          6: 'var(--pmt-chart-6)',
        },
      },

      // Escala tipografica do sistema. Note que `xs` e `sm` valem o MESMO
      // 14px: o piso e proposital, e a chave `xs` so existe para que codigo
      // legado que escreve `text-xs` nao caia abaixo dele por acidente.
      fontSize: {
        xs: ['var(--pmt-text-xs)', { lineHeight: '1.5' }],
        sm: ['var(--pmt-text-sm)', { lineHeight: '1.5' }],
        base: ['var(--pmt-text-base)', { lineHeight: '1.65' }],
        lg: ['var(--pmt-text-lg)', { lineHeight: '1.6' }],
        xl: ['var(--pmt-text-xl)', { lineHeight: '1.3' }],
        '2xl': ['var(--pmt-text-2xl)', { lineHeight: '1.2' }],
        '3xl': ['var(--pmt-text-3xl)', { lineHeight: '1.15' }],
        '4xl': ['var(--pmt-text-4xl)', { lineHeight: '1' }],
        '5xl': ['var(--pmt-text-5xl)', { lineHeight: '1.05' }],
        '6xl': ['var(--pmt-text-6xl)', { lineHeight: '0.98' }],
        '7xl': ['var(--pmt-text-7xl)', { lineHeight: '0.9' }],
      },

      letterSpacing: {
        hero: 'var(--pmt-tracking-hero)',
        heading: 'var(--pmt-tracking-heading)',
        tight: 'var(--pmt-tracking-tight)',
        wide: 'var(--pmt-tracking-wide)',
        eyebrow: 'var(--pmt-tracking-eyebrow)',
      },

      borderRadius: {
        none: '0',
        sm: 'var(--pmt-radius-sm)',
        DEFAULT: 'var(--pmt-radius)',
        md: 'var(--pmt-radius-md)',
        lg: 'var(--pmt-radius-lg)',
        xl: 'var(--pmt-radius-xl)',
        full: 'var(--pmt-radius-full)',
      },

      boxShadow: {
        soft: 'var(--pmt-shadow-soft)',
        elevated: 'var(--pmt-shadow-elevated)',
        overlay: 'var(--pmt-shadow-overlay)',
        toast: 'var(--pmt-shadow-toast)',
        none: 'none',
      },

      backgroundImage: {
        'gradient-primary': 'var(--pmt-gradient-primary)',
        'gradient-page-hero': 'var(--pmt-gradient-page-hero)',
        'gradient-brand': 'var(--pmt-gradient-brand)',
        'gradient-paper': 'var(--pmt-gradient-paper)',
        'gradient-hero-overlay': 'var(--pmt-gradient-hero-overlay)',
      },

      maxWidth: {
        shell: 'var(--pmt-container)',
        prose: '68ch',
      },

      spacing: {
        gutter: 'var(--pmt-gutter)',
        section: 'var(--pmt-section-y)',
      },

      zIndex: {
        sticky: 'var(--pmt-z-sticky)',
        header: 'var(--pmt-z-header)',
        dropdown: 'var(--pmt-z-dropdown)',
        overlay: 'var(--pmt-z-overlay)',
        modal: 'var(--pmt-z-modal)',
        toast: 'var(--pmt-z-toast)',
      },

      transitionTimingFunction: { pmt: 'var(--pmt-ease)' },
    },
  },
}

export default preset

import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

import pmt from './design-system/pmt.preset.js';

// A identidade visual inteira vem do preset do PMT 2026 — cores, escala
// tipográfica, raios, sombras e espaçamento. O que fica aqui é só o que é
// específico deste projeto.
//
// Nada de cor nova: se um valor não existe no preset, ou ele vira token no
// sistema de design, ou o uso está errado. Ver design-system/README.md.
const config: Config = {
  presets: [pmt as Config],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // O SGCAS é um sistema interno, e algumas telas dependem de animação de
      // entrada dos componentes do Radix.
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

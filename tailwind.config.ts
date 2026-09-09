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

        // Entrada e saída do diálogo, escritas à mão em vez de usar o
        // `zoom-in-95` do tailwindcss-animate.
        //
        // Aquele utilitário anima a propriedade `transform` inteira. Num
        // conteúdo centralizado por `translate(-50%, -50%)`, o keyframe
        // sobrescreve a centralização: o modal partia do canto inferior
        // direito e escorregava até o meio da tela. Aqui a centralização é do
        // flex do contêiner, e a animação só mexe em opacidade e deslocamento
        // vertical — que é o "fade in up" pedido.
        'dialogo-entra': {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'dialogo-sai': {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
        },

        // No celular o diálogo vira gaveta ancorada embaixo: sobe da borda
        // inferior, sem escala — escala em folha colada na borda faz a peça
        // parecer descolar do fundo da tela.
        'gaveta-entra': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'gaveta-sai': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(100%)' },
        },

        'fade-entra': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-sai': { from: { opacity: '1' }, to: { opacity: '0' } },

        'lista-entra': {
          from: { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'dialogo-entra': 'dialogo-entra 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
        'dialogo-sai': 'dialogo-sai 0.16s ease-in',
        'gaveta-entra': 'gaveta-entra 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'gaveta-sai': 'gaveta-sai 0.2s ease-in',
        'fade-entra': 'fade-entra 0.2s ease-out',
        'fade-sai': 'fade-sai 0.16s ease-in',
        'lista-entra': 'lista-entra 0.14s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

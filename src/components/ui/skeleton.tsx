import { cn } from '@/lib/utils';

/**
 * Barra de conteúdo que ainda não chegou.
 *
 * O tom é o `--border` cheio (#dce2dc). Antes era `bg-border/70`, que sobre o
 * bege do fundo (#fbfaf6) some: nas capturas a tela aparecia com as caixas
 * certas e vazias por dentro, que é justamente a tela em branco que o esqueleto
 * existe para evitar.
 *
 * A animação é uma faixa clara atravessando a barra, e não a opacidade
 * piscando: o brilho continua legível num cinza claro, o pulso não. Quem pediu
 * menos movimento no sistema (`prefers-reduced-motion`) recebe a barra parada,
 * que continua dizendo a mesma coisa.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-border',
        "after:absolute after:inset-0 after:content-['']",
        'after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/80 after:to-transparent',
        'motion-safe:after:animate-brilho motion-reduce:after:hidden',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };

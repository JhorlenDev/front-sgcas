"use client";

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

/** Abaixo disto o diálogo vira gaveta ancorada na borda inferior. Casa com `sm:` do Tailwind. */
const LARGURA_DE_GAVETA = 640;

/** Quanto o dedo precisa arrastar para a gaveta fechar, em pixels. */
const ARRASTO_PARA_FECHAR = 110;

function useEhGaveta() {
  // `useSyncExternalStore` evita o pisca do primeiro render: no servidor não há
  // largura de janela, e decidir no `useEffect` renderizaria o formato errado
  // por um quadro antes de corrigir.
  return React.useSyncExternalStore(
    (aoMudar) => {
      const consulta = window.matchMedia(`(max-width: ${LARGURA_DE_GAVETA - 1}px)`);
      consulta.addEventListener('change', aoMudar);
      return () => consulta.removeEventListener('change', aoMudar);
    },
    () => window.matchMedia(`(max-width: ${LARGURA_DE_GAVETA - 1}px)`).matches,
    () => false,
  );
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-fade-entra data-[state=closed]:animate-fade-sai',
      'motion-reduce:animate-none',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type ConteudoProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  /** Some com o X do canto. Útil quando o rodapé já tem "Cancelar". */
  semBotaoFechar?: boolean;
};

/**
 * Conteúdo do diálogo — centralizado no desktop, gaveta no celular.
 *
 * A centralização é do flex do contêiner, e não de `translate(-50%, -50%)`.
 * A diferença não é estética: o `zoom-in-95` do tailwindcss-animate anima a
 * propriedade `transform` inteira e apagava aquela centralização durante a
 * animação, fazendo o modal atravessar a tela na diagonal, do canto inferior
 * direito até o meio. Sem o translate, a animação mexe só no que deve.
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ConteudoProps
>(({ className, children, semBotaoFechar = false, ...props }, ref) => {
  const ehGaveta = useEhGaveta();
  const conteudo = React.useRef<HTMLDivElement | null>(null);
  const [arrasto, setArrasto] = React.useState(0);
  const inicio = React.useRef<number | null>(null);

  // Arrastar para baixo fecha a gaveta. É o gesto que qualquer pessoa tenta
  // primeiro num painel colado na borda inferior; sem ele, a única saída é
  // mirar no X, que fica longe do polegar.
  const aoApontar = React.useCallback((evento: React.PointerEvent<HTMLDivElement>) => {
    if (!ehGaveta || evento.button !== 0) return;
    // Só inicia o gesto quando a lista já está no topo, senão o arrasto rouba
    // a rolagem do conteúdo.
    if ((conteudo.current?.scrollTop ?? 0) > 0) return;
    inicio.current = evento.clientY;
    evento.currentTarget.setPointerCapture(evento.pointerId);
  }, [ehGaveta]);

  const aoMover = React.useCallback((evento: React.PointerEvent<HTMLDivElement>) => {
    if (inicio.current === null) return;
    setArrasto(Math.max(0, evento.clientY - inicio.current));
  }, []);

  const aoSoltar = React.useCallback((evento: React.PointerEvent<HTMLDivElement>) => {
    if (inicio.current === null) return;
    const percorrido = evento.clientY - inicio.current;
    inicio.current = null;
    setArrasto(0);
    if (percorrido > ARRASTO_PARA_FECHAR) {
      // Fecha pelo próprio Radix, para o foco voltar a quem abriu.
      evento.currentTarget.closest('[role="dialog"]')
        ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }
  }, []);

  return (
    <DialogPortal>
      <DialogOverlay />
      {/* Contêiner que centraliza. `pointer-events-none` para o clique fora
          continuar chegando no overlay e fechar o diálogo. */}
      <div className={cn(
        'pointer-events-none fixed inset-0 z-50 flex justify-center',
        ehGaveta ? 'items-end' : 'items-center p-4',
      )}>
        <DialogPrimitive.Content
          ref={ref}
          onOpenAutoFocus={(evento) => {
            // No celular, focar o primeiro campo sozinho abre o teclado e come
            // metade da gaveta antes de a pessoa ler o que ela pergunta.
            if (ehGaveta) evento.preventDefault();
          }}
          style={arrasto ? { transform: `translateY(${arrasto}px)`, transition: 'none' } : undefined}
          className={cn(
            'pointer-events-auto relative flex max-h-[90dvh] w-full flex-col gap-5 border border-border bg-background shadow-elevated',
            'focus:outline-none',
            ehGaveta
              ? [
                  // Gaveta: colada embaixo, cantos superiores arredondados e
                  // respiro para a barra de gestos do aparelho.
                  'max-w-none rounded-t-xl border-b-0 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3',
                  'data-[state=open]:animate-gaveta-entra data-[state=closed]:animate-gaveta-sai',
                ]
              : [
                  'max-w-lg rounded-none p-8',
                  'data-[state=open]:animate-dialogo-entra data-[state=closed]:animate-dialogo-sai',
                ],
            'motion-reduce:animate-none',
            className,
          )}
          {...props}
        >
          {ehGaveta && (
            <div
              onPointerDown={aoApontar}
              onPointerMove={aoMover}
              onPointerUp={aoSoltar}
              onPointerCancel={aoSoltar}
              className="-mx-5 -mt-3 flex shrink-0 cursor-grab touch-none justify-center px-5 pb-2 pt-3 active:cursor-grabbing"
            >
              <span className="h-1.5 w-11 rounded-full bg-border" aria-hidden="true" />
            </div>
          )}

          <div ref={conteudo} className="flex min-h-0 flex-col gap-5 overflow-y-auto">
            {children}
          </div>

          {!semBotaoFechar && (
            <DialogPrimitive.Close className={cn(
              'absolute flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-all',
              'hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              ehGaveta ? 'right-3 top-3' : 'right-4 top-4',
            )}>
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex shrink-0 flex-col gap-1.5 pr-12 text-left', className)} {...props} />
);

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex shrink-0 flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end',
      className,
    )}
    {...props}
  />
);

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-xl font-medium leading-tight tracking-tight text-foreground', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm leading-relaxed text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
};

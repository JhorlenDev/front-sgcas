"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui";

/**
 * O desfecho de um formulário que grava.
 *
 * `null` é o estado de antes de enviar — e é o que impede o diálogo de abrir
 * sozinho quando a tela monta. Qualquer desfecho, certo ou errado, é objeto.
 *
 * Fechar volta a `null`. É isso que garante que a MESMA recusa, recebida duas
 * vezes seguidas, reabra o diálogo: sem voltar ao vazio, o segundo erro não
 * mudaria nada na tela e pareceria que o botão parou de funcionar.
 */
export type Resultado = {
  ok: boolean;
  titulo: string;
  mensagem: string;
} | null;

/**
 * Responde num diálogo o que aconteceu ao gravar: o sucesso confirmando o que
 * foi feito, a recusa dizendo o motivo.
 *
 * Usa o `Dialog` do projeto, e não um `<dialog>` nativo: o do projeto já vira
 * gaveta no celular e tem o foco resolvido junto das camadas flutuantes — um
 * segundo sistema de diálogo seria mais uma coisa a manter em sincronia.
 */
export function ResultadoDoFormulario({
  resultado,
  onFechar,
}: {
  resultado: Resultado;
  onFechar: () => void;
}) {
  const Icone = resultado?.ok ? CircleCheck : CircleAlert;

  return (
    <Dialog open={resultado !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icone
              size={20}
              aria-hidden="true"
              className={resultado?.ok ? "text-[var(--pmt-color-primary)]" : "text-[var(--pmt-color-danger)]"}
            />
            {resultado?.titulo}
          </DialogTitle>
          <DialogDescription>{resultado?.mensagem}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={onFechar}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

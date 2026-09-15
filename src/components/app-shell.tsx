"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Building2,
  Ellipsis,
  MapPinned,
  Headset,
  LayoutDashboard,
  LogOut,
  Search,
  Shield,
  Sparkles,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConteudoFalso } from "@/components/skeletons/blocos";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { defaultRouteForRole, useAuth } from "@/lib/auth";
import { rotuloDoPapel } from "@/lib/rotulos";

type ItemDeNavegacao = {
  href: string;
  label: string;
  /** Rótulo da barra inferior do celular, onde cada aba tem ~75px. */
  curto: string;
  icon: LucideIcon;
  roles?: string[];
};

const navItems: ItemDeNavegacao[] = [
  { href: "/dashboard", label: "Painel", curto: "Painel", icon: LayoutDashboard },
  { href: "/cidadaos", label: "Cidadãos", curto: "Cidadãos", icon: Search },
  { href: "/recepcao", label: "Recepção", curto: "Recepção", icon: Headset },
  { href: "/fila", label: "Atendimento", curto: "Atender", icon: Stethoscope },
  { href: "/casos", label: "Acompanhamentos", curto: "Casos", icon: ClipboardList },
  { href: "/acoes-itinerantes", label: "Ações itinerantes", curto: "Ações", icon: MapPinned, roles: ["ADMIN", "GESTOR_ACOES_ITINERANTES"] },
  { href: "/institucional", label: "Institucional", curto: "Institucional", icon: Building2, roles: ["ADMIN", "COORDENADOR"] },
  { href: "/admin", label: "Usuários", curto: "Usuários", icon: Users, roles: ["ADMIN", "COORDENADOR"] },
];

/**
 * As 4 abas da barra inferior, por papel — cada um vê primeiro o que mais usa.
 *
 * A barra de um app comporta 5 posições, e a quinta é "Mais". O resto dos
 * itens do papel vai para a gaveta que ela abre. A ordem aqui é de uso, não a
 * da barra lateral: a recepcionista abre o sistema para o balcão, não para o
 * painel.
 */
const ABAS_POR_PAPEL: Record<string, string[]> = {
  ADMIN: ["/dashboard", "/cidadaos", "/recepcao", "/fila"],
  COORDENADOR: ["/dashboard", "/casos", "/fila", "/cidadaos"],
  ASSISTENTE_SOCIAL: ["/fila", "/casos", "/cidadaos", "/dashboard"],
  TECNICO: ["/fila", "/casos", "/cidadaos", "/dashboard"],
  RECEPCIONISTA: ["/recepcao", "/cidadaos", "/fila", "/dashboard"],
  GESTOR_ACOES_ITINERANTES: ["/acoes-itinerantes", "/cidadaos", "/dashboard", "/casos"],
  VISUALIZADOR: ["/cidadaos", "/dashboard", "/casos", "/fila"],
};

const ABAS_NA_BARRA = 4;

function itensDoPapel(role: string) {
  return navItems.filter((item) => !item.roles || item.roles.includes(role));
}

/** Separa o que vai na barra do que vai na gaveta "Mais". */
function distribuirNavegacao(role: string) {
  const visiveis = itensDoPapel(role);
  const preferidas = (ABAS_POR_PAPEL[role] ?? [])
    .map((href) => visiveis.find((item) => item.href === href))
    .filter((item): item is ItemDeNavegacao => Boolean(item));
  // Papel sem mapa (ou mapa apontando para item que ele não vê) completa pela
  // ordem da barra lateral, para a barra nunca nascer com buraco.
  const abas = [...preferidas, ...visiveis.filter((item) => !preferidas.includes(item))].slice(0, ABAS_NA_BARRA);
  return { abas, mais: visiveis.filter((item) => !abas.includes(item)) };
}

function estaAtivo(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [maisAberto, setMaisAberto] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSidebarCollapsed(window.localStorage.getItem("sgcas-sidebar-collapsed") === "true");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("sgcas-sidebar-collapsed", String(next));
      return next;
    });
  }

  if (loading) {
    // A moldura aparece na hora; só o miolo espera a sessão.
    //
    // Antes esta tela era a frase "Carregando sessão..." no meio do vazio: a
    // pessoa clicava e o sistema sumia por inteiro por um instante. A barra
    // lateral e o cabeçalho não dependem de dado nenhum para existir — só os
    // rótulos dentro deles dependem, e é só isso que vira esqueleto.
    return (
      <div className="min-h-screen bg-background">
        <aside className={cn(
          "hidden border-r border-border bg-white md:fixed md:inset-y-0 md:z-30 md:flex md:flex-col",
          sidebarCollapsed ? "md:w-20" : "md:w-64",
        )}>
          <div className="flex items-center gap-3 px-5 pt-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            {!sidebarCollapsed && (
              <div className="flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-1.5 h-3 w-28" />
              </div>
            )}
          </div>
          <div className="mt-8 grid gap-1 px-3">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        </aside>

        <div className={cn("transition-[padding] duration-300", sidebarCollapsed ? "md:pl-20" : "md:pl-64")}>
          <header className="sticky top-0 z-20 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-4 border-b border-border/70 bg-elevated px-4 pt-[env(safe-area-inset-top)] md:px-8">
            <Skeleton className="h-4 w-32" />
            <div className="flex-1" />
            <Skeleton className="hidden h-6 w-28 rounded-full sm:block" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </header>

          <main className="mx-auto max-w-[1440px] overflow-x-clip p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-8" aria-busy="true">
            <span className="sr-only" role="status">Carregando a sessão…</span>
            <ConteudoFalso />
          </main>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-elevated pb-[env(safe-area-inset-bottom)] md:hidden" aria-hidden="true">
          <div className="grid h-16 grid-cols-5">
            {Array.from({ length: ABAS_NA_BARRA + 1 }, (_, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-1.5">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-2.5 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials =
    user.nome
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "??";
  const current = navItems.find((item) => estaAtivo(pathname, item.href));
  const pageTitle = current?.label ?? "SGCAS";
  const { abas, mais } = distribuirNavegacao(user.papel);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        pathname={pathname}
        homeHref={defaultRouteForRole(user.papel)}
        role={user.papel}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <div className={cn("transition-[padding] duration-300", sidebarCollapsed ? "md:pl-20" : "md:pl-64")}>
        <header className="sticky top-0 z-20 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-4 border-b border-border/70 bg-elevated px-4 pt-[env(safe-area-inset-top)] md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
            <span className="truncate text-sm font-semibold text-foreground">{pageTitle}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {user.unidade ? (
              <span className="hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground sm:inline">
                {user.unidade.nome}
              </span>
            ) : (
              <span className="hidden items-center gap-1 rounded-full bg-[var(--pmt-color-warning-soft)] px-3 py-1 text-xs font-medium text-[var(--pmt-color-warning-soft-fg)] sm:inline-flex">
                <Sparkles className="h-3.5 w-3.5" />
                Sem unidade vinculada
              </span>
            )}

            {/* No celular o avatar é botão: abre a mesma gaveta do "Mais", que
                é onde moram o perfil e o Sair. */}
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full md:hidden"
              onClick={() => setMaisAberto(true)}
              aria-label="Abrir perfil e menu"
            >
              <Avatar className="h-9 w-9 ring-2 ring-white">
                <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>

            <div className="hidden items-center gap-3 md:flex">
              <Avatar className="h-9 w-9 ring-2 ring-white">
                <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium leading-tight text-foreground">{user.nome}</p>
                <p className="text-xs tracking-tight text-muted-foreground">{rotuloDoPapel(user.papel)}</p>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => void logout()} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* `overflow-x-clip`, e não `hidden`: é a rede de segurança contra
            estouro lateral que não transforma o `main` em contêiner de
            rolagem — `hidden` faria isso e deixaria inerte todo `sticky` dentro
            dele. O `pb` do celular reserva a altura da barra inferior, e mais
            a do botão flutuante quando a página tem um. */}
        <main
          id="conteudo"
          className={cn(
            "mx-auto max-w-[1440px] overflow-x-clip p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-8",
            "has-[[data-fab]]:pb-[calc(10.5rem+env(safe-area-inset-bottom))] md:has-[[data-fab]]:pb-8",
          )}
        >
          {children}
        </main>
      </div>

      <BarraInferior pathname={pathname} abas={abas} maisAtivo={mais.some((item) => estaAtivo(pathname, item.href))} onMais={() => setMaisAberto(true)} />

      <GavetaMais
        aberta={maisAberto}
        onAberta={setMaisAberto}
        pathname={pathname}
        itens={mais}
        nome={user.nome}
        email={user.email}
        papel={rotuloDoPapel(user.papel)}
        unidade={user.unidade?.nome}
        initials={initials}
        onSair={() => void logout()}
      />
    </div>
  );
}

/**
 * Barra de abas do celular, no lugar do menu hambúrguer.
 *
 * Hambúrguer esconde a navegação atrás de dois toques e fica no canto de cima,
 * longe do polegar. A barra deixa os destinos do papel sempre à vista, na zona
 * que a mão alcança — é o que dá à tela a cara de app.
 */
function BarraInferior({
  pathname,
  abas,
  maisAtivo,
  onMais,
}: {
  pathname: string;
  abas: ItemDeNavegacao[];
  maisAtivo: boolean;
  onMais: () => void;
}) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-elevated/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {abas.map((item) => (
          <li key={item.href} className="min-w-0">
            <AbaDaBarra
              href={item.href}
              icon={item.icon}
              rotulo={item.curto}
              ativo={estaAtivo(pathname, item.href)}
            />
          </li>
        ))}
        <li className="min-w-0">
          <AbaDaBarra icon={Ellipsis} rotulo="Mais" ativo={maisAtivo} onClick={onMais} />
        </li>
      </ul>
    </nav>
  );
}

function AbaDaBarra({
  href,
  icon: Icon,
  rotulo,
  ativo,
  onClick,
}: {
  href?: string;
  icon: LucideIcon;
  rotulo: string;
  ativo: boolean;
  onClick?: () => void;
}) {
  const classes = cn(
    "flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold tracking-tight transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    ativo ? "text-primary" : "text-muted-foreground",
  );
  const conteudo = (
    <>
      {/* A pílula atrás do ícone marca a aba atual sem depender só da cor. */}
      <span className={cn(
        "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
        ativo && "bg-primary-soft",
      )}>
        <Icon className="h-5 w-5" strokeWidth={ativo ? 2.4 : 2} aria-hidden="true" />
      </span>
      <span className="max-w-full truncate">{rotulo}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-current={ativo ? "page" : undefined}>
        {conteudo}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick} aria-haspopup="dialog">
      {conteudo}
    </button>
  );
}

/** Gaveta do "Mais": perfil de quem está logado, o resto do menu e o Sair. */
function GavetaMais({
  aberta,
  onAberta,
  pathname,
  itens,
  nome,
  email,
  papel,
  unidade,
  initials,
  onSair,
}: {
  aberta: boolean;
  onAberta: (aberta: boolean) => void;
  pathname: string;
  itens: ItemDeNavegacao[];
  nome: string;
  email?: string | null;
  papel: string;
  unidade?: string | null;
  initials: string;
  onSair: () => void;
}) {
  return (
    <Dialog open={aberta} onOpenChange={onAberta}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">Menu</DialogTitle>
          <DialogDescription className="sr-only">Perfil, demais telas do sistema e saída.</DialogDescription>
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">{nome}</p>
              <p className="truncate text-sm text-muted-foreground">{email || papel}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{papel}</span>
            <span className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              unidade ? "bg-secondary text-muted-foreground" : "bg-[var(--pmt-color-warning-soft)] text-[var(--pmt-color-warning-soft-fg)]",
            )}>
              {unidade ?? "Sem unidade vinculada"}
            </span>
          </div>
        </DialogHeader>

        {itens.length > 0 && (
          <nav aria-label="Outras telas" className="flex flex-col gap-1">
            {itens.map((item) => {
              const ativo = estaAtivo(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onAberta(false)}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium transition-colors",
                    ativo ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary",
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", !ativo && "text-muted-foreground")} aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className={cn("h-4 w-4", !ativo && "text-muted-foreground")} aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onSair}
            className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Sair
          </button>
          <p className="text-center text-xs text-muted-foreground">SGCAS v0.1.0 · Desenvolvido por SEDECTI</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Sidebar({
  pathname,
  homeHref,
  role,
  collapsed,
  onToggle,
}: {
  pathname: string;
  homeHref: string;
  role: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        "hidden transition-[width] duration-300 md:fixed md:inset-y-0 md:z-30 md:flex md:flex-col",
        collapsed ? "md:w-20" : "md:w-64",
      )}
    >
      <div className="flex flex-grow flex-col overflow-y-auto overflow-x-hidden border-r border-border bg-white pt-6">
        <div className={cn("mb-8 flex items-center", collapsed ? "justify-center px-3" : "justify-between gap-2 px-5")}>
          <Brand href={homeHref} hideText={collapsed} />
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("h-9 w-9", collapsed && "absolute left-[62px] top-6 rounded-full border border-border bg-white")}
            title={collapsed ? "Expandir menu" : "Minimizar menu"}
            aria-label={collapsed ? "Expandir menu lateral" : "Minimizar menu lateral"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <Nav pathname={pathname} role={role} compact={collapsed} />
        <Footer compact={collapsed} />
      </div>
    </aside>
  );
}

function Brand({ href, hideText = false }: { href: string; hideText?: boolean }) {
  return (
    // Sem margem nem padding próprios: quem posiciona a marca é o cabeçalho que
    // a contém. Com `mb-8 px-6` aqui, o espaçamento somava com o do container e
    // espremia o botão de minimizar contra a borda da barra.
    <Link className="flex min-w-0 items-center gap-3" href={href} title="SGCAS">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary">
        <Shield className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className={cn("min-w-0", hideText && "sr-only")}>
        <h1 className="text-base font-semibold tracking-tight text-foreground">SGCAS</h1>
        <p className="text-xs text-muted-foreground">Assistência Social</p>
      </div>
    </Link>
  );
}

function Nav({ pathname, role, compact = false }: { pathname: string; role: string; compact?: boolean }) {
  return (
    <nav className="flex-1 space-y-1 px-3">
      {itensDoPapel(role).map((item) => {
        const isActive = estaAtivo(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              "flex items-center rounded-full px-4 py-2.5 text-base font-medium tracking-tight transition-all duration-200",
              compact && "justify-center px-0",
              isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary",
            )}
          >
            <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", !compact && "mr-3", isActive ? "" : "text-muted-foreground")} />
            <span className={cn(compact && "sr-only")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Footer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("relative flex-shrink-0 border-t border-border", compact ? "p-3" : "p-6")}>
      {compact ? (
        <p className="text-center text-sm font-semibold tracking-tight text-muted-foreground">v0.1</p>
      ) : (
        <>
          <p className="text-center text-xs tracking-tight text-muted-foreground">SGCAS v0.1.0</p>
          <p className="mt-0.5 text-center text-sm tracking-tight text-muted-foreground/70">Desenvolvido por SEDECTI</p>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  BookOpen,
  ChefHat,
  ListChecks,
  Plus,
  ShoppingCart,
  Siren,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Schnellaktionen: mobil ein schwebender Plus-Knopf über der Bottom-Nav,
 * am Desktop zusätzlich Cmd/Ctrl+K als Befehls-Palette. Beide führen zu den
 * häufigsten Handgriffen (Tagebuch-Eintrag, Einkaufsliste, Packliste,
 * Rezept-Suche, SOS) – Gäste sehen nur die Aktionen ohne Login-Pflicht.
 */

/** Auf Druck- und Teil-Ansichten bewusst ausblenden (ruhige Leseansichten). */
function isQuietRoute(path: string): boolean {
  return (
    path.includes("/drucken") ||
    path.startsWith("/liste/") ||
    path.startsWith("/einkaufsliste/") ||
    path.startsWith("/platz/") ||
    path.startsWith("/vorlage/") ||
    path.startsWith("/reise/") ||
    path.startsWith("/reise-einladung/")
  );
}

interface QuickAction {
  id: string;
  icon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
  label: string;
  /** true = führt zur Einkaufslisten-Eingabe statt zu einer Navigation */
  shopping?: boolean;
  target?: string;
  destructive?: boolean;
}

export default function QuickActions() {
  const t = useT();
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  /** Palette: "menu" zeigt die Aktionen, "shopping" das Eingabefeld. */
  const [paletteView, setPaletteView] = useState<"menu" | "shopping">("menu");
  const [itemName, setItemName] = useState("");

  const hidden = isQuietRoute(location);

  // Desktop: Cmd/Ctrl+K öffnet bzw. schliesst die Befehls-Palette
  useEffect(() => {
    if (hidden) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteView("menu");
        setItemName("");
        setPaletteOpen(open => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hidden]);

  const addToShoppingMutation = trpc.shopping.add.useMutation({
    onSuccess: (result, variables) => {
      utils.shopping.list.invalidate();
      if (result.added) {
        toast.success(t.quickActions.shoppingAdded(variables.name));
      } else {
        toast.info(t.quickActions.shoppingExists(variables.name));
      }
      setItemName("");
    },
    onError: () => toast.error(t.quickActions.shoppingFailed),
  });

  if (hidden) return null;

  const actions: QuickAction[] = [
    ...(isAuthenticated
      ? [
          {
            id: "trip",
            icon: BookOpen,
            label: t.quickActions.newTrip,
            target: "/tagebuch?neu=1",
          },
          {
            id: "shopping",
            icon: ShoppingCart,
            label: t.quickActions.shoppingAdd,
            shopping: true,
          },
          {
            id: "packlist",
            icon: ListChecks,
            label: t.quickActions.newPackList,
            target: "/packlisten?neu=1",
          },
        ]
      : []),
    {
      id: "recipes",
      icon: ChefHat,
      label: t.quickActions.recipeSearch,
      target: "/rezepte?suche=1",
    },
    {
      id: "sos",
      icon: Siren,
      label: t.quickActions.sos,
      target: "/sos",
      destructive: true,
    },
  ];

  const runNavigation = (target: string) => {
    setSheetOpen(false);
    setPaletteOpen(false);
    setPaletteView("menu");
    navigate(target);
  };

  const submitShoppingItem = () => {
    const name = itemName.trim();
    if (!name || addToShoppingMutation.isPending) return;
    addToShoppingMutation.mutate({ name });
  };

  /** Inline-Eingabe für die Einkaufsliste (im Sheet und in der Palette). */
  const shoppingForm = (idPrefix: string) => (
    <form
      className="grid gap-2"
      onSubmit={e => {
        e.preventDefault();
        submitShoppingItem();
      }}
    >
      <Label htmlFor={`${idPrefix}-shopping-input`}>
        {t.quickActions.shoppingAdd}
      </Label>
      <div className="flex gap-2">
        <Input
          id={`${idPrefix}-shopping-input`}
          value={itemName}
          onChange={e => setItemName(e.target.value)}
          placeholder={t.quickActions.shoppingPlaceholder}
          maxLength={160}
          autoFocus={idPrefix === "palette"}
        />
        <Button
          type="submit"
          disabled={!itemName.trim() || addToShoppingMutation.isPending}
        >
          {t.quickActions.shoppingSubmit}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {/* Mobil: schwebender Plus-Knopf über der Bottom-Nav */}
      <button
        type="button"
        onClick={() => {
          setItemName("");
          setSheetOpen(true);
        }}
        className={cn(
          "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 md:hidden",
          "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground",
          "shadow-lg transition-transform active:scale-95"
        )}
        aria-label={t.quickActions.fabAria}
        aria-haspopup="dialog"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Mobil: Aktions-Sheet von unten */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="pb-1">
            <SheetTitle>{t.quickActions.title}</SheetTitle>
            <SheetDescription>{t.quickActions.subtitle}</SheetDescription>
          </SheetHeader>
          <div className="grid gap-1 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {actions.map(action => {
              const Icon = action.icon;
              if (action.shopping) {
                return <div key={action.id}>{shoppingForm("sheet")}</div>;
              }
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => runNavigation(action.target!)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm font-medium",
                    "transition-colors hover:bg-accent",
                    action.destructive && "text-destructive"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: Befehls-Palette (Cmd/Ctrl+K) mit Tastatur-Navigation */}
      <Dialog
        open={paletteOpen}
        onOpenChange={open => {
          setPaletteOpen(open);
          if (!open) {
            setPaletteView("menu");
            setItemName("");
          }
        }}
      >
        <DialogContent className="p-0 sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>{t.quickActions.title}</DialogTitle>
            <DialogDescription>{t.quickActions.subtitle}</DialogDescription>
          </DialogHeader>
          {paletteView === "menu" ? (
            <Command>
              <CommandInput placeholder={t.quickActions.searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{t.quickActions.noResults}</CommandEmpty>
                <CommandGroup heading={t.quickActions.title}>
                  {actions.map(action => {
                    const Icon = action.icon;
                    return (
                      <CommandItem
                        key={action.id}
                        onSelect={() => {
                          if (action.shopping) {
                            setPaletteView("shopping");
                          } else {
                            runNavigation(action.target!);
                          }
                        }}
                        className={cn(action.destructive && "text-destructive")}
                      >
                        <Icon aria-hidden="true" />
                        {action.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          ) : (
            <div className="grid gap-3 p-4">
              {shoppingForm("palette")}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-self-start"
                onClick={() => setPaletteView("menu")}
              >
                {t.quickActions.backToActions}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

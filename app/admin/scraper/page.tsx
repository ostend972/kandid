"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Play,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type RecentJob = {
  id: string;
  title: string;
  company: string | null;
  canton: string | null;
  source: string | null;
  publishedAt: string | null;
};

type ScraperStats = {
  activeCount: number;
  expiredCount: number;
  lastScrape: string | null;
  sourceDistribution: Record<string, number>;
  recentJobs: RecentJob[];
};

type PurgePreview = {
  expiredJobsCount: number;
  affectedSavedJobs: number;
  affectedMatches: number;
};

type LogEntry = {
  type: "log" | "error" | "done";
  data: string;
  timestamp: Date;
};

/* -------------------------------------------------------------------------- */
/*                              Helpers                                        */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 20;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "---";
  return new Date(dateStr).toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "Jamais";
  return new Date(dateStr).toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* -------------------------------------------------------------------------- */
/*                              Component                                      */
/* -------------------------------------------------------------------------- */

export default function AdminScraperPage() {
  const [stats, setStats] = useState<ScraperStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // Scraper run state
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Purge dialog state
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
  const [purgePreview, setPurgePreview] = useState<PurgePreview | null>(null);
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [purging, setPurging] = useState(false);

  /* ----------------------------- Auto-scroll ------------------------------- */

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  /* ----------------------------- Fetch stats ------------------------------ */

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/scraper/stats");
      if (!res.ok) throw new Error("Erreur lors du chargement des stats");
      const data: ScraperStats = await res.json();
      setStats(data);
    } catch {
      toast.error("Impossible de charger les statistiques du scraper");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ----------------------------- Run scraper ------------------------------- */

  function handleRunScraper() {
    setIsRunning(true);
    setLogs([]);
    setShowConsole(true);

    const eventSource = new EventSource("/api/admin/scraper/run");

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as {
          type: "log" | "error" | "done";
          data: string;
        };
        setLogs((prev) => [
          ...prev,
          { type: parsed.type, data: parsed.data, timestamp: new Date() },
        ]);

        if (parsed.type === "done") {
          setIsRunning(false);
          eventSource.close();
          // Refresh stats after scraper finishes
          fetchStats();
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setLogs((prev) => [
        ...prev,
        {
          type: "error",
          data: "Connexion au scraper perdue",
          timestamp: new Date(),
        },
      ]);
      setIsRunning(false);
      eventSource.close();
    };
  }

  /* ----------------------------- Purge flow ------------------------------- */

  async function handleOpenPurgeDialog() {
    setPurgeDialogOpen(true);
    setPurgeLoading(true);
    setPurgePreview(null);
    try {
      const res = await fetch("/api/admin/scraper/purge-preview");
      if (!res.ok) throw new Error("Erreur purge-preview");
      const data: PurgePreview = await res.json();
      setPurgePreview(data);
    } catch {
      toast.error("Impossible de charger l'apercu de la purge");
      setPurgeDialogOpen(false);
    } finally {
      setPurgeLoading(false);
    }
  }

  async function handleConfirmPurge() {
    setPurging(true);
    try {
      const res = await fetch("/api/admin/scraper/purge", { method: "POST" });
      if (!res.ok) throw new Error("Erreur purge");
      const data = await res.json();
      toast.success(`${data.deletedCount} offres expirees supprimees`);
      setPurgeDialogOpen(false);
      setPage(0);
      fetchStats();
    } catch {
      toast.error("Erreur lors de la purge");
    } finally {
      setPurging(false);
    }
  }

  /* ----------------------------- Pagination ------------------------------- */

  const totalJobs = stats?.recentJobs.length ?? 0;
  const totalPages = Math.ceil(totalJobs / PAGE_SIZE);
  const paginatedJobs =
    stats?.recentJobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? [];

  /* ----------------------------- Render ----------------------------------- */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            Gestion du scraper
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchStats()}
          disabled={loading}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Rafraichir
        </Button>
      </div>

      {/* Scraper run section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={handleRunScraper} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="animate-spin" />
                Scrape en cours...
              </>
            ) : (
              <>
                <Play />
                Lancer le scrape
              </>
            )}
          </Button>
          {showConsole && !isRunning && logs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConsole(false)}
            >
              Masquer la console
            </Button>
          )}
        </div>

        {showConsole && logs.length > 0 && (
          <Card className="bg-gray-950 text-gray-100 font-mono text-sm">
            <CardContent
              className="p-4 max-h-96 overflow-y-auto"
              ref={consoleRef}
            >
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    "py-0.5",
                    log.type === "error" && "text-red-400",
                    log.type === "done" && "text-green-400 font-bold"
                  )}
                >
                  <span className="text-gray-500 mr-2">
                    {log.timestamp.toLocaleTimeString("fr-CH")}
                  </span>
                  {log.data}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Offres actives */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Offres actives</p>
            {loading ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <p className="text-3xl font-bold text-green-600">
                {stats?.activeCount ?? 0}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Offres expirees */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Offres expirees</p>
            {loading ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <p className="text-3xl font-bold text-amber-500">
                {stats?.expiredCount ?? 0}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dernier scrape */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Dernier scrape</p>
            {loading ? (
              <Skeleton className="mt-2 h-9 w-36" />
            ) : (
              <p className="text-3xl font-bold">
                {formatDateTime(stats?.lastScrape ?? null)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Sources</p>
            {loading ? (
              <Skeleton className="mt-2 h-9 w-40" />
            ) : (
              <div className="mt-1 flex flex-wrap gap-2">
                {stats?.sourceDistribution &&
                Object.keys(stats.sourceDistribution).length > 0 ? (
                  Object.entries(stats.sourceDistribution).map(
                    ([source, count]) => (
                      <Badge key={source} variant="secondary">
                        {source}: {count}
                      </Badge>
                    )
                  )
                ) : (
                  <p className="text-3xl font-bold">---</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold">Dernieres offres</h2>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleOpenPurgeDialog}
              disabled={loading || (stats?.expiredCount ?? 0) === 0}
            >
              <Trash2 />
              Purger les offres expirees
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Canton</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedJobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    Aucune offre trouvee
                  </TableCell>
                </TableRow>
              ) : (
                paginatedJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium max-w-[250px] truncate">
                      {job.title}
                    </TableCell>
                    <TableCell>{job.company ?? "---"}</TableCell>
                    <TableCell>
                      {job.canton ? (
                        <Badge variant="outline">{job.canton}</Badge>
                      ) : (
                        "---"
                      )}
                    </TableCell>
                    <TableCell>
                      {job.source ? (
                        <Badge variant="secondary">{job.source}</Badge>
                      ) : (
                        "---"
                      )}
                    </TableCell>
                    <TableCell>{formatDate(job.publishedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Precedent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purge confirmation dialog */}
      <Dialog open={purgeDialogOpen} onOpenChange={setPurgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Confirmer la purge
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                {purgeLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : purgePreview ? (
                  <>
                    <p>
                      <span className="font-semibold text-foreground">
                        {purgePreview.expiredJobsCount}
                      </span>{" "}
                      offres expirees seront supprimees
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">
                        {purgePreview.affectedSavedJobs}
                      </span>{" "}
                      offres sauvegardees et{" "}
                      <span className="font-semibold text-foreground">
                        {purgePreview.affectedMatches}
                      </span>{" "}
                      matches seront aussi supprimes (CASCADE)
                    </p>
                    <p className="text-destructive font-medium">
                      Cette action est irreversible
                    </p>
                  </>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPurgeDialogOpen(false)}
              disabled={purging}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmPurge}
              disabled={purgeLoading || purging}
            >
              {purging ? (
                <>
                  <RefreshCw className="animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 />
                  Confirmer la purge
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

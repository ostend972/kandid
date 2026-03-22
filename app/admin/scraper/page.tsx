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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Play,
  Loader2,
  Search,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type JobRow = {
  id: string;
  title: string;
  company: string | null;
  canton: string | null;
  source: string | null;
  status: string | null;
  publishedAt: string | null;
};

type JobDetail = {
  id: string;
  externalId: string;
  source: string;
  sourceUrl: string;
  title: string;
  company: string;
  canton: string;
  description: string;
  salary: string | null;
  contractType: string | null;
  activityRate: string | null;
  language: string | null;
  status: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  lastSeenAt: string | null;
  createdAt: string | null;
};

type JobsPage = {
  data: JobRow[];
  total: number;
  page: number;
  totalPages: number;
};

type ScraperStats = {
  activeCount: number;
  expiredCount: number;
  lastScrape: string | null;
  sourceDistribution: Record<string, number>;
  jobs: JobsPage;
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

type StatusFilter = "all" | "active" | "expired";

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

function sanitizeHtml(html: string): string {
  let clean = html;
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  clean = clean.replace(/<img\b[^>]*>/gi, "");
  clean = clean.replace(/<link\b[^>]*>/gi, "");
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  clean = clean.replace(/\s+style\s*=\s*"[^"]*"/gi, "");
  clean = clean.replace(/\s+style\s*=\s*'[^']*'/gi, "");
  clean = clean.replace(/\s+class\s*=\s*"[^"]*"/gi, "");
  clean = clean.replace(/\s+class\s*=\s*'[^']*'/gi, "");
  return clean;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span>---</span>;
  const map: Record<string, { label: string; cls: string }> = {
    active: {
      label: "Active",
      cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    expired: {
      label: "Expiree",
      cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
    reposted: {
      label: "Repostee",
      cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
  };
  const info = map[status] ?? { label: status, cls: "" };
  return (
    <Badge variant="outline" className={info.cls}>
      {info.label}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Component                                      */
/* -------------------------------------------------------------------------- */

export default function AdminScraperPage() {
  // Stats
  const [stats, setStats] = useState<ScraperStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Table filters & pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Job detail sheet
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  /* ----------------------------- Debounce search -------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        search: debouncedSearch,
        status: statusFilter,
      });
      const res = await fetch(`/api/admin/scraper/stats?${params}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des stats");
      const data: ScraperStats = await res.json();
      setStats(data);
    } catch {
      toast.error("Impossible de charger les statistiques du scraper");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ----------------------------- Fetch job detail ------------------------- */

  async function handleOpenJob(jobId: string) {
    setSheetOpen(true);
    setDetailLoading(true);
    setSelectedJob(null);
    try {
      const res = await fetch(`/api/admin/scraper/jobs/${jobId}`);
      if (!res.ok) throw new Error("Erreur");
      const data: JobDetail = await res.json();
      setSelectedJob(data);
    } catch {
      toast.error("Impossible de charger le detail de l'offre");
      setSheetOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  /* ----------------------------- Delete job ------------------------------- */

  function handleDeleteClick(e: React.MouseEvent, job: { id: string; title: string }) {
    e.stopPropagation();
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!jobToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/scraper/jobs/${jobToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success("Offre supprimee");
      setDeleteDialogOpen(false);
      setJobToDelete(null);
      // Close sheet if it was showing this job
      if (selectedJob?.id === jobToDelete.id) {
        setSheetOpen(false);
        setSelectedJob(null);
      }
      fetchStats();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  }

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
      setPage(1);
      fetchStats();
    } catch {
      toast.error("Erreur lors de la purge");
    } finally {
      setPurging(false);
    }
  }

  /* ----------------------------- Pagination data -------------------------- */

  const jobsPage = stats?.jobs;
  const jobRows = jobsPage?.data ?? [];
  const totalPages = jobsPage?.totalPages ?? 0;
  const totalJobs = jobsPage?.total ?? 0;

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

      {/* Jobs table */}
      <Card>
        <CardContent className="p-0">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 px-6 py-4 border-b sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold whitespace-nowrap">
                Toutes les offres
                {!loading && (
                  <span className="text-muted-foreground font-normal ml-2">
                    ({totalJobs})
                  </span>
                )}
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleOpenPurgeDialog}
                disabled={loading || (stats?.expiredCount ?? 0) === 0}
              >
                <Trash2 />
                Purger expirees
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher titre ou entreprise..."
                  className="pl-9 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Status filter tabs */}
              <div className="flex rounded-md border">
                {(
                  [
                    { value: "all", label: "Toutes" },
                    { value: "active", label: "Actives" },
                    { value: "expired", label: "Expirees" },
                  ] as const
                ).map((tab) => (
                  <Button
                    key={tab.value}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-none border-0 px-3",
                      statusFilter === tab.value &&
                        "bg-muted font-semibold"
                    )}
                    onClick={() => {
                      setStatusFilter(tab.value);
                      setPage(1);
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Canton</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : jobRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Aucune offre trouvee
                  </TableCell>
                </TableRow>
              ) : (
                jobRows.map((job) => (
                  <TableRow
                    key={job.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOpenJob(job.id)}
                  >
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
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell>{formatDate(job.publishedAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) =>
                          handleDeleteClick(e, {
                            id: job.id,
                            title: job.title,
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Precedent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page >= totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {detailLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                selectedJob?.title ?? "Detail de l'offre"
              )}
            </SheetTitle>
            <SheetDescription asChild>
              <span className="text-sm text-muted-foreground">
                {detailLoading ? (
                  <span className="animate-pulse rounded-md bg-accent inline-block h-4 w-32" />
                ) : selectedJob ? (
                  `${selectedJob.company} - ${selectedJob.canton}`
                ) : null}
              </span>
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="space-y-4 px-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : selectedJob ? (
            <div className="space-y-6 px-4 pb-8">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Source</p>
                  <Badge variant="secondary" className="mt-1">
                    {selectedJob.source}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedJob.status} />
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Canton</p>
                  <p className="font-medium mt-1">{selectedJob.canton}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type de contrat</p>
                  <p className="font-medium mt-1">
                    {selectedJob.contractType ?? "---"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Taux d&apos;activite</p>
                  <p className="font-medium mt-1">
                    {selectedJob.activityRate ?? "---"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Salaire</p>
                  <p className="font-medium mt-1">
                    {selectedJob.salary ?? "---"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Publiee le</p>
                  <p className="font-medium mt-1">
                    {formatDate(selectedJob.publishedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expire le</p>
                  <p className="font-medium mt-1">
                    {formatDate(selectedJob.expiresAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Derniere vue</p>
                  <p className="font-medium mt-1">
                    {formatDateTime(selectedJob.lastSeenAt)}
                  </p>
                </div>
              </div>

              {/* External link */}
              {selectedJob.sourceUrl && (
                <a
                  href={selectedJob.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="size-4" />
                  Voir sur {selectedJob.source}
                </a>
              )}

              {/* Description */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Description
                </p>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(selectedJob.description),
                  }}
                />
              </div>

              {/* Delete button */}
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  setJobToDelete({
                    id: selectedJob.id,
                    title: selectedJob.title,
                  });
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 />
                Supprimer cette offre
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Supprimer l&apos;offre
            </DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment supprimer{" "}
              <span className="font-semibold text-foreground">
                {jobToDelete?.title}
              </span>{" "}
              ? Les sauvegardes et matches associes seront aussi supprimes.
              Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

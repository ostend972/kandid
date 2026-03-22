"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type UserRow = {
  id: string;
  email: string;
  fullName: string | null;
  plan: string;
  createdAt: string;
  analysesCount: number;
  applicationsCount: number;
  lastCvScore: number | null;
};

type UsersResponse = {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
};

type UserDetail = {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    plan: string;
    createdAt: string;
  };
  analyses: {
    id: string;
    fileName: string | null;
    overallScore: number | null;
    createdAt: string;
  }[];
  applications: {
    id: string;
    jobTitle: string | null;
    jobCompany: string | null;
    status: string;
    createdAt: string;
  }[];
  documentsCount: number;
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function planBadgeVariant(plan: string) {
  switch (plan) {
    case "pro":
      return "default" as const;
    case "free":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "completed":
      return "default" as const;
    case "draft":
      return "secondary" as const;
    case "sent":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

/* -------------------------------------------------------------------------- */
/*                             Skeleton rows                                  */
/* -------------------------------------------------------------------------- */

function SkeletonRows({ count = 10 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b">
          <td className="py-3 px-3">
            <Skeleton className="h-4 w-40" />
          </td>
          <td className="py-3 px-3">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="py-3 px-3">
            <Skeleton className="h-4 w-20" />
          </td>
          <td className="py-3 px-3">
            <Skeleton className="h-4 w-10" />
          </td>
          <td className="py-3 px-3">
            <Skeleton className="h-4 w-10" />
          </td>
          <td className="py-3 px-3">
            <Skeleton className="h-4 w-12" />
          </td>
          <td className="py-3 px-3">
            <Skeleton className="h-5 w-14 rounded-full" />
          </td>
        </tr>
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                           User detail Sheet                                */
/* -------------------------------------------------------------------------- */

function UserDetailSheet({
  userId,
  open,
  onOpenChange,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !open) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((data: UserDetail) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        {loading || !detail ? (
          <SheetHeader>
            <SheetTitle>
              <Skeleton className="h-5 w-40" />
            </SheetTitle>
            <SheetDescription>
              <Skeleton className="h-4 w-56" />
            </SheetDescription>
          </SheetHeader>
        ) : (
          <>
            {/* ---------- Header ---------- */}
            <SheetHeader>
              <SheetTitle>
                {detail.user.fullName || "Sans nom"}
              </SheetTitle>
              <SheetDescription>{detail.user.email}</SheetDescription>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant={planBadgeVariant(detail.user.plan)}>
                  {detail.user.plan}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Inscrit le {formatDate(detail.user.createdAt)}
                </span>
              </div>
            </SheetHeader>

            <div className="px-4 pb-6 space-y-6">
              <Separator />

              {/* ---------- Analyses CV ---------- */}
              <section>
                <h3 className="text-sm font-semibold mb-3">Analyses CV</h3>
                {detail.analyses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune analyse
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {detail.analyses.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate mr-2">
                          {a.fileName || "CV"}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          {a.overallScore != null && (
                            <Badge variant="outline">
                              {a.overallScore}/100
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(a.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <Separator />

              {/* ---------- Candidatures ---------- */}
              <section>
                <h3 className="text-sm font-semibold mb-3">Candidatures</h3>
                {detail.applications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune candidature
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {detail.applications.map((app) => (
                      <li
                        key={app.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="truncate mr-2">
                          <span className="font-medium">
                            {app.jobTitle || "Poste"}
                          </span>
                          {app.jobCompany && (
                            <span className="text-muted-foreground">
                              {" "}
                              - {app.jobCompany}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant={statusBadgeVariant(app.status)}>
                            {app.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(app.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <Separator />

              {/* ---------- Documents ---------- */}
              <section>
                <h3 className="text-sm font-semibold mb-1">Documents</h3>
                <p className="text-sm text-muted-foreground">
                  {detail.documentsCount} document
                  {detail.documentsCount !== 1 ? "s" : ""}
                </p>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main page                                    */
/* -------------------------------------------------------------------------- */

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // ---- Debounce search ----
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearch(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 300);
    },
    []
  );

  // ---- Fetch users ----
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", String(page));
    if (debouncedSearch) params.set("search", debouncedSearch);

    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((json: UsersResponse) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch]);

  // ---- Row click ----
  function handleRowClick(userId: string) {
    setSelectedUserId(userId);
    setSheetOpen(true);
  }

  return (
    <>
      {/* -------- Header -------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Gestion des utilisateurs
        </h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email ou nom..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      </div>

      {/* -------- Table -------- */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">Nom</th>
                  <th className="py-3 px-4 font-medium">Inscription</th>
                  <th className="py-3 px-4 font-medium text-center">
                    Analyses
                  </th>
                  <th className="py-3 px-4 font-medium text-center">
                    Candidatures
                  </th>
                  <th className="py-3 px-4 font-medium text-center">
                    Score CV
                  </th>
                  <th className="py-3 px-4 font-medium">Plan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : data && data.users.length > 0 ? (
                  data.users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => handleRowClick(user.id)}
                      className="border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {user.fullName || "-"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {user.analysesCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {user.applicationsCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {user.lastCvScore != null ? (
                          <span>{user.lastCvScore}/100</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={planBadgeVariant(user.plan)}>
                          {user.plan}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground"
                    >
                      Aucun utilisateur trouv&eacute;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* -------- Pagination -------- */}
          {data && data.totalPages > 1 && (
            <>
              <Separator />
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  {data.total} utilisateur{data.total !== 1 ? "s" : ""} — page{" "}
                  {data.page} / {data.totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page >= (data?.totalPages ?? 1)}
                    onClick={() =>
                      setPage((p) =>
                        Math.min(data?.totalPages ?? 1, p + 1)
                      )
                    }
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* -------- Detail Sheet -------- */}
      <UserDetailSheet
        userId={selectedUserId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}

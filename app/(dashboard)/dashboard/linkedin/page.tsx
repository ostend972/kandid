"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PdfUploader } from "@/components/linkedin/pdf-uploader";
import { AuditResults } from "@/components/linkedin/audit-results";
import { OptimizedProfile } from "@/components/linkedin/optimized-profile";
import { EditorialCalendar } from "@/components/linkedin/editorial-calendar";
import { Loader2, Linkedin, CheckCircle2 } from "lucide-react";
import type { LinkedinPost } from "@/lib/db/schema";
import type { LinkedinAuditResult } from "@/lib/validations/linkedin";

interface ProfileData {
  id: string;
  headline?: string | null;
  summary?: string | null;
  auditScore?: number | null;
  auditResult?: LinkedinAuditResult | null;
  optimizedHeadline?: string | null;
  optimizedSummary?: string | null;
  structured?: Record<string, unknown> | null;
}

export default function LinkedinPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<LinkedinPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("import");

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/linkedin/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile ?? null);
        if (data.posts) {
          setPosts(data.posts);
        }
      }
    } catch (err) {
      console.error("Failed to fetch LinkedIn profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function handleImportComplete() {
    fetchProfile();
    setActiveTab("audit");
  }

  async function handleRunAudit() {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/linkedin/audit", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                auditScore: data.score,
                auditResult: data as LinkedinAuditResult,
              }
            : prev
        );
      }
    } catch (err) {
      console.error("Audit failed:", err);
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleOptimize() {
    setOptimizeLoading(true);
    try {
      const res = await fetch("/api/linkedin/optimize", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                optimizedHeadline: data.headline,
                optimizedSummary: data.summary,
              }
            : prev
        );
      }
    } catch (err) {
      console.error("Optimize failed:", err);
    } finally {
      setOptimizeLoading(false);
    }
  }

  async function handleGenerateCalendar() {
    setCalendarLoading(true);
    try {
      const res = await fetch("/api/linkedin/calendar", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Calendar generation failed:", err);
    } finally {
      setCalendarLoading(false);
    }
  }

  async function handleSavePost(postId: string, content: string) {
    const res = await fetch(`/api/linkedin/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userContent: content }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...updated } : p))
      );
    }
  }

  const hasProfile = !!profile?.structured;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Linkedin className="h-5 w-5 text-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">LinkedIn</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Optimisez votre profil LinkedIn et planifiez votre strategie de contenu.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import" className="flex items-center gap-1">
            {hasProfile && <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
            Import
          </TabsTrigger>
          <TabsTrigger value="audit" disabled={!hasProfile}>
            Audit SEO
          </TabsTrigger>
          <TabsTrigger value="optimize" disabled={!hasProfile}>
            Optimisation
          </TabsTrigger>
          <TabsTrigger value="calendar" disabled={!hasProfile}>
            Calendrier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          {hasProfile ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Profil LinkedIn importe avec succes
                  </p>
                </div>
                {profile.headline && (
                  <p className="mt-2 text-sm text-foreground">
                    {profile.headline}
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Vous pouvez reimporter votre profil pour le mettre a jour.
              </p>
              <PdfUploader onImportComplete={handleImportComplete} />
            </div>
          ) : (
            <PdfUploader onImportComplete={handleImportComplete} />
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditResults
            auditScore={profile?.auditScore ?? null}
            auditResult={profile?.auditResult ?? null}
            onRunAudit={handleRunAudit}
            isLoading={auditLoading}
          />
        </TabsContent>

        <TabsContent value="optimize" className="mt-6">
          <OptimizedProfile
            currentHeadline={profile?.headline}
            currentSummary={profile?.summary}
            optimizedHeadline={profile?.optimizedHeadline}
            optimizedSummary={profile?.optimizedSummary}
            onOptimize={handleOptimize}
            isLoading={optimizeLoading}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <EditorialCalendar
            posts={posts}
            onRegenerate={handleGenerateCalendar}
            onSavePost={handleSavePost}
            isLoading={calendarLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Save,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LinkedinPost } from "@/lib/db/schema";

interface EditorialCalendarProps {
  posts: LinkedinPost[];
  onRegenerate: () => void;
  onSavePost: (postId: string, content: string) => Promise<void>;
  isLoading: boolean;
}

const contentTypeConfig: Record<
  string,
  { label: string; color: string }
> = {
  expertise: { label: "Expertise", color: "bg-muted text-foreground" },
  actualite: { label: "Actualite", color: "bg-muted text-foreground" },
  success_story: { label: "Success Story", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  recommandation: { label: "Recommandation", color: "bg-muted text-foreground" },
};

const dayOrder = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];

function PostCard({
  post,
  onSave,
}: {
  post: LinkedinPost;
  onSave: (postId: string, content: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(
    post.userContent || post.draftContent
  );
  const [saving, setSaving] = useState(false);

  const typeConfig = contentTypeConfig[post.contentType] ?? {
    label: post.contentType,
    color: "bg-muted text-muted-foreground",
  };

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(post.id, editContent);
      setEditing(false);
    } catch {
      console.error("Failed to save post edit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize text-muted-foreground">
            {post.dayOfWeek}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              typeConfig.color
            )}
          >
            {typeConfig.label}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      <h4 className="mt-1 text-sm font-semibold">{post.title}</h4>

      {expanded && (
        <div className="mt-3 space-y-3">
          {editing ? (
            <>
              <textarea
                className="w-full rounded-lg border p-3 text-sm min-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-3 w-3" />
                  )}
                  Sauvegarder
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setEditContent(post.userContent || post.draftContent);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {post.userContent || post.draftContent}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                Modifier le brouillon
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function EditorialCalendar({
  posts,
  onRegenerate,
  onSavePost,
  isLoading,
}: EditorialCalendarProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Generation du calendrier editorial...
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Calendar className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Generez votre calendrier editorial personnalise pour 4 semaines.
        </p>
        <Button onClick={onRegenerate} variant="outline">
          Generer le calendrier
        </Button>
      </div>
    );
  }

  const postsByWeek = new Map<number, LinkedinPost[]>();
  for (const post of posts) {
    const week = post.weekNumber;
    if (!postsByWeek.has(week)) {
      postsByWeek.set(week, []);
    }
    postsByWeek.get(week)!.push(post);
  }

  for (const weekPosts of postsByWeek.values()) {
    weekPosts.sort((a, b) => {
      const aIdx = dayOrder.indexOf(a.dayOfWeek.toLowerCase());
      const bIdx = dayOrder.indexOf(b.dayOfWeek.toLowerCase());
      return aIdx - bIdx;
    });
  }

  const weeks = Array.from(postsByWeek.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {posts.length} posts sur 4 semaines
          </p>
        </div>
        <Button onClick={onRegenerate} variant="ghost" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerer
        </Button>
      </div>

      {weeks.map((weekNum) => (
        <div key={weekNum} className="space-y-3">
          <h3 className="text-sm font-semibold">
            Semaine {weekNum}
          </h3>
          <div className="space-y-2">
            {postsByWeek.get(weekNum)!.map((post) => (
              <PostCard key={post.id} post={post} onSave={onSavePost} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

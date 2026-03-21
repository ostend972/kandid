"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import {
  GraduationCap,
  FileCheck,
  Shield,
  FileText,
  Trash2,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type DocumentCategory = "diploma" | "certificate" | "permit" | "recommendation";

interface CandidateDocument {
  id: string;
  category: string;
  label: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

const CATEGORY_META: Record<
  DocumentCategory,
  { label: string; icon: typeof FileText }
> = {
  diploma: { label: "Diplome", icon: GraduationCap },
  certificate: { label: "Certificat de travail", icon: FileCheck },
  permit: { label: "Permis", icon: Shield },
  recommendation: { label: "Lettre de recommandation", icon: FileText },
};

const MAX_DOCS = 20;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentsSection() {
  const { data, isLoading, mutate } = useSWR<{ documents: CandidateDocument[] }>(
    "/api/profile/documents",
    fetcher
  );

  const documents = data?.documents ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [label, setLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setCategory("");
    setLabel("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Upload ──────────────────────────────────────────────────────────────

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];

    if (!category) {
      toast.error("Veuillez selectionner une categorie.");
      return;
    }
    if (!label.trim()) {
      toast.error("Veuillez saisir un libelle.");
      return;
    }
    if (!file) {
      toast.error("Veuillez selectionner un fichier PDF.");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptes.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Le fichier depasse la taille maximale de 10 Mo.");
      return;
    }
    if (documents.length >= MAX_DOCS) {
      toast.error(`Nombre maximum de documents atteint (${MAX_DOCS}).`);
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    formData.append("label", label.trim());

    try {
      const res = await fetch("/api/profile/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erreur lors de l'envoi.");
      }

      toast.success("Document ajoute.");
      resetForm();
      setDialogOpen(false);
      mutate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'envoi."
      );
    } finally {
      setUploading(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const res = await fetch(`/api/profile/documents/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erreur lors de la suppression.");
      }

      toast.success("Document supprime.");
      mutate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Documents justificatifs</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {documents.length}/{MAX_DOCS} documents
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={documents.length >= MAX_DOCS}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un document</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="doc-category">Categorie</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as DocumentCategory)}
                >
                  <SelectTrigger id="doc-category">
                    <SelectValue placeholder="Selectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diploma">Diplome</SelectItem>
                    <SelectItem value="certificate">
                      Certificat de travail
                    </SelectItem>
                    <SelectItem value="permit">Permis</SelectItem>
                    <SelectItem value="recommendation">
                      Lettre de recommandation
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Label */}
              <div className="space-y-2">
                <Label htmlFor="doc-label">Libelle</Label>
                <Input
                  id="doc-label"
                  placeholder="Ex: Master en informatique"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              {/* File */}
              <div className="space-y-2">
                <Label htmlFor="doc-file">Fichier PDF</Label>
                <Input
                  id="doc-file"
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={uploading}
              >
                Annuler
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Ajouter"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucun document ajoute.
          </p>
        ) : (
          <ul className="divide-y">
            {documents.map((doc) => {
              const meta =
                CATEGORY_META[doc.category as DocumentCategory] ??
                CATEGORY_META.diploma;
              const Icon = meta.icon;

              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{doc.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {meta.label} &middot; {formatFileSize(doc.fileSize)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={deletingId === doc.id}
                    onClick={() => handleDelete(doc.id)}
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

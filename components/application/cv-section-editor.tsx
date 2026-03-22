'use client';

import { useCallback } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { GeneratedCvData } from '@/lib/ai/generate-cv';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CvSectionEditorProps {
  data: GeneratedCvData;
  onChange: (data: GeneratedCvData) => void;
}

// ---------------------------------------------------------------------------
// CECR levels
// ---------------------------------------------------------------------------

const CECR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CvSectionEditor({ data, onChange }: CvSectionEditorProps) {
  // Helper to update identity fields
  const updateIdentity = useCallback(
    (field: keyof GeneratedCvData['identity'], value: string) => {
      onChange({
        ...data,
        identity: { ...data.identity, [field]: value },
      });
    },
    [data, onChange]
  );

  // -------------------------------------------------------------------------
  // Experiences
  // -------------------------------------------------------------------------

  const addExperience = useCallback(() => {
    onChange({
      ...data,
      experiences: [
        ...data.experiences,
        {
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          contractType: '',
          activityRate: '100%',
          bullets: [''],
        },
      ],
    });
  }, [data, onChange]);

  const removeExperience = useCallback(
    (idx: number) => {
      onChange({
        ...data,
        experiences: data.experiences.filter((_, i) => i !== idx),
      });
    },
    [data, onChange]
  );

  const updateExperience = useCallback(
    (
      idx: number,
      field: keyof GeneratedCvData['experiences'][number],
      value: string | string[]
    ) => {
      const updated = [...data.experiences];
      updated[idx] = { ...updated[idx], [field]: value };
      onChange({ ...data, experiences: updated });
    },
    [data, onChange]
  );

  // -------------------------------------------------------------------------
  // Education
  // -------------------------------------------------------------------------

  const addEducation = useCallback(() => {
    onChange({
      ...data,
      education: [
        ...data.education,
        {
          degree: '',
          equivalence: '',
          institution: '',
          location: '',
          year: '',
          details: '',
        },
      ],
    });
  }, [data, onChange]);

  const removeEducation = useCallback(
    (idx: number) => {
      onChange({
        ...data,
        education: data.education.filter((_, i) => i !== idx),
      });
    },
    [data, onChange]
  );

  const updateEducation = useCallback(
    (
      idx: number,
      field: keyof GeneratedCvData['education'][number],
      value: string
    ) => {
      const updated = [...data.education];
      updated[idx] = { ...updated[idx], [field]: value };
      onChange({ ...data, education: updated });
    },
    [data, onChange]
  );

  // -------------------------------------------------------------------------
  // Skills
  // -------------------------------------------------------------------------

  const addSkillCategory = useCallback(() => {
    onChange({
      ...data,
      skills: [...(data.skills ?? []), { category: '', items: [] }],
    });
  }, [data, onChange]);

  const removeSkillCategory = useCallback(
    (idx: number) => {
      onChange({
        ...data,
        skills: (data.skills ?? []).filter((_, i) => i !== idx),
      });
    },
    [data, onChange]
  );

  const updateSkillCategoryName = useCallback(
    (idx: number, name: string) => {
      const updated = [...(data.skills ?? [])];
      updated[idx] = { ...updated[idx], category: name };
      onChange({ ...data, skills: updated });
    },
    [data, onChange]
  );

  const addSkillItem = useCallback(
    (catIdx: number, skill: string) => {
      const trimmed = skill.trim();
      if (!trimmed) return;
      const updated = [...(data.skills ?? [])];
      updated[catIdx] = {
        ...updated[catIdx],
        items: [...updated[catIdx].items, trimmed],
      };
      onChange({ ...data, skills: updated });
    },
    [data, onChange]
  );

  const removeSkillItem = useCallback(
    (catIdx: number, itemIdx: number) => {
      const updated = [...(data.skills ?? [])];
      updated[catIdx] = {
        ...updated[catIdx],
        items: updated[catIdx].items.filter((_, i) => i !== itemIdx),
      };
      onChange({ ...data, skills: updated });
    },
    [data, onChange]
  );

  // -------------------------------------------------------------------------
  // Languages
  // -------------------------------------------------------------------------

  const addLanguage = useCallback(() => {
    onChange({
      ...data,
      languages: [...(data.languages ?? []), { language: '', level: 'B1' }],
    });
  }, [data, onChange]);

  const removeLanguage = useCallback(
    (idx: number) => {
      onChange({
        ...data,
        languages: (data.languages ?? []).filter((_, i) => i !== idx),
      });
    },
    [data, onChange]
  );

  const updateLanguage = useCallback(
    (idx: number, field: 'language' | 'level', value: string) => {
      const updated = [...(data.languages ?? [])];
      updated[idx] = { ...updated[idx], [field]: value };
      onChange({ ...data, languages: updated });
    },
    [data, onChange]
  );

  // -------------------------------------------------------------------------
  // Interests
  // -------------------------------------------------------------------------

  const updateInterests = useCallback(
    (text: string) => {
      const items = text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      onChange({ ...data, interests: items });
    },
    [data, onChange]
  );

  // -------------------------------------------------------------------------
  // References
  // -------------------------------------------------------------------------

  const addReference = useCallback(() => {
    onChange({
      ...data,
      references: [...(data.references ?? []), { name: '', position: '' }],
    });
  }, [data, onChange]);

  const removeReference = useCallback(
    (idx: number) => {
      onChange({
        ...data,
        references: (data.references ?? []).filter((_, i) => i !== idx),
      });
    },
    [data, onChange]
  );

  const updateReference = useCallback(
    (idx: number, field: 'name' | 'position', value: string) => {
      const updated = [...(data.references ?? [])];
      updated[idx] = { ...updated[idx], [field]: value };
      onChange({ ...data, references: updated });
    },
    [data, onChange]
  );

  // -------------------------------------------------------------------------
  // Certifications
  // -------------------------------------------------------------------------

  const addCertification = useCallback(() => {
    onChange({
      ...data,
      certifications: [...(data.certifications ?? []), ''],
    });
  }, [data, onChange]);

  const removeCertification = useCallback(
    (idx: number) => {
      onChange({
        ...data,
        certifications: (data.certifications ?? []).filter(
          (_, i) => i !== idx
        ),
      });
    },
    [data, onChange]
  );

  const updateCertification = useCallback(
    (idx: number, value: string) => {
      const updated = [...(data.certifications ?? [])];
      updated[idx] = value;
      onChange({ ...data, certifications: updated });
    },
    [data, onChange]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6 overflow-y-auto pr-1">
      {/* ================================================================= */}
      {/* Identity */}
      {/* ================================================================= */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Identite
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cv-firstName">Prenom</Label>
            <Input
              id="cv-firstName"
              value={data.identity.firstName}
              onChange={(e) => updateIdentity('firstName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cv-lastName">Nom</Label>
            <Input
              id="cv-lastName"
              value={data.identity.lastName}
              onChange={(e) => updateIdentity('lastName', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cv-title">Titre professionnel</Label>
            <Input
              id="cv-title"
              value={data.identity.title}
              onChange={(e) => updateIdentity('title', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cv-address">Adresse</Label>
            <Input
              id="cv-address"
              value={data.identity.address}
              onChange={(e) => updateIdentity('address', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cv-phone">Telephone</Label>
            <Input
              id="cv-phone"
              value={data.identity.phone}
              onChange={(e) => updateIdentity('phone', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cv-email">Email</Label>
            <Input
              id="cv-email"
              value={data.identity.email}
              onChange={(e) => updateIdentity('email', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cv-nationality">Nationalite</Label>
            <Input
              id="cv-nationality"
              value={data.identity.nationality}
              onChange={(e) => updateIdentity('nationality', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cv-dob">Date de naissance</Label>
            <Input
              id="cv-dob"
              value={data.identity.dateOfBirth}
              onChange={(e) => updateIdentity('dateOfBirth', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cv-civil">Etat civil</Label>
            <Input
              id="cv-civil"
              value={data.identity.civilStatus}
              onChange={(e) => updateIdentity('civilStatus', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cv-workPermit">Permis de travail</Label>
            <Input
              id="cv-workPermit"
              value={data.identity.workPermit ?? ''}
              onChange={(e) => updateIdentity('workPermit', e.target.value)}
              placeholder="ex: Eligible au permis G (frontalier)"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ================================================================= */}
      {/* Experiences */}
      {/* ================================================================= */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Experiences
          </h3>
          <Button variant="outline" size="sm" onClick={addExperience}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>

        <div className="space-y-3">
          {data.experiences.map((exp, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4 pb-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <div>
                      <Label>Poste</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) =>
                          updateExperience(idx, 'title', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Entreprise</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(idx, 'company', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Lieu</Label>
                      <Input
                        value={exp.location}
                        onChange={(e) =>
                          updateExperience(idx, 'location', e.target.value)
                        }
                        placeholder="ex: Geneve, Suisse"
                      />
                    </div>
                    <div>
                      <Label>Type de contrat</Label>
                      <Input
                        value={exp.contractType}
                        onChange={(e) =>
                          updateExperience(idx, 'contractType', e.target.value)
                        }
                        placeholder="ex: contrat fixe"
                      />
                    </div>
                    <div>
                      <Label>Taux d&apos;activite</Label>
                      <Input
                        value={exp.activityRate ?? ''}
                        onChange={(e) =>
                          updateExperience(
                            idx,
                            'activityRate',
                            e.target.value
                          )
                        }
                        placeholder="ex: 100%"
                      />
                    </div>
                    <div>
                      <Label>Date debut</Label>
                      <Input
                        value={exp.startDate}
                        onChange={(e) =>
                          updateExperience(idx, 'startDate', e.target.value)
                        }
                        placeholder="ex: Jan. 2022"
                      />
                    </div>
                    <div>
                      <Label>Date fin</Label>
                      <Input
                        value={exp.endDate}
                        onChange={(e) =>
                          updateExperience(idx, 'endDate', e.target.value)
                        }
                        placeholder="ex: Present"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeExperience(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <Label>Description (une puce par ligne)</Label>
                  <Textarea
                    rows={4}
                    value={exp.bullets.join('\n')}
                    onChange={(e) =>
                      updateExperience(
                        idx,
                        'bullets',
                        e.target.value.split('\n')
                      )
                    }
                    placeholder="Decrivez vos realisations, une par ligne..."
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ================================================================= */}
      {/* Education */}
      {/* ================================================================= */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Formation
          </h3>
          <Button variant="outline" size="sm" onClick={addEducation}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>

        <div className="space-y-3">
          {data.education.map((edu, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4 pb-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <div className="sm:col-span-2">
                      <Label>Diplome</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(idx, 'degree', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Etablissement</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) =>
                          updateEducation(idx, 'institution', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Lieu</Label>
                      <Input
                        value={edu.location}
                        onChange={(e) =>
                          updateEducation(idx, 'location', e.target.value)
                        }
                        placeholder="ex: Paris, France"
                      />
                    </div>
                    <div>
                      <Label>Annee</Label>
                      <Input
                        value={edu.year}
                        onChange={(e) =>
                          updateEducation(idx, 'year', e.target.value)
                        }
                        placeholder="ex: 2020"
                      />
                    </div>
                    <div>
                      <Label>Equivalence</Label>
                      <Input
                        value={edu.equivalence}
                        onChange={(e) =>
                          updateEducation(idx, 'equivalence', e.target.value)
                        }
                        placeholder="ex: equiv. Master HES"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeEducation(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ================================================================= */}
      {/* Certifications */}
      {/* ================================================================= */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Certifications
          </h3>
          <Button variant="outline" size="sm" onClick={addCertification}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>

        <div className="space-y-2">
          {(data.certifications ?? []).map((cert, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  value={cert}
                  onChange={(e) => updateCertification(idx, e.target.value)}
                  placeholder="ex: Certification AMF (2022)"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeCertification(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ================================================================= */}
      {/* Skills */}
      {/* ================================================================= */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Competences
          </h3>
          <Button variant="outline" size="sm" onClick={addSkillCategory}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Categorie
          </Button>
        </div>

        <div className="space-y-3">
          {(data.skills ?? []).map((cat, catIdx) => (
            <Card key={catIdx}>
              <CardContent className="pt-4 pb-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label>Categorie</Label>
                    <Input
                      value={cat.category}
                      onChange={(e) =>
                        updateSkillCategoryName(catIdx, e.target.value)
                      }
                      placeholder="ex: Techniques, Outils, Soft skills..."
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive mt-5"
                    onClick={() => removeSkillCategory(catIdx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Skill badges */}
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((skill, itemIdx) => (
                    <Badge
                      key={itemIdx}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkillItem(catIdx, itemIdx)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Add skill input */}
                <Input
                  placeholder="Taper une competence et appuyer sur Entree"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      addSkillItem(catIdx, input.value);
                      input.value = '';
                    }
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ================================================================= */}
      {/* Languages */}
      {/* ================================================================= */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Langues
          </h3>
          <Button variant="outline" size="sm" onClick={addLanguage}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>

        <div className="space-y-2">
          {(data.languages ?? []).map((lang, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <div className="flex-1">
                <Label>Langue</Label>
                <Input
                  value={lang.language}
                  onChange={(e) =>
                    updateLanguage(idx, 'language', e.target.value)
                  }
                  placeholder="ex: Francais"
                />
              </div>
              <div className="w-28">
                <Label>Niveau</Label>
                <Select
                  value={lang.level}
                  onValueChange={(v) => updateLanguage(idx, 'level', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CECR_LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeLanguage(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ================================================================= */}
      {/* Interests */}
      {/* ================================================================= */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Centres d&apos;interet
        </h3>
        <Textarea
          rows={3}
          value={(data.interests ?? []).join(', ')}
          onChange={(e) => updateInterests(e.target.value)}
          placeholder="Voyages, Cuisine, Football, Lecture..."
        />
      </section>

      <Separator />

      {/* ================================================================= */}
      {/* References */}
      {/* ================================================================= */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            References
          </h3>
          <Button variant="outline" size="sm" onClick={addReference}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Si aucune reference n&apos;est ajoutee, le CV affichera &quot;Disponibles sur demande&quot;.
        </p>

        <div className="space-y-2">
          {(data.references ?? []).map((ref, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <div>
                      <Label>Nom complet</Label>
                      <Input
                        value={ref.name}
                        onChange={(e) =>
                          updateReference(idx, 'name', e.target.value)
                        }
                        placeholder="ex: Jean Dupont"
                      />
                    </div>
                    <div>
                      <Label>Poste et entreprise</Label>
                      <Input
                        value={ref.position}
                        onChange={(e) =>
                          updateReference(idx, 'position', e.target.value)
                        }
                        placeholder="ex: Directeur commercial, Nestle SA"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeReference(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

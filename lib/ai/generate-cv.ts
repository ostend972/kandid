import OpenAI from "openai";
import { buildCvGenerationPrompt } from "./prompts";
import { withRetry } from "./with-retry";
import { normalizeGeneratedCv } from "./normalize-ats";

const openai = new OpenAI();

// =============================================================================
// Types
// =============================================================================

export interface GeneratedCvData {
  identity: {
    firstName: string;
    lastName: string;
    title: string;
    address: string;
    phone: string;
    email: string;
    nationality: string;
    dateOfBirth: string;
    civilStatus: string;
    workPermit?: string;
  };
  experiences: {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    contractType: string;
    activityRate?: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    equivalence: string;
    institution: string;
    location: string;
    year: string;
    details?: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  languages: {
    language: string;
    level: string;
  }[];
  interests: string[];
  references?: {
    name: string;
    position: string;
  }[];
  certifications?: string[];
}

// =============================================================================
// Identity context passed from the route (extracted from CV analysis + fallbacks)
// =============================================================================

export interface IdentityContext {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  nationality: string;
  dateOfBirth: string;
  civilStatus: string;
  title: string;
}

// =============================================================================
// Core generation function
// =============================================================================

export async function generateCvData(
  profile: Record<string, unknown>,
  jobTitle: string,
  jobCompany: string,
  jobDescription: string,
  instructions?: string,
  identityContext?: IdentityContext,
  detailedCvContext?: string,
  atsKeywords?: string[]
): Promise<{ data: GeneratedCvData; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const systemPrompt = buildCvGenerationPrompt();

  let userMessage = `PROFIL DU CANDIDAT:
${JSON.stringify(profile, null, 2)}`;

  // Inject identity context if available
  if (identityContext) {
    userMessage += `

DONNEES D'IDENTITE DU CANDIDAT (extraites de son CV) :
Prenom: ${identityContext.firstName || '[A completer]'}
Nom: ${identityContext.lastName || '[A completer]'}
Adresse: ${identityContext.address || '[A completer]'}
Telephone: ${identityContext.phone || '[A completer]'}
Email: ${identityContext.email || '[A completer]'}
Nationalite: ${identityContext.nationality || '[A completer]'}
Date de naissance: ${identityContext.dateOfBirth || '[A completer]'}
Etat civil: ${identityContext.civilStatus || '[A completer]'}
Titre professionnel: ${identityContext.title || '[A completer]'}

IMPORTANT: Utilise ces donnees d'identite DIRECTEMENT dans la section "identity" du CV. Ne les remplace PAS par des valeurs inventees.`;
  }

  if (detailedCvContext) {
    userMessage += `
${detailedCvContext}

IMPORTANT : Le CV suisse DOIT faire 2 pages. Tu as ci-dessus TOUTES les experiences du candidat.
Inclus-les TOUTES dans le CV genere avec des bullet points detailles en methode XYZ/CAR pour chacune.
Ne selectionne PAS — inclus TOUT.`;
  }

  userMessage += `

POSTE CIBLE: ${jobTitle}
ENTREPRISE: ${jobCompany}

DESCRIPTION DU POSTE:
${jobDescription}`;

  if (atsKeywords && atsKeywords.length > 0) {
    userMessage += `

KEYWORDS ATS A INTEGRER NATURELLEMENT (seulement si pertinents au profil du candidat):
${atsKeywords.join(', ')}`;
  }

  if (instructions) {
    userMessage += `

INSTRUCTIONS SUPPLEMENTAIRES DU CANDIDAT:
${instructions}`;
  }

  userMessage += `

Genere le CV suisse optimise au format JSON demande.`;

  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 5500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Reponse IA vide");

    const parsed = JSON.parse(content) as GeneratedCvData;
    const normalized = normalizeGeneratedCv(parsed);

    // Validate required fields
    if (!normalized.identity || !normalized.experiences || !normalized.education) {
      throw new Error("Format de reponse IA invalide : champs obligatoires manquants");
    }

    if (!normalized.identity.firstName || !normalized.identity.lastName) {
      throw new Error("Format de reponse IA invalide : identite incomplete");
    }

    if (!Array.isArray(normalized.experiences) || normalized.experiences.length === 0) {
      throw new Error("Format de reponse IA invalide : aucune experience generee");
    }

    return {
      data: normalized,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  });
}

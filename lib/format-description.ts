/**
 * Formate une description d'offre d'emploi en HTML lisible.
 *
 * Gere 3 cas :
 *   1. HTML deja formate (contient <p>, <br>, <ul>...) → retourne tel quel
 *   2. Markdown (contient **bold**, ### titres, listes `- `, `* `) → convertit
 *   3. Texte brut avec sauts de ligne → convertit en paragraphes/br
 */

const HTML_TAG_REGEX = /<(p|div|br|ul|ol|li|h[1-6]|strong|b|em|i|a)[\s>]/i;
const MARKDOWN_SIGNALS = [
	/\*\*[^*]+\*\*/, // **bold**
	/^#{1,6}\s/m,    // # heading
	/^[-*]\s+/m,     // - item or * item
	/^\d+\.\s/m,     // 1. item
];

function isHtml(text: string): boolean {
	return HTML_TAG_REGEX.test(text);
}

function isMarkdown(text: string): boolean {
	return MARKDOWN_SIGNALS.some((re) => re.test(text));
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

/** Convertit du markdown simple vers HTML. */
function markdownToHtml(raw: string): string {
	const lines = raw.split(/\r?\n/);
	const out: string[] = [];
	let inList: "ul" | "ol" | null = null;
	let paragraphBuffer: string[] = [];

	const flushParagraph = () => {
		if (paragraphBuffer.length > 0) {
			const joined = paragraphBuffer.join(" ").trim();
			if (joined) out.push(`<p>${applyInline(joined)}</p>`);
			paragraphBuffer = [];
		}
	};
	const closeList = () => {
		if (inList) {
			out.push(`</${inList}>`);
			inList = null;
		}
	};

	for (let line of lines) {
		line = line.trim();

		// Ligne vide → flush paragraphe
		if (!line) {
			flushParagraph();
			closeList();
			continue;
		}

		// Heading: ### Titre
		const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
		if (hMatch) {
			flushParagraph();
			closeList();
			const level = Math.min(hMatch[1].length + 2, 6); // h3-h6
			out.push(`<h${level}>${applyInline(hMatch[2])}</h${level}>`);
			continue;
		}

		// Bullet list: - item ou * item
		const bulletMatch = line.match(/^[-*]\s+(.*)$/);
		if (bulletMatch) {
			flushParagraph();
			if (inList !== "ul") {
				closeList();
				out.push("<ul>");
				inList = "ul";
			}
			out.push(`<li>${applyInline(bulletMatch[1])}</li>`);
			continue;
		}

		// Numbered list: 1. item
		const numMatch = line.match(/^\d+\.\s+(.*)$/);
		if (numMatch) {
			flushParagraph();
			if (inList !== "ol") {
				closeList();
				out.push("<ol>");
				inList = "ol";
			}
			out.push(`<li>${applyInline(numMatch[1])}</li>`);
			continue;
		}

		// Ligne normale → accumule dans paragraphe
		closeList();
		paragraphBuffer.push(line);
	}
	flushParagraph();
	closeList();
	return out.join("\n");
}

/** Applique les transformations inline (bold, italic). */
function applyInline(text: string): string {
	return escapeHtml(text)
		// **bold**
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		// *italic*
		.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
}

/**
 * Detecte si une ligne est probablement un titre de section :
 * - Courte (<= 50 chars)
 * - Pas de ponctuation finale (., !, ?)
 * - Pas de ":" au milieu (serait un label description)
 * - Au moins 2 mots OU commence par une majuscule
 */
function looksLikeHeading(line: string): boolean {
	const trimmed = line.trim();
	if (trimmed.length === 0 || trimmed.length > 60) return false;
	if (/[.!?]$/.test(trimmed)) return false;
	if (/:.+/.test(trimmed)) return false; // "Label: contenu"
	// Doit contenir au moins une lettre
	if (!/[a-zA-Z]/.test(trimmed)) return false;
	return true;
}

/**
 * Applique le formatage inline pour texte brut :
 * - "Label: description" → <strong>Label:</strong> description
 */
function formatInlineText(line: string): string {
	const escaped = escapeHtml(line);
	// Match "Label: reste" ou "Label : reste" (label <= 40 chars, pas de ponctuation dans label)
	const labelMatch = escaped.match(/^([A-Z][^:.\n]{1,40}?)(\s*:\s+)(.+)$/);
	if (labelMatch) {
		return `<strong>${labelMatch[1]}:</strong> ${labelMatch[3]}`;
	}
	return escaped;
}

/** Convertit du texte brut en HTML structure. */
function plainTextToHtml(raw: string): string {
	const lines = raw.split(/\r?\n/);
	const out: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		// Heading : ligne courte sans ponctuation + ligne suivante plus longue
		const next = lines[i + 1]?.trim() || "";
		if (looksLikeHeading(line) && next && next.length > line.length) {
			out.push(`<h4>${escapeHtml(line)}</h4>`);
			continue;
		}

		out.push(`<p>${formatInlineText(line)}</p>`);
	}

	return out.join("\n");
}

/**
 * Pre-traite du markdown qui a perdu ses sauts de ligne.
 * Transforme :
 *   - `****heading****`  → saut + `### heading` + saut
 *   - ` * item`          → saut + `- item`
 *   - Long texte plat    → ajoute sauts de ligne apres `**bold**` isole
 */
function normalizeInlineMarkdown(raw: string): string {
	let text = raw;
	// `****texte****` (4 etoiles) = heading
	text = text.replace(/\*{4}([^*]+?)\*{4}/g, "\n\n### $1\n\n");
	// ` * item` isole (espace, etoile, espace, mot) → bullet
	text = text.replace(/(?:^|\s)\*\s+([A-ZÀ-Ü])/g, "\n- $1");
	// Double espace ou ` \| ` en separateur
	text = text.replace(/\s\\\|\s/g, "\n\n");
	// `**Label**` suivi d'un autre `**Label**` sur la meme ligne = pivote vers nouvelles lignes
	// (pattern frequent : `**Titre A** contenu. **Titre B** contenu.)
	text = text.replace(/\.\s+\*\*/g, ".\n\n**");
	return text;
}

export function formatJobDescription(raw: string): string {
	if (!raw) return "";
	const trimmed = raw.trim();
	if (isHtml(trimmed)) return trimmed; // sanitizeHtml s'occupe du reste
	if (isMarkdown(trimmed)) {
		return markdownToHtml(normalizeInlineMarkdown(trimmed));
	}
	return plainTextToHtml(trimmed);
}

/**
 * Convertit le nom technique d'une source de scrape en label lisible.
 * Exemple : "jobup" -> "JobUp"
 */
export function sourceLabel(source: string | null | undefined): string {
	if (!source) return "l'offre";
	const map: Record<string, string> = {
		jobup: "JobUp",
		jobsch: "Jobs.ch",
		jobroom: "Job-Room",
		indeed: "Indeed",
		ictjob: "ICTjobs",
		jobscout24: "JobScout24",
		adecco: "Adecco",
		manpower: "Manpower",
		hoteljobs: "HotelCareer",
		medijobs: "Medi-Jobs",
		finanzjobs: "Finanz-Job",
		myhandicap: "MyHandicap",
		wttj: "Welcome to the Jungle",
		startupjobs: "Startup.jobs",
	};
	return map[source] ?? source;
}

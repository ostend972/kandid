import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { GeneratedCvData } from "@/lib/ai/generate-cv";

// =============================================================================
// Constants
// =============================================================================

const COLORS = {
  sidebar: "#1a1a2e",
  accent: "#4a90d9",
  white: "#ffffff",
  black: "#111111",
  gray: "#666666",
  lightGray: "#e0e0e0",
  sidebarText: "#c8c8d4",
};

const SIDEBAR_WIDTH = "30%";
const MAIN_WIDTH = "70%";

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.black,
  },

  // -- Sidebar ----------------------------------------------------------------
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: COLORS.sidebar,
    color: COLORS.white,
    paddingTop: 36,
    paddingBottom: 36,
    paddingLeft: 20,
    paddingRight: 20,
  },
  sidebarEmpty: {
    width: SIDEBAR_WIDTH,
    backgroundColor: COLORS.sidebar,
  },
  photoWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    objectFit: "cover",
  },
  sidebarSectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: COLORS.accent,
    marginBottom: 8,
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
    paddingBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  contactLabel: {
    fontSize: 8,
    color: COLORS.sidebarText,
    width: 50,
    fontFamily: "Helvetica-Bold",
  },
  contactValue: {
    fontSize: 8,
    color: COLORS.white,
    flex: 1,
  },
  skillPill: {
    backgroundColor: "rgba(74,144,217,0.25)",
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 7,
    marginRight: 5,
    marginBottom: 5,
  },
  skillPillText: {
    fontSize: 8,
    color: COLORS.white,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  languageName: {
    fontSize: 9,
    color: COLORS.white,
  },
  languageLevel: {
    fontSize: 8,
    color: COLORS.accent,
    fontFamily: "Helvetica-Bold",
  },

  // -- Main content -----------------------------------------------------------
  main: {
    width: MAIN_WIDTH,
    paddingTop: 36,
    paddingBottom: 36,
    paddingLeft: 28,
    paddingRight: 28,
    backgroundColor: COLORS.white,
  },
  mainContinuation: {
    width: MAIN_WIDTH,
    paddingTop: 36,
    paddingBottom: 36,
    paddingLeft: 28,
    paddingRight: 28,
    backgroundColor: COLORS.white,
  },
  nameText: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: COLORS.black,
  },
  titleText: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 2,
    marginBottom: 10,
  },
  separator: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    marginBottom: 12,
  },
  personalInfoRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  personalInfoItem: {
    fontSize: 8,
    color: COLORS.gray,
    marginRight: 6,
  },
  personalInfoSep: {
    fontSize: 8,
    color: COLORS.lightGray,
    marginRight: 6,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: COLORS.accent,
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
    paddingBottom: 4,
  },
  sectionHeaderFirst: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: COLORS.accent,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
    paddingBottom: 4,
  },

  // Experience block
  experienceBlock: {
    marginBottom: 12,
  },
  experienceTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.black,
  },
  experienceMeta: {
    fontSize: 8,
    color: COLORS.gray,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 9,
    marginRight: 4,
    color: COLORS.accent,
  },
  bulletText: {
    fontSize: 9,
    color: COLORS.black,
    flex: 1,
    lineHeight: 1.4,
  },

  // Education block
  educationBlock: {
    marginBottom: 10,
  },
  educationDegree: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.black,
  },
  educationEquivalence: {
    fontSize: 8,
    color: COLORS.accent,
    fontStyle: "italic",
  },
  educationMeta: {
    fontSize: 8,
    color: COLORS.gray,
    marginBottom: 2,
  },
  educationDetails: {
    fontSize: 9,
    color: COLORS.black,
    lineHeight: 1.4,
  },

  // Interests
  interestItem: {
    fontSize: 9,
    color: COLORS.black,
    marginBottom: 3,
  },
  skillCategoryTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.accent,
    marginTop: 6,
    marginBottom: 4,
  },
});

// =============================================================================
// Props
// =============================================================================

interface CvTemplateProps {
  data: GeneratedCvData;
  photoBase64?: string;
}

// =============================================================================
// Helper sub-components
// =============================================================================

function SidebarContact({ data }: { data: GeneratedCvData }) {
  const items = [
    { label: "Tel.", value: data.identity.phone },
    { label: "Email", value: data.identity.email },
    { label: "Adresse", value: data.identity.address },
  ].filter((i) => i.value);

  return (
    <View>
      <Text style={styles.sidebarSectionTitle}>Contact</Text>
      {items.map((item, idx) => (
        <View style={styles.contactRow} key={idx}>
          <Text style={styles.contactLabel}>{item.label}</Text>
          <Text style={styles.contactValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function SidebarSkills({ skills }: { skills: GeneratedCvData["skills"] }) {
  if (!skills || skills.length === 0) return null;

  return (
    <View>
      <Text style={styles.sidebarSectionTitle}>Competences</Text>
      {skills.map((cat, catIdx) => (
        <View key={catIdx}>
          {cat.category && (
            <Text style={styles.skillCategoryTitle}>{cat.category}</Text>
          )}
          <View style={styles.skillsContainer}>
            {cat.items.map((skill, idx) => (
              <View style={styles.skillPill} key={idx}>
                <Text style={styles.skillPillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function SidebarLanguages({
  languages,
}: {
  languages: GeneratedCvData["languages"];
}) {
  if (!languages || languages.length === 0) return null;

  return (
    <View>
      <Text style={styles.sidebarSectionTitle}>Langues</Text>
      {languages.map((lang, idx) => (
        <View style={styles.languageRow} key={idx}>
          <Text style={styles.languageName}>{lang.language}</Text>
          <Text style={styles.languageLevel}>{lang.level}</Text>
        </View>
      ))}
    </View>
  );
}

function PersonalInfoRow({ data }: { data: GeneratedCvData }) {
  const items = [
    data.identity.nationality,
    data.identity.dateOfBirth,
    data.identity.civilStatus,
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <View style={styles.personalInfoRow}>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <Text style={styles.personalInfoSep}>|</Text>}
          <Text style={styles.personalInfoItem}>{item}</Text>
        </React.Fragment>
      ))}
    </View>
  );
}

function ExperienceBlock({
  exp,
}: {
  exp: GeneratedCvData["experiences"][number];
}) {
  const dateRange = [exp.startDate, exp.endDate].filter(Boolean).join(" - ");
  const meta = [exp.company, exp.location, dateRange, exp.contractType]
    .filter(Boolean)
    .join(" | ");

  return (
    <View style={styles.experienceBlock} wrap={false}>
      <Text style={styles.experienceTitle}>{exp.title}</Text>
      <Text style={styles.experienceMeta}>{meta}</Text>
      {exp.bullets.map((bullet, idx) => (
        <View style={styles.bulletRow} key={idx}>
          <Text style={styles.bulletDot}>&#8226;</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  );
}

function EducationBlock({
  edu,
}: {
  edu: GeneratedCvData["education"][number];
}) {
  const meta = [edu.institution, edu.location, edu.year]
    .filter(Boolean)
    .join(" | ");

  return (
    <View style={styles.educationBlock} wrap={false}>
      <Text style={styles.educationDegree}>{edu.degree}</Text>
      {edu.equivalence && (
        <Text style={styles.educationEquivalence}>{edu.equivalence}</Text>
      )}
      <Text style={styles.educationMeta}>{meta}</Text>
      {edu.details && (
        <Text style={styles.educationDetails}>{edu.details}</Text>
      )}
    </View>
  );
}

// =============================================================================
// Main CV Template
// =============================================================================

export function CvTemplate({ data, photoBase64 }: CvTemplateProps) {
  return (
    <Document>
      {/* ---- Page 1 -------------------------------------------------------- */}
      <Page size="A4" style={styles.page} wrap>
        {/* Sidebar — fixed on every page */}
        <View style={styles.sidebar} fixed>
          {photoBase64 && (
            <View style={styles.photoWrapper}>
              <Image src={photoBase64} style={styles.photo} />
            </View>
          )}
          <SidebarContact data={data} />
          <SidebarSkills skills={data.skills} />
          <SidebarLanguages languages={data.languages} />
        </View>

        {/* Main — wraps to page 2 */}
        <View style={styles.main}>
          <Text style={styles.nameText}>
            {data.identity.firstName} {data.identity.lastName}
          </Text>
          <Text style={styles.titleText}>{data.identity.title}</Text>
          <View style={styles.separator} />
          <PersonalInfoRow data={data} />

          <Text style={styles.sectionHeaderFirst}>
            Experience professionnelle
          </Text>
          {data.experiences.map((exp, idx) => (
            <ExperienceBlock key={idx} exp={exp} />
          ))}

          <Text style={styles.sectionHeader}>Formation</Text>
          {data.education.map((edu, idx) => (
            <EducationBlock key={idx} edu={edu} />
          ))}

          {data.interests && data.interests.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Centres d&apos;interet</Text>
              {data.interests.map((interest, idx) => (
                <Text style={styles.interestItem} key={idx}>
                  &#8226; {interest}
                </Text>
              ))}
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}

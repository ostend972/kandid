import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CandidateReference } from "@/lib/db/schema";

// =============================================================================
// Constants
// =============================================================================

const COLORS = {
  accent: "#4a90d9",
  black: "#111111",
  gray: "#666666",
  lightGray: "#f0f0f0",
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.black,
    paddingTop: 50,
    paddingBottom: 50,
    paddingLeft: 60,
    paddingRight: 60,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: COLORS.accent,
    marginBottom: 6,
  },
  candidateName: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 14,
  },
  separator: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    marginBottom: 24,
  },

  // Reference card
  referenceCard: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  refName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.black,
    marginBottom: 2,
  },
  refPosition: {
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: 6,
  },
  refDetailRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  refDetailLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gray,
    width: 70,
  },
  refDetailValue: {
    fontSize: 9,
    color: COLORS.black,
    flex: 1,
  },
  refRelationship: {
    fontSize: 9,
    fontStyle: "italic",
    color: COLORS.gray,
    marginTop: 4,
  },
});

// =============================================================================
// Props
// =============================================================================

interface ReferencesTemplateProps {
  references: CandidateReference[];
  candidateName: string;
}

// =============================================================================
// Reference Card
// =============================================================================

function ReferenceCard({ reference }: { reference: CandidateReference }) {
  const position = [reference.jobTitle, reference.company]
    .filter(Boolean)
    .join(" — ");

  return (
    <View style={styles.referenceCard} wrap={false}>
      <Text style={styles.refName}>{reference.fullName}</Text>
      {position && <Text style={styles.refPosition}>{position}</Text>}

      {reference.phone && (
        <View style={styles.refDetailRow}>
          <Text style={styles.refDetailLabel}>Telephone</Text>
          <Text style={styles.refDetailValue}>{reference.phone}</Text>
        </View>
      )}

      {reference.email && (
        <View style={styles.refDetailRow}>
          <Text style={styles.refDetailLabel}>Email</Text>
          <Text style={styles.refDetailValue}>{reference.email}</Text>
        </View>
      )}

      {reference.relationship && (
        <Text style={styles.refRelationship}>{reference.relationship}</Text>
      )}
    </View>
  );
}

// =============================================================================
// References Template
// =============================================================================

export function ReferencesTemplate({
  references,
  candidateName,
}: ReferencesTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>References professionnelles</Text>
        <Text style={styles.candidateName}>{candidateName}</Text>
        <View style={styles.separator} />

        {references.map((reference, idx) => (
          <ReferenceCard key={reference.id ?? idx} reference={reference} />
        ))}
      </Page>
    </Document>
  );
}

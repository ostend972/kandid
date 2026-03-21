import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

// =============================================================================
// Constants
// =============================================================================

const COLORS = {
  accent: "#4a90d9",
  black: "#111111",
  gray: "#666666",
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
    lineHeight: 1.6,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  senderBlock: {
    maxWidth: "50%",
  },
  senderName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.black,
    marginBottom: 2,
  },
  senderLine: {
    fontSize: 9,
    color: COLORS.gray,
    marginBottom: 1,
  },
  recipientBlock: {
    maxWidth: "45%",
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.black,
  },

  // Date
  dateLine: {
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: 24,
    textAlign: "right",
  },

  // Subject
  subjectLine: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.black,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
    paddingBottom: 4,
  },

  // Body
  greeting: {
    fontSize: 10,
    marginBottom: 14,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 12,
    textAlign: "justify",
    lineHeight: 1.6,
  },

  // Closing
  closing: {
    fontSize: 10,
    marginTop: 14,
    marginBottom: 28,
  },
  signature: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
});

// =============================================================================
// Props
// =============================================================================

interface LetterTemplateProps {
  data: {
    subject?: string;
    greeting: string;
    body: {
      vous: string;
      moi: string;
      nous: string;
    };
    closing: string;
    signature: string;
  };
  candidateName: string;
  candidateAddress: string;
  candidatePhone: string;
  candidateEmail: string;
  companyName: string;
  date: string;
}

// =============================================================================
// Letter Template
// =============================================================================

export function LetterTemplate({
  data,
  candidateName,
  candidateAddress,
  candidatePhone,
  candidateEmail,
  companyName,
  date,
}: LetterTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header: sender + recipient */}
        <View style={styles.headerRow}>
          <View style={styles.senderBlock}>
            <Text style={styles.senderName}>{candidateName}</Text>
            {candidateAddress && (
              <Text style={styles.senderLine}>{candidateAddress}</Text>
            )}
            {candidatePhone && (
              <Text style={styles.senderLine}>{candidatePhone}</Text>
            )}
            {candidateEmail && (
              <Text style={styles.senderLine}>{candidateEmail}</Text>
            )}
          </View>

          <View style={styles.recipientBlock}>
            <Text style={styles.companyName}>{companyName}</Text>
          </View>
        </View>

        {/* Date */}
        <Text style={styles.dateLine}>{date}</Text>

        {/* Subject */}
        {data.subject && (
          <Text style={styles.subjectLine}>{data.subject}</Text>
        )}

        {/* Greeting */}
        <Text style={styles.greeting}>{data.greeting}</Text>

        {/* Body — VOUS / MOI / NOUS */}
        <Text style={styles.paragraph}>{data.body.vous}</Text>
        <Text style={styles.paragraph}>{data.body.moi}</Text>
        <Text style={styles.paragraph}>{data.body.nous}</Text>

        {/* Closing */}
        <Text style={styles.closing}>{data.closing}</Text>

        {/* Signature */}
        <Text style={styles.signature}>{data.signature}</Text>
      </Page>
    </Document>
  );
}

/**
 * Shared brand theme for every PDF the CRM emits — quotations, invoices,
 * salary slips, offer letters, interview sheets. Change once, change
 * everywhere.
 *
 * Values are literals (not CSS variables) because @react-pdf/renderer
 * doesn't parse CSS variables — it takes plain style objects.
 */

import { StyleSheet } from '@react-pdf/renderer';

/**
 * We use @react-pdf/renderer's built-in PDF14 fonts (Helvetica, Times-Roman,
 * Courier). They ship with every PDF viewer — no network fetch, no font
 * subsetting, no missing-glyph rectangles. When the design brief demands
 * Fraunces later, drop a bundled .ttf under src/pdf/fonts/ and Font.register
 * it here.
 */

/**
 * Palette pulled straight from the logo. Kept here (not imported from the
 * frontend's globals.css) because the two apps deploy independently.
 */
export const brand = {
  gold:      '#EAB130',
  goldDeep:  '#C88C1A',
  teal:      '#0B4A5A',
  tealMid:   '#0E5D71',
  tealLight: '#4FA5B8',
  cream:     '#FBF7EE',
  parchment: '#F6EFDF',
  border:    '#ECDFC4',
  ink:       '#0F1420',
  text:      '#2B2F3A',
  muted:     '#6D6A5C',
  soft:      '#4A4A45',
  healthy:   '#2E7D5B',
  warn:      '#B87116',
  loss:      '#B84A37',
} as const;

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: brand.text,
    backgroundColor: '#FFFFFF',
    paddingTop: 42,
    paddingBottom: 56,
    paddingHorizontal: 44,
  },

  // ---- header -----------------------------------------------------------
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  brandRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  brandGold: {
    fontFamily: 'Times-Roman',
    fontWeight: 700,
    fontSize: 20,
    color: brand.gold,
    letterSpacing: -0.3,
  },
  brandTeal: {
    fontFamily: 'Helvetica',
    fontWeight: 700,
    fontSize: 10,
    color: brand.teal,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  brandTagline: {
    marginTop: 4,
    fontSize: 8.5,
    color: brand.muted,
    letterSpacing: 0.4,
  },
  docMeta: { textAlign: 'right' },
  docLabel: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: brand.muted,
    marginBottom: 2,
  },
  docNumber: {
    fontFamily: 'Times-Roman',
    fontWeight: 700,
    fontSize: 15,
    color: brand.ink,
    letterSpacing: -0.2,
  },
  docDate: { marginTop: 3, fontSize: 9, color: brand.soft },

  // ---- generic display --------------------------------------------------
  h1: {
    fontFamily: 'Times-Roman',
    fontWeight: 700,
    fontSize: 22,
    color: brand.ink,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  h2: {
    fontFamily: 'Times-Roman',
    fontWeight: 700,
    fontSize: 13,
    color: brand.ink,
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: brand.muted,
    marginBottom: 4,
  },
  para: { fontSize: 10, lineHeight: 1.55, color: brand.text },
  small: { fontSize: 9, color: brand.muted },

  // ---- two-column parties block -----------------------------------------
  parties: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 22,
  },
  partyBox: {
    flex: 1,
    padding: 12,
    backgroundColor: brand.cream,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: brand.border,
  },

  // ---- tables -----------------------------------------------------------
  table: { marginTop: 6, borderWidth: 1, borderColor: brand.border, borderRadius: 6 },
  th: {
    flexDirection: 'row',
    backgroundColor: brand.parchment,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  thText: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: brand.muted,
    fontWeight: 700,
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
  },
  trLast: { borderBottomWidth: 0 },
  td: { fontSize: 9.5, color: brand.text },

  // ---- totals -----------------------------------------------------------
  totals: {
    marginTop: 12,
    marginLeft: 'auto',
    width: '55%',
    padding: 12,
    backgroundColor: brand.cream,
    borderRadius: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalGrand: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: brand.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalGrandLabel: { fontFamily: 'Times-Roman', fontWeight: 700, fontSize: 12, color: brand.ink },
  totalGrandValue: {
    fontFamily: 'Times-Roman',
    fontWeight: 700,
    fontSize: 15,
    color: brand.teal,
  },

  // ---- footer -----------------------------------------------------------
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 44,
    right: 44,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: brand.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: brand.muted },

  // ---- small utility markers -------------------------------------------
  goldAccent: { width: 34, height: 3, backgroundColor: brand.gold, marginBottom: 10 },
});

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import {
  formatCurrency,
  formatEntryDateLabel,
  formatMonthYear,
  formatTenantGroup,
  getPropertyTotal,
} from "@/lib/format"
import type { ReceiptPdfData } from "@/types/domain"

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
    paddingTop: 34,
    paddingRight: 34,
    paddingBottom: 34,
    paddingLeft: 34,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 28,
  },
  companyBlock: {
    width: "48%",
  },
  titleBlock: {
    width: "40%",
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: "#475569",
  },
  section: {
    marginBottom: 18,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: "#475569",
  },
  detailRow: {
    flexDirection: "row",
    gap: 8,
  },
  label: {
    width: 130,
    fontWeight: "bold",
  },
  value: {
    flexGrow: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 18,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRowLast: {
    borderBottomWidth: 0,
    backgroundColor: "#f8fafc",
  },
  paymentBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  signature: {
    marginTop: 32,
    alignItems: "flex-end",
    gap: 10,
  },
  signatureLine: {
    width: 180,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
})

export function RentReceiptDocument({ data }: { data: ReceiptPdfData }) {
  const total = getPropertyTotal(data.property)

  return (
    <Document title={`Quittance ${formatMonthYear(data.month, data.year)}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{data.landlordSettings.companyName}</Text>
            <Text>{data.landlordSettings.addressLine1}</Text>
            {data.landlordSettings.addressLine2 ? (
              <Text>{data.landlordSettings.addressLine2}</Text>
            ) : null}
            <Text>
              {data.landlordSettings.postalCode} {data.landlordSettings.city}
            </Text>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Quittance de loyer</Text>
            <Text style={styles.subtitle}>{formatMonthYear(data.month, data.year)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du logement</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Locataire(s)</Text>
            <Text style={styles.value}>
              {formatTenantGroup(data.tenants, true)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Adresse du bien</Text>
            <Text style={styles.value}>
              {data.property.residenceName ? `${data.property.residenceName}, ` : ""}
              {data.property.addressLine1}
              {data.property.addressLine2 ? `, ${data.property.addressLine2}` : ""}
              {`, ${data.property.postalCode} ${data.property.city}`}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Entrée dans le bien</Text>
            <Text style={styles.value}>
              {formatEntryDateLabel(
                data.property.entryDate,
                data.property.entryDateDetail
              )}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Indice de référence des loyers (IRL)</Text>
            <Text style={styles.value}>{data.property.technicalReference}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paiement constaté</Text>
          <Text>
            Le bailleur soussigné reconnaît avoir reçu du ou des locataires
            indiqués ci-dessus le règlement intégral du loyer et des charges
            pour la période de {formatMonthYear(data.month, data.year)}.
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text>Loyer</Text>
            <Text>{formatCurrency(data.property.baseRent)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text>Charges</Text>
            <Text>{formatCurrency(data.property.charges)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowLast]}>
            <Text style={{ fontWeight: "bold" }}>Total</Text>
            <Text style={{ fontWeight: "bold" }}>{formatCurrency(total)}</Text>
          </View>
        </View>

        <View style={styles.paymentBox}>
          <Text>Payé la somme de {formatCurrency(total)}</Text>
          <Text>Le :</Text>
          <Text>________________________________________________</Text>
          <Text>Par chèque / esp / vrt</Text>
        </View>

        <View style={styles.signature}>
          <Text>{data.landlordSettings.signatureLabel}</Text>
          <Text style={styles.signatureLine}> </Text>
        </View>
      </Page>
    </Document>
  )
}

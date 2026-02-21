import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Invoice } from '@/types';
import { format } from 'date-fns';

// Register fonts
// Note: In a real app we'd load fonts from public, but for MVP we use default fonts to avoid loading issues.

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 60,
        height: 60,
        objectFit: 'contain',
        marginRight: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E3A5F',
    },
    brand: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    col: {
        width: '45%',
    },
    label: {
        fontSize: 10,
        color: '#64748B',
        marginBottom: 4,
    },
    value: {
        fontSize: 12,
        color: '#1E293B',
    },
    table: {
        marginTop: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        padding: 8,
    },
    colDesc: {
        width: '50%',
        fontSize: 10,
    },
    colQty: {
        width: '15%',
        fontSize: 10,
        textAlign: 'center',
    },
    colPrice: {
        width: '15%',
        fontSize: 10,
        textAlign: 'right',
    },
    colTotal: {
        width: '20%',
        fontSize: 10,
        textAlign: 'right',
    },
    summary: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    summaryLabel: {
        width: 100,
        fontSize: 10,
        textAlign: 'right',
        paddingRight: 10,
        color: '#64748B',
    },
    summaryValue: {
        width: 80,
        fontSize: 12,
        textAlign: 'right',
        fontWeight: 'bold',
    },
});

interface InvoicePDFProps {
    invoice: Invoice & { items: any[]; client: any };
    profile: any;
    paperSize?: 'A4' | 'LETTER';
}

const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
        return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
        return 'Invalid Date';
    }
};

export const InvoicePDF = ({ invoice, profile, paperSize = 'A4' }: InvoicePDFProps) => (
    <Document>
        <Page size={paperSize} style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {profile?.logo_url && (
                        <Image src={profile.logo_url} style={styles.logo} />
                    )}
                    <View>
                        <Text style={styles.title}>INVOICE</Text>
                        <Text style={styles.brand}>{profile?.company_name || profile?.full_name || 'Aranora'}</Text>
                    </View>
                </View>
                <View>
                    <Text style={styles.value}>#{invoice.invoice_number || '---'}</Text>
                    <Text style={[styles.label, { marginTop: 4, textAlign: 'right' }]}>{invoice.status || 'Draft'}</Text>
                </View>
            </View>

            {/* Info Row */}
            <View style={styles.row}>
                <View style={styles.col}>
                    <Text style={styles.label}>From:</Text>
                    <Text style={[styles.value, { fontWeight: 'bold' }]}>{profile?.company_name || profile?.full_name}</Text>
                    <Text style={styles.value}>{profile?.company_email}</Text>
                    <Text style={[styles.value, { fontSize: 10, marginTop: 4 }]}>{profile?.address}</Text>
                </View>
                <View style={styles.col}>
                    <Text style={styles.label}>Bill To:</Text>
                    <Text style={[styles.value, { fontWeight: 'bold' }]}>{invoice?.client?.name || 'Valued Client'}</Text>
                    <Text style={styles.value}>{invoice?.client?.email || ''}</Text>
                    <Text style={styles.value}>{invoice?.client?.phone || ''}</Text>
                </View>
            </View>

            <View style={styles.row}>
                <View style={styles.col}>
                    <Text style={styles.label}>Dates:</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.label}>Issued:</Text>
                        <Text style={styles.value}>{formatDate(invoice.issue_date)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.label}>Due:</Text>
                        <Text style={styles.value}>{formatDate(invoice.due_date)}</Text>
                    </View>
                </View>
                <View style={styles.col}>
                </View>
            </View>

            {/* Line Items */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colDesc}>Description</Text>
                    <Text style={styles.colQty}>Qty</Text>
                    <Text style={styles.colPrice}>Unit Price</Text>
                    <Text style={styles.colTotal}>Total</Text>
                </View>
                {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.colDesc}>{item.description || 'Item'}</Text>
                            <Text style={styles.colQty}>{item.quantity || 0}</Text>
                            <Text style={styles.colPrice}>${(item.unit_price || 0).toFixed(2)}</Text>
                            <Text style={styles.colTotal}>${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}</Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.tableRow}>
                        <Text style={styles.colDesc}>No items</Text>
                    </View>
                )}
            </View>

            {/* Summary */}
            <View style={styles.summary}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>${(invoice.subtotal || 0).toLocaleString()}</Text>
                </View>
                {(invoice.tax_rate || 0) > 0 && (
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tax ({invoice.tax_rate}%)</Text>
                        <Text style={styles.summaryValue}>${(invoice.tax_amount || 0).toLocaleString()}</Text>
                    </View>
                )}
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total</Text>
                    <Text style={[styles.summaryValue, { fontSize: 14, color: '#1E3A5F' }]}>${(invoice.total || 0).toLocaleString()}</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={{ position: 'absolute', bottom: 30, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 }}>
                <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center' }}>
                    Thank you for your business.
                </Text>
            </View>
        </Page>
    </Document>
);

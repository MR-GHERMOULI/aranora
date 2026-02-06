import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Contract } from '@/types';
import { format } from 'date-fns';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#1E3A5F',
        paddingBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E3A5F',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E3A5F',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 5,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    label: {
        fontSize: 10,
        color: '#64748B',
        width: 100,
    },
    value: {
        fontSize: 11,
        color: '#1E293B',
        flex: 1,
    },
    content: {
        fontSize: 11,
        lineHeight: 1.6,
        color: '#334155',
        marginTop: 10,
        padding: 15,
        backgroundColor: '#F8FAFC',
        borderRadius: 4,
    },
    signatureSection: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '45%',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#CBD5E1',
        marginTop: 60,
        paddingTop: 10,
    },
    signatureLabel: {
        fontSize: 10,
        color: '#64748B',
    },
    signedBadge: {
        backgroundColor: '#10B981',
        color: '#FFFFFF',
        padding: 8,
        borderRadius: 4,
        fontSize: 10,
        textAlign: 'center',
        marginTop: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 9,
        color: '#94A3B8',
        textAlign: 'center',
    },
});

interface ContractPDFProps {
    contract: Contract & { client?: any };
    profile?: any;
}

export const ContractPDF = ({ contract, profile }: ContractPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{contract.title}</Text>
                <Text style={styles.subtitle}>
                    {profile?.company_name || 'Aranora'} • Contract Agreement
                </Text>
            </View>

            {/* Parties Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Parties</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Service Provider:</Text>
                    <Text style={styles.value}>{profile?.company_name || profile?.full_name || 'Aranora'}</Text>
                </View>
                {profile?.address && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Address:</Text>
                        <Text style={styles.value}>{profile.address}</Text>
                    </View>
                )}
                <View style={styles.row}>
                    <Text style={styles.label}>Client:</Text>
                    <Text style={styles.value}>{contract.client?.name || 'N/A'}</Text>
                </View>
                {contract.client?.email && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Client Email:</Text>
                        <Text style={styles.value}>{contract.client.email}</Text>
                    </View>
                )}
            </View>

            {/* Dates Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dates</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Created:</Text>
                    <Text style={styles.value}>{format(new Date(contract.created_at), 'MMMM d, yyyy')}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={styles.value}>{contract.status}</Text>
                </View>
                {contract.signed_at && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Signed:</Text>
                        <Text style={styles.value}>{format(new Date(contract.signed_at), 'MMMM d, yyyy h:mm a')}</Text>
                    </View>
                )}
            </View>

            {/* Terms Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Agreement Terms</Text>
                <Text style={styles.content}>{contract.content || 'No terms specified.'}</Text>
            </View>

            {/* Signature Section */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureLabel}>Service Provider</Text>
                    <View style={styles.signatureLine}>
                        <Text style={styles.value}>{profile?.full_name || 'Authorized Representative'}</Text>
                    </View>
                </View>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureLabel}>Client</Text>
                    <View style={styles.signatureLine}>
                        <Text style={styles.value}>{contract.client?.name || 'Client Representative'}</Text>
                    </View>
                    {contract.status === 'Signed' && (
                        <Text style={styles.signedBadge}>✓ SIGNED</Text>
                    )}
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    This document was generated by {profile?.company_name || 'Aranora'}.
                </Text>
            </View>
        </Page>
    </Document>
);

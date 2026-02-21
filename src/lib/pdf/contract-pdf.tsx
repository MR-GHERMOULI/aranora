import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 50,
        height: 50,
        objectFit: 'contain',
        marginRight: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E3A5F',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 11,
        color: '#64748B',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 9,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 13,
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
    signatureImage: {
        width: 180,
        height: 70,
        objectFit: 'contain',
        marginTop: 5,
    },
    signatureDetails: {
        marginTop: 5,
    },
    signatureDetailText: {
        fontSize: 8,
        color: '#94A3B8',
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
                <View style={styles.headerLeft}>
                    {profile?.logo_url && (
                        <Image src={profile.logo_url} style={styles.logo} />
                    )}
                    <View>
                        <Text style={styles.title}>{contract.title}</Text>
                        <Text style={styles.subtitle}>
                            {profile?.company_name || 'Aranora'} • Contract Agreement
                        </Text>
                    </View>
                </View>
                <View style={[
                    styles.statusBadge,
                    {
                        backgroundColor: contract.status === 'Signed' ? '#D1FAE5' : contract.status === 'Sent' ? '#DBEAFE' : '#F3F4F6',
                    }
                ]}>
                    <Text style={{
                        fontSize: 9,
                        color: contract.status === 'Signed' ? '#047857' : contract.status === 'Sent' ? '#1D4ED8' : '#4B5563',
                    }}>
                        {contract.status === 'Signed' ? '✓ SIGNED' : contract.status?.toUpperCase()}
                    </Text>
                </View>
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

            {/* Structured Summary Section */}
            {contract.contract_data && (
                <View style={[styles.section, { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: '#1E3A5F' }]}>
                    <Text style={[styles.sectionTitle, { borderBottomWidth: 0 }]}>Summary of Key Terms</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
                        <View style={{ minWidth: 100 }}>
                            <Text style={styles.label}>Total Amount:</Text>
                            <Text style={[styles.value, { fontWeight: 'bold' }]}>{contract.contract_data.total_amount} {contract.contract_data.currency}</Text>
                        </View>
                        <View style={{ minWidth: 100 }}>
                            <Text style={styles.label}>Payment Type:</Text>
                            <Text style={styles.value}>{contract.contract_data.payment_type}</Text>
                        </View>
                        <View style={{ minWidth: 100 }}>
                            <Text style={styles.label}>Schedule:</Text>
                            <Text style={styles.value}>{contract.contract_data.payment_schedule}</Text>
                        </View>
                    </View>

                    <View style={{ marginTop: 10 }}>
                        <Text style={styles.label}>Project Period:</Text>
                        <Text style={styles.value}>
                            {contract.contract_data.start_date ? format(new Date(contract.contract_data.start_date), 'MMM d, yyyy') : 'N/A'} -
                            {contract.contract_data.is_open_ended ? ' Open Ended' : (contract.contract_data.end_date ? format(new Date(contract.contract_data.end_date), ' MMM d, yyyy') : ' N/A')}
                        </Text>
                    </View>

                    {contract.contract_data.deliverables && contract.contract_data.deliverables.length > 0 && (
                        <View style={{ marginTop: 10 }}>
                            <Text style={styles.label}>Deliverables:</Text>
                            {contract.contract_data.deliverables.map((d: string, i: number) => (
                                <Text key={i} style={[styles.value, { fontSize: 9, marginLeft: 10, marginBottom: 2 }]}>• {d}</Text>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Dates Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dates</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Created:</Text>
                    <Text style={styles.value}>{format(new Date(contract.created_at), 'MMMM d, yyyy')}</Text>
                </View>
                {contract.sent_at && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Sent:</Text>
                        <Text style={styles.value}>{format(new Date(contract.sent_at), 'MMMM d, yyyy h:mm a')}</Text>
                    </View>
                )}
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
                    {contract.status === 'Signed' && contract.signature_data ? (
                        <View>
                            <Image src={contract.signature_data} style={styles.signatureImage} />
                            <Text style={[styles.value, { marginTop: 5, fontWeight: 'bold' }]}>
                                {contract.signer_name || contract.client?.name || 'Client Representative'}
                            </Text>
                            <View style={styles.signatureDetails}>
                                {contract.signed_at && (
                                    <Text style={styles.signatureDetailText}>
                                        Signed: {format(new Date(contract.signed_at), 'MMM d, yyyy h:mm a')}
                                    </Text>
                                )}
                                {contract.signer_ip && (
                                    <Text style={styles.signatureDetailText}>
                                        IP: {contract.signer_ip}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.signedBadge}>✓ ELECTRONICALLY SIGNED</Text>
                        </View>
                    ) : (
                        <View style={styles.signatureLine}>
                            <Text style={styles.value}>{contract.client?.name || 'Client Representative'}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    This document was generated by {profile?.company_name || 'Aranora'}. Electronic signatures are legally binding.
                </Text>
            </View>
        </Page>
    </Document>
);

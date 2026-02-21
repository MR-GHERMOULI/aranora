import { ContractStructuredData } from "@/types";
import { format } from "date-fns";

/**
 * Injects structured data into a contract template string.
 * Supports placeholders like {{field_name}}
 */
export function injectContractData(template: string, data: ContractStructuredData, partyInfo: { freelancerName: string, clientName: string }): string {
    let result = template;

    // Helper to replace all occurrences
    const replaceAll = (str: string, search: string, replacement: string) => {
        return str.split(search).join(replacement);
    };

    // Parties
    result = replaceAll(result, '{{freelancer_name}}', partyInfo.freelancerName || '[Freelancer Name]');
    result = replaceAll(result, '{{client_name}}', partyInfo.clientName || '[Client Name]');

    // Core Terms
    result = replaceAll(result, '{{total_amount}}', data.total_amount ? `${data.total_amount} ${data.currency || 'USD'}` : '[Amount]');
    result = replaceAll(result, '{{currency}}', data.currency || 'USD');
    result = replaceAll(result, '{{payment_type}}', data.payment_type || '[Payment Type]');
    result = replaceAll(result, '{{payment_schedule}}', data.payment_schedule || '[Payment Schedule]');

    // Dates
    result = replaceAll(result, '{{start_date}}', data.start_date ? format(new Date(data.start_date), 'PPP') : '[Start Date]');
    result = replaceAll(result, '{{end_date}}', data.end_date ? format(new Date(data.end_date), 'PPP') : (data.is_open_ended ? 'Open-ended' : '[End Date]'));

    // Terms
    result = replaceAll(result, '{{revisions_included}}', String(data.revisions_included || 0));
    result = replaceAll(result, '{{termination_notice_days}}', String(data.termination_notice_days || 0));
    result = replaceAll(result, '{{governing_law}}', data.governing_law || '[Governing Law]');
    result = replaceAll(result, '{{nda_status}}', data.nda_included ? 'includes confidentiality' : 'standard confidentiality applies');
    result = replaceAll(result, '{{ip_ownership}}', data.ip_ownership || '[IP Ownership]');

    // Deliverables (Bulleted list)
    if (data.deliverables && data.deliverables.length > 0) {
        const deliverablesList = data.deliverables.map(d => `- ${d}`).join('\n');
        result = replaceAll(result, '{{deliverables}}', deliverablesList);
    } else {
        result = replaceAll(result, '{{deliverables}}', '[List of Deliverables]');
    }

    return result;
}

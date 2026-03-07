/**
 * NPI Registry Lookup Service
 * 
 * Uses the free CMS NPI Registry API to look up provider contact information.
 * https://npiregistry.cms.hhs.gov/api-page
 */

interface NPIResult {
  name: string;
  npi: string;
  address?: string;
  phone?: string;
  fax?: string;
  taxonomy?: string;
  organizationName?: string;
}

interface NPIResponse {
  result_count: number;
  results: any[];
}

/**
 * Look up provider by NPI number
 */
export async function lookupByNPI(npi: string): Promise<NPIResult | null> {
  try {
    const response = await fetch(
      `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npi}`,
      { 
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );
    
    if (!response.ok) {
      console.error(`[NPI] Lookup failed: ${response.status}`);
      return null;
    }
    
    const data: NPIResponse = await response.json();
    
    if (data.result_count === 0 || !data.results?.[0]) {
      return null;
    }
    
    const result = data.results[0];
    
    // Extract organization or individual name
    let name = '';
    if (result.enumeration_type === 'NPI-2') {
      // Organization
      name = result.basic?.organization_name || '';
    } else {
      // Individual
      const first = result.basic?.first_name || '';
      const last = result.basic?.last_name || '';
      name = `${first} ${last}`.trim();
    }
    
    // Get practice location address (preferred) or mailing address
    const addresses = result.addresses || [];
    const practiceAddr = addresses.find((a: any) => a.address_purpose === 'LOCATION') || addresses[0];
    
    let address = '';
    let phone = '';
    let fax = '';
    
    if (practiceAddr) {
      const parts = [
        practiceAddr.address_1,
        practiceAddr.address_2,
        practiceAddr.city,
        practiceAddr.state,
        practiceAddr.postal_code
      ].filter(Boolean);
      address = parts.join(', ');
      
      phone = practiceAddr.telephone_number || '';
      fax = practiceAddr.fax_number || '';
    }
    
    // Get primary taxonomy
    const taxonomies = result.taxonomies || [];
    const primaryTax = taxonomies.find((t: any) => t.primary) || taxonomies[0];
    const taxonomy = primaryTax?.desc || '';
    
    return {
      name,
      npi,
      address,
      phone,
      fax,
      taxonomy,
      organizationName: result.basic?.organization_name
    };
    
  } catch (error) {
    console.error('[NPI] Lookup error:', error);
    return null;
  }
}

/**
 * Search for providers by name
 */
export async function searchByName(
  name: string, 
  state?: string,
  city?: string
): Promise<NPIResult[]> {
  try {
    let url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=10`;
    
    // Determine if organization or individual name
    if (name.includes(' ') && !name.toLowerCase().includes('clinic') && 
        !name.toLowerCase().includes('hospital') && !name.toLowerCase().includes('center')) {
      // Likely individual - split into first/last
      const parts = name.split(' ');
      if (parts.length >= 2) {
        url += `&first_name=${encodeURIComponent(parts[0])}&last_name=${encodeURIComponent(parts[parts.length - 1])}`;
      }
    } else {
      // Likely organization
      url += `&organization_name=${encodeURIComponent(name)}`;
    }
    
    if (state) url += `&state=${encodeURIComponent(state)}`;
    if (city) url += `&city=${encodeURIComponent(city)}`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) return [];
    
    const data: NPIResponse = await response.json();
    
    return (data.results || []).map((result: any) => {
      const practiceAddr = (result.addresses || []).find((a: any) => a.address_purpose === 'LOCATION') || result.addresses?.[0];
      
      let name = '';
      if (result.enumeration_type === 'NPI-2') {
        name = result.basic?.organization_name || '';
      } else {
        name = `${result.basic?.first_name || ''} ${result.basic?.last_name || ''}`.trim();
      }
      
      return {
        name,
        npi: result.number,
        address: practiceAddr ? `${practiceAddr.city}, ${practiceAddr.state}` : '',
        phone: practiceAddr?.telephone_number || '',
        fax: practiceAddr?.fax_number || '',
        taxonomy: result.taxonomies?.[0]?.desc || '',
        organizationName: result.basic?.organization_name
      };
    });
    
  } catch (error) {
    console.error('[NPI] Search error:', error);
    return [];
  }
}

/**
 * Enrich bill with NPI data if missing contact info
 */
export async function enrichBillWithNPI(bill: {
  provider_npi?: string;
  provider_name?: string;
  provider_phone?: string;
  provider_fax?: string;
  provider_address?: string;
}): Promise<{
  provider_phone?: string;
  provider_fax?: string;
  provider_address?: string;
} | null> {
  // Only enrich if we have NPI and missing contact info
  if (!bill.provider_npi) return null;
  if (bill.provider_fax && bill.provider_phone) return null; // Already have contact info
  
  const npiData = await lookupByNPI(bill.provider_npi);
  if (!npiData) return null;
  
  const updates: any = {};
  
  // Only fill in missing fields
  if (!bill.provider_phone && npiData.phone) {
    updates.provider_phone = npiData.phone;
  }
  if (!bill.provider_fax && npiData.fax) {
    updates.provider_fax = npiData.fax;
  }
  if (!bill.provider_address && npiData.address) {
    updates.provider_address = npiData.address;
  }
  
  return Object.keys(updates).length > 0 ? updates : null;
}

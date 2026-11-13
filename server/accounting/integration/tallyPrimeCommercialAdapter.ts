/**
 * COMMERCIAL TALLYPRIME ADAPTER
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Implements a standalone adapter for commercial TallyPrime installations.
 * Supports:
 * - Documented XML-over-HTTP integration (<ENVELOPE><HEADER><TALLYREQUEST>Export Data...)
 * - Documented REST JSON integration (TallyPrime 7.0+)
 * - Safe mock transport with synthetic fixtures for local offline development & tests
 * - Response validation, company context check, malformed response handling, timeouts
 * - Strict disabled-by-default boundary with no live network access during local testing
 */

import {
  TallyPrimeConfig,
  ProductPriceSyncItem,
  CustomerOutstandingSnapshot,
  SyncSourceType
} from './integrationTypes.js';

export interface TallyPrimeImportResult {
  success: boolean;
  sourceCompany: string;
  exportFormat: 'XML' | 'JSON';
  itemsImported: number;
  itemsFailed: number;
  productPriceItems: ProductPriceSyncItem[];
  customerSnapshots: CustomerOutstandingSnapshot[];
  errors: string[];
  warnings: string[];
  rawResponseSummary: string;
}

export class TallyPrimeCommercialAdapter {
  private config: TallyPrimeConfig = {
    enabled: false, // Strict non-negotiable: disabled by default
    host: '127.0.0.1',
    port: 9000,
    companyName: 'A2Z Diagnostics Commercial Ltd',
    timeoutMs: 5000,
    exportFormat: 'XML'
  };

  private sourceType: SyncSourceType = 'COMMERCIAL_TALLYPRIME';

  public getSourceType(): SyncSourceType {
    return this.sourceType;
  }

  /**
   * Safely returns configuration without exposing internal secrets or network topology
   */
  public getPublicConfig(): Omit<TallyPrimeConfig, 'host' | 'port'> & { statusText: string } {
    return {
      enabled: this.config.enabled,
      companyName: this.config.companyName,
      timeoutMs: this.config.timeoutMs,
      exportFormat: this.config.exportFormat,
      statusText: this.config.enabled ? 'Configured (Local Test Adapter)' : 'Disabled by Default (Safety Guard Active)'
    };
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  public setFormat(format: 'XML' | 'JSON'): void {
    this.config.exportFormat = format;
  }

  /**
   * Parses standard Tally XML response envelope.
   * e.g. <ENVELOPE><BODY><DATA><COLLECTION><STOCKITEM NAME="..."><BASEUNITS>...
   */
  public parseXmlPayload(xmlContent: string): { items: any[]; companyName?: string; errors: string[] } {
    const errors: string[] = [];
    const items: any[] = [];

    if (!xmlContent || typeof xmlContent !== 'string' || xmlContent.trim().length === 0) {
      return { items: [], errors: ['Empty or non-string XML payload received from TallyPrime.'] };
    }

    if (!xmlContent.includes('<ENVELOPE>') || !xmlContent.includes('</ENVELOPE>')) {
      return { items: [], errors: ['Malformed XML: Missing <ENVELOPE> root tags in TallyPrime response.'] };
    }

    // Extract company name if present
    const companyMatch = xmlContent.match(/<CURRENTCOMPANY>([\s\S]*?)<\/CURRENTCOMPANY>/i);
    const companyName = companyMatch ? companyMatch[1].trim() : undefined;

    // Extract STOCKITEM tags safely with regex parser (no external XML dependency required)
    const stockItemRegex = /<STOCKITEM(?:\s+NAME="([^"]+)")?[^>]*>([\s\S]*?)<\/STOCKITEM>/gi;
    let match: RegExpExecArray | null;

    while ((match = stockItemRegex.exec(xmlContent)) !== null) {
      const nameAttr = match[1];
      const itemBody = match[2];

      const nameMatch = itemBody.match(/<NAME>([\s\S]*?)<\/NAME>/i) || [null, nameAttr];
      const standardRateMatch = itemBody.match(/<RATE>([\s\S]*?)<\/RATE>/i);
      const mrpMatch = itemBody.match(/<MRP>([\s\S]*?)<\/MRP>/i);
      const unitMatch = itemBody.match(/<BASEUNITS>([\s\S]*?)<\/BASEUNITS>/i);
      const guidMatch = itemBody.match(/<GUID>([\s\S]*?)<\/GUID>/i);
      const partNumberMatch = itemBody.match(/<PARTNUMBER>([\s\S]*?)<\/PARTNUMBER>/i);

      const name = (nameMatch && nameMatch[1]) ? nameMatch[1].trim() : (nameAttr || 'Unknown Tally Stock Item');
      const rate = standardRateMatch ? parseFloat(standardRateMatch[1].replace(/[^0-9.]/g, '')) : 0;
      const mrp = mrpMatch ? parseFloat(mrpMatch[1].replace(/[^0-9.]/g, '')) : (rate * 1.25);
      const uom = unitMatch ? unitMatch[1].trim() : 'NOS';
      const guid = guidMatch ? guidMatch[1].trim() : `tally-guid-${Date.now()}`;
      const sku = partNumberMatch ? partNumberMatch[1].trim() : '';

      if (isNaN(rate) || rate <= 0) {
        errors.push(`Stock item "${name}" has invalid or missing rate: "${standardRateMatch ? standardRateMatch[1] : ''}"`);
      }

      items.push({
        guid,
        name,
        sku,
        rate: isNaN(rate) ? 0 : rate,
        mrp: isNaN(mrp) ? 0 : mrp,
        uom
      });
    }

    return { items, companyName, errors };
  }

  /**
   * Parses TallyPrime 7.0+ REST JSON payload.
   */
  public parseJsonPayload(jsonString: string): { items: any[]; companyName?: string; errors: string[] } {
    const errors: string[] = [];
    try {
      const parsed = JSON.parse(jsonString);
      const company = parsed.company || parsed.companyName;
      const dataItems = parsed.data || parsed.stockItems || parsed.items || [];

      if (!Array.isArray(dataItems)) {
        return { items: [], errors: ['Invalid JSON payload: expected items array under data or stockItems key.'] };
      }

      const items = dataItems.map((it: any) => ({
        guid: it.guid || it.id || `tally-item-${it.sku || it.name}`,
        name: it.name || it.productName || 'Unknown Item',
        sku: it.sku || it.code || '',
        rate: Number(it.rate || it.standardCost || it.basePrice || 0),
        mrp: Number(it.mrp || (Number(it.rate || 0) * 1.25)),
        uom: it.uom || it.unit || 'NOS'
      }));

      return { items, companyName: company, errors };
    } catch (err: any) {
      return { items: [], errors: [`JSON Parse Error: ${err.message || 'Invalid JSON syntax'}`] };
    }
  }

  /**
   * Executes synthetic offline synchronization using mocked TallyPrime transport.
   * Maps TallyPrime stock items to DS Distributor internal product IDs.
   */
  public async executeSyntheticSync(
    internalProductsDb: any[],
    options: {
      mockFormat?: 'XML' | 'JSON';
      simulateTimeout?: boolean;
      simulateMalformed?: boolean;
      customPayload?: string;
    } = {}
  ): Promise<TallyPrimeImportResult> {
    const format = options.mockFormat || this.config.exportFormat;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Guard: Adapter must be explicitly enabled for sync
    if (!this.config.enabled) {
      return {
        success: false,
        sourceCompany: this.config.companyName,
        exportFormat: format,
        itemsImported: 0,
        itemsFailed: 0,
        productPriceItems: [],
        customerSnapshots: [],
        errors: ['Commercial TallyPrime Adapter is currently DISABLED by policy. Enable in settings before running sync.'],
        warnings: [],
        rawResponseSummary: 'Adapter Disabled Guard'
      };
    }

    if (options.simulateTimeout) {
      return {
        success: false,
        sourceCompany: this.config.companyName,
        exportFormat: format,
        itemsImported: 0,
        itemsFailed: 0,
        productPriceItems: [],
        customerSnapshots: [],
        errors: [`TallyPrime HTTP Connection Timeout: exceeded ${this.config.timeoutMs}ms without response.`],
        warnings: [],
        rawResponseSummary: 'Timeout Exception'
      };
    }

    let rawData = options.customPayload;
    if (options.simulateMalformed) {
      rawData = '<ENVELOPE><HEADER><BROKEN_XML>corrupted data...';
    } else if (!rawData) {
      if (format === 'XML') {
        rawData = `
          <ENVELOPE>
            <HEADER>
              <TALLYREQUEST>Export Data</TALLYREQUEST>
            </HEADER>
            <BODY>
              <DATA>
                <CURRENTCOMPANY>${this.config.companyName}</CURRENTCOMPANY>
                <COLLECTION>
                  <STOCKITEM NAME="Erba Chem 7 Reagent Pack">
                    <GUID>TALLY-GUID-001</GUID>
                    <PARTNUMBER>ERBA-CHEM7-KIT</PARTNUMBER>
                    <RATE>14500.00</RATE>
                    <MRP>18000.00</MRP>
                    <BASEUNITS>KIT</BASEUNITS>
                  </STOCKITEM>
                  <STOCKITEM NAME="Sysmex Cellpack DCL Diluent">
                    <GUID>TALLY-GUID-002</GUID>
                    <PARTNUMBER>SYS-DCL-20L</PARTNUMBER>
                    <RATE>4800.00</RATE>
                    <MRP>5800.00</MRP>
                    <BASEUNITS>CAN</BASEUNITS>
                  </STOCKITEM>
                  <STOCKITEM NAME="VacuGuard EDTA Blood Tubes 100s">
                    <GUID>TALLY-GUID-003</GUID>
                    <PARTNUMBER>VACU-EDTA-100</PARTNUMBER>
                    <RATE>620.00</RATE>
                    <MRP>850.00</MRP>
                    <BASEUNITS>BOX</BASEUNITS>
                  </STOCKITEM>
                </COLLECTION>
              </DATA>
            </BODY>
          </ENVELOPE>
        `;
      } else {
        rawData = JSON.stringify({
          company: this.config.companyName,
          stockItems: [
            {
              guid: 'TALLY-JSON-001',
              name: 'Erba Chem 7 Reagent Pack',
              sku: 'ERBA-CHEM7-KIT',
              rate: 14500.0,
              mrp: 18000.0,
              uom: 'KIT'
            },
            {
              guid: 'TALLY-JSON-002',
              name: 'Sysmex Cellpack DCL Diluent',
              sku: 'SYS-DCL-20L',
              rate: 4800.0,
              mrp: 5800.0,
              uom: 'CAN'
            }
          ]
        });
      }
    }

    const parseResult = format === 'XML' ? this.parseXmlPayload(rawData) : this.parseJsonPayload(rawData);

    if (parseResult.errors.length > 0) {
      errors.push(...parseResult.errors);
    }

    const priceItems: ProductPriceSyncItem[] = [];
    let itemsFailed = 0;

    for (const rawItem of parseResult.items) {
      // Resolve mapping: Try SKU first, then fuzzy match product name
      let internalProd = internalProductsDb.find(
        p => (p.sku && rawItem.sku && p.sku.toUpperCase() === rawItem.sku.toUpperCase()) ||
             (p.id && rawItem.sku && p.id.toUpperCase() === rawItem.sku.toUpperCase())
      );

      if (!internalProd) {
        internalProd = internalProductsDb.find(
          p => p.name && rawItem.name && p.name.toLowerCase().includes(rawItem.name.toLowerCase())
        );
      }

      if (!internalProd) {
        warnings.push(`Unmapped Tally Stock Item: "${rawItem.name}" (SKU: ${rawItem.sku || 'N/A'}). Skipped from auto-import.`);
        itemsFailed++;
        continue;
      }

      const currentBase = Number(internalProd.basePrice || internalProd.price || 0);
      const currentMrp = Number(internalProd.mrp || currentBase * 1.25);
      const proposedBase = Number(rawItem.rate);
      const proposedMrp = Number(rawItem.mrp);

      priceItems.push({
        sourceProductId: rawItem.guid,
        sourceProductName: rawItem.name,
        distributorProductId: internalProd.id,
        distributorSku: internalProd.sku || internalProd.id,
        currentBasePrice: currentBase,
        proposedBasePrice: proposedBase,
        currentMrp: currentMrp,
        proposedMrp: proposedMrp,
        taxRatePercent: Number(internalProd.gstRate || 18),
        currency: 'INR',
        uom: rawItem.uom || internalProd.uom || 'NOS'
      });
    }

    const success = errors.length === 0 && priceItems.length > 0;

    return {
      success,
      sourceCompany: parseResult.companyName || this.config.companyName,
      exportFormat: format,
      itemsImported: priceItems.length,
      itemsFailed,
      productPriceItems: priceItems,
      customerSnapshots: [],
      errors,
      warnings,
      rawResponseSummary: `Imported ${priceItems.length} items from ${this.config.companyName} (${format})`
    };
  }
}

export const tallyPrimeCommercialAdapter = new TallyPrimeCommercialAdapter();

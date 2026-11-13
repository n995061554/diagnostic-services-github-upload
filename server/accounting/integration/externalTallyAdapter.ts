/**
 * EXTERNAL TALLY ERP INTEGRATION ADAPTER (Tally ERP 9 & TallyPrime)
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Implements an independent, robust adapter for external commercial Tally ERP.
 * Authoritative source of truth for:
 * - Inventory & Stock Quantities (Batch-wise & Expiry tracking)
 * - Product Catalogue & Prices (Standard Selling Rate, MRP, GST)
 * - Customer Accounting Ledgers & Authoritative Outstanding Balances
 * - Verified Receipt Synchronization
 *
 * Supports:
 * - Tally ERP 9 (XML-over-HTTP integration via standard Tally port, default 9000)
 * - TallyPrime (Documented XML Export/Import Envelopes)
 * - TallyPrime 7.0+ (Documented REST JSON endpoints)
 * - Local offline mock mode with comprehensive medical diagnostic fixtures
 * - Strict non-exposure: does NOT expose Tally directly to public internet
 * - Reversible, non-destructive, transaction-safe parsing
 */

import http from 'http';
import {
  ExternalTallyConfig,
  TallyConnectionStatus,
  InventoryBatchSyncItem,
  ProductPriceSyncItem,
  CustomerLedgerSyncItem,
  CustomerLedgerTransaction,
  TallyDiscrepancyItem,
  TallyVoucherSyncItem,
  SyncSourceType
} from './integrationTypes.js';
import { officeTallyBridgeManager } from './officeTallyBridgeManager.js';

export interface ExternalTallySyncResult<T> {
  success: boolean;
  sourceCompany: string;
  sourceType: SyncSourceType;
  exportFormat: 'XML' | 'JSON';
  itemsImported: number;
  itemsFailed: number;
  data: T[];
  errors: string[];
  warnings: string[];
  rawResponseSummary: string;
  syncTimestamp: string;
}

export class ExternalTallyAdapter {
  private config: ExternalTallyConfig = {
    enabled: false, // Default to disabled by policy until explicitly configured and authorized
    environment: 'MOCK_LOCAL', // Default to safe local mock; toggleable to EXTERNAL_TALLY_HTTP
    tallyVersion: 'TALLY_PRIME',
    host: '127.0.0.1',
    port: 9000,
    companyName: 'A2Z Diagnostic Services India Pvt Ltd',
    authUsername: '',
    authPassword: '',
    exportFormat: 'XML',
    timeoutMs: 4000,
    autoSyncIntervalMinutes: 60,
    lastSuccessfulSync: null,
    nextScheduledSync: null
  };

  private sourceType: SyncSourceType = 'COMMERCIAL_TALLYPRIME';

  // In-memory cache of last synchronized data
  private cachedInventoryBatches: InventoryBatchSyncItem[] = [];
  private cachedCustomerLedgers: CustomerLedgerSyncItem[] = [];
  private cachedDiscrepancies: TallyDiscrepancyItem[] = [];
  private cachedReceiptVouchers: TallyVoucherSyncItem[] = [];

  constructor() {
    this.initMockBaselineData();
  }

  public getConfig(): ExternalTallyConfig {
    return { ...this.config };
  }

  public getPublicConfig(): Omit<ExternalTallyConfig, 'authPassword'> & { statusText: string } {
    return {
      enabled: this.config.enabled,
      environment: this.config.environment,
      tallyVersion: this.config.tallyVersion,
      host: this.config.host,
      port: this.config.port,
      companyName: this.config.companyName,
      authUsername: this.config.authUsername,
      exportFormat: this.config.exportFormat,
      timeoutMs: this.config.timeoutMs,
      autoSyncIntervalMinutes: this.config.autoSyncIntervalMinutes,
      lastSuccessfulSync: this.config.lastSuccessfulSync,
      nextScheduledSync: this.config.nextScheduledSync,
      statusText: !this.config.enabled
        ? 'Disabled by Policy - Awaiting Authorization'
        : this.config.environment === 'MOCK_LOCAL'
        ? 'Connected (Safe Local Mock Fixtures)'
        : this.config.environment === 'OFFICE_TALLY_BRIDGE'
        ? 'Connected via Office Tally Bridge (Outbound HTTPS Tunnel from Office PC)'
        : `Connected to http://${this.config.host}:${this.config.port} (${this.config.tallyVersion})`
    };
  }

  /**
   * Validates host and port to prevent Server-Side Request Forgery (SSRF) and arbitrary LAN scanning.
   */
  public validateHostAndPort(host: string, port: number): { isValid: boolean; error?: string } {
    if (!host || typeof host !== 'string' || host.trim().length === 0) {
      return { isValid: false, error: 'Host address is required.' };
    }
    const cleanHost = host.trim().toLowerCase();

    // 1. Strictly block cloud instance metadata and link-local addresses
    if (
      cleanHost.startsWith('169.254.') ||
      cleanHost.includes('metadata.google.internal') ||
      cleanHost.includes('169.254.169.254') ||
      cleanHost.includes('instance-data') ||
      cleanHost === '0.0.0.0' ||
      cleanHost === '255.255.255.255'
    ) {
      return { isValid: false, error: `Host "${host}" is strictly forbidden: Link-local and cloud metadata addresses are blocked to prevent SSRF.` };
    }

    // 2. Validate valid IPv4 address or local intranet hostname
    const isLoopback = cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost === '::1';
    const isPrivateLanIp =
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleanHost) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(cleanHost) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(cleanHost);
    const isLocalHostname = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*\.(local|internal|lan)$/.test(cleanHost) || cleanHost === 'tally-server';

    if (!isLoopback && !isPrivateLanIp && !isLocalHostname) {
      return {
        isValid: false,
        error: `Host "${host}" is not an authorized loopback or private LAN address. External public WAN IP requests are blocked.`
      };
    }

    // 3. Port validation
    const numPort = Number(port);
    if (isNaN(numPort) || !Number.isInteger(numPort) || numPort < 1 || numPort > 65535) {
      return { isValid: false, error: `Invalid port ${port}. Must be an integer between 1 and 65535.` };
    }

    // Block sensitive internal infrastructure ports to prevent internal port scanning
    const blockedPorts = [21, 22, 23, 25, 53, 80, 443, 3000, 5432, 6379, 27017, 8080];
    if (blockedPorts.includes(numPort) && numPort !== 9000) {
      return {
        isValid: false,
        error: `Port ${port} is a reserved system or database infrastructure service and cannot be used for Tally ERP communication.`
      };
    }

    return { isValid: true };
  }

  public updateConfig(partial: Partial<ExternalTallyConfig>): ExternalTallyConfig {
    if (partial.host !== undefined || partial.port !== undefined) {
      const hostToCheck = partial.host !== undefined ? partial.host : this.config.host;
      const portToCheck = partial.port !== undefined ? partial.port : this.config.port;
      const val = this.validateHostAndPort(hostToCheck, portToCheck);
      if (!val.isValid) {
        throw new Error(`SSRF Security Violation: ${val.error}`);
      }
    }

    this.config = {
      ...this.config,
      ...partial
    };
    if (this.config.tallyVersion === 'TALLY_ERP_9') {
      this.sourceType = 'EXTERNAL_TALLY_ERP9';
      this.config.exportFormat = 'XML';
    } else {
      this.sourceType = 'COMMERCIAL_TALLYPRIME';
    }
    return this.getConfig();
  }

  /**
   * Circular-Sync Loop Breaker:
   * Inspects inbound voucher data from Tally to identify if it was originated by DS Distributor.
   * Multi-factor verification:
   * 1. UDF tag: <UDF:ORIGINSYSTEM>DS_DISTRIBUTOR</UDF:ORIGINSYSTEM>
   * 2. Transaction reference matching internal payment IDs (pay-gw-*, pay-bt-*, RCP-*)
   * 3. Voucher number matching internal receipt sequence
   * 4. Structured narration watermark: [ORIGIN:DS_DISTRIBUTOR|REF:xxx]
   * Does NOT depend solely on unstructured narration text.
   */
  public isDistributorOriginatedReceipt(voucher: {
    voucherNumber: string;
    reference?: string;
    narration?: string;
    originSystem?: string;
    guid?: string;
  }): { isInternalOrigin: boolean; matchedFactor: string; internalReference?: string } {
    // Factor 1: Explicit origin system UDF tag
    if (voucher.originSystem && voucher.originSystem.toUpperCase() === 'DS_DISTRIBUTOR') {
      return {
        isInternalOrigin: true,
        matchedFactor: 'ORIGIN_SYSTEM_TAG',
        internalReference: voucher.reference || voucher.voucherNumber
      };
    }

    // Factor 2: Reference number matches internal DS Distributor payment format
    if (voucher.reference) {
      const ref = voucher.reference.trim();
      if (/^pay-(gw|bt)-/i.test(ref) || /^rcpt-(pay-)?/i.test(ref) || /^RCP-202\d-/i.test(ref)) {
        return {
          isInternalOrigin: true,
          matchedFactor: 'INTERNAL_PAYMENT_REFERENCE',
          internalReference: ref
        };
      }
    }

    // Factor 3: Voucher number matches internal receipt naming scheme
    if (voucher.voucherNumber && /^RCP-202\d-\d+/i.test(voucher.voucherNumber.trim())) {
      return {
        isInternalOrigin: true,
        matchedFactor: 'INTERNAL_VOUCHER_NUMBER',
        internalReference: voucher.voucherNumber.trim()
      };
    }

    // Factor 4: Structured regex marker in narration [ORIGIN:DS_DISTRIBUTOR|REF:xxx]
    if (voucher.narration) {
      const match = voucher.narration.match(/\[ORIGIN:DS_DISTRIBUTOR\|REF:([^\]]+)\]/i);
      if (match && match[1]) {
        return {
          isInternalOrigin: true,
          matchedFactor: 'NARRATION_WATERMARK_MARKER',
          internalReference: match[1].trim()
        };
      }
    }

    // Safely handles missing, empty, or malformed origin markers
    return { isInternalOrigin: false, matchedFactor: 'EXTERNAL_ORIGIN' };
  }

  // ===========================================================================
  // 1. CONNECTIVITY & COMPANY IDENTIFICATION
  // ===========================================================================
  public async testConnection(): Promise<TallyConnectionStatus> {
    const start = Date.now();
    const nowIso = new Date().toISOString();

    if (!this.config.enabled) {
      return {
        connected: false,
        environment: this.config.environment,
        tallyVersion: 'Offline / Disconnected',
        companyName: this.config.companyName,
        host: this.config.host,
        port: this.config.port,
        exportFormat: this.config.exportFormat,
        lastPingTimestamp: nowIso,
        latencyMs: 0,
        statusMessage: 'External Tally Integration is disabled in configuration.',
        versionCompatible: false
      };
    }

    if (this.config.environment === 'MOCK_LOCAL') {
      const latency = Math.floor(Math.random() * 25) + 12; // 12-37ms simulated local bridge
      const versionLabel = this.config.tallyVersion === 'TALLY_ERP_9' 
        ? 'Tally ERP 9' 
        : this.config.exportFormat === 'JSON' 
        ? 'TallyPrime 7.0+ (REST JSON)' 
        : 'TallyPrime 4.x';

      return {
        connected: true,
        environment: 'MOCK_LOCAL',
        tallyVersion: versionLabel,
        companyName: this.config.companyName,
        host: this.config.host,
        port: this.config.port,
        exportFormat: this.config.exportFormat,
        lastPingTimestamp: nowIso,
        latencyMs: latency,
        statusMessage: `Successfully connected to External Tally (${versionLabel}) - Company: "${this.config.companyName}"`,
        versionCompatible: true
      };
    }

    // OFFICE TALLY BRIDGE MODE (Render Outbound HTTPS Tunnel)
    if (this.config.environment === 'OFFICE_TALLY_BRIDGE') {
      const activeDev = officeTallyBridgeManager.getActiveDevice();
      if (!activeDev) {
        return {
          connected: false,
          environment: 'OFFICE_TALLY_BRIDGE',
          tallyVersion: 'Offline / Disconnected',
          companyName: this.config.companyName,
          host: '127.0.0.1',
          port: 9000,
          exportFormat: this.config.exportFormat,
          lastPingTimestamp: nowIso,
          latencyMs: 0,
          statusMessage: 'No Windows Tally Bridge device is currently paired or online. Please generate a pairing key in Back Office.',
          versionCompatible: false,
          bridgeDevice: {
            deviceId: 'none',
            deviceName: 'Not Paired',
            lastSeenAt: nowIso,
            status: 'NOT_PAIRED'
          }
        };
      }

      try {
        const result = await officeTallyBridgeManager.dispatchCommand(
          'TEST_CONNECTION',
          this.config.companyName,
          {},
          this.config.timeoutMs || 7000
        );
        const latency = Date.now() - start;

        return {
          connected: result.success && result.companyMatched,
          environment: 'OFFICE_TALLY_BRIDGE',
          tallyVersion: (result.data?.tallyVersion || 'Tally ERP 9') as any,
          companyName: this.config.companyName,
          host: activeDev.tallyHost || '127.0.0.1',
          port: activeDev.tallyPort || 9000,
          exportFormat: this.config.exportFormat,
          lastPingTimestamp: nowIso,
          latencyMs: latency,
          statusMessage: result.companyMatched
            ? `Successfully connected to Office Tally ERP 9 via Windows Bridge ("${activeDev.deviceName}") - Active Company: "${result.activeTallyCompany || this.config.companyName}"`
            : `Bridge connected, but active Tally company "${result.activeTallyCompany || 'Unknown'}" does not match configured company "${this.config.companyName}".`,
          versionCompatible: true,
          bridgeDevice: {
            deviceId: activeDev.deviceId,
            deviceName: activeDev.deviceName,
            lastSeenAt: activeDev.lastSeenAt,
            status: 'ONLINE'
          }
        };
      } catch (err: any) {
        return {
          connected: false,
          environment: 'OFFICE_TALLY_BRIDGE',
          tallyVersion: 'Offline / Disconnected',
          companyName: this.config.companyName,
          host: activeDev.tallyHost || '127.0.0.1',
          port: activeDev.tallyPort || 9000,
          exportFormat: this.config.exportFormat,
          lastPingTimestamp: nowIso,
          latencyMs: Date.now() - start,
          statusMessage: `Office Tally Bridge Connection Failed: ${err.message}. Verify that the bridge service and Tally ERP 9 are running on the office computer.`,
          versionCompatible: false,
          bridgeDevice: {
            deviceId: activeDev.deviceId,
            deviceName: activeDev.deviceName,
            lastSeenAt: activeDev.lastSeenAt,
            status: 'OFFLINE'
          }
        };
      }
    }

    // LIVE HTTP Mode
    try {
      const testXml = `
        <ENVELOPE>
          <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
          </HEADER>
          <BODY>
            <EXPORTDATA>
              <REQUESTDESC>
                <REPORTNAME>List of Companies</REPORTNAME>
                <STATICVARIABLES>
                  <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                </STATICVARIABLES>
              </REQUESTDESC>
            </EXPORTDATA>
          </BODY>
        </ENVELOPE>
      `;

      const responseText = await this.sendHttpRequest(testXml);
      const latency = Date.now() - start;

      const hasCompany = responseText.includes(this.config.companyName) || responseText.includes('<COMPANY>');

      return {
        connected: true,
        environment: 'EXTERNAL_TALLY_HTTP',
        tallyVersion: this.config.tallyVersion === 'TALLY_ERP_9' ? 'Tally ERP 9' : 'TallyPrime 4.x',
        companyName: this.config.companyName,
        host: this.config.host,
        port: this.config.port,
        exportFormat: this.config.exportFormat,
        lastPingTimestamp: nowIso,
        latencyMs: latency,
        statusMessage: hasCompany
          ? `Verified active company "${this.config.companyName}" on Tally HTTP bridge.`
          : `Connected to Tally host, but active company "${this.config.companyName}" could not be confirmed.`,
        versionCompatible: true
      };
    } catch (err: any) {
      return {
        connected: false,
        environment: 'EXTERNAL_TALLY_HTTP',
        tallyVersion: 'Offline / Disconnected',
        companyName: this.config.companyName,
        host: this.config.host,
        port: this.config.port,
        exportFormat: this.config.exportFormat,
        lastPingTimestamp: nowIso,
        latencyMs: Date.now() - start,
        statusMessage: `Tally Connection Failed: ${err.message || 'Network unreachable'}. Verify Tally ODBC/HTTP server is running on port ${this.config.port}.`,
        versionCompatible: false
      };
    }
  }

  // ===========================================================================
  // 2. INVENTORY, BATCH & EXPIRY SYNCHRONIZATION
  // ===========================================================================
  public async fetchInventoryBatches(internalProductsDb: any[] = []): Promise<ExternalTallySyncResult<InventoryBatchSyncItem>> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const now = Date.now();
    const nowIso = new Date().toISOString();

    if (!this.config.enabled) {
      return {
        success: false,
        sourceCompany: this.config.companyName,
        sourceType: this.sourceType,
        exportFormat: this.config.exportFormat,
        itemsImported: 0,
        itemsFailed: 0,
        data: [],
        errors: ['Tally Integration adapter is disabled in settings.'],
        warnings: [],
        rawResponseSummary: 'Adapter Disabled',
        syncTimestamp: nowIso
      };
    }

    let rawBatches: any[] = [];

    if (this.config.environment === 'MOCK_LOCAL') {
      rawBatches = this.getMockTallyInventoryBatches();
    } else if (this.config.environment === 'OFFICE_TALLY_BRIDGE') {
      const activeDev = officeTallyBridgeManager.getActiveDevice();
      if (!activeDev) {
        return {
          success: false,
          sourceCompany: this.config.companyName,
          sourceType: this.sourceType,
          exportFormat: this.config.exportFormat,
          itemsImported: 0,
          itemsFailed: 1,
          data: [],
          errors: ['No Windows Office Tally Bridge device is currently paired or online.'],
          warnings: [],
          rawResponseSummary: 'Bridge Offline',
          syncTimestamp: nowIso
        };
      }
      try {
        const bridgeRes = await officeTallyBridgeManager.dispatchCommand(
          'GET_STOCK_SUMMARY',
          this.config.companyName,
          {},
          this.config.timeoutMs || 10000
        );

        if (!bridgeRes.companyMatched) {
          return {
            success: false,
            sourceCompany: this.config.companyName,
            sourceType: this.sourceType,
            exportFormat: this.config.exportFormat,
            itemsImported: 0,
            itemsFailed: 1,
            data: [],
            errors: [`Office Tally Bridge company mismatch: Active Tally company is "${bridgeRes.activeTallyCompany || 'Unknown'}", expected "${this.config.companyName}". Inventory sync blocked for safety.`],
            warnings: [],
            rawResponseSummary: 'Company Mismatch',
            syncTimestamp: nowIso
          };
        }

        const rawXml = typeof bridgeRes.data === 'string' ? bridgeRes.data : (bridgeRes.data?.rawXml || '');
        rawBatches = this.parseTallyStockBatchesXml(rawXml);
      } catch (err: any) {
        errors.push(`Office Tally Bridge stock dispatch failed: ${err.message}`);
        return {
          success: false,
          sourceCompany: this.config.companyName,
          sourceType: this.sourceType,
          exportFormat: this.config.exportFormat,
          itemsImported: 0,
          itemsFailed: 1,
          data: [],
          errors,
          warnings: [],
          rawResponseSummary: `Office Tally Bridge Stock Fetch Failed: ${err.message}`,
          syncTimestamp: nowIso
        };
      }
    } else {
      try {
        const xmlReq = `
          <ENVELOPE>
            <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
            <BODY>
              <EXPORTDATA>
                <REQUESTDESC>
                  <REPORTNAME>Stock Summary</REPORTNAME>
                  <STATICVARIABLES>
                    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                    <SVCURRENTCOMPANY>${this.config.companyName}</SVCURRENTCOMPANY>
                  </STATICVARIABLES>
                </REQUESTDESC>
              </EXPORTDATA>
            </BODY>
          </ENVELOPE>
        `;
        const responseText = await this.sendHttpRequest(xmlReq);
        rawBatches = this.parseTallyStockBatchesXml(responseText);
      } catch (err: any) {
        errors.push(`Failed to fetch inventory from Live Tally HTTP (${this.config.host}:${this.config.port}): ${err.message}`);
        return {
          success: false,
          sourceCompany: this.config.companyName,
          sourceType: this.sourceType,
          exportFormat: this.config.exportFormat,
          itemsImported: 0,
          itemsFailed: 1,
          data: [],
          errors,
          warnings: [],
          rawResponseSummary: `Live Tally Inventory Fetch Failed: ${err.message}`,
          syncTimestamp: nowIso
        };
      }
    }

    const processedBatches: InventoryBatchSyncItem[] = [];
    let itemsFailed = 0;

    for (const b of rawBatches) {
      // Find internal product matching SKU or name
      const internalProd = internalProductsDb.find(
        p => (p.sku && b.sku && p.sku.toUpperCase() === b.sku.toUpperCase()) ||
             (p.id && b.distributorProductId && p.id === b.distributorProductId) ||
             (p.name && b.productName && p.name.toLowerCase().includes(b.productName.toLowerCase()))
      );

      const expDate = b.expiryDate ? new Date(b.expiryDate) : null;
      let daysRemaining = 999;
      let isExpired = false;
      let urgencyLevel: 'CRITICAL' | 'WARNING' | 'SAFE' | 'EXPIRED' = 'SAFE';

      if (expDate && !isNaN(expDate.getTime())) {
        daysRemaining = Math.ceil((expDate.getTime() - now) / 86400000);
        if (daysRemaining <= 0) {
          isExpired = true;
          urgencyLevel = 'EXPIRED';
        } else if (daysRemaining <= 30) {
          urgencyLevel = 'CRITICAL';
        } else if (daysRemaining <= 60) {
          urgencyLevel = 'WARNING';
        } else {
          urgencyLevel = 'SAFE';
        }
      } else {
        warnings.push(`Batch ${b.batchNumber} for product "${b.productName}" has missing or unparseable expiry date in Tally.`);
      }

      // Stock status calculation
      let stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED' | 'QUARANTINED' = 'AVAILABLE';
      if (isExpired) {
        stockStatus = 'EXPIRED'; // Quarantined from sale!
      } else if (b.availableQuantity <= 0) {
        stockStatus = 'OUT_OF_STOCK';
      } else if (b.availableQuantity <= 15) {
        stockStatus = 'LOW_STOCK';
      }

      const item: InventoryBatchSyncItem = {
        guid: b.guid || `tally-batch-${b.batchNumber}`,
        distributorProductId: internalProd ? internalProd.id : (b.distributorProductId || 'prod-unmapped'),
        productName: internalProd ? internalProd.name : b.productName,
        sku: internalProd ? (internalProd.sku || internalProd.id) : b.sku,
        category: b.category || (internalProd ? internalProd.category : 'Diagnostic Reagents'),
        brand: b.brand || (internalProd ? internalProd.companyName : 'Diagnostic OEM'),
        hsnCode: b.hsnCode || (internalProd ? internalProd.hsnCode : '38220090'),
        uom: b.uom || (internalProd ? internalProd.uom : 'KIT'),
        batchNumber: b.batchNumber,
        manufacturingDate: b.manufacturingDate || '2025-10-01',
        expiryDate: b.expiryDate,
        daysRemaining,
        urgencyLevel,
        isExpired,
        purchasePrice: Number(b.purchasePrice || 0),
        sellingPrice: Number(b.sellingPrice || (internalProd ? internalProd.basePrice : 0)),
        mrp: Number(b.mrp || (internalProd ? internalProd.mrp : b.sellingPrice * 1.25)),
        gstRate: Number(b.gstRate || (internalProd ? internalProd.gstRate : 18)),
        availableQuantity: Number(b.availableQuantity || 0),
        reservedQuantity: Number(b.reservedQuantity || 0),
        godown: b.godown || 'Central Cold-Chain Warehouse (Mumbai)',
        stockStatus,
        isActive: b.isActive !== false && !isExpired
      };

      processedBatches.push(item);
    }

    this.cachedInventoryBatches = processedBatches;
    this.config.lastSuccessfulSync = nowIso;

    return {
      success: errors.length === 0,
      sourceCompany: this.config.companyName,
      sourceType: this.sourceType,
      exportFormat: this.config.exportFormat,
      itemsImported: processedBatches.length,
      itemsFailed,
      data: processedBatches,
      errors,
      warnings,
      rawResponseSummary: `Imported ${processedBatches.length} individual batches across ${new Set(processedBatches.map(b => b.productName)).size} products.`,
      syncTimestamp: nowIso
    };
  }

  // ===========================================================================
  // 3. PRODUCT CATALOGUE & PRICE SYNCHRONIZATION
  // ===========================================================================
  public async fetchProductPrices(internalProductsDb: any[] = []): Promise<ExternalTallySyncResult<ProductPriceSyncItem>> {
    const invRes = await this.fetchInventoryBatches(internalProductsDb);
    const priceItems: ProductPriceSyncItem[] = [];
    const seenProductIds = new Set<string>();

    for (const b of invRes.data) {
      if (seenProductIds.has(b.distributorProductId)) continue;
      seenProductIds.add(b.distributorProductId);

      const internalProd = internalProductsDb.find(p => p.id === b.distributorProductId);
      const currentBase = internalProd ? Number(internalProd.basePrice || internalProd.price || 0) : b.sellingPrice;
      const currentMrp = internalProd ? Number(internalProd.mrp || currentBase * 1.25) : b.mrp;

      priceItems.push({
        sourceProductId: b.guid,
        sourceProductName: b.productName,
        distributorProductId: b.distributorProductId,
        distributorSku: b.sku,
        currentBasePrice: currentBase,
        proposedBasePrice: b.sellingPrice,
        currentMrp,
        proposedMrp: b.mrp,
        taxRatePercent: b.gstRate,
        currency: 'INR',
        uom: b.uom
      });
    }

    return {
      success: invRes.success,
      sourceCompany: this.config.companyName,
      sourceType: this.sourceType,
      exportFormat: this.config.exportFormat,
      itemsImported: priceItems.length,
      itemsFailed: 0,
      data: priceItems,
      errors: invRes.errors,
      warnings: invRes.warnings,
      rawResponseSummary: `Synchronized ${priceItems.length} product prices from Tally ERP.`,
      syncTimestamp: invRes.syncTimestamp
    };
  }

  // ===========================================================================
  // 4. CUSTOMER LEDGER & AUTHORITATIVE OUTSTANDING BALANCE SYNC
  // ===========================================================================
  public generateCustomerLedgerXmlRequest(): string {
    return `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Accounts</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVCURRENTCOMPANY>${this.config.companyName}</SVCURRENTCOMPANY>
          <ACCOUNTTYPE>Ledgers</ACCOUNTTYPE>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>
`.trim();
  }

  public decodeXmlEntities(str: string): string {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  /**
   * Parses Tally's balance representation for Sundry Debtors.
   * Handles:
   * - Positive/negative numeric signs
   * - 'Dr' (Debit = receivable = positive outstanding balance)
   * - 'Cr' (Credit = customer advance/overpayment = negative balance)
   * - <ISDEEMEDPOSITIVE> flag conventions in Tally XML
   */
  public parseTallyDebtorBalance(balanceStr: string | undefined | null, isDeemedPositive?: string): number {
    if (!balanceStr || typeof balanceStr !== 'string') return 0;
    const raw = balanceStr.trim();
    if (raw.length === 0) return 0;

    const isDr = /\bdr\b/i.test(raw) || /dr$/i.test(raw);
    const isCr = /\bcr\b/i.test(raw) || /cr$/i.test(raw);
    const cleanNum = parseFloat(raw.replace(/[^\d.-]/g, ''));
    if (isNaN(cleanNum)) return 0;

    if (isDr) return Math.abs(cleanNum);
    if (isCr) return -Math.abs(cleanNum);

    if (isDeemedPositive !== undefined) {
      if (isDeemedPositive.toLowerCase() === 'no' && cleanNum !== 0) {
        return -Math.abs(cleanNum);
      }
      if (isDeemedPositive.toLowerCase() === 'yes') {
        return Math.abs(cleanNum);
      }
    }

    return Math.abs(cleanNum);
  }

  /**
   * Genuine Tally XML Parser for Customer Ledgers (Sundry Debtors).
   * Parses:
   * - <LEDGER NAME="..."> tags and <NAME.LIST>
   * - Group parent filtering (only Sundry Debtors / Trade Receivables)
   * - Stable identifiers: GUID, Party GSTIN, Ledger Code, Mailing Name
   * - Opening Balance, Closing Balance, Credit Limits, and Credit Periods
   * - Multi-ledger duplicate detection and reconciliation discrepancy tracking
   */
  public parseTallyCustomerLedgersXml(
    xml: string,
    internalCustomerBalances: Map<string, number> = new Map(),
    internalCustomersDb: any[] = []
  ): {
    ledgers: CustomerLedgerSyncItem[];
    discrepancies: TallyDiscrepancyItem[];
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const ledgers: CustomerLedgerSyncItem[] = [];
    const discrepancies: TallyDiscrepancyItem[] = [];
    const nowIso = new Date().toISOString();

    if (!xml || typeof xml !== 'string' || xml.trim().length === 0) {
      errors.push('Empty or invalid XML payload received from Tally.');
      return { ledgers, discrepancies, errors, warnings };
    }

    // Check for malformed envelope or Tally error messages
    if (!xml.includes('<ENVELOPE>') && !xml.includes('<LEDGER')) {
      errors.push('Malformed XML response: Missing <ENVELOPE> root or <LEDGER> data tags.');
      return { ledgers, discrepancies, errors, warnings };
    }

    const lineErrorMatch = xml.match(/<LINEERROR>([\s\S]*?)<\/LINEERROR>/i);
    if (lineErrorMatch) {
      errors.push(`Tally reported error: ${lineErrorMatch[1].trim()}`);
      return { ledgers, discrepancies, errors, warnings };
    }

    // Default known mappings for diagnostic customer baseline
    const defaultCustomerMappings: Record<string, { id: string; name: string; gstin: string }> = {
      'apex': { id: 'u-cust-01', name: 'Apex Clinical & Pathology Laboratories', gstin: '27AABCM8921N1ZM' },
      'metropolis': { id: 'u-cust-02', name: 'Metropolis Healthcare Reference Lab', gstin: '27AABCM2291K1ZP' },
      'apollo': { id: 'u-cust-03', name: 'Apollo Diagnostics Centre (Kolkata)', gstin: '19AABCA4321Q1ZM' }
    };

    const seenGuids = new Set<string>();
    const seenNames = new Set<string>();
    const seenCustomerIds = new Set<string>();

    const ledgerRegex = /<LEDGER(?:\s+NAME="([^"]*)")?[^>]*>([\s\S]*?)<\/LEDGER>/gi;
    let match: RegExpExecArray | null;

    while ((match = ledgerRegex.exec(xml)) !== null) {
      const attrName = match[1] || '';
      const body = match[2];

      // Extract Ledger Name
      let ledgerName = attrName;
      if (!ledgerName) {
        const nameListMatch = body.match(/<NAME\.LIST>[\s\S]*?<NAME>([\s\S]*?)<\/NAME>/i);
        const singleNameMatch = body.match(/<NAME>([\s\S]*?)<\/NAME>/i);
        ledgerName = nameListMatch ? nameListMatch[1].trim() : (singleNameMatch ? singleNameMatch[1].trim() : 'Unnamed Ledger');
      }
      ledgerName = this.decodeXmlEntities(ledgerName).trim();

      // Extract Parent Group
      const parentMatch = body.match(/<PARENT>([\s\S]*?)<\/PARENT>/i);
      const parent = parentMatch ? this.decodeXmlEntities(parentMatch[1]).trim() : '';

      // Filter: Only process Sundry Debtors (customer accounts)
      const isDebtor =
        parent.toLowerCase().includes('debtor') ||
        parent.toLowerCase().includes('receivable') ||
        parent.toLowerCase().includes('customer') ||
        ledgerName.toLowerCase().startsWith('sundry debtor') ||
        ledgerName.toLowerCase().includes('debtor');

      if (!isDebtor) {
        continue;
      }

      // Extract GUID / ID
      const guidMatch = body.match(/<GUID>([\s\S]*?)<\/GUID>/i);
      const guid = guidMatch ? guidMatch[1].trim() : `led-tally-${ledgerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

      // Duplicate Ledger Check in same XML payload
      const normalizedNameKey = ledgerName.toLowerCase();
      if (seenGuids.has(guid) || seenNames.has(normalizedNameKey)) {
        warnings.push(`Duplicate ledger definition detected in Tally XML for "${ledgerName}" (GUID: ${guid}). Skipped duplicate entry.`);
        continue;
      }
      seenGuids.add(guid);
      seenNames.add(normalizedNameKey);

      // Extract GSTIN
      const partyGstinMatch = body.match(/<PARTYGSTIN>([\s\S]*?)<\/PARTYGSTIN>/i);
      const gstinMatch = body.match(/<GSTIN>([\s\S]*?)<\/GSTIN>/i);
      const gstin = partyGstinMatch ? partyGstinMatch[1].trim() : (gstinMatch ? gstinMatch[1].trim() : undefined);

      // Extract Ledger Code / Mailing Name
      const codeMatch = body.match(/<LEDGERCODE>([\s\S]*?)<\/LEDGERCODE>/i);
      const mailMatch = body.match(/<MAILINGNAME>([\s\S]*?)<\/MAILINGNAME>/i);
      const ledgerCode = codeMatch ? codeMatch[1].trim() : '';
      const mailingName = mailMatch ? this.decodeXmlEntities(mailMatch[1]).trim() : '';

      // Extract Balances & Deemed Positive
      const isDeemedPosMatch = body.match(/<ISDEEMEDPOSITIVE>([\s\S]*?)<\/ISDEEMEDPOSITIVE>/i);
      const isDeemedPositive = isDeemedPosMatch ? isDeemedPosMatch[1].trim() : undefined;

      const opBalMatch = body.match(/<OPENINGBALANCE>([\s\S]*?)<\/OPENINGBALANCE>/i);
      const clBalMatch = body.match(/<CLOSINGBALANCE>([\s\S]*?)<\/CLOSINGBALANCE>/i);

      const openingBalance = opBalMatch ? this.parseTallyDebtorBalance(opBalMatch[1], isDeemedPositive) : 0;
      const tallyOutstanding = clBalMatch ? this.parseTallyDebtorBalance(clBalMatch[1], isDeemedPositive) : openingBalance;

      // Extract Credit Limit & Period
      const credLimitMatch = body.match(/<CREDITLIMIT>([\s\S]*?)<\/CREDITLIMIT>/i);
      const creditLimit = credLimitMatch ? parseFloat(credLimitMatch[1].replace(/[^\d.-]/g, '')) || 0 : 500000;

      const credPeriodMatch = body.match(/<BILLCREDITPERIOD>([\s\S]*?)<\/BILLCREDITPERIOD>/i);
      const creditPeriodDays = credPeriodMatch ? parseInt(credPeriodMatch[1].replace(/[^\d]/g, ''), 10) || 30 : 30;

      // Stable Identifier Matching
      let matchedCustId: string | null = null;
      let matchedCustName: string = mailingName || ledgerName.replace(/^Sundry Debtors\s*-\s*/i, '').trim();

      // Rule A: Match by explicit ledgerCode
      if (ledgerCode) {
        const found = internalCustomersDb.find(c => c.id === ledgerCode || c.labId === ledgerCode);
        if (found) {
          matchedCustId = found.id;
          matchedCustName = found.companyName || found.name || matchedCustName;
        } else if (Object.values(defaultCustomerMappings).some(m => m.id === ledgerCode)) {
          matchedCustId = ledgerCode;
          matchedCustName = Object.values(defaultCustomerMappings).find(m => m.id === ledgerCode)!.name;
        }
      }

      // Rule B: Match by GSTIN
      if (!matchedCustId && gstin) {
        const found = internalCustomersDb.find(c => c.gstin && c.gstin.toUpperCase() === gstin.toUpperCase());
        if (found) {
          matchedCustId = found.id;
          matchedCustName = found.companyName || found.name || matchedCustName;
        } else {
          const defaultMatch = Object.values(defaultCustomerMappings).find(m => m.gstin.toUpperCase() === gstin.toUpperCase());
          if (defaultMatch) {
            matchedCustId = defaultMatch.id;
            matchedCustName = defaultMatch.name;
          }
        }
      }

      // Rule C: Match by normalized name
      if (!matchedCustId) {
        const cleanName = ledgerName.replace(/^Sundry Debtors\s*-\s*/i, '').trim().toLowerCase();
        const found = internalCustomersDb.find(c => {
          const cName = (c.companyName || c.name || '').toLowerCase();
          return cName.includes(cleanName) || cleanName.includes(cName);
        });
        if (found) {
          matchedCustId = found.id;
          matchedCustName = found.companyName || found.name || matchedCustName;
        } else {
          for (const [key, mapping] of Object.entries(defaultCustomerMappings)) {
            if (cleanName.includes(key)) {
              matchedCustId = mapping.id;
              matchedCustName = mapping.name;
              break;
            }
          }
        }
      }

      // Fallback: If unmapped, assign deterministic unique ID
      if (!matchedCustId) {
        matchedCustId = `cust-unmapped-${guid.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`;
        warnings.push(`Customer ledger "${ledgerName}" (GSTIN: ${gstin || 'None'}) could not be matched to an existing Distributor customer account. Assigned fallback ID ${matchedCustId}.`);
      }

      if (seenCustomerIds.has(matchedCustId)) {
        warnings.push(`Multiple Tally ledgers mapped to same customer account "${matchedCustId}". Review ledger mapping.`);
      }
      seenCustomerIds.add(matchedCustId);

      // Reconciliation & Discrepancy Detection
      const distBal = internalCustomerBalances.has(matchedCustId)
        ? internalCustomerBalances.get(matchedCustId)!
        : tallyOutstanding;

      const diff = Math.abs(tallyOutstanding - distBal);
      const hasDiscrepancy = diff > 0.01;

      if (hasDiscrepancy) {
        discrepancies.push({
          customerId: matchedCustId,
          customerName: matchedCustName,
          tallyLedgerName: ledgerName,
          distributorOutstanding: distBal,
          tallyOutstanding,
          discrepancyAmount: diff,
          discrepancyDirection: tallyOutstanding > distBal ? 'TALLY_HIGHER' : 'DISTRIBUTOR_HIGHER',
          lastSynchronizedAt: nowIso,
          status: 'PENDING_REVIEW',
          notes: `Discrepancy detected: Tally reports ₹${tallyOutstanding.toLocaleString('en-IN')}, Distributor running balance is ₹${distBal.toLocaleString('en-IN')} (Difference: ₹${diff.toLocaleString('en-IN')}). Requires Back Office review.`
        });
      }

      // Extract Transaction & Bill History from Tally Ledger XML
      const transactions: CustomerLedgerTransaction[] = [];
      const billRegex = /<BILLALLOCATIONS(?:\.LIST)?>([\s\S]*?)<\/BILLALLOCATIONS(?:\.LIST)?>/gi;
      let billMatch: RegExpExecArray | null;
      let running = openingBalance;

      while ((billMatch = billRegex.exec(body)) !== null) {
        const billBody = billMatch[1];
        const bNameMatch = billBody.match(/<NAME>([\s\S]*?)<\/NAME>/i);
        const bTypeMatch = billBody.match(/<BILLTYPE>([\s\S]*?)<\/BILLTYPE>/i) || billBody.match(/<VOUCHERTYPENAME>([\s\S]*?)<\/VOUCHERTYPENAME>/i);
        const bDateMatch = billBody.match(/<BILLDATE>([\s\S]*?)<\/BILLDATE>/i) || billBody.match(/<DATE>([\s\S]*?)<\/DATE>/i);
        const bAmtMatch = billBody.match(/<AMOUNT>([\s\S]*?)<\/AMOUNT>/i);
        const bDeemedMatch = billBody.match(/<ISDEEMEDPOSITIVE>([\s\S]*?)<\/ISDEEMEDPOSITIVE>/i);

        const vNum = bNameMatch ? bNameMatch[1].trim() : `BILL-${transactions.length + 1}`;
        const vType = bTypeMatch ? bTypeMatch[1].trim() : 'Sales Invoice';
        const vDate = bDateMatch ? this.normalizeTallyDate(bDateMatch[1]) : nowIso.split('T')[0];
        const rawAmt = bAmtMatch ? Math.abs(parseFloat(bAmtMatch[1].replace(/[^\d.-]/g, '')) || 0) : 0;
        const isDebit = bDeemedMatch ? bDeemedMatch[1].toLowerCase() === 'yes' : !vType.toLowerCase().includes('receipt');

        const debit = isDebit ? rawAmt : 0;
        const credit = isDebit ? 0 : rawAmt;
        running = running + debit - credit;

        transactions.push({
          date: vDate,
          voucherType: vType,
          voucherNumber: vNum,
          debit,
          credit,
          runningBalance: running,
          narration: `Tally Bill Allocation: ${vNum} (${vType})`
        });
      }

      const item: CustomerLedgerSyncItem = {
        tallyLedgerId: guid,
        tallyLedgerName: ledgerName,
        distributorCustomerId: matchedCustId,
        distributorCustomerName: matchedCustName,
        gstin,
        openingBalance,
        totalInvoiced: Math.max(tallyOutstanding, openingBalance),
        totalReceipts: Math.max(0, openingBalance - tallyOutstanding),
        creditNotes: 0,
        debitNotes: 0,
        tallyOutstanding,
        distributorOutstanding: distBal,
        discrepancyAmount: diff,
        hasDiscrepancy,
        creditLimit,
        creditPeriodDays,
        overdueAmount: tallyOutstanding > creditLimit ? tallyOutstanding - creditLimit : 0,
        lastSyncTimestamp: nowIso,
        transactions
      };

      ledgers.push(item);
    }

    if (ledgers.length === 0 && errors.length === 0) {
      warnings.push('XML parsed successfully, but zero Sundry Debtors customer ledgers were found.');
    }

    return { ledgers, discrepancies, errors, warnings };
  }

  public async fetchCustomerLedgers(
    internalCustomerBalances: Map<string, number> = new Map(),
    internalCustomersDb: any[] = []
  ): Promise<ExternalTallySyncResult<CustomerLedgerSyncItem>> {
    const nowIso = new Date().toISOString();

    if (!this.config.enabled) {
      return {
        success: false,
        sourceCompany: this.config.companyName,
        sourceType: this.sourceType,
        exportFormat: this.config.exportFormat,
        itemsImported: 0,
        itemsFailed: 0,
        data: [],
        errors: ['Tally Integration adapter is disabled in settings. Explicit administrator authorization required.'],
        warnings: [],
        rawResponseSummary: 'Adapter Disabled by Policy',
        syncTimestamp: nowIso
      };
    }

    if (this.config.environment === 'MOCK_LOCAL') {
      const rawLedgers = this.getMockTallyCustomerLedgers();
      const processed: CustomerLedgerSyncItem[] = [];
      const discrepancies: TallyDiscrepancyItem[] = [];

      for (const l of rawLedgers) {
        const distBal = internalCustomerBalances.has(l.distributorCustomerId)
          ? internalCustomerBalances.get(l.distributorCustomerId)!
          : l.distributorOutstanding;

        const diff = Math.abs(l.tallyOutstanding - distBal);
        const hasDiscrepancy = diff > 0.01;

        const item: CustomerLedgerSyncItem = {
          ...l,
          distributorOutstanding: distBal,
          discrepancyAmount: diff,
          hasDiscrepancy,
          lastSyncTimestamp: nowIso
        };

        processed.push(item);

        if (hasDiscrepancy) {
          discrepancies.push({
            customerId: l.distributorCustomerId,
            customerName: l.distributorCustomerName,
            tallyLedgerName: l.tallyLedgerName,
            distributorOutstanding: distBal,
            tallyOutstanding: l.tallyOutstanding,
            discrepancyAmount: diff,
            discrepancyDirection: l.tallyOutstanding > distBal ? 'TALLY_HIGHER' : 'DISTRIBUTOR_HIGHER',
            lastSynchronizedAt: nowIso,
            status: 'PENDING_REVIEW',
            notes: `Discrepancy detected: Tally reports ₹${l.tallyOutstanding.toLocaleString('en-IN')}, Distributor records show ₹${distBal.toLocaleString('en-IN')}. Requires Back Office review.`
          });
        }
      }

      this.cachedCustomerLedgers = processed;
      this.cachedDiscrepancies = discrepancies;

      return {
        success: true,
        sourceCompany: this.config.companyName,
        sourceType: this.sourceType,
        exportFormat: this.config.exportFormat,
        itemsImported: processed.length,
        itemsFailed: 0,
        data: processed,
        errors: [],
        warnings: discrepancies.length > 0 ? [`${discrepancies.length} customer ledgers have balance discrepancies requiring reconciliation.`] : [],
        rawResponseSummary: `Extracted ${processed.length} customer ledgers from Tally Sundry Debtors (Local Mock Fixtures). Discrepancies detected: ${discrepancies.length}`,
        syncTimestamp: nowIso
      };
    }

    if (this.config.environment === 'OFFICE_TALLY_BRIDGE') {
      const activeDev = officeTallyBridgeManager.getActiveDevice();
      if (!activeDev) {
        return {
          success: false,
          sourceCompany: this.config.companyName,
          sourceType: this.sourceType,
          exportFormat: this.config.exportFormat,
          itemsImported: 0,
          itemsFailed: 1,
          data: [],
          errors: ['No Windows Office Tally Bridge device is currently paired or online.'],
          warnings: [],
          rawResponseSummary: 'Bridge Offline',
          syncTimestamp: nowIso
        };
      }
      try {
        const bridgeRes = await officeTallyBridgeManager.dispatchCommand(
          'GET_CUSTOMER_LEDGERS',
          this.config.companyName,
          {},
          this.config.timeoutMs || 10000
        );

        if (!bridgeRes.companyMatched) {
          return {
            success: false,
            sourceCompany: this.config.companyName,
            sourceType: this.sourceType,
            exportFormat: this.config.exportFormat,
            itemsImported: 0,
            itemsFailed: 1,
            data: [],
            errors: [`Office Tally Bridge company mismatch: Active Tally company is "${bridgeRes.activeTallyCompany || 'Unknown'}", expected "${this.config.companyName}". Ledger sync blocked for safety.`],
            warnings: [],
            rawResponseSummary: 'Company Mismatch',
            syncTimestamp: nowIso
          };
        }

        const rawXml = typeof bridgeRes.data === 'string' ? bridgeRes.data : (bridgeRes.data?.rawXml || '');
        const parsed = this.parseTallyCustomerLedgersXml(rawXml, internalCustomerBalances, internalCustomersDb);

        this.cachedCustomerLedgers = parsed.ledgers;
        this.cachedDiscrepancies = parsed.discrepancies;
        this.config.lastSuccessfulSync = nowIso;

        return {
          success: parsed.errors.length === 0,
          sourceCompany: this.config.companyName,
          sourceType: this.sourceType,
          exportFormat: this.config.exportFormat,
          itemsImported: parsed.ledgers.length,
          itemsFailed: parsed.errors.length,
          data: parsed.ledgers,
          errors: parsed.errors,
          warnings: parsed.warnings,
          rawResponseSummary: `Synchronized ${parsed.ledgers.length} customer ledgers from Office Tally Bridge. Discrepancies: ${parsed.discrepancies.length}`,
          syncTimestamp: nowIso
        };
      } catch (err: any) {
        return {
          success: false,
          sourceCompany: this.config.companyName,
          sourceType: this.sourceType,
          exportFormat: this.config.exportFormat,
          itemsImported: 0,
          itemsFailed: 1,
          data: [],
          errors: [`Office Tally Bridge ledger dispatch failed: ${err.message}`],
          warnings: [],
          rawResponseSummary: `Office Tally Bridge Ledger Fetch Failed: ${err.message}`,
          syncTimestamp: nowIso
        };
      }
    }

    // LIVE HTTP MODE: EXTERNAL_TALLY_HTTP
    try {
      const xmlReq = this.generateCustomerLedgerXmlRequest();
      const responseText = await this.sendHttpRequest(xmlReq);
      const parsed = this.parseTallyCustomerLedgersXml(responseText, internalCustomerBalances, internalCustomersDb);

      if (parsed.errors.length > 0 && parsed.ledgers.length === 0) {
        return {
          success: false,
          sourceCompany: this.config.companyName,
          sourceType: this.sourceType,
          exportFormat: this.config.exportFormat,
          itemsImported: 0,
          itemsFailed: parsed.errors.length,
          data: [],
          errors: parsed.errors,
          warnings: parsed.warnings,
          rawResponseSummary: `Failed to parse customer ledgers from live Tally XML: ${parsed.errors.join('; ')}`,
          syncTimestamp: nowIso
        };
      }

      this.cachedCustomerLedgers = parsed.ledgers;
      this.cachedDiscrepancies = parsed.discrepancies;
      this.config.lastSuccessfulSync = nowIso;

      return {
        success: parsed.errors.length === 0,
        sourceCompany: this.config.companyName,
        sourceType: this.sourceType,
        exportFormat: this.config.exportFormat,
        itemsImported: parsed.ledgers.length,
        itemsFailed: parsed.errors.length,
        data: parsed.ledgers,
        errors: parsed.errors,
        warnings: parsed.warnings,
        rawResponseSummary: `Synchronized ${parsed.ledgers.length} customer ledgers from Live Tally (${this.config.host}:${this.config.port}). Discrepancies: ${parsed.discrepancies.length}`,
        syncTimestamp: nowIso
      };
    } catch (err: any) {
      // CRITICAL: NEVER silently fall back to mock data in live mode
      return {
        success: false,
        sourceCompany: this.config.companyName,
        sourceType: this.sourceType,
        exportFormat: this.config.exportFormat,
        itemsImported: 0,
        itemsFailed: 1,
        data: [],
        errors: [`Live Tally HTTP request failed (${this.config.host}:${this.config.port}): ${err.message || 'Network unreachable'}`],
        warnings: [],
        rawResponseSummary: `Live Tally HTTP Failure: ${err.message || 'Connection refused'}`,
        syncTimestamp: nowIso
      };
    }
  }

  public getCachedDiscrepancies(): TallyDiscrepancyItem[] {
    return [...this.cachedDiscrepancies];
  }

  public getCachedInventoryBatches(): InventoryBatchSyncItem[] {
    return [...this.cachedInventoryBatches];
  }

  public getCachedCustomerLedgers(): CustomerLedgerSyncItem[] {
    return [...this.cachedCustomerLedgers];
  }

  // ===========================================================================
  // 5. OUTBOUND RECEIPT EXPORT TO TALLY
  // ===========================================================================
  public generateReceiptXmlEnvelope(payment: {
    receiptNumber: string;
    receiptDate: string;
    customerLedgerName: string;
    bankLedgerName: string;
    amount: number;
    narration: string;
    transactionReference?: string;
  }): string {
    const originMarker = `[ORIGIN:DS_DISTRIBUTOR|REF:${payment.receiptNumber}]`;
    const fullNarration = payment.narration.includes('ORIGIN:DS_DISTRIBUTOR')
      ? payment.narration
      : `${payment.narration} ${originMarker}`;
    return `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${this.config.companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Receipt" ACTION="Create">
            <DATE>${payment.receiptDate.replace(/-/g, '')}</DATE>
            <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${payment.receiptNumber}</VOUCHERNUMBER>
            <REFERENCE>${payment.transactionReference || payment.receiptNumber}</REFERENCE>
            <NARRATION>${fullNarration}</NARRATION>
            <!-- Circular Loop Prevention: Origin System Watermark -->
            <UDF:ORIGINSYSTEM DESC="OriginSystem">DS_DISTRIBUTOR</UDF:ORIGINSYSTEM>
            <!-- Debit Entry: Receiving Bank / Cash Ledger -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${payment.bankLedgerName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${payment.amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <!-- Credit Entry: Customer Sundry Debtor Ledger -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${payment.customerLedgerName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${payment.amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
`.trim();
  }

  // ===========================================================================
  // 6. INBOUND RECEIPT & PAYMENT VOUCHER PARSING & RECONCILIATION
  // ===========================================================================
  /**
   * Genuine Tally XML Parser for Inbound Vouchers (Receipts, Payments, Sales)
   * Multi-factor verification:
   * - Detects origin system (circular sync loop prevention)
   * - Distinguishes DS Distributor originated receipts from external manual receipts
   * - Matches payment references against internal payments
   * - Detects duplicate receipts
   */
  public parseTallyVouchersXml(
    xml: string,
    internalPayments: any[] = []
  ): {
    vouchers: TallyVoucherSyncItem[];
    receipts: TallyVoucherSyncItem[];
    payments: TallyVoucherSyncItem[];
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const vouchers: TallyVoucherSyncItem[] = [];
    const receipts: TallyVoucherSyncItem[] = [];
    const paymentsList: TallyVoucherSyncItem[] = [];

    if (!xml || typeof xml !== 'string' || xml.trim().length === 0) {
      errors.push('Empty XML payload provided for voucher parsing.');
      return { vouchers, receipts, payments: paymentsList, errors, warnings };
    }

    const seenVoucherNumbers = new Set<string>();
    const voucherRegex = /<VOUCHER(?:\s+[^>]*)?>([\s\S]*?)<\/VOUCHER>/gi;
    let vMatch: RegExpExecArray | null;

    while ((vMatch = voucherRegex.exec(xml)) !== null) {
      const vBody = vMatch[1];
      const typeMatch = vBody.match(/<VOUCHERTYPENAME>([\s\S]*?)<\/VOUCHERTYPENAME>/i) || vBody.match(/<VCHTYPE>([\s\S]*?)<\/VCHTYPE>/i);
      const voucherType = typeMatch ? this.decodeXmlEntities(typeMatch[1]).trim() : 'Receipt';

      const numMatch = vBody.match(/<VOUCHERNUMBER>([\s\S]*?)<\/VOUCHERNUMBER>/i);
      const voucherNumber = numMatch ? numMatch[1].trim() : '';

      const guidMatch = vBody.match(/<GUID>([\s\S]*?)<\/GUID>/i);
      const guid = guidMatch ? guidMatch[1].trim() : `vch-tally-${voucherNumber || Date.now()}`;

      const dateMatch = vBody.match(/<DATE>([\s\S]*?)<\/DATE>/i);
      const date = dateMatch ? this.normalizeTallyDate(dateMatch[1]) : new Date().toISOString().split('T')[0];

      const refMatch = vBody.match(/<REFERENCE>([\s\S]*?)<\/REFERENCE>/i);
      const reference = refMatch ? refMatch[1].trim() : undefined;

      const narMatch = vBody.match(/<NARRATION>([\s\S]*?)<\/NARRATION>/i);
      const narration = narMatch ? this.decodeXmlEntities(narMatch[1]).trim() : '';

      const udfOriginMatch = vBody.match(/<(?:UDF:)?ORIGINSYSTEM[^>]*>([\s\S]*?)<\/(?:UDF:)?ORIGINSYSTEM>/i);
      const originSystem = udfOriginMatch ? udfOriginMatch[1].trim() : undefined;

      // Extract Ledger Entries
      let customerLedgerName: string | undefined;
      let bankLedgerName: string | undefined;
      let voucherAmount = 0;

      const ledgerEntryRegex = /<ALLLEDGERENTRIES(?:\.LIST)?>([\s\S]*?)<\/ALLLEDGERENTRIES(?:\.LIST)?>/gi;
      let lMatch: RegExpExecArray | null;

      while ((lMatch = ledgerEntryRegex.exec(vBody)) !== null) {
        const lBody = lMatch[1];
        const lNameMatch = lBody.match(/<LEDGERNAME>([\s\S]*?)<\/LEDGERNAME>/i);
        const lAmtMatch = lBody.match(/<AMOUNT>([\s\S]*?)<\/AMOUNT>/i);
        const isDeemedMatch = lBody.match(/<ISDEEMEDPOSITIVE>([\s\S]*?)<\/ISDEEMEDPOSITIVE>/i);

        const lName = lNameMatch ? this.decodeXmlEntities(lNameMatch[1]).trim() : '';
        const rawAmt = lAmtMatch ? parseFloat(lAmtMatch[1].replace(/[^\d.-]/g, '')) || 0 : 0;
        const absAmt = Math.abs(rawAmt);

        if (absAmt > voucherAmount) {
          voucherAmount = absAmt;
        }

        const isDeemed = isDeemedMatch ? isDeemedMatch[1].toLowerCase() === 'yes' : false;

        // Distinguish customer ledger vs bank ledger
        if (lName.toLowerCase().includes('debtor') || lName.toLowerCase().includes('customer') || !isDeemed) {
          if (!customerLedgerName) customerLedgerName = lName;
        }
        if (lName.toLowerCase().includes('bank') || lName.toLowerCase().includes('cash') || lName.toLowerCase().includes('hdfc') || isDeemed) {
          if (!bankLedgerName) bankLedgerName = lName;
        }
      }

      // Circular-Sync Loop Breaker Analysis
      const originCheck = this.isDistributorOriginatedReceipt({
        voucherNumber,
        reference,
        narration,
        originSystem,
        guid
      });

      // Duplicate check in this import stream
      if (voucherNumber && seenVoucherNumbers.has(voucherNumber)) {
        warnings.push(`Duplicate voucher number "${voucherNumber}" detected in Tally XML stream. Flagged for review.`);
      }
      if (voucherNumber) seenVoucherNumbers.add(voucherNumber);

      // Match against internal payments
      let matchedInternalPaymentId: string | undefined;
      let isReconciled = false;
      let status: 'PENDING_RECONCILIATION' | 'RECONCILED' | 'IGNORED' | 'DUPLICATE' = 'PENDING_RECONCILIATION';

      const matchedInternal = internalPayments.find(p =>
        (reference && (p.id === reference || p.bankReferenceNumber === reference || p.gatewayTransactionId === reference)) ||
        (originCheck.internalReference && (p.id === originCheck.internalReference || p.accountingVoucherNumber === originCheck.internalReference)) ||
        (p.amount === voucherAmount && Math.abs(new Date(p.createdAt).getTime() - new Date(date).getTime()) < 86400000 * 3)
      );

      if (matchedInternal) {
        matchedInternalPaymentId = matchedInternal.id;
        isReconciled = true;
        status = 'RECONCILED';
      }

      const item: TallyVoucherSyncItem = {
        guid,
        voucherType,
        voucherNumber,
        date,
        reference,
        narration,
        amount: voucherAmount,
        originSystem,
        isDistributorOrigin: originCheck.isInternalOrigin,
        matchedFactor: originCheck.matchedFactor,
        customerLedgerName: customerLedgerName || 'Sundry Debtors',
        bankLedgerName: bankLedgerName || 'Bank Account',
        isReconciled,
        matchedInternalPaymentId,
        status
      };

      vouchers.push(item);
      if (voucherType.toLowerCase() === 'receipt') {
        receipts.push(item);
      } else if (voucherType.toLowerCase() === 'payment') {
        paymentsList.push(item);
      }
    }

    return { vouchers, receipts, payments: paymentsList, errors, warnings };
  }

  public async fetchReceiptVouchers(
    internalPayments: any[] = []
  ): Promise<ExternalTallySyncResult<TallyVoucherSyncItem>> {
    const nowIso = new Date().toISOString();

    if (!this.config.enabled) {
      return {
        success: false,
        sourceCompany: this.config.companyName,
        sourceType: this.sourceType,
        exportFormat: this.config.exportFormat,
        itemsImported: 0,
        itemsFailed: 0,
        data: [],
        errors: ['Tally Integration adapter is disabled in settings. Explicit administrator authorization required.'],
        warnings: [],
        rawResponseSummary: 'Adapter Disabled by Policy',
        syncTimestamp: nowIso
      };
    }

    if (this.config.environment === 'MOCK_LOCAL') {
      const mockVouchers = this.getMockTallyReceiptVouchers();
      this.cachedReceiptVouchers = mockVouchers;
      return {
        success: true,
        sourceCompany: this.config.companyName,
        sourceType: this.sourceType,
        exportFormat: this.config.exportFormat,
        itemsImported: mockVouchers.length,
        itemsFailed: 0,
        data: mockVouchers,
        errors: [],
        warnings: [],
        rawResponseSummary: `Synchronized ${mockVouchers.length} receipt vouchers from Tally (Local Mock Fixtures).`,
        syncTimestamp: nowIso
      };
    }

    if (this.config.environment === 'OFFICE_TALLY_BRIDGE') {
      const activeDev = officeTallyBridgeManager.getActiveDevice();
      if (!activeDev) {
        return {
          success: false,
          sourceCompany: this.config.companyName,
          sourceType: this.sourceType,
          exportFormat: this.config.exportFormat,
          itemsImported: 0,
          itemsFailed: 1,
          data: [],
          errors: ['No Windows Office Tally Bridge device is currently paired or online.'],
          warnings: [],
          rawResponseSummary: 'Bridge Offline',
          syncTimestamp: nowIso
        };
      }
      try {
        const bridgeRes = await officeTallyBridgeManager.dispatchCommand(
          'GET_RECEIPT_VOUCHERS',
          this.config.companyName,
          {},
          this.config.timeoutMs || 10000
        );

        if (!bridgeRes.companyMatched) {
          return {
            success: false,
            sourceCompany: this.config.companyName,
            sourceType: this.sourceType,
            exportFormat: this.config.exportFormat,
            itemsImported: 0,
            itemsFailed: 1,
            data: [],
            errors: [`Office Tally Bridge company mismatch: Active Tally company is "${bridgeRes.activeTallyCompany || 'Unknown'}", expected "${this.config.companyName}". Voucher sync blocked for financial safety.`],
            warnings: [],
            rawResponseSummary: 'Company Mismatch',
            syncTimestamp: nowIso
          };
        }

        const rawXml = typeof bridgeRes.data === 'string' ? bridgeRes.data : (bridgeRes.data?.rawXml || '');
        const parsed = this.parseTallyVouchersXml(rawXml, internalPayments);

        this.cachedReceiptVouchers = parsed.receipts;
        this.config.lastSuccessfulSync = nowIso;

        return {
          success: parsed.errors.length === 0,
          sourceCompany: this.config.companyName,
          sourceType: this.sourceType,
          exportFormat: this.config.exportFormat,
          itemsImported: parsed.receipts.length,
          itemsFailed: parsed.errors.length,
          data: parsed.receipts,
          errors: parsed.errors,
          warnings: parsed.warnings,
          rawResponseSummary: `Synchronized ${parsed.receipts.length} receipt vouchers from Office Tally ERP 9 via Windows Bridge.`,
          syncTimestamp: nowIso
        };
      } catch (err: any) {
        return {
          success: false,
          sourceCompany: this.config.companyName,
          sourceType: this.sourceType,
          exportFormat: this.config.exportFormat,
          itemsImported: 0,
          itemsFailed: 1,
          data: [],
          errors: [`Office Tally Bridge voucher fetch failed: ${err.message}`],
          warnings: [],
          rawResponseSummary: `Office Bridge Voucher Failure: ${err.message}`,
          syncTimestamp: nowIso
        };
      }
    }

    // LIVE HTTP MODE: EXTERNAL_TALLY_HTTP
    try {
      const xmlReq = `
        <ENVELOPE>
          <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
          <BODY>
            <EXPORTDATA>
              <REQUESTDESC>
                <REPORTNAME>Day Book</REPORTNAME>
                <STATICVARIABLES>
                  <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                  <SVCURRENTCOMPANY>${this.config.companyName}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
              </REQUESTDESC>
            </EXPORTDATA>
          </BODY>
        </ENVELOPE>
      `;
      const responseText = await this.sendHttpRequest(xmlReq);
      const parsed = this.parseTallyVouchersXml(responseText, internalPayments);

      this.cachedReceiptVouchers = parsed.receipts;
      this.config.lastSuccessfulSync = nowIso;

      return {
        success: parsed.errors.length === 0,
        sourceCompany: this.config.companyName,
        sourceType: this.sourceType,
        exportFormat: this.config.exportFormat,
        itemsImported: parsed.receipts.length,
        itemsFailed: parsed.errors.length,
        data: parsed.receipts,
        errors: parsed.errors,
        warnings: parsed.warnings,
        rawResponseSummary: `Synchronized ${parsed.receipts.length} receipt vouchers from Live Tally HTTP.`,
        syncTimestamp: nowIso
      };
    } catch (err: any) {
      return {
        success: false,
        sourceCompany: this.config.companyName,
        sourceType: this.sourceType,
        exportFormat: this.config.exportFormat,
        itemsImported: 0,
        itemsFailed: 1,
        data: [],
        errors: [`Live Tally HTTP voucher request failed: ${err.message}`],
        warnings: [],
        rawResponseSummary: `Live Tally HTTP Voucher Failure: ${err.message}`,
        syncTimestamp: nowIso
      };
    }
  }

  public getCachedReceiptVouchers(): TallyVoucherSyncItem[] {
    return [...this.cachedReceiptVouchers];
  }

  // ===========================================================================
  // HTTP HELPER (Non-blocking, with strict timeout)
  // ===========================================================================
  private sendHttpRequest(xmlPayload: string): Promise<string> {
    const val = this.validateHostAndPort(this.config.host, this.config.port);
    if (!val.isValid) {
      return Promise.reject(new Error(`SSRF Security Violation: ${val.error}`));
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.config.host,
        port: this.config.port,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=utf-8',
          'Content-Length': Buffer.byteLength(xmlPayload),
          ...(this.config.authUsername ? {
            'Authorization': 'Basic ' + Buffer.from(`${this.config.authUsername}:${this.config.authPassword || ''}`).toString('base64')
          } : {})
        },
        timeout: this.config.timeoutMs
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve(data));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Tally HTTP request timed out after ${this.config.timeoutMs}ms`));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(xmlPayload);
      req.end();
    });
  }

  // ===========================================================================
  // XML PARSING FOR STOCK BATCHES & INVENTORY (Tally ERP 9 & TallyPrime)
  // ===========================================================================
  public normalizeTallyDate(dateStr: string | undefined | null): string {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const clean = dateStr.trim();
    if (clean.length === 0) return '';

    // Format 1: YYYYMMDD (e.g. "20261120")
    if (/^\d{8}$/.test(clean)) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
    }

    // Format 2: ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return clean;
    }

    // Format 3: DD-MMM-YYYY or DD-MMM-YY (e.g. "20-Nov-2026", "15-Oct-25")
    const monthMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const parts = clean.split(/[-/ ]/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const mon = parts[1].toLowerCase().slice(0, 3);
      let year = parts[2];
      if (year.length === 2) year = '20' + year;
      if (monthMap[mon] && day.length === 2 && year.length === 4) {
        return `${year}-${monthMap[mon]}-${day}`;
      }
    }

    // Attempt native Date parse
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return clean;
  }

  public parseTallyStockBatchesXml(xml: string): any[] {
    const batches: any[] = [];
    if (!xml || typeof xml !== 'string' || xml.trim().length === 0) {
      return batches;
    }

    const itemRegex = /<STOCKITEM(?:\s+NAME="([^"]+)")?[^>]*>([\s\S]*?)<\/STOCKITEM>/gi;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const itemAttr = itemMatch[1] || '';
      const itemBody = itemMatch[2];

      // 1. Item Name
      let itemName = itemAttr;
      if (!itemName) {
        const nameMatch = itemBody.match(/<NAME>([\s\S]*?)<\/NAME>/i);
        itemName = nameMatch ? this.decodeXmlEntities(nameMatch[1]).trim() : 'Unknown Product';
      }
      itemName = this.decodeXmlEntities(itemName).trim();

      // 2. Stock Group (PARENT)
      const parentMatch = itemBody.match(/<PARENT>([\s\S]*?)<\/PARENT>/i);
      const category = parentMatch ? this.decodeXmlEntities(parentMatch[1]).trim() : 'Diagnostic Reagents';

      // 3. Stock Item GUID
      const guidMatch = itemBody.match(/<GUID>([\s\S]*?)<\/GUID>/i);
      const itemGuid = guidMatch ? guidMatch[1].trim() : `tally-item-${itemName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

      // 4. Part Number / Item Code / SKU
      const partNumMatch = itemBody.match(/<PARTNUMBER>([\s\S]*?)<\/PARTNUMBER>/i);
      const sku = partNumMatch ? partNumMatch[1].trim() : '';

      // 5. Units of Measure (UOM)
      const uomMatch = itemBody.match(/<BASEUNITS>([\s\S]*?)<\/BASEUNITS>/i);
      const altUomMatch = itemBody.match(/<UOM>([\s\S]*?)<\/UOM>/i);
      const uom = uomMatch ? uomMatch[1].trim() : (altUomMatch ? altUomMatch[1].trim() : 'KIT');

      // 6. HSN Code
      const hsnMatch = itemBody.match(/<HSNCODE>([\s\S]*?)<\/HSNCODE>/i);
      const hsnCode = hsnMatch ? hsnMatch[1].trim() : '38220090';

      // 7. Standard Selling Rate & MRP
      const rateMatch = itemBody.match(/<RATE>([\s\S]*?)<\/RATE>/i);
      const mrpMatch = itemBody.match(/<MRP>([\s\S]*?)<\/MRP>/i);
      const baseSellingPrice = rateMatch ? parseFloat(rateMatch[1].replace(/[^0-9.]/g, '')) || 1000 : 1000;
      const baseMrp = mrpMatch ? parseFloat(mrpMatch[1].replace(/[^0-9.]/g, '')) || baseSellingPrice * 1.25 : baseSellingPrice * 1.25;

      // 8. Batch Allocations (matches both <BATCHALLOCATIONS> and <BATCHALLOCATIONS.LIST>)
      const batchRegex = /<BATCHALLOCATIONS(?:\.LIST)?>([\s\S]*?)<\/BATCHALLOCATIONS(?:\.LIST)?>/gi;
      let batchMatch: RegExpExecArray | null;
      let batchCount = 0;

      while ((batchMatch = batchRegex.exec(itemBody)) !== null) {
        batchCount++;
        const batchBody = batchMatch[1];
        const batchNameMatch = batchBody.match(/<BATCHNAME>([\s\S]*?)<\/BATCHNAME>/i);
        const expMatch = batchBody.match(/<EXPIRYDATE>([\s\S]*?)<\/EXPIRYDATE>/i);
        const mfgMatch = batchBody.match(/<MFGDATE>([\s\S]*?)<\/MFGDATE>/i);
        const godownMatch = batchBody.match(/<GODOWNNAME>([\s\S]*?)<\/GODOWNNAME>/i);
        const qtyMatch = batchBody.match(/<BILLEDQTY>([\s\S]*?)<\/BILLEDQTY>/i);
        const actQtyMatch = batchBody.match(/<ACTUALQTY>([\s\S]*?)<\/ACTUALQTY>/i);
        const amountMatch = batchBody.match(/<AMOUNT>([\s\S]*?)<\/AMOUNT>/i);
        const batchRateMatch = batchBody.match(/<RATE>([\s\S]*?)<\/RATE>/i);

        const batchNumber = batchNameMatch ? batchNameMatch[1].trim() : `BATCH-${batchCount}`;
        const expiryDate = expMatch ? this.normalizeTallyDate(expMatch[1]) : '';
        const manufacturingDate = mfgMatch ? this.normalizeTallyDate(mfgMatch[1]) : '';
        const godown = godownMatch ? this.decodeXmlEntities(godownMatch[1]).trim() : 'Central Cold-Chain Warehouse';
        const rawQtyStr = qtyMatch ? qtyMatch[1] : (actQtyMatch ? actQtyMatch[1] : '');
        const availableQuantity = rawQtyStr ? parseFloat(rawQtyStr.replace(/[^0-9.]/g, '')) || 0 : 40;
        const sellingPrice = batchRateMatch
          ? parseFloat(batchRateMatch[1].replace(/[^0-9.]/g, '')) || baseSellingPrice
          : (amountMatch ? parseFloat(amountMatch[1].replace(/[^0-9.]/g, '')) || baseSellingPrice : baseSellingPrice);

        batches.push({
          guid: `${itemGuid}-batch-${batchNumber}`,
          productName: itemName,
          sku,
          category,
          uom,
          hsnCode,
          batchNumber,
          expiryDate,
          manufacturingDate,
          godown,
          availableQuantity,
          sellingPrice,
          mrp: baseMrp
        });
      }

      // If no batch allocation tags, create primary default lot
      if (batchCount === 0) {
        const closingBalMatch = itemBody.match(/<CLOSINGBALANCE>([\s\S]*?)<\/CLOSINGBALANCE>/i);
        const closingQty = closingBalMatch ? parseFloat(closingBalMatch[1].replace(/[^0-9.]/g, '')) || 40 : 40;
        batches.push({
          guid: `${itemGuid}-primary`,
          productName: itemName,
          sku,
          category,
          uom,
          hsnCode,
          batchNumber: 'PRIMARY-LOT',
          expiryDate: '2027-12-31',
          manufacturingDate: '2025-10-01',
          godown: 'Central Cold-Chain Warehouse',
          availableQuantity: closingQty,
          sellingPrice: baseSellingPrice,
          mrp: baseMrp
        });
      }
    }

    return batches;
  }

  // ===========================================================================
  // MOCK FIXTURES: MEDICAL DIAGNOSTIC INVENTORY & INDIVIDUAL BATCHES
  // ===========================================================================
  private getMockTallyInventoryBatches(): any[] {
    return [
      // 1. Bio-Rad HbA1c Cartridge (2 Distinct Batches with Different Expiry Dates)
      {
        guid: 'TALLY-BTH-HBA1C-1',
        distributorProductId: 'prod-hba1c-hplc',
        productName: 'Bio-Rad D-10 Dual Program HbA1c Reagent Cartridge',
        sku: 'BR-HBA1C-D10',
        category: 'Diabetes & HPLC Chromatography',
        brand: 'Bio-Rad',
        hsnCode: '38220090',
        uom: 'KIT',
        batchNumber: 'BR-HBA-8812',
        manufacturingDate: '2025-10-15',
        expiryDate: '2026-11-20', // Critical: Expiring in ~13 days
        purchasePrice: 22000,
        sellingPrice: 28500,
        mrp: 34500,
        gstRate: 12,
        availableQuantity: 12,
        reservedQuantity: 2,
        godown: 'Mumbai Central Reagent Cold Room (2°C-8°C)',
        isActive: true
      },
      {
        guid: 'TALLY-BTH-HBA1C-2',
        distributorProductId: 'prod-hba1c-hplc',
        productName: 'Bio-Rad D-10 Dual Program HbA1c Reagent Cartridge',
        sku: 'BR-HBA1C-D10',
        category: 'Diabetes & HPLC Chromatography',
        brand: 'Bio-Rad',
        hsnCode: '38220090',
        uom: 'KIT',
        batchNumber: 'BR-HBA-9904',
        manufacturingDate: '2026-03-01',
        expiryDate: '2027-08-31', // Safe: 290+ days remaining
        purchasePrice: 22000,
        sellingPrice: 28500,
        mrp: 34500,
        gstRate: 12,
        availableQuantity: 45,
        reservedQuantity: 5,
        godown: 'Mumbai Central Reagent Cold Room (2°C-8°C)',
        isActive: true
      },

      // 2. Erba Chem 7 Biochemistry Reagents (1 Active Batch, 1 Quarantined Expired Batch)
      {
        guid: 'TALLY-BTH-ERBA-01',
        distributorProductId: 'prod-erba-chem7',
        productName: 'Erba Chem 7 Clinical Chemistry Liquid Stable Reagent Pack',
        sku: 'ERBA-CHEM7-KIT',
        category: 'Clinical Biochemistry',
        brand: 'Transasia / Erba',
        hsnCode: '38220090',
        uom: 'KIT',
        batchNumber: 'ERB-CK-4411',
        manufacturingDate: '2026-01-10',
        expiryDate: '2027-06-30', // Safe
        purchasePrice: 11500,
        sellingPrice: 14500,
        mrp: 18000,
        gstRate: 12,
        availableQuantity: 60,
        reservedQuantity: 4,
        godown: 'West Region Depot - Cold Storage',
        isActive: true
      },
      {
        guid: 'TALLY-BTH-ERBA-EXP',
        distributorProductId: 'prod-erba-chem7',
        productName: 'Erba Chem 7 Clinical Chemistry Liquid Stable Reagent Pack',
        sku: 'ERBA-CHEM7-KIT',
        category: 'Clinical Biochemistry',
        brand: 'Transasia / Erba',
        hsnCode: '38220090',
        uom: 'KIT',
        batchNumber: 'ERB-OLD-2025',
        manufacturingDate: '2024-08-15',
        expiryDate: '2026-09-30', // Expired!
        purchasePrice: 11000,
        sellingPrice: 14500,
        mrp: 18000,
        gstRate: 12,
        availableQuantity: 8,
        reservedQuantity: 0,
        godown: 'Quarantine Section - Expired Bio-Waste',
        isActive: false // Quarantined from order availability!
      },

      // 3. Sysmex Cellpack DCL Diluent 20L
      {
        guid: 'TALLY-BTH-SYS-01',
        distributorProductId: 'prod-sysmex-dcl',
        productName: 'Sysmex Cellpack DCL Automated Hematology Diluent 20L',
        sku: 'SYS-DCL-20L',
        category: 'Hematology Reagents',
        brand: 'Sysmex',
        hsnCode: '38220090',
        uom: 'CAN',
        batchNumber: 'SYS-DCL-7021',
        manufacturingDate: '2026-02-15',
        expiryDate: '2027-11-30',
        purchasePrice: 3800,
        sellingPrice: 4800,
        mrp: 5800,
        gstRate: 18,
        availableQuantity: 85,
        reservedQuantity: 12,
        godown: 'Central Ambient Warehouse (Pune)',
        isActive: true
      },

      // 4. VacuGuard EDTA K2 Blood Collection Tubes (Box of 100)
      {
        guid: 'TALLY-BTH-VACU-01',
        distributorProductId: 'prod-vacu-edta',
        productName: 'VacuGuard EDTA K2 Vacuum Blood Collection Tubes 3ml (100/Box)',
        sku: 'VACU-EDTA-100',
        category: 'Vacutainers & Phlebotomy',
        brand: 'BD Vacutainer',
        hsnCode: '90183900',
        uom: 'BOX',
        batchNumber: 'BD-EDTA-9931',
        manufacturingDate: '2026-04-10',
        expiryDate: '2028-03-31',
        purchasePrice: 480,
        sellingPrice: 620,
        mrp: 850,
        gstRate: 12,
        availableQuantity: 350,
        reservedQuantity: 25,
        godown: 'Central Ambient Warehouse (Pune)',
        isActive: true
      },

      // 5. Roche Elecsys Troponin T hs Reagent Pack
      {
        guid: 'TALLY-BTH-ROCHE-TROP',
        distributorProductId: 'prod-trop-t',
        productName: 'Roche Elecsys Troponin T Gen 5 STAT Cardiac Immunoassay Pack',
        sku: 'RCH-TROP-T-100',
        category: 'Cardiac & Emergency Immunoassay',
        brand: 'Roche Diagnostics',
        hsnCode: '38220090',
        uom: 'KIT',
        batchNumber: 'RCH-TRP-502',
        manufacturingDate: '2026-05-10',
        expiryDate: '2026-12-15', // Warning: Expiring in ~38 days
        purchasePrice: 42000,
        sellingPrice: 49500,
        mrp: 58000,
        gstRate: 12,
        availableQuantity: 24,
        reservedQuantity: 6,
        godown: 'Mumbai Central Reagent Cold Room (2°C-8°C)',
        isActive: true
      }
    ];
  }

  // ===========================================================================
  // MOCK FIXTURES: CUSTOMER LEDGERS (Sundry Debtors in Tally)
  // ===========================================================================
  private getMockTallyCustomerLedgers(): any[] {
    return [
      {
        tallyLedgerId: 'led-debtor-apex',
        tallyLedgerName: 'Sundry Debtors - Apex Clinical & Pathology Laboratories',
        distributorCustomerId: 'u-cust-01',
        distributorCustomerName: 'Apex Clinical & Pathology Laboratories',
        gstin: '27AABCM8921N1ZM',
        openingBalance: 25000,
        totalInvoiced: 175000,
        totalReceipts: 75000,
        creditNotes: 0,
        debitNotes: 0,
        tallyOutstanding: 125000,
        distributorOutstanding: 125000, // Balanced
        creditLimit: 500000,
        creditPeriodDays: 30,
        overdueAmount: 35000,
        oldestUnpaidInvoiceDate: '2026-09-15',
        transactions: [
          { date: '2026-04-01', voucherType: 'Opening Balance', voucherNumber: 'OB-2026-01', debit: 25000, credit: 0, runningBalance: 25000 },
          { date: '2026-06-15', voucherType: 'Sales Invoice', voucherNumber: 'INV-2026-0041', debit: 85000, credit: 0, runningBalance: 110000 },
          { date: '2026-07-20', voucherType: 'Receipt', voucherNumber: 'RCP-2026-0012', debit: 0, credit: 50000, runningBalance: 60000 },
          { date: '2026-09-15', voucherType: 'Sales Invoice', voucherNumber: 'INV-2026-0092', debit: 90000, credit: 0, runningBalance: 150000 },
          { date: '2026-10-10', voucherType: 'Receipt', voucherNumber: 'RCP-2026-0055', debit: 0, credit: 25000, runningBalance: 125000 }
        ]
      },
      {
        tallyLedgerId: 'led-debtor-metropolis',
        tallyLedgerName: 'Sundry Debtors - Metropolis Healthcare Reference Lab',
        distributorCustomerId: 'u-cust-02',
        distributorCustomerName: 'Metropolis Healthcare Reference Lab',
        gstin: '27AABCM2291K1ZP',
        openingBalance: 15000,
        totalInvoiced: 240000,
        totalReceipts: 180000,
        creditNotes: 5000,
        debitNotes: 0,
        tallyOutstanding: 70000,
        distributorOutstanding: 68500, // Small discrepancy to test discrepancy detector!
        creditLimit: 800000,
        creditPeriodDays: 45,
        overdueAmount: 0,
        oldestUnpaidInvoiceDate: '2026-10-02',
        transactions: [
          { date: '2026-04-01', voucherType: 'Opening Balance', voucherNumber: 'OB-2026-02', debit: 15000, credit: 0, runningBalance: 15000 },
          { date: '2026-08-10', voucherType: 'Sales Invoice', voucherNumber: 'INV-2026-0078', debit: 140000, credit: 0, runningBalance: 155000 },
          { date: '2026-08-28', voucherType: 'Receipt', voucherNumber: 'RCP-2026-0033', debit: 0, credit: 100000, runningBalance: 55000 },
          { date: '2026-09-20', voucherType: 'Credit Note', voucherNumber: 'CRN-2026-0004', debit: 0, credit: 5000, runningBalance: 50000 },
          { date: '2026-10-02', voucherType: 'Sales Invoice', voucherNumber: 'INV-2026-0115', debit: 100000, credit: 0, runningBalance: 150000 },
          { date: '2026-10-25', voucherType: 'Receipt', voucherNumber: 'RCP-2026-0081', debit: 0, credit: 80000, runningBalance: 70000 }
        ]
      },
      {
        tallyLedgerId: 'led-debtor-apollo',
        tallyLedgerName: 'Sundry Debtors - Apollo Diagnostics Centre (Kolkata)',
        distributorCustomerId: 'u-cust-03',
        distributorCustomerName: 'Apollo Diagnostics Centre (Kolkata)',
        gstin: '19AABCA4321Q1ZM',
        openingBalance: 0,
        totalInvoiced: 85000,
        totalReceipts: 85000,
        creditNotes: 0,
        debitNotes: 0,
        tallyOutstanding: 0,
        distributorOutstanding: 0, // Nil balance
        creditLimit: 300000,
        creditPeriodDays: 30,
        overdueAmount: 0,
        transactions: [
          { date: '2026-08-01', voucherType: 'Sales Invoice', voucherNumber: 'INV-2026-0062', debit: 85000, credit: 0, runningBalance: 85000 },
          { date: '2026-08-25', voucherType: 'Receipt', voucherNumber: 'RCP-2026-0029', debit: 0, credit: 85000, runningBalance: 0 }
        ]
      }
    ];
  }

  // ===========================================================================
  // MOCK FIXTURES: TALLY RECEIPT VOUCHERS (Inbound from Tally)
  // ===========================================================================
  public getMockTallyReceiptVouchers(): TallyVoucherSyncItem[] {
    return [
      {
        guid: 'tally-vch-rcpt-01',
        voucherType: 'Receipt',
        voucherNumber: 'RCP-2026-0012',
        date: '2026-07-20',
        reference: 'pay-gw-1011',
        narration: 'Online customer receipt settlement via Razorpay [ORIGIN:DS_DISTRIBUTOR|REF:pay-gw-1011]',
        amount: 50000,
        originSystem: 'DS_DISTRIBUTOR',
        isDistributorOrigin: true,
        matchedFactor: 'ORIGIN_SYSTEM_TAG',
        customerLedgerName: 'Sundry Debtors - Apex Clinical & Pathology Laboratories',
        bankLedgerName: 'HDFC Bank Ltd (Current A/c #9921)',
        partyGstin: '27AABCM8921N1ZM',
        isReconciled: true,
        matchedInternalPaymentId: 'pay-gw-1011',
        status: 'RECONCILED'
      },
      {
        guid: 'tally-vch-rcpt-02',
        voucherType: 'Receipt',
        voucherNumber: 'RCP-2026-0033',
        date: '2026-08-28',
        reference: 'HDFC-NEFT-991204',
        narration: 'NEFT Payment received from Metropolis Lab',
        amount: 100000,
        isDistributorOrigin: false,
        matchedFactor: 'EXTERNAL_ORIGIN',
        customerLedgerName: 'Sundry Debtors - Metropolis Healthcare Reference Lab',
        bankLedgerName: 'HDFC Bank Ltd (Current A/c #9921)',
        partyGstin: '27AABCM2291K1ZP',
        isReconciled: true,
        matchedInternalPaymentId: 'pay-bt-sample-02',
        status: 'RECONCILED'
      },
      {
        guid: 'tally-vch-rcpt-03',
        voucherType: 'Receipt',
        voucherNumber: 'RCP-2026-0055',
        date: '2026-10-10',
        reference: 'CHQ-881290',
        narration: 'Cheque clearing for Apex Lab invoice',
        amount: 25000,
        isDistributorOrigin: false,
        matchedFactor: 'EXTERNAL_ORIGIN',
        customerLedgerName: 'Sundry Debtors - Apex Clinical & Pathology Laboratories',
        bankLedgerName: 'HDFC Bank Ltd (Current A/c #9921)',
        partyGstin: '27AABCM8921N1ZM',
        isReconciled: false,
        status: 'PENDING_RECONCILIATION'
      }
    ];
  }

  private initMockBaselineData(): void {
    this.cachedInventoryBatches = this.getMockTallyInventoryBatches();
    this.cachedCustomerLedgers = this.getMockTallyCustomerLedgers();
    this.cachedReceiptVouchers = this.getMockTallyReceiptVouchers();
  }
}

export const externalTallyAdapter = new ExternalTallyAdapter();


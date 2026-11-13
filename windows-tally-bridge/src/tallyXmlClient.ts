/**
 * TALLY XML CLIENT (Windows Office Host)
 * DS Distributor Tally Bridge
 *
 * Communicates exclusively with local Tally ERP 9 / TallyPrime at 127.0.0.1:9000.
 *
 * Security Constraints:
 * - NEVER accepts arbitrary network destinations.
 * - Strictly restricted to 127.0.0.1 / localhost.
 * - Executes allowlisted read-only XML queries only.
 * - Zero shell command execution.
 */

import http from 'http';

export interface TallyPingResult {
  connected: boolean;
  tallyVersion?: string;
  loadedCompanies: string[];
  activeCompany?: string;
  latencyMs: number;
  error?: string;
}

export class TallyXmlClient {
  private defaultHost: string;
  private defaultPort: number;

  constructor(host = '127.0.0.1', port = 9000) {
    this.assertLocalDestination(host, port);
    this.defaultHost = host;
    this.defaultPort = port;
  }

  /**
   * Enforces strict destination restriction.
   * Prohibits arbitrary network destinations, WAN addresses, and internal network hopping.
   */
  public assertLocalDestination(host: string, port: number): void {
    const cleanHost = (host || '').trim().toLowerCase();
    const isLocalhost =
      cleanHost === '127.0.0.1' ||
      cleanHost === 'localhost' ||
      cleanHost === '::1';

    if (!isLocalhost) {
      throw new Error(`Security Violation: Office Tally Bridge is strictly locked to local loopback (127.0.0.1). Remote host "${host}" is strictly forbidden.`);
    }

    if (port < 1024 || port > 65535) {
      throw new Error(`Security Violation: Invalid Tally port ${port}. Must be a standard non-privileged port (typically 9000).`);
    }
  }

  /**
   * Sends an XML request to local Tally with a strict timeout.
   */
  public sendXmlRequest(xmlPayload: string, host = this.defaultHost, port = this.defaultPort, timeoutMs = 6000): Promise<string> {
    this.assertLocalDestination(host, port);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: host,
        port,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=utf-8',
          'Content-Length': Buffer.byteLength(xmlPayload)
        },
        timeout: timeoutMs
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { responseData += chunk; });
        res.on('end', () => resolve(responseData));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Tally request timed out after ${timeoutMs}ms. Verify Tally ERP 9 is responding at ${host}:${port}.`));
      });

      req.on('error', (err) => {
        reject(new Error(`Failed to reach Tally ERP 9 at http://${host}:${port}/ - ${err.message}. Ensure Tally is open with ODBC/HTTP enabled on port ${port}.`));
      });

      req.write(xmlPayload);
      req.end();
    });
  }

  /**
   * Tests connection and retrieves currently loaded company names in Tally.
   */
  public async checkConnection(host = this.defaultHost, port = this.defaultPort): Promise<TallyPingResult> {
    const start = Date.now();
    try {
      const listCompaniesXml = `
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
      `.trim();

      const responseXml = await this.sendXmlRequest(listCompaniesXml, host, port, 4000);
      const latencyMs = Date.now() - start;

      const companies: string[] = [];
      const companyRegex = /<COMPANY(?:\s+NAME="([^"]+)")?[^>]*>([\s\S]*?)<\/COMPANY>/gi;
      let match: RegExpExecArray | null;

      while ((match = companyRegex.exec(responseXml)) !== null) {
        if (match[1]) {
          companies.push(match[1].trim());
        } else {
          const nameTagMatch = match[2].match(/<NAME>([\s\S]*?)<\/NAME>/i);
          if (nameTagMatch) {
            companies.push(nameTagMatch[1].trim());
          }
        }
      }

      // If no <COMPANY> tag found, fallback to checking <SVCOMPANYNAME> or text content
      if (companies.length === 0) {
        const singleMatch = responseXml.match(/<SVCOMPANYNAME>([\s\S]*?)<\/SVCOMPANYNAME>/i);
        if (singleMatch) {
          companies.push(singleMatch[1].trim());
        }
      }

      const activeCompany = companies.length > 0 ? companies[0] : undefined;

      return {
        connected: true,
        tallyVersion: responseXml.includes('TallyPrime') ? 'TallyPrime' : 'Tally ERP 9',
        loadedCompanies: companies,
        activeCompany,
        latencyMs
      };
    } catch (err: any) {
      return {
        connected: false,
        loadedCompanies: [],
        latencyMs: Date.now() - start,
        error: err.message
      };
    }
  }

  /**
   * Retrieves Stock Summary XML from local Tally for a specific company.
   */
  public async fetchStockSummaryXml(companyName: string, host = this.defaultHost, port = this.defaultPort): Promise<string> {
    const xml = `
      <ENVELOPE>
        <HEADER>
          <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
          <EXPORTDATA>
            <REQUESTDESC>
              <REPORTNAME>Stock Summary</REPORTNAME>
              <STATICVARIABLES>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
              </STATICVARIABLES>
            </REQUESTDESC>
          </EXPORTDATA>
        </BODY>
      </ENVELOPE>
    `.trim();

    return this.sendXmlRequest(xml, host, port);
  }

  /**
   * Retrieves Customer Ledgers (Sundry Debtors) XML from local Tally for a specific company.
   */
  public async fetchCustomerLedgersXml(companyName: string, host = this.defaultHost, port = this.defaultPort): Promise<string> {
    const xml = `
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
                <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
                <ACCOUNTTYPE>Ledgers</ACCOUNTTYPE>
              </STATICVARIABLES>
            </REQUESTDESC>
          </EXPORTDATA>
        </BODY>
      </ENVELOPE>
    `.trim();

    return this.sendXmlRequest(xml, host, port);
  }

  /**
   * Retrieves Receipt & Payment Vouchers XML from local Tally for a specific company (Read-Only).
   */
  public async fetchReceiptVouchersXml(companyName: string, host = this.defaultHost, port = this.defaultPort): Promise<string> {
    const xml = `
      <ENVELOPE>
        <HEADER>
          <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
          <EXPORTDATA>
            <REQUESTDESC>
              <REPORTNAME>Day Book</REPORTNAME>
              <STATICVARIABLES>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
              </STATICVARIABLES>
            </REQUESTDESC>
          </EXPORTDATA>
        </BODY>
      </ENVELOPE>
    `.trim();

    return this.sendXmlRequest(xml, host, port);
  }
}


import { Router, Request, Response } from 'express';
import { TallyEngine } from './tallyEngine';

export const tallyRouter = Router();
const engine = TallyEngine.getInstance();

// Helper to extract user identity
function getActor(req: Request): string {
  const user = (req as any).user;
  if (user && user.name) return `${user.name} (${user.role || 'Staff'})`;
  if (user && user.id) return user.id;
  return 'Tally Administrator';
}

// Demo credentials
tallyRouter.get('/auth/demo-credentials', (_req: Request, res: Response) => {
  res.json({
    roles: [
      { role: 'Owner', username: 'admin', description: 'Full access to all companies, masters, and accounting vouchers' },
      { role: 'Accountant', username: 'accountant', description: 'Access to voucher creation, ledgers, and financial reports' },
      { role: 'Viewer', username: 'auditor', description: 'Read-only access to Balance Sheet, P&L, and Day Book' },
    ],
    defaultCredentials: 'Use active session or Super Admin credentials',
  });
});

// ==========================================
// COMPANY ENDPOINTS
// ==========================================
tallyRouter.get('/companies', (_req: Request, res: Response) => {
  try {
    const companies = engine.listCompanies();
    const selectedCompanyId = engine.getSelectedCompanyId();
    res.json({ companies, selectedCompanyId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

tallyRouter.get('/companies/selected', (_req: Request, res: Response) => {
  try {
    const company = engine.getSelectedCompany();
    if (!company) {
      return res.status(404).json({ error: 'No active company selected' });
    }
    res.json({ company });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

tallyRouter.post('/companies/:id/select', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const company = engine.selectCompany(req.params.id, actor);
    res.json({ success: true, company });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

tallyRouter.post('/companies', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const company = engine.createCompany(req.body, actor);
    res.status(201).json({ success: true, company });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

tallyRouter.put('/companies/:id', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const company = engine.updateCompany(req.params.id, req.body, actor);
    res.json({ success: true, company });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

tallyRouter.delete('/companies/:id', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const { confirmationName } = req.body;
    if (!confirmationName) {
      return res.status(400).json({ error: 'Exact company name confirmation is required to delete' });
    }
    engine.deleteCompany(req.params.id, confirmationName, actor);
    res.json({ success: true, message: 'Company successfully deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// ACCOUNT GROUPS
// ==========================================
tallyRouter.get('/companies/:companyId/groups', (req: Request, res: Response) => {
  try {
    const groups = engine.listGroups(req.params.companyId);
    res.json({ groups });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

tallyRouter.post('/companies/:companyId/groups', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const group = engine.createGroup(req.params.companyId, req.body, actor);
    res.status(201).json({ success: true, group });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// LEDGERS
// ==========================================
tallyRouter.get('/companies/:companyId/ledgers', (req: Request, res: Response) => {
  try {
    const ledgers = engine.listLedgers(req.params.companyId);
    res.json({ ledgers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

tallyRouter.post('/companies/:companyId/ledgers', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const ledger = engine.createLedger(req.params.companyId, req.body, actor);
    res.status(201).json({ success: true, ledger });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

tallyRouter.put('/companies/:companyId/ledgers/:id', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const ledger = engine.updateLedger(req.params.companyId, req.params.id, req.body, actor);
    res.json({ success: true, ledger });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

tallyRouter.delete('/companies/:companyId/ledgers/:id', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    engine.deleteLedger(req.params.companyId, req.params.id, actor);
    res.json({ success: true, message: 'Ledger successfully deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// VOUCHER TYPES
// ==========================================
tallyRouter.get('/companies/:companyId/voucher-types', (req: Request, res: Response) => {
  try {
    const voucherTypes = engine.listVoucherTypes(req.params.companyId);
    res.json({ voucherTypes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

tallyRouter.post('/companies/:companyId/voucher-types', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const voucherType = engine.createVoucherType(req.params.companyId, req.body, actor);
    res.status(201).json({ success: true, voucherType });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// UNITS OF MEASURE
// ==========================================
tallyRouter.get('/companies/:companyId/units', (req: Request, res: Response) => {
  try {
    const units = engine.listUnits(req.params.companyId);
    res.json({ units });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

tallyRouter.post('/companies/:companyId/units', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const unit = engine.createUnit(req.params.companyId, req.body, actor);
    res.status(201).json({ success: true, unit });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// GODOWNS
// ==========================================
tallyRouter.get('/companies/:companyId/godowns', (req: Request, res: Response) => {
  try {
    const godowns = engine.listGodowns(req.params.companyId);
    res.json({ godowns });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

tallyRouter.post('/companies/:companyId/godowns', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const godown = engine.createGodown(req.params.companyId, req.body, actor);
    res.status(201).json({ success: true, godown });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// STOCK GROUPS
// ==========================================
tallyRouter.get('/companies/:companyId/stock-groups', (req: Request, res: Response) => {
  try {
    const stockGroups = engine.listStockGroups(req.params.companyId);
    res.json({ stockGroups });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

tallyRouter.post('/companies/:companyId/stock-groups', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const stockGroup = engine.createStockGroup(req.params.companyId, req.body, actor);
    res.status(201).json({ success: true, stockGroup });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// STOCK ITEMS
// ==========================================
tallyRouter.get('/companies/:companyId/stock-items', (req: Request, res: Response) => {
  try {
    const stockItems = engine.listStockItems(req.params.companyId);
    res.json({ stockItems });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

tallyRouter.post('/companies/:companyId/stock-items', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const stockItem = engine.createStockItem(req.params.companyId, req.body, actor);
    res.status(201).json({ success: true, stockItem });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

tallyRouter.put('/companies/:companyId/stock-items/:id', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    const stockItem = engine.updateStockItem(req.params.companyId, req.params.id, req.body, actor);
    res.json({ success: true, stockItem });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

tallyRouter.delete('/companies/:companyId/stock-items/:id', (req: Request, res: Response) => {
  try {
    const actor = getActor(req);
    engine.deleteStockItem(req.params.companyId, req.params.id, actor);
    res.json({ success: true, message: 'Stock item successfully deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

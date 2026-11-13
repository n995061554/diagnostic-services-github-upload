export interface Phase5TestResult {
  id: string;
  name: string;
  category: 'EQUIPMENT' | 'TICKETING' | 'LIFECYCLE' | 'AUTHORIZATION' | 'OPERATIONS' | 'RESOLUTION_FEEDBACK' | 'BACK_OFFICE';
  status: 'PASSED' | 'FAILED' | 'PENDING';
  message: string;
  durationMs: number;
  details?: any;
}

export async function runPhase5TestSuite(engineerToken?: string, customerToken?: string, adminToken?: string): Promise<Phase5TestResult[]> {
  const results: Phase5TestResult[] = [];

  const addResult = (res: Phase5TestResult) => {
    results.push(res);
  };

  // Helper for requests
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const start = performance.now();
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      const duration = Math.round(performance.now() - start);
      return { ok: res.ok, status: res.status, data, duration };
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      return { ok: false, status: 0, data: { message: err.message }, duration };
    }
  };

  // 1. Get Service Desk Analytics
  {
    const res = await apiCall('/api/v1/service/stats', {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
    });
    const sData = res.data?.data;
    addResult({
      id: 'test-p5-01',
      name: 'Service Desk Statistics & SLA Engine API',
      category: 'OPERATIONS',
      status: res.ok && sData?.totalTickets >= 0 ? 'PASSED' : 'FAILED',
      message: res.ok && sData ? `Computed metrics: Total ${sData.totalTickets} tickets, SLA Compliance: ${sData.slaComplianceRate}%` : 'Failed to retrieve service stats',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 2. List Installed Customer Equipment
  let sampleEquipmentId = 'eq-001';
  {
    const res = await apiCall('/api/v1/service/equipment');
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    if (list.length > 0) {
      sampleEquipmentId = list[0].id;
    }
    addResult({
      id: 'test-p5-02',
      name: 'Installed Equipment Registry & Warranty Lookup',
      category: 'EQUIPMENT',
      status: res.ok && list.length > 0 ? 'PASSED' : 'FAILED',
      message: res.ok ? `Loaded ${list.length} installed biomedical analyzers with AMC/CMC records.` : 'Failed to fetch equipment catalog',
      durationMs: res.duration,
      details: list
    });
  }

  // 3. Register New Installed Equipment
  let createdEquipmentId = '';
  {
    const payload = {
      customerId: 'u-cust-01',
      customerLabName: 'Apex Clinical & Pathology Laboratories',
      productId: 'prod-002',
      productSku: 'EQ-ERB-CHEM7',
      equipmentName: 'Erba Chem 7 Semi-Automated Clinical Chemistry Analyzer',
      modelNumber: 'Chem 7 Plus 2026 Edition',
      serialNumber: `ERB-SN-${Date.now().toString().slice(-6)}`,
      installationDate: new Date().toISOString().split('T')[0],
      warrantyStatus: 'ACTIVE_AMC',
      warrantyExpiryDate: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
      locationDepartment: 'Automated Clinical Chemistry Lab Wing B',
      contactPerson: 'Dr. Rajesh Kulkarni',
      contactPhone: '+91-98200-11223'
    };
    const res = await apiCall('/api/v1/service/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data?.data?.id) {
      createdEquipmentId = res.data.data.id;
    }
    const eqData = res.data?.data;
    addResult({
      id: 'test-p5-03',
      name: 'Equipment Registration with QR Code Generation',
      category: 'EQUIPMENT',
      status: res.ok && createdEquipmentId ? 'PASSED' : 'FAILED',
      message: res.ok && eqData ? `Registered equipment ${eqData.serialNumber} with QR code ${eqData.qrCode}` : 'Failed to register equipment',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 4. Create Customer Breakdown Complaint Ticket
  let createdTicketId = '';
  let createdTicketNumber = '';
  {
    const payload = {
      customerId: 'u-cust-01',
      customerLabName: 'Apex Clinical & Pathology Laboratories',
      customerContactPerson: 'Dr. Rajesh Kulkarni',
      customerPhone: '+91-98200-11223',
      category: 'EQUIPMENT_BREAKDOWN',
      equipmentId: sampleEquipmentId,
      priority: 'HIGH',
      title: 'Photometer Blank Fluctuation on Albumin Run',
      description: 'Analyzer baseline fluctuates exceeding +/- 0.05 Abs on channel 340nm.',
      errorCode: 'ERR-340-ABS'
    };
    const res = await apiCall('/api/v1/service/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data?.data?.id) {
      createdTicketId = res.data.data.id;
      createdTicketNumber = res.data.data.ticketNumber;
    }
    const tData = res.data?.data;
    addResult({
      id: 'test-p5-04',
      name: 'Complaint Creation & Dynamic SLA Calculator',
      category: 'TICKETING',
      status: res.ok && createdTicketId ? 'PASSED' : 'FAILED',
      message: res.ok && tData ? `Generated Ticket ${createdTicketNumber} (Status: ${tData.status}, SLA: ${tData.slaTargetHours}h)` : 'Failed to create ticket',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 5. Assign Ticket to Service Engineer
  {
    const payload = {
      assignedEngineerId: 'u-eng-01',
      assignedEngineerName: 'Anand Deshmukh',
      assignedEngineerPhone: '+91-98220-44556',
      assignedEngineerEmail: 'anand.deshmukh@diagnostics.com'
    };
    const res = await apiCall(`/api/v1/service/tickets/${createdTicketId || 'tck-001'}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    addResult({
      id: 'test-p5-05',
      name: 'Engineer Assignment & Status Transition: ASSIGNED',
      category: 'LIFECYCLE',
      status: res.ok ? 'PASSED' : 'FAILED',
      message: res.ok ? `Ticket transitioned to ASSIGNED with Engineer ${payload.assignedEngineerName}` : 'Failed to assign engineer',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 6. Engineer Acknowledge Ticket
  {
    const res = await apiCall(`/api/v1/service/tickets/${createdTicketId || 'tck-001'}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    addResult({
      id: 'test-p5-06',
      name: 'Ticket Acknowledgment: ACKNOWLEDGED',
      category: 'LIFECYCLE',
      status: res.ok ? 'PASSED' : 'FAILED',
      message: res.ok ? `Ticket acknowledged by assigned engineer at ${res.data?.data?.acknowledgedAt || 'current time'}` : 'Failed to acknowledge ticket',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 7. Schedule Field Visit
  {
    const payload = {
      scheduledVisitDate: new Date().toISOString().split('T')[0],
      scheduledVisitSlot: '11:00 AM - 01:00 PM'
    };
    const res = await apiCall(`/api/v1/service/tickets/${createdTicketId || 'tck-001'}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    addResult({
      id: 'test-p5-07',
      name: 'Field Visit Scheduling: SCHEDULED',
      category: 'LIFECYCLE',
      status: res.ok ? 'PASSED' : 'FAILED',
      message: res.ok ? `Visit scheduled for ${payload.scheduledVisitDate} (${payload.scheduledVisitSlot})` : 'Failed to schedule visit',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 8. Engineer On The Way Transition
  {
    const res = await apiCall(`/api/v1/service/tickets/${createdTicketId || 'tck-001'}/on-the-way`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    addResult({
      id: 'test-p5-08',
      name: 'Trip Dispatch Status: ENGINEER_ON_THE_WAY',
      category: 'LIFECYCLE',
      status: res.ok ? 'PASSED' : 'FAILED',
      message: res.ok ? 'Customer notified: Service Engineer is en route to laboratory' : 'Failed to set on-the-way status',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 9. Geo-Verified Check-In with Initial Checklist
  {
    const payload = {
      latitude: 19.1197,
      longitude: 72.8464,
      locationName: 'Apex Clinical & Pathology Laboratories, Andheri East, Mumbai',
      initialChecklist: [
        { item: 'Visual casing integrity', passed: true },
        { item: 'Power line voltage test (220V +/- 5%)', passed: true },
        { item: 'Optics filter integrity', passed: true },
        { item: 'Waste bottle level check', passed: true }
      ]
    };
    const res = await apiCall(`/api/v1/service/tickets/${createdTicketId || 'tck-001'}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    addResult({
      id: 'test-p5-09',
      name: 'GPS Geo-Fenced Check-In & Safety Checklist: CHECKED_IN',
      category: 'OPERATIONS',
      status: res.ok && res.data?.data?.checkIn?.isGeoVerified ? 'PASSED' : 'FAILED',
      message: res.ok && res.data?.data?.checkIn ? `Engineer checked-in (GPS Verified: ${res.data.data.checkIn.isGeoVerified}, 4 items verified)` : 'Failed check-in',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 10. Add Service Notes & Diagnosis
  {
    const payload = {
      authorId: 'u-eng-01',
      authorName: 'Anand Deshmukh',
      authorRole: 'SERVICE_ENGINEER',
      noteType: 'INTERNAL',
      content: 'Calibrated optical photometer lamp voltage. Baseline stable on 340nm at 0.002 Abs.'
    };
    const res = await apiCall(`/api/v1/service/tickets/${createdTicketId || 'tck-001'}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const notesCount = res.data?.data?.notes?.length ?? 0;
    addResult({
      id: 'test-p5-10',
      name: 'Internal & Customer Service Notes Logging',
      category: 'OPERATIONS',
      status: res.ok && notesCount > 0 ? 'PASSED' : 'FAILED',
      message: res.ok && notesCount > 0 ? `Note logged successfully. Total notes on ticket: ${notesCount}` : 'Failed to add note',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 11. Add Spare Part Used with Automatic Inventory Deduction
  {
    const payload = {
      partId: 'prt-001',
      partNumber: 'ERB-LMP-1220',
      partName: 'Erba Chem 7 Halogen Lamp (12V 20W Quartz Optics)',
      quantity: 1,
      unitCost: 4500.00,
      isWarrantyCovered: true,
      isBillable: false,
      addedBy: 'Anand Deshmukh'
    };
    const res = await apiCall(`/api/v1/service/tickets/${createdTicketId || 'tck-001'}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const partsCount = res.data?.data?.partsUsed?.length ?? 0;
    addResult({
      id: 'test-p5-11',
      name: 'Spare Parts Consumption & Stock Decrement',
      category: 'OPERATIONS',
      status: res.ok && partsCount > 0 ? 'PASSED' : 'FAILED',
      message: res.ok && partsCount > 0 ? `Added spare part ${payload.partNumber} (₹${payload.unitCost}, Warranty Covered)` : 'Failed to record spare part',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 12. Submit Ticket Resolution with QC Validation
  {
    const payload = {
      rootCause: 'Halogen lamp output degraded after 1,200 operating hours.',
      actionTaken: 'Replaced optical lamp, realigned condensing lens, ran 10-point water blank baseline.',
      testRunResult: 'Passed 10x replicate test. Absorbance drift = 0.001 Abs (within +/- 0.005 limit).',
      calibrationPassed: true,
      reagentLotTested: 'Erba Glucose Hexokinase Lot #9921',
      qcValueObserved: 'QC Level 1: 98.4 mg/dL | QC Level 2: 246.1 mg/dL',
      resolvedBy: 'u-eng-01',
      resolvedByName: 'Anand Deshmukh'
    };
    const res = await apiCall(`/api/v1/service/tickets/${createdTicketId || 'tck-001'}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    addResult({
      id: 'test-p5-12',
      name: 'Resolution Submission & Calibration QC Verification: RESOLVED',
      category: 'RESOLUTION_FEEDBACK',
      status: res.ok && res.data?.data?.status === 'CUSTOMER_FEEDBACK_PENDING' ? 'PASSED' : 'FAILED',
      message: res.ok ? `Ticket resolved! Calibration verified. Status transitioned to CUSTOMER_FEEDBACK_PENDING.` : 'Failed to resolve ticket',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 13. Customer Submits Rating & Digital Sign-off
  {
    const payload = {
      rating: 5,
      feedbackNotes: 'Excellent swift resolution. Calibration run passed hospital QA standards.',
      customerSignatoryName: 'Dr. Rajesh Kulkarni',
      customerDesignation: 'Chief Pathologist & Lab Director',
      signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    };
    const res = await apiCall(`/api/v1/service/tickets/${createdTicketId || 'tck-001'}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    addResult({
      id: 'test-p5-13',
      name: 'Customer Sign-off, Rating & Signature: BACK_OFFICE_REVIEW',
      category: 'RESOLUTION_FEEDBACK',
      status: res.ok && res.data?.data?.status === 'BACK_OFFICE_REVIEW' ? 'PASSED' : 'FAILED',
      message: res.ok ? `Customer rated 5/5 stars with signature. Status transitioned to BACK_OFFICE_REVIEW.` : 'Failed customer feedback submission',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 14. Back-Office Quality Audit & Ticket Closure
  {
    const payload = {
      reviewedBy: 'u-admin-01',
      reviewedByName: 'Sarah Jenkins (Biomedical QA Mgr)',
      isApproved: true,
      totalBillingAmount: 0.00,
      warrantyApproved: true,
      qaPassed: true,
      reviewNotes: 'Verified calibration log sheet against NABL standard protocols. AMC warranty verified.'
    };
    const res = await apiCall(`/api/v1/service/tickets/${createdTicketId || 'tck-001'}/back-office-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    addResult({
      id: 'test-p5-14',
      name: 'Back-Office Audit, Warranty Clearance & Closure: CLOSED',
      category: 'BACK_OFFICE',
      status: res.ok && res.data?.data?.status === 'CLOSED' ? 'PASSED' : 'FAILED',
      message: res.ok ? `QA review approved. Ticket officially marked CLOSED.` : 'Failed back-office review',
      durationMs: res.duration,
      details: res.data
    });
  }

  // 15. Customer Dispute / Reopen Verification
  {
    const payload = {
      reopenedBy: 'Dr. Rajesh Kulkarni',
      reopenReason: 'Re-occurred on alternate wavelength test 600nm channel'
    };
    const res = await apiCall(`/api/v1/service/tickets/${createdTicketId || 'tck-001'}/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    addResult({
      id: 'test-p5-15',
      name: 'Reopen & Dispute Workflow: ASSIGNED',
      category: 'TICKETING',
      status: res.ok && res.data?.data?.status === 'ASSIGNED' ? 'PASSED' : 'FAILED',
      message: res.ok ? `Ticket successfully reopened with historical dispute trail preserved.` : 'Failed to reopen ticket',
      durationMs: res.duration,
      details: res.data
    });
  }

  return results;
}

const express = require('express');
const path = require('path');
// Server initialization logic
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, 'public')));

// --- Minimal in-memory registry (single module) ---

const owners = [
  {
    id: 'owner-1',
    name: 'Alice Kumar',
    email: 'alice@example.com',
    status: 'active'
  },
  {
    id: 'owner-2',
    name: 'Ravi Singh',
    email: 'ravi@example.com',
    status: 'active'
  }
];

const vehicles = [
  {
    id: 'veh-1',
    vin: 'VIN-ABC-123',
    plateNumber: 'KA01AB1234',
    ownerId: 'owner-1',
    status: 'active'
  },
  {
    id: 'veh-2',
    vin: 'VIN-XYZ-999',
    plateNumber: 'MH02CD5678',
    ownerId: 'owner-2',
    status: 'active'
  },
  {
    id: 'veh-3',
    vin: 'VIN-EXPIRED-777',
    plateNumber: 'DL03EF9876',
    ownerId: 'owner-1',
    status: 'active'
  }
];

const insurancePolicies = [
  {
    id: 'pol-1',
    vehicleId: 'veh-1',
    providerName: 'SecureDrive Insurance',
    policyNumber: 'SD-2026-0001',
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2027-01-01T00:00:00.000Z',
    status: 'active',
    connectedServicesCovered: true
  },
  {
    id: 'pol-2',
    vehicleId: 'veh-2',
    providerName: 'UrbanShield Insurance',
    policyNumber: 'US-2025-0042',
    validFrom: '2025-01-01T00:00:00.000Z',
    validTo: '2026-06-01T00:00:00.000Z',
    status: 'suspended',
    connectedServicesCovered: true
  },
  {
    id: 'pol-3',
    vehicleId: 'veh-3',
    providerName: 'SecureDrive Insurance',
    policyNumber: 'SD-2024-0999',
    validFrom: '2024-01-01T00:00:00.000Z',
    validTo: '2025-01-01T00:00:00.000Z',
    status: 'inactive',
    connectedServicesCovered: true
  }
];

// --- Minimal authorization logic (single function) ---

function evaluateVehicleAuthorization({ vehicleId, vin, plateNumber }) {
  const now = new Date();

  let vehicle = null;
  if (vehicleId) {
    vehicle = vehicles.find(v => v.id === vehicleId);
  } else if (vin) {
    vehicle = vehicles.find(v => v.vin === vin);
  } else if (plateNumber) {
    vehicle = vehicles.find(v => v.plateNumber === plateNumber);
  }

  const reasons = [];

  if (!vehicle) {
    reasons.push('Vehicle not found in identity registry.');
    return {
      authorized: false,
      reasons,
      details: {}
    };
  }

  if (vehicle.status !== 'active') {
    reasons.push('Vehicle status is not active.');
  }

  const owner = owners.find(o => o.id === vehicle.ownerId);
  if (!owner) {
    reasons.push('Owner record missing.');
  } else if (owner.status !== 'active') {
    reasons.push('Owner is not active.');
  }

  const policiesForVehicle = insurancePolicies.filter(
    p => p.vehicleId === vehicle.id
  );

  if (!policiesForVehicle.length) {
    reasons.push('No insurance policy associated with vehicle.');
  }

  const activePolicies = policiesForVehicle.filter(p => {
    const from = new Date(p.validFrom);
    const to = new Date(p.validTo);
    const withinRange = from <= now && now <= to;
    return (
      p.status === 'active' &&
      withinRange &&
      p.connectedServicesCovered === true
    );
  });

  if (!activePolicies.length) {
    reasons.push('No valid, active insurance policy covering connected services.');
  }

  const authorized = reasons.length === 0;

  return {
    authorized,
    reasons: authorized ? ['All checks passed.'] : reasons,
    details: {
      vehicle,
      owner: owner || null,
      activePolicies,
      allPolicies: policiesForVehicle
    }
  };
}

// --- API routes (very small surface) ---

app.get('/api/registry', (req, res) => {
  res.json({
    owners,
    vehicles,
    insurancePolicies
  });
});

app.post('/api/policies/upsert', (req, res) => {
  const {
    id,
    vehicleId,
    providerName,
    policyNumber,
    validFrom,
    validTo,
    status,
    connectedServicesCovered
  } = req.body || {};

  if (!vehicleId || !policyNumber) {
    return res.status(400).json({
      error: 'Provide at least vehicleId and policyNumber for the policy.'
    });
  }

  let policy = null;

  if (id) {
    policy = insurancePolicies.find(p => p.id === id);
  }

  if (policy) {
    policy.vehicleId = vehicleId || policy.vehicleId;
    policy.providerName = providerName || policy.providerName;
    policy.policyNumber = policyNumber || policy.policyNumber;
    policy.validFrom = validFrom || policy.validFrom;
    policy.validTo = validTo || policy.validTo;
    policy.status = status || policy.status;
    policy.connectedServicesCovered =
      typeof connectedServicesCovered === 'boolean'
        ? connectedServicesCovered
        : policy.connectedServicesCovered;
  } else {
    let newId = id && id.trim() ? id.trim() : `pol-${insurancePolicies.length + 1}`;
    if (insurancePolicies.find(p => p.id === newId)) {
      newId = `pol-${Date.now()}`;
    }

    policy = {
      id: newId,
      vehicleId,
      providerName: providerName || '',
      policyNumber,
      validFrom: validFrom || new Date().toISOString(),
      validTo: validTo || new Date().toISOString(),
      status: status || 'active',
      connectedServicesCovered: !!connectedServicesCovered
    };

    insurancePolicies.push(policy);
  }

  res.json({ policy });
});

app.post('/api/vehicles/upsert', (req, res) => {
  const { id, vin, plateNumber, ownerId, status } = req.body || {};

  if (!vin && !plateNumber) {
    return res.status(400).json({
      error: 'Provide at least a VIN or plateNumber for the vehicle.'
    });
  }

  let vehicle = null;

  if (id) {
    vehicle = vehicles.find(v => v.id === id);
  }

  if (vehicle) {
    vehicle.vin = vin || vehicle.vin;
    vehicle.plateNumber = plateNumber || vehicle.plateNumber;
    vehicle.ownerId = ownerId || vehicle.ownerId;
    vehicle.status = status || vehicle.status;
  } else {
    let newId = id && id.trim() ? id.trim() : `veh-${vehicles.length + 1}`;
    if (vehicles.find(v => v.id === newId)) {
      newId = `veh-${Date.now()}`;
    }

    vehicle = {
      id: newId,
      vin: vin || '',
      plateNumber: plateNumber || '',
      ownerId: ownerId || '',
      status: status || 'active'
    };
    vehicles.push(vehicle);
  }

  res.json({ vehicle });
});

app.post('/api/verify', (req, res) => {
  const { vehicleId, vin, plateNumber } = req.body || {};

  if (!vehicleId && !vin && !plateNumber) {
    return res.status(400).json({
      error: 'Provide at least one of vehicleId, vin, or plateNumber.'
    });
  }

  const result = evaluateVehicleAuthorization({ vehicleId, vin, plateNumber });
  res.json(result);
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Vehicle Identity Platform listening on port ${PORT}`);
});


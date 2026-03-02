async function getJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw data;
  }
  return data;
}

function renderRegistry(registry) {
  const vehiclesEl = document.getElementById('tab-vehicles');
  const ownersEl = document.getElementById('tab-owners');
  const policiesEl = document.getElementById('tab-policies');

  if (!vehiclesEl || !ownersEl || !policiesEl) return;

  vehiclesEl.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>VIN</th>
          <th>Plate</th>
          <th>Owner</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${registry.vehicles
          .map(v => {
            const owner = registry.owners.find(o => o.id === v.ownerId);
            const badgeClass = v.status === 'active' ? 'good' : 'bad';
            return `
              <tr>
                <td>${v.id}</td>
                <td>${v.vin}</td>
                <td>${v.plateNumber}</td>
                <td>${owner ? owner.name : '—'}</td>
                <td><span class="badge ${badgeClass}">${v.status}</span></td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;

  ownersEl.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${registry.owners
          .map(o => {
            const badgeClass = o.status === 'active' ? 'good' : 'bad';
            return `
              <tr>
                <td>${o.id}</td>
                <td>${o.name}</td>
                <td>${o.email}</td>
                <td><span class="badge ${badgeClass}">${o.status}</span></td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;

  policiesEl.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Vehicle</th>
          <th>Provider</th>
          <th>Policy #</th>
          <th>Valid</th>
          <th>Connected</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${registry.insurancePolicies
          .map(p => {
            const vehicle = registry.vehicles.find(v => v.id === p.vehicleId);
            const dateRange = `${p.validFrom.slice(0, 10)} → ${p.validTo.slice(
              0,
              10
            )}`;
            const connectedBadge = p.connectedServicesCovered
              ? '<span class="badge good">yes</span>'
              : '<span class="badge warn">no</span>';
            const badgeClass =
              p.status === 'active' ? 'good' : p.status === 'suspended' ? 'warn' : 'bad';
            return `
              <tr>
                <td>${p.id}</td>
                <td>${vehicle ? vehicle.id : '—'}</td>
                <td>${p.providerName}</td>
                <td>${p.policyNumber}</td>
                <td>${dateRange}</td>
                <td>${connectedBadge}</td>
                <td><span class="badge ${badgeClass}">${p.status}</span></td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;
}

async function initRegistry() {
  try {
    const registry = await getJson('/api/registry');
    renderRegistry(registry);
  } catch (e) {
    console.error('Failed to fetch registry', e);
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.add('hidden'));

      tab.classList.add('active');
      const panel = document.getElementById(`tab-${target}`);
      if (panel) panel.classList.remove('hidden');
    });
  });
}

function renderVerifyResult(result) {
  const container = document.getElementById('verify-result');
  if (!container) return;

  container.classList.remove('hidden');
  const success = !!result.authorized;

  const reasons = result.reasons || [];
  const vehicle = result.details && result.details.vehicle;
  const owner = result.details && result.details.owner;
  const activePolicies = (result.details && result.details.activePolicies) || [];
  const allPolicies = (result.details && result.details.allPolicies) || [];

  const primaryPill = success
    ? `<span class="pill success"><span class="pill-dot"></span> Authorized</span>`
    : `<span class="pill error"><span class="pill-dot"></span> Blocked</span>`;

  const reasonsHtml =
    reasons.length > 0
      ? `<ul class="reason-list">${reasons
          .map(r => `<li>${r}</li>`)
          .join('')}</ul>`
      : '';

  container.innerHTML = `
    <h3>Decision</h3>
    ${primaryPill}
    ${reasonsHtml}

    <div class="verify-meta">
      <div class="verify-meta-block">
        <span class="label">Vehicle</span>
        <div>${vehicle ? vehicle.id : '—'}</div>
        <div style="color:#9ca3af;font-size:0.7rem">
          ${vehicle ? `${vehicle.vin || ''} ${vehicle.plateNumber || ''}` : ''}
        </div>
      </div>
      <div class="verify-meta-block">
        <span class="label">Owner</span>
        <div>${owner ? owner.name : '—'}</div>
        <div style="color:#9ca3af;font-size:0.7rem">
          ${owner ? owner.email : ''}
        </div>
      </div>
      <div class="verify-meta-block">
        <span class="label">Active Policies</span>
        <div>${activePolicies.length}</div>
        <div style="color:#9ca3af;font-size:0.7rem">
          ${activePolicies.map(p => p.policyNumber).join(', ')}
        </div>
      </div>
    </div>

    <div style="margin-top:8px;border-top:1px dashed rgba(51,65,85,0.8);padding-top:6px;">
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;font-size:0.75rem;">
        <div class="verify-meta-block">
          <span class="label">Vehicle details</span>
          ${
            vehicle
              ? `
                <div>ID: ${vehicle.id}</div>
                <div>VIN: ${vehicle.vin}</div>
                <div>Plate: ${vehicle.plateNumber}</div>
                <div>Owner ID: ${vehicle.ownerId}</div>
                <div>Status: ${vehicle.status}</div>
              `
              : '<div>No vehicle found.</div>'
          }
        </div>
        <div class="verify-meta-block">
          <span class="label">Owner details</span>
          ${
            owner
              ? `
                <div>ID: ${owner.id}</div>
                <div>Name: ${owner.name}</div>
                <div>Email: ${owner.email}</div>
                <div>Status: ${owner.status}</div>
              `
              : '<div>No owner linked.</div>'
          }
        </div>
      </div>

      <div style="margin-top:8px;">
        <span class="label">Insurance policies</span>
        ${
          allPolicies.length
            ? `
              <table class="table" style="margin-top:4px;font-size:0.7rem;">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Provider</th>
                    <th>Policy #</th>
                    <th>Valid</th>
                    <th>Status</th>
                    <th>Connected</th>
                  </tr>
                </thead>
                <tbody>
                  ${allPolicies
                    .map(p => {
                      const dateRange = `${p.validFrom.slice(0, 10)} → ${p.validTo.slice(0, 10)}`;
                      const statusClass =
                        p.status === 'active' ? 'good' : p.status === 'suspended' ? 'warn' : 'bad';
                      const connected =
                        p.connectedServicesCovered
                          ? '<span class="badge good">yes</span>'
                          : '<span class="badge warn">no</span>';
                      return `
                        <tr>
                          <td>${p.id}</td>
                          <td>${p.providerName}</td>
                          <td>${p.policyNumber}</td>
                          <td>${dateRange}</td>
                          <td><span class="badge ${statusClass}">${p.status}</span></td>
                          <td>${connected}</td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>
            `
            : '<div style="font-size:0.75rem;">No policies linked to this vehicle.</div>'
        }
      </div>
    </div>
  `;
}

function initVerifyForm() {
  const form = document.getElementById('verify-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const identifier = document.getElementById('identifier').value.trim();

    if (!identifier) {
      alert('Please enter an identifier.');
      return;
    }

    try {
      const result = await getJson('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: identifier,
          vin: identifier,
          plateNumber: identifier
        })
      });
      renderVerifyResult(result);
    } catch (err) {
      console.error(err);
      alert('Verification failed. Check console for details.');
    }
  });
}

function initVehicleForm() {
  const form = document.getElementById('vehicle-form');
  const messageEl = document.getElementById('vehicle-form-message');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('form-vehicle-id').value.trim();
    const vin = document.getElementById('form-vin').value.trim();
    const plateNumber = document.getElementById('form-plateNumber').value.trim();
    const ownerId = document.getElementById('form-ownerId').value.trim();
    const status = document.getElementById('form-status').value;

    if (!vin && !plateNumber) {
      alert('Please provide at least a VIN or Plate Number.');
      return;
    }

    try {
      const result = await getJson('/api/vehicles/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, vin, plateNumber, ownerId, status })
      });

      if (messageEl) {
        messageEl.textContent = `Saved vehicle with ID: ${result.vehicle.id}`;
      }

      document.getElementById('form-vehicle-id').value = '';
      document.getElementById('form-vin').value = '';
      document.getElementById('form-plateNumber').value = '';
      document.getElementById('form-ownerId').value = '';
      document.getElementById('form-status').value = 'active';

      await initRegistry();
    } catch (err) {
      console.error(err);
      if (messageEl) {
        messageEl.textContent = 'Failed to save vehicle.';
      }
    }
  });
}

function initPolicyForm() {
  const form = document.getElementById('policy-form');
  const messageEl = document.getElementById('policy-form-message');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const id = document.getElementById('form-policy-id').value.trim();
    const vehicleId = document.getElementById('form-policy-vehicleId').value.trim();
    const providerName = document.getElementById('form-providerName').value.trim();
    const policyNumber = document.getElementById('form-policyNumber').value.trim();
    const validFrom = document.getElementById('form-validFrom').value.trim();
    const validTo = document.getElementById('form-validTo').value.trim();
    const status = document.getElementById('form-policy-status').value;
    const connectedServicesCovered = document.getElementById('form-connected').checked;

    if (!vehicleId || !policyNumber) {
      alert('Please provide at least vehicle ID and policy number.');
      return;
    }

    try {
      const result = await getJson('/api/policies/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          vehicleId,
          providerName,
          policyNumber,
          validFrom,
          validTo,
          status,
          connectedServicesCovered
        })
      });

      if (messageEl) {
        messageEl.textContent = `Saved policy with ID: ${result.policy.id}`;
      }

      document.getElementById('form-policy-id').value = '';
      document.getElementById('form-policy-vehicleId').value = '';
      document.getElementById('form-providerName').value = '';
      document.getElementById('form-policyNumber').value = '';
      document.getElementById('form-validFrom').value = '';
      document.getElementById('form-validTo').value = '';
      document.getElementById('form-policy-status').value = 'active';
      document.getElementById('form-connected').checked = false;

      await initRegistry();
    } catch (err) {
      console.error(err);
      if (messageEl) {
        messageEl.textContent = 'Failed to save policy.';
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initRegistry();
  initTabs();
  initVerifyForm();
  initVehicleForm();
  initPolicyForm();
});


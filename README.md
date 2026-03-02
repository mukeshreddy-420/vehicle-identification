# 🚗 Vehicle, Owner & Insurance Identity Management Platform

## 📌 Overview

This project implements a lightweight **Vehicle Identity & Authorization Platform** designed to answer one core business question:

> **Is this vehicle allowed to interact with our connected-vehicle services right now?**

The system evaluates:

* ✅ Vehicle identity
* ✅ Ownership status
* ✅ Insurance coverage (including connected-services eligibility and validity window)

It acts as a **mini authorization gateway** in front of a connected-vehicle ecosystem, deciding whether to allow or block vehicle access based on identity and policy rules.

---

## 🏗 Architecture

The solution is built using:

* **Node.js**
* **Express.js**
* Static **HTML/CSS/JavaScript** frontend
* In-memory data registry (no database required)

### High-Level Design

The system consists of:

1. **Backend Service (Express)**

   * Maintains identity registry in memory
   * Runs authorization logic
   * Exposes REST APIs

2. **Frontend UI**

   * Displays registry data
   * Runs authorization checks
   * Allows live creation and updates of vehicles and policies

---

## 📂 Data Model

The system manages three identity domains:

### 👤 Owners

Each owner contains:

* `ownerId`
* `name`
* `email`
* `status` (active / inactive)

If an owner is not active, their vehicles cannot be authorized.

---

### 🚘 Vehicles

Each vehicle contains:

* `vehicleId`
* `vin`
* `plateNumber`
* `ownerId`
* `status` (active / revoked)

Vehicles are the primary entity evaluated for authorization.

---

### 🛡 Insurance Policies

Each policy contains:

* `policyId`
* `vehicleId`
* `provider`
* `policyNumber`
* `validFrom`
* `validTo`
* `status` (active / suspended / inactive)
* `coversConnectedServices` (true / false)

A vehicle must have a currently valid and active insurance policy covering connected services to be authorized.

---

## 🔎 Authorization Logic

When a request is made to verify a vehicle, the backend performs the following checks:

1. **Vehicle Lookup**

   * Accepts `vehicleId`, `VIN`, or `plateNumber`
   * If not found → Blocked

2. **Vehicle Status**

   * Must be `active`

3. **Owner Validation**

   * Owner must exist
   * Owner must be `active`

4. **Insurance Validation**

   * At least one policy must:

     * Be `active`
     * Be within validity dates
     * Cover connected services

### ✅ If all checks pass:

```
authorized = true
reason = "All checks passed."
```

### ❌ If any check fails:

```
authorized = false
reasons = detailed list of failures
```

The response includes:

* Vehicle details
* Owner details
* All linked policies
* Currently valid policies

This makes the decision process transparent and auditable.

---

## 🌐 API Endpoints

### 📌 GET `/api/registry`

Returns all:

* Owners
* Vehicles
* Insurance policies

---

### 📌 POST `/api/vehicles/upsert`

Creates or updates a vehicle.

Requirements:

* At least one of VIN or Plate Number
* If ID exists → update
* If new → create

---

### 📌 POST `/api/policies/upsert`

Creates or updates an insurance policy.

Requirements:

* `vehicleId`
* `policyNumber`

---

### 📌 POST `/api/verify`

Verifies authorization.

Accepts:

* `vehicleId`
* `vin`
* `plateNumber`

Returns:

* `authorized` (true/false)
* `reasons`
* `details`

This is the main authorization gateway endpoint.

---



### 📊 View Registry

Tabs for:

* Vehicles
* Owners
* Insurance Policies

Status indicators use color-coded badges for clarity.

---

### ✅ Fully Compliant Vehicle

* Active vehicle
* Active owner
* Valid active policy covering connected services
  → Result: **Authorized**

---

### ❌ Suspended Policy

* Policy status = suspended
  → Result: **Blocked**

---

### ❌ Expired Policy

* validTo date in the past
  → Result: **Blocked**

---

### ➕ Add New Vehicle Without Insurance

→ Blocked

Add valid policy →
→ Authorization switches to **Authorized**

---

## ⚙️ How To Run (Windows + VS Code)

### 1️⃣ Install Node.js

Check installation:

```
node -v
npm -v
```

If not installed, download from:
[https://nodejs.org](https://nodejs.org)

---

### 3️⃣ Install Dependencies

In VS Code terminal:

```
npm install
```

---

### 4️⃣ Start Server

```
npm start
```

You should see:

```
Server listening on port 3000
```

---

### 5️⃣ Open Browser

Navigate to:

```
http://localhost:3000
```

---

### 6️⃣ Stop Server

Press:

```
CTRL + C
```

---

## 🧠 Solution Summary

### Technology Choice

* Node.js + Express backend
* Static frontend
* In-memory registry



This project is for academic and demonstration purposes.
pac


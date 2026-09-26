# StockSense

**Offline-aware inventory management system with an immutable stock ledger and explainable reorder intelligence — built for teams leaving Excel.**

> Built for the Odoo x LPU Jalandhar Hackathon 2026

---

## The Problem

Most small and medium businesses — especially in India — are stuck between two extremes:

- **Excel / simple tools** (spreadsheets, basic free apps) → easy to start, but no real-time multi-user truth, no audit trail, and accuracy collapses as the business grows.
- **Full ERPs** (Odoo, Tally, enterprise systems) → powerful and comprehensive, but heavy, complex to configure, and often assume constant internet connectivity that isn't guaranteed even in tier-1 Indian cities during peak hours.

The middle ground — a system that's simple enough for a team leaving Excel, but trustworthy and structured enough to actually run a warehouse — is poorly served today.

## Existing Solutions — Where They Fall Short

| Tool | Strengths | Weaknesses |
|---|---|---|
| Vyapar | Simple, offline, popular in India | Inventory remains basic — no strong multi-location ledger |
| TallyPrime | Deep multi-godown, CA-trusted | Desktop-heavy, dated UI |
| Zoho Inventory | Clean cloud UI | Free tier limited, features gated behind paid plans |
| Odoo Inventory | Very powerful multi-warehouse & routes | Complex to configure, heavy for teams leaving Excel |
| Marg / Busy | Strong for distribution/pharma | Older interface, desktop-heavy |
| Excel / Sheets | Free, flexible | No real-time truth, no audit trail, breaks at scale |

## Why StockSense Is Different

StockSense is one of the few lightweight inventory systems that combines:

- **An immutable stock ledger** — every stock movement is permanently recorded and traceable, never edited or deleted
- **True multi-location stock visibility** — know exactly what you have, and where, from day one
- **Explainable reorder suggestions** — transparent logic instead of black-box AI:
  > "Based on the last 30 days you move ~12 units/day. At current stock, you have ~3.5 days of cover. Suggested reorder: 80 units."
- **Offline-aware design** — built with the reality of unreliable connectivity in mind
- **A clean, modern UI** — designed for warehouse staff, not just the owner's dashboard

## Core Features

- **Authentication** — signup/login with OTP-based password reset
- **Dashboard** — live KPIs (total stock, low/out-of-stock items, pending receipts & deliveries, scheduled transfers) with filters by document type, status, warehouse, and category
- **Product Management** — name, SKU, category, unit of measure, reorder level
- **Receipts** — record incoming stock from suppliers; validating auto-increases stock
- **Delivery Orders** — pick, pack, and validate outgoing stock; auto-decreases stock
- **Internal Transfers** — move stock between locations (e.g. Main Warehouse → Production Floor), fully logged
- **Stock Adjustments** — reconcile recorded stock vs. physical counts, with every change logged
- **Move History / Ledger** — a complete, append-only audit trail of every stock movement
- **Explainable Reorder Suggestions** — simple, transparent demand-based reorder recommendations
- **Low-stock Alerts** — never get caught out by a stockout

## How It Works — The Ledger Engine

Every operation type (Receipt, Delivery, Internal Transfer, Adjustment) is really just a **stock move** with different source/destination semantics:

| Operation | Source | Destination |
|---|---|---|
| Receipt | Vendor | Warehouse |
| Delivery | Warehouse | Customer |
| Internal Transfer | Location A | Location B |
| Adjustment | Same location | Same location (delta) |

On every **Validate**:
1. Current stock (`stock_quants`) is updated
2. One or more rows are inserted into the immutable ledger (`stock_moves`) — never updated or deleted
3. The operation status is set to `done`

This single rule gives StockSense an audit-grade trail that most lightweight inventory tools skip entirely.

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt

## Data Model (Summary)

- `users` — accounts and roles (manager/staff)
- `categories` — product categories
- `products` — name, SKU, category, unit of measure, reorder level
- `locations` — warehouses, racks, floors (supports nesting)
- `stock_quants` — current stock per product per location
- `operations` — receipts, deliveries, transfers, adjustments (draft → done)
- `stock_moves` — the immutable ledger; append-only, one row per stock movement

## Business Model

| Tier | Price | Features |
|---|---|---|
| Free / Self-hosted | ₹0 | Core inventory, 1 location, immutable ledger |
| Pro | ₹499–999/month | Multi-location, explainable suggestions, alerts, barcode scanning |
| Growth | Custom | API access, advanced reporting, integrations |

**Go-to-market:** Position StockSense as the intelligent inventory layer that plugs into existing GST/billing apps (Vyapar-style) rather than competing directly on billing — a faster, lower-friction path to adoption for MSMEs already using those tools.

## Impact

Inventory mismanagement isn't a rounding error — it's lost revenue, wasted stock, and hours of manual reconciliation for businesses with the least buffer to absorb it. StockSense targets the exact gap between "too simple to trust" and "too complex to adopt," giving small teams real visibility and confidence without the overhead of a full ERP.

## Team

- **Bibek Gorai** — Team Leader

## Hackathon

Odoo x LPU Jalandhar Hackathon 2026 — Problem Statement: StockSense (Inventory Management System)

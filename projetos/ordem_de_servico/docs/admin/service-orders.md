# Service Order Management Module

## Overview

The Service Order (OS) module is the core operational module of ServiceForge. It manages the complete lifecycle of service orders from creation through delivery and closure.

## Architecture

```
src/modules/service-orders/
├── service.ts     # Business logic (50+ methods)
├── types.ts       # TypeScript interfaces (30+ types)
└── seeds.ts       # Seed data for development
```

## Data Model

### ServiceOrder (main entity)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `number` | string | Auto-generated OS number (e.g., SF-000001) |
| `customerId` | string | Reference to Customer |
| `customerName` | string | Denormalized customer name |
| `deviceId` | string? | Reference to Device |
| `deviceInfo` | string? | Device description |
| `technicianId` | string? | Assigned technician |
| `technicianName` | string? | Technician name |
| `priority` | enum | low, medium, high, urgent |
| `status` | string | Current status (Em Aberto, Em Diagnóstico, etc.) |
| `entryDate` | string | Date of entry |
| `deadline` | string? | Service deadline |
| `deliveryDate` | string? | Date of delivery |
| `description` | string | Problem description |
| `diagnosis` | string? | Technical diagnosis |
| `notes` | string? | Internal notes |
| `estimatedValue` | number? | Estimated cost |
| `finalValue` | number? | Final cost |
| `pinned` | boolean | Pin/favorite flag |
| `timeline` | SOTimelineEntry[] | Event history |
| `comments` | SOComment[] | Internal comments |
| `attachments` | SOAttachment[] | File attachments |
| `documents` | SODocumentRef[] | Generated documents |
| `communications` | SOCommunicationRef[] | Communication history |

### Supporting Entities
- **SODiagnostic** — Multi-version diagnostic with revisions
- **SOChecklist** — Receipt/entry checklists with items
- **SOExecutionActivity** — Service execution activities with time tracking
- **SOPhoto** — Photos with categories (entry, diagnosis, execution, exit, return, warranty)
- **SOReturn** — Return/warranty service records
- **SOWarranty** — Warranty tracking (service, part, labor, full)
- **SOBudget** — Multi-version budgets with items, discounts, taxes
- **SOApproval** — Approval workflow (whatsapp, email, sms, portal, in-person)
- **SOPayment** — Payment records with installment support
- **SODelivery** — Delivery/pickup records with checklist
- **SOSignature** — Digital signatures
- **SOReceipt** — Generated receipts (entry, payment, withdrawal, warranty)
- **SOFinancialHistoryEntry** — Financial audit trail
- **SOPortalAccess** — Public portal access records
- **SOTest** — Testing module (functional, visual, stress, burn-in, connectivity, etc.)
- **SOQualityControl** — Quality control (approved/rejected with observations)
- **SOCosts** — Cost analysis (parts, labor, third-party, margin, profit)
- **SOAnalytics** — Analytics data (avg diagnosis/execution/approval times, common defects, most used parts)

## API / Service Methods

### CRUD Operations
- `list()` — List all service orders
- `get(id)` — Get single OS by ID
- `create(data)` — Create new OS with auto-numbering
- `update(id, patch)` — Update OS fields
- `remove(id)` — Delete OS

### Comments (used as Observações)
- `addComment(orderId, data)` — Add comment
- `editComment(orderId, commentId, text)` — Edit comment
- `removeComment(orderId, commentId)` — Remove comment

### Attachments
- `addAttachment(orderId, data)` — Upload attachment
- `removeAttachment(orderId, attachmentId)` — Delete attachment

### Services & Parts
- `addService(orderId, item)` — Add service item
- `addPart(orderId, item)` — Add part item

### Diagnostics
- `getDiagnostic(orderId)` — Get current diagnostic
- `createDiagnostic(orderId, data)` — Create diagnostic revision

### Checklists
- `getChecklists(orderId)` — List checklists
- `createChecklist(orderId, data)` — Create checklist
- `updateChecklistItem(orderId, checklistId, itemId, checked)` — Toggle item

### Execution
- `getExecutionActivities(orderId)` — List activities
- `createExecutionActivity(orderId, data)` — Start activity
- `updateExecutionActivity(orderId, activityId, patch)` — Update activity
- `addExecutionComment(orderId, activityId, text, author, authorId)` — Activity comment

### Time Tracking
- `getTimeTracking(orderId)` — Get time entries
- `startTimeTracking(orderId, ...)` — Start timer
- `updateTimeTracking(orderId, trackingId, patch)` — Pause/resume/complete

### Photos
- `getPhotos(orderId)` — List photos
- `addPhoto(orderId, data)` — Upload photo
- `removePhoto(orderId, photoId)` — Delete photo
- `togglePhotoFavorite(orderId, photoId)` — Toggle favorite

### Returns
- `getReturns(orderId)` — List returns
- `createReturn(orderId, data)` — Create return
- `updateReturn(orderId, returnId, patch)` — Update return

### Warranties
- `getWarranties(orderId)` — List warranties
- `createWarranty(orderId, data)` — Create warranty
- `updateWarranty(orderId, warrantyId, patch)` — Update warranty

### Budget
- `getBudget(orderId)` — Get latest budget
- `getBudgetVersions(orderId)` — All budget versions
- `createBudget(orderId, data)` — Create budget
- `updateBudget(orderId, budgetId, patch)` — Approve/reject budget

### Approval
- `getApproval(orderId)` — Get approval record
- `createApproval(orderId, data)` — Create approval request
- `updateApproval(orderId, approvalId, patch)` — Update approval status

### Payments
- `getPayments(orderId)` — List payments
- `createPayment(orderId, data)` — Add payment
- `confirmPayment(orderId, paymentId)` — Confirm payment

### Delivery & Signature
- `getDelivery(orderId)` — Get delivery record
- `completeDelivery(orderId, data)` — Complete delivery
- `getSignatures(orderId)` — List signatures
- `collectSignature(orderId, data)` — Collect signature

### Receipts
- `getReceipts(orderId)` — List receipts
- `generateReceipt(orderId, type)` — Generate receipt

### Financial History
- `getFinancialHistory(orderId)` — List financial entries
- `addFinancialHistory(orderId, data)` — Add financial entry

### Portal
- `getPortalAccess(orderId)` — Get portal access
- `generatePortalAccess(orderId)` — Generate portal link

### Closing
- `validateClosing(orderId)` — Validate close readiness
- `closeOrder(orderId, userName)` — Close OS

### Dashboard / Stats
- `getDashboardStats()` — Basic status counts
- `getEnhancedDashboardStats()` — Extended stats
- `getEnhancedDashboardStatsV2()` — Full stats with budget/payment data
- `getTechnicianDashboardStats(technicianId?)` — Tech-specific stats
- `getDeviceHistory(deviceId)` — Device service history

### Status Management
- `getStatuses()` — List statuses
- `createStatus(data)` — Custom status
- `updateStatus(id, patch)` — Edit status
- `removeStatus(id)` — Delete status

### Tests (Sprint 29)
- `getTests(orderId)` — List tests
- `createTest(orderId, data)` — Create test
- `updateTest(orderId, testId, patch)` — Update test result
- `removeTest(orderId, testId)` — Remove test
- `canDeliver(orderId)` — Check if all tests passed for delivery

### Quality Control (Sprint 29)
- `getQualityControl(orderId)` — Get latest QC record
- `createQualityControl(orderId, data)` — Approve or reject quality

### Costs (Sprint 29)
- `getCosts(orderId)` — Get cost analysis
- `calculateCosts(orderId)` — Calculate costs from parts/services
- `updateCosts(orderId, patch)` — Update cost fields

### Analytics (Sprint 29)
- `getAnalytics(orderId)` — Get SO analytics (tech times, defects, parts, returns)

### Document Generation (Sprint 29)
- `generateDiagnosticDocument(orderId)` — Generate technical report PDF
- `generateBudgetDocument(orderId)` — Generate budget PDF
- `generateWarrantyCertificate(orderId, warrantyId)` — Generate warranty certificate
- `generateDeliveryReceipt(orderId)` — Generate delivery receipt
- `generateTechnicalReport(orderId)` — Generate technical report

### Utilities
- `reopen(id, userName?)` — Reopen closed/cancelled OS
- `togglePin(id)` — Toggle pinned state
- `generateSONumber(companyId?)` — Generate OS number

## Routes

### List & Create
| Route | Component | Description |
|-------|-----------|-------------|
| `/service-orders` | SOListPage | List with table/kanban views |
| `/service-orders/new` | NewServiceOrderWizard | 5-step creation wizard |

### Detail Tabs
| Route | Tab | Description |
|-------|-----|-------------|
| `/service-orders/$id` | Summary | Overview and actions |
| `/service-orders/$id/diagnostic` | Diagnostic | Multi-version diagnostics |
| `/service-orders/$id/execution` | Execution | Activities and time tracking |
| `/service-orders/$id/budget` | Budget | Multi-version budgets |
| `/service-orders/$id/approval` | Approval | Approval workflow |
| `/service-orders/$id/payments` | Payments | Payment records |
| `/service-orders/$id/delivery` | Delivery | Delivery/pickup |
| `/service-orders/$id/receipts` | Receipts | Generated receipts |
| `/service-orders/$id/signatures` | Signatures | Digital signatures |
| `/service-orders/$id/financialHistory` | Financial | Financial audit trail |
| `/service-orders/$id/portal` | Portal | Public portal access |
| `/service-orders/$id/services` | Services | Service items |
| `/service-orders/$id/parts` | Parts | Part items |
| `/service-orders/$id/returns` | Returns | Return records |
| `/service-orders/$id/warranty` | Warranty | Warranty tracking |
| `/service-orders/$id/timeline` | Timeline | Full event history |
| `/service-orders/$id/comments` | Comments | Internal discussions |
| `/service-orders/$id/documents` | Documents | Generated documents |
| `/service-orders/$id/communications` | Communications | Message history |
| `/service-orders/$id/attachments` | Attachments | File attachments |
| `/service-orders/$id/audit` | Audit | Change audit log |
| `/service-orders/$id/events` | Events | Platform events |
| `/service-orders/$id/photos` | Photos | Photo gallery |
| `/service-orders/$id/recebimento` | Recebimento | Entry receipt info |
| `/service-orders/$id/movimentacoes` | Movimentações | Movement history |
| `/service-orders/$id/observacoes` | Observações | Categorized notes |
| `/service-orders/$id/tests` | Tests | Test management (functional, visual, stress, etc.) |
| `/service-orders/$id/quality` | Quality | Quality control (approve/reject) |
| `/service-orders/$id/costs` | Costs | Cost analysis and profit margin |
| `/service-orders/$id/analytics` | Analytics | Technical KPIs and statistics |
| `/service-orders/$id/knowledge` | Knowledge | Knowledge Platform integration |

### Dashboard
| Route | Description |
|-------|-------------|
| `/service-orders/dashboard` | Stats dashboard with charts |

## Events

The module emits 40+ events:

| Event | Description |
|-------|-------------|
| `service-order.created` | OS created |
| `service-order.updated` | OS updated |
| `service-order.deleted` | OS deleted |
| `service-order.status.changed` | Status transition |
| `service-order.assigned` | Technician assigned |
| `service-order.comment.added` | Comment added |
| `service-order.attachment.added` | File attached |
| `service-order.reopened` | OS reopened |
| `service-order.diagnostic.created` | Diagnostic created |
| `service-order.diagnostic.updated` | Diagnostic updated |
| `service-order.checklist.completed` | Checklist completed |
| `service-order.execution.*` | Execution lifecycle (7 events) |
| `service-order.service.*` | Service items (2 events) |
| `service-order.part.*` | Part items (2 events) |
| `service-order.warranty.*` | Warranty lifecycle (3 events) |
| `service-order.return.*` | Return lifecycle (2 events) |
| `service-order.photo.*` | Photo lifecycle (2 events) |
| `service-order.budget.*` | Budget lifecycle (4 events) |
| `service-order.payment.*` | Payment lifecycle (2 events) |
| `service-order.receipt.generated` | Receipt generated |
| `service-order.signature.collected` | Signature collected |
| `service-order.delivery.completed` | Delivery completed |
| `service-order.closed` | OS closed |
| `service-order.cancelled` | OS cancelled |
| `service-order.delivered` | OS delivered |
| `service-order.returned` | OS returned |
| `service-order.test.created` | Test created |
| `service-order.test.completed` | Test completed (passed/failed) |
| `service-order.quality.approved` | Quality approved |
| `service-order.quality.rejected` | Quality rejected |
| `service-order.costs.calculated` | Costs calculated |
| `service-order.costs.updated` | Costs updated |
| `service-order.analytics.generated` | Analytics generated |

## Lifecycle

1. **Entry** — OS created via dialog or 5-step wizard
2. **Diagnosis** — Technical evaluation with multi-version diagnostic
3. **Budget** — Cost estimate creation and customer approval
4. **Approval** — Customer approval via WhatsApp, email, portal, etc.
5. **Execution** — Service activities with time tracking
6. **Quality Check** — Checklist completion verification
7. **Delivery** — Physical delivery with checklist and signature
8. **Payment** — Payment collection with installment support
9. **Closure** — Financial reconciliation and final status
10. **Warranty** — Post-service warranty tracking

## Seed Data

Located in `src/modules/service-orders/seeds.ts` with extended seeds in `extended-seeds.ts`, `extended-seeds-2.ts` (Sprint 28) and `extended-seeds-3.ts` (Sprint 29 — tests, quality control, costs).

## Knowledge Platform Integration (Sprint 31)

The Service Order workspace includes a **Conhecimento Técnico** tab that integrates with the Knowledge Platform:

- **Automatic recommendations**: Based on the SO's equipment info and defect name, the system searches for relevant knowledge articles
- **Direct search**: Technicians can search the full knowledge base without leaving the SO workspace
- **Scored results**: Articles are ranked by relevance (brand match, model match, defect keywords)
- **Usage metrics**: Each article viewed/used from the SO is tracked for analytics

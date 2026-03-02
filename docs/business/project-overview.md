# Betelgeuse - Splynx Admin Panel

## Overview
Betelgeuse is a React SPA that serves as the administration panel for the Splynx automated ticket management system. It provides tools for managing operators, schedules, tickets, and system configuration through a web interface.

## User Roles

### Admin
Full access to all features and system configuration.

### Operator
Limited access to operator-specific views (operator dashboard, device analysis).

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview of ticket metrics, active operators, and system status |
| **Operator Management** | CRUD operations for operators (active status, WhatsApp numbers, pause states) |
| **Schedule Management** | Configure work, assignment, and alert schedules per operator |
| **WhatsApp Admin** | Send messages, view operator WhatsApp config, health checks |
| **Message Templates** | Manage WhatsApp message templates for notifications |
| **Metrics** | Ticket response time metrics and operator performance |
| **Audit Logs** | View system audit trail and activity logs |
| **Reassignment History** | Track ticket reassignment events |
| **Device Analysis** | Network device analysis with AI feedback |
| **NOC Dashboard** | Network Operations Center dashboard (sites, events, metrics) |

## Operators

| Name | Person ID |
|------|-----------|
| Gabriel | 10 |
| Luis | 27 |
| Cesareo | 37 |
| Yaini | 38 |

## Backend Integration
The frontend communicates with the backend project **Betelgeus_Backend** (Flask) via REST API:
- Development: Vite proxies `/api` to `localhost:5605`
- Production: Nginx proxies `/api` to `backend:7842`

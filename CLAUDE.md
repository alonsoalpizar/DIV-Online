# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DIV - Designer de Integración Visual** is a visual integration orchestration system consisting of two main components:

- **BackendMotor** (Go): Core execution engine that processes integration flows on port 50000
- **div/backend** (Go): Management API for configuration and metadata on port 30000  
- **div/frontend** (React + TypeScript): Visual flow designer interface on port 5173

The system enables visual creation and execution of data integration workflows with support for various node types (entrada, condición, proceso, salida, splitter, subproceso, salida_error).

## Development Commands

### Frontend (div/frontend)
```bash
cd div/frontend
npm run dev          # Start development server (Vite) on port 5173
npm run build        # Build for production (TypeScript + Vite)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend Services
```bash
# Management API (div/backend)
cd div/backend
go run main.go       # Start on port 30000

# Execution Engine (BackendMotor)  
cd BackendMotor
go run cmd/server/main.go  # Start on port 50000
```

### SystemD Services (Production)
```bash
# div-backend.service (Management API)
sudo systemctl restart div-backend.service
systemctl status div-backend.service
journalctl -u div-backend.service -f

# div-backend-motor.service (Execution Engine)
sudo systemctl restart div-backend-motor.service  
systemctl status div-backend-motor.service
journalctl -u div-backend-motor.service -f
```

### Database
Both backends use PostgreSQL with GORM. Connection details configured via environment variables.

## Architecture

### BackendMotor (Execution Engine)
- **Purpose**: Executes integration flows defined in JSON format
- **Port**: 50000
- **Key Components**:
  - `internal/ejecucion/motor.go`: Core flow execution engine
  - `internal/scheduler/`: Task scheduling system for programmed executions
  - `internal/monitoring/`: Prometheus metrics collection
  - Node executors in `internal/ejecucion/ejecutores/`
  - Flow parsing and execution logic

### div/backend (Management API)  
- **Purpose**: CRUD operations for flows, channels, processes, servers, tables, parameters
- **Port**: 30000
- **Key Components**:
  - Controllers for each entity type in `controllers/`
  - Models defining database schema in `models/`
  - CORS middleware configured for frontend communication

### div/frontend (Visual Designer)
- **Purpose**: React-based visual flow designer using ReactFlow
- **Port**: 5173 (Vite dev server)
- **Key Components**:
  - `pages/FlujoCanvas.tsx`: Main flow design interface
  - `nodos/`: Visual node components for different node types
  - `editors/`: Property editors for each node type
  - `hooks/useFlujo.ts`: Flow state management
  - `utils/validarFlujo.ts`: Flow validation logic

### Data Flow
1. Frontend creates/edits flows visually and saves JSON to div/backend
2. div/backend stores flow definitions and metadata in PostgreSQL
3. BackendMotor retrieves and executes flows, either on-demand or scheduled
4. Both backends share the same PostgreSQL database but serve different purposes

### Node Types
- **entrada**: Entry points for data input
- **condición**: Conditional branching logic  
- **proceso**: Data processing steps
- **salida**: Output/result nodes
- **splitter**: Data splitting operations
- **subproceso**: Nested sub-workflows
- **salida_error**: Error handling outputs

### Database Schema
Key models shared between backends:
- `Proceso`: Flow definitions with JSON structure
- `Canal`: Communication channels
- `Servidor`: External server configurations
- `Parametro`: System parameters
- `Tabla`: Table definitions
- `TareaProgramada`: Scheduled task definitions

### Development Workflow
The project uses a structured daily development approach documented in `logs-desarrollo/` with conversation-driven development using AI assistance. Each development session is logged and tracked.

## Testing and Quality

### Frontend Testing
- TypeScript compilation: `npm run build` (includes type checking)
- Linting: `npm run lint`

### Backend Testing  
- Go compilation validation: `go build` in respective directories
- No specific test framework configured - verify functionality through manual testing

## Key Technical Details

### Flow Execution Engine
The core execution logic is in `BackendMotor/internal/ejecucion/motor.go`:
- Loads process definitions from PostgreSQL
- Parses JSON flow structure into executable nodes
- Supports various connectors (REST, SOAP, PostgreSQL) in `ejecutores/`
- Includes monitoring via Prometheus metrics

### Frontend State Management
- Flow state managed via `hooks/useFlujo.ts`
- ReactFlow integration for visual node editor
- Flow validation logic in `utils/validarFlujo.ts` (currently disabled)
- Node editors in `editors/` for each node type configuration

### Database Models
Shared models between backends include:
- Flow definitions stored as JSON in `Proceso.flujo` field
- Channel configurations in `Canal` for external connections
- Server definitions in `Servidor` for endpoint management
- Scheduled executions in `TareaProgramada`
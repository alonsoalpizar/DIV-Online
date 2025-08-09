# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DIV - Designer de Integración Visual** is a visual integration orchestration system consisting of three main components:

- **BackendMotor** (Go 1.23): Core execution engine that processes integration flows on port 50000
- **div/backend** (Go 1.24): Management API for configuration and metadata on port 30000  
- **div/frontend** (React 19 + TypeScript 5.8): Visual flow designer interface on port 5173

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
journalctl -u div-backend-motor.service -f

# div-backend-motor.service (Execution Engine)
sudo systemctl restart div-backend-motor.service  
systemctl status div-backend-motor.service
journalctl -u div-backend-motor.service -f
```

### Database
Both backends use PostgreSQL with GORM. Connection details configured via environment variables in `.env` files.

## Architecture

### BackendMotor (Execution Engine)
- **Purpose**: Executes integration flows defined in JSON format
- **Port**: 50000
- **Key Components**:
  - `internal/ejecucion/motor.go`: Core flow execution engine
  - `internal/scheduler/`: Task scheduling system for programmed executions
  - `internal/monitoring/`: Prometheus metrics collection
  - Node executors in `internal/ejecucion/ejecutores/`
  - SOAP integration in `internal/integraciones/soap/`
  - Flow parsing and execution logic

### div/backend (Management API)  
- **Purpose**: CRUD operations for flows, channels, processes, servers, tables, parameters
- **Port**: 30000
- **Key Components**:
  - Controllers for each entity type in `controllers/`
  - Models defining database schema in `models/`
  - CORS middleware configured for frontend communication
  - Gorilla Mux routing

### div/frontend (Visual Designer)
- **Purpose**: React-based visual flow designer using ReactFlow
- **Port**: 5173 (Vite dev server)
- **Key Components**:
  - `pages/FlujoCanvas.tsx`: Main flow design interface
  - `nodos/`: Visual node components for different node types
  - `editors/`: Property editors for each node type
  - `hooks/useFlujo.ts`: Flow state management
  - `utils/validarFlujo.ts`: Flow validation logic (currently disabled)
  - Drag-and-drop support via @dnd-kit

### Data Flow
1. Frontend creates/edits flows visually and saves JSON to div/backend
2. div/backend stores flow definitions and metadata in PostgreSQL
3. BackendMotor retrieves and executes flows, either on-demand or scheduled
4. Both backends share the same PostgreSQL database but serve different purposes

### Node Types
- **entrada**: Entry points for data input (REST/SOAP/Database)
- **condición**: Conditional branching logic with expression evaluation
- **proceso**: Data processing steps with transformations
- **salida**: Output/result nodes for external systems
- **splitter**: Data splitting operations for parallel processing
- **subproceso**: Nested sub-workflows for modular design
- **salida_error**: Error handling outputs with retry logic

### Database Schema
Key models shared between backends:
- `Proceso`: Flow definitions with JSON structure in `flujo` field
- `Canal`: Communication channels with authentication
- `Servidor`: External server configurations (REST/SOAP endpoints)
- `Parametro`: System-wide configuration parameters
- `Tabla`: Table definitions for database operations
- `TareaProgramada`: Scheduled task definitions with cron expressions
- `Categoria`: Optional categorization for processes

### Key Technical Details

#### Flow Execution Engine
The core execution logic in `BackendMotor/internal/ejecucion/motor.go`:
- Loads process definitions from PostgreSQL using GORM
- Parses JSON flow structure into executable nodes
- Supports various connectors (REST, SOAP, PostgreSQL) in `ejecutores/`
- Dynamic parameter mapping between nodes
- Comprehensive error handling with retry mechanisms
- Prometheus metrics for monitoring execution

#### SOAP Integration
Complete SOAP support in `internal/integraciones/soap/`:
- WSDL parsing and service discovery
- Dynamic SOAP envelope generation
- XML namespace handling
- Complex type mapping

#### Frontend State Management
- Flow state managed via custom `hooks/useFlujo.ts`
- ReactFlow 11 integration for visual node editor
- Flow validation logic in `utils/validarFlujo.ts`
- Node editors in `editors/` for each node type configuration
- Sortable parameter lists with drag-and-drop

#### API Integration
- Frontend uses Axios for HTTP requests
- Dynamic API base URL configuration
- CORS properly configured between services
- JWT authentication support (planned)

### Development Workflow
The project uses a structured daily development approach documented in `logs-desarrollo/` with conversation-driven development using AI assistance. Each development session is logged and tracked.

## Testing and Quality

### Frontend Testing
- TypeScript compilation: `npm run build` (includes strict type checking)
- Linting: `npm run lint` (ESLint with TypeScript rules)

### Backend Testing  
- Go compilation validation: `go build` in respective directories
- No automated test framework configured - verify functionality through manual testing

## Important Dependencies

### BackendMotor
- GORM v1.30.0 for database operations
- Gin v1.10.1 for HTTP routing
- pgx/v5 for PostgreSQL connectivity
- govaluate for expression evaluation
- etree for XML processing

### div/frontend
- React 19.1.0 with TypeScript 5.8.3
- Vite 7.0.4 for build tooling
- ReactFlow 11.11.4 for visual editing
- @dnd-kit for drag-and-drop functionality
- React Router DOM 7.7.0 for routing
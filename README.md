# Intelligent Timetable Generator (Genetic Algorithm)

Production-grade web app for conflict-free academic timetable generation using a Genetic Algorithm.

## Architecture Mapping
- Authentication: backend auth module + admin UI
- Global Configuration: backend config module + admin UI
- Data Management: teachers/classes/subjects + assignments
- Generation Setup: class/semester selection + priorities
- Genetic Algorithm Engine: backend GA service
- Visualization: timetable views + admin overrides

## Repo Structure
- apps/backend: Fastify API server
- apps/frontend: React UI
- shared configuration in root

## Prerequisites
- Node.js 20+
- npm 10+
- (Phase 1+) PostgreSQL 14+

## Quick Start (Phase 0)
1. Install dependencies: `npm install`
2. Start dev servers: `npm run dev`
3. Frontend: http://localhost:5173
4. Backend: http://localhost:4000/health

## Environment
Copy `.env.example` to `.env` and fill in values as needed.
"# Intelligent-Timetable-Generator" 

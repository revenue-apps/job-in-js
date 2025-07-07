# Job-in-JS Folder Structure

This document explains the organized folder structure for the Job-in-JS project with multiple LangGraph workflows.

## 📁 Project Structure

```
job-in-js/
├── src/
│   ├── workflows/                    # All LangGraph workflows
│   │   ├── job-scraping/            # Job scraping workflow
│   │   │   ├── index.js             # Main workflow definition
│   │   │   ├── nodes/               # Workflow-specific nodes
│   │   │   │   ├── urlProcessor.js
│   │   │   │   ├── jobScraper.js
│   │   │   │   ├── dataProcessor.js
│   │   │   │   └── outputGenerator.js
│   │   │   └── types.js             # Workflow-specific state types
│   │   │
│   │   └── job-application/         # Job application workflow
│   │       ├── index.js             # Main workflow definition
│   │       ├── nodes/               # Workflow-specific nodes
│   │       │   ├── jobClassifier.js
│   │       │   ├── applicationRouter.js
│   │       │   ├── easyApplyNode.js
│   │       │   ├── formSubmissionNode.js
│   │       │   ├── resumeUploadNode.js
│   │       │   ├── confirmationHandler.js
│   │       │   ├── errorHandler.js
│   │       │   └── outputGenerator.js
│   │       └── types.js             # Workflow-specific state types
│   │
│   ├── shared/                      # Common components across workflows
│   │   ├── utils/                   # Shared utilities
│   │   │   ├── logger.js
│   │   │   ├── stagehand.js         # Basic Stagehand client
│   │   │   ├── enhancedStagehand.js # Enhanced client for applications
│   │   │   ├── csvReader.js
│   │   │   └── candidateProfile.js
│   │   │
│   │   ├── config/                  # Configuration
│   │   │   └── environment.js
│   │   │
│   │   └── types/                   # Shared type definitions
│   │       ├── common.js            # Common state types
│   │       └── schemas.js           # Zod schemas
│   │
│   ├── entry-points/                # Main application entry points
│   │   ├── jobScraper.js            # CLI for job scraping
│   │   ├── jobApplicator.js         # CLI for job applications
│   │   └── batchProcessor.js        # CLI for batch operations
│   │
│   └── tests/                       # Test files
│       ├── workflows/
│       │   ├── job-scraping.test.js
│       │   └── job-application.test.js
│       └── shared/
│           └── utils.test.js
│
├── data/                            # Data files
│   ├── job_urls.csv
│   ├── sample_candidate.json
│   └── test-data/
│
├── output/                          # Generated outputs
│   ├── scraped-jobs/
│   └── applications/
│
└── logs/                            # Application logs
```

## 🔄 Workflow Organization

### **Job Scraping Workflow** (`src/workflows/job-scraping/`)
- **Purpose**: Extract and process job descriptions from URLs
- **Nodes**: URL validation → Job scraping → Data processing → Output generation
- **Entry Point**: `src/entry-points/jobScraper.js`

### **Job Application Workflow** (`src/workflows/job-application/`)
- **Purpose**: Automatically apply to jobs using candidate data
- **Nodes**: Job classification → Application routing → Form filling → Confirmation handling
- **Entry Point**: `src/entry-points/jobApplicator.js`

## 🔧 Shared Components

### **Utilities** (`src/shared/utils/`)
- `logger.js`: Centralized logging
- `stagehand.js`: Basic Stagehand client for scraping
- `enhancedStagehand.js`: Enhanced client for applications
- `csvReader.js`: CSV file processing
- `candidateProfile.js`: Candidate data management

### **Configuration** (`src/shared/config/`)
- `environment.js`: Environment variables and settings

### **Types** (`src/shared/types/`)
- `common.js`: Common state types across workflows
- `schemas.js`: Zod validation schemas

## 🚀 Usage

### **Job Scraping**
```bash
# Single workflow
npm run scrape

# With mock data
npm run scrape:mock
```

### **Job Applications**
```bash
# Single application
npm run apply <job-url>

# Batch applications
npm run apply:batch

# With mock data
npm run apply:mock
```

### **Testing**
```bash
# Test job scraping
npm run test:scraping

# Test job applications
npm run test:application

# Test all workflows
npm run test:all
```

## 📝 Naming Conventions

### **Workflows**
- Use kebab-case: `job-scraping`, `job-application`
- Each workflow is self-contained in its own folder

### **Nodes**
- Use camelCase: `urlProcessor`, `jobScraper`
- Group related nodes in workflow-specific folders

### **Entry Points**
- Use descriptive names: `jobScraper.js`, `jobApplicator.js`
- Include CLI argument handling

### **Files**
- `index.js`: Main workflow definition
- `types.js`: Workflow-specific state types
- `*.test.js`: Test files

## 🔄 Migration Benefits

### **✅ Clear Separation**
- Each workflow is isolated and self-contained
- Easy to understand what belongs where
- No confusion between different workflows

### **✅ Shared Resources**
- Common utilities in `shared/`
- No code duplication
- Easy to maintain and update

### **✅ Scalability**
- Easy to add new workflows
- Clear pattern to follow
- Consistent structure

### **✅ Testing**
- Workflow-specific tests
- Shared utility tests
- Clear test organization

## 🎯 Best Practices

1. **Keep workflows isolated**: Each workflow should be self-contained
2. **Share common code**: Use `shared/` for utilities used across workflows
3. **Consistent naming**: Follow established naming conventions
4. **Clear entry points**: Each workflow should have a clear CLI entry point
5. **Comprehensive testing**: Test each workflow independently
6. **Documentation**: Keep this structure document updated

## 🔄 Adding New Workflows

To add a new workflow:

1. Create folder: `src/workflows/new-workflow/`
2. Add files: `index.js`, `types.js`, `nodes/` folder
3. Create entry point: `src/entry-points/newWorkflow.js`
4. Add tests: `src/tests/workflows/new-workflow.test.js`
5. Update package.json scripts
6. Update documentation

This structure provides a clean, scalable foundation for managing multiple LangGraph workflows while maintaining code organization and reusability. 
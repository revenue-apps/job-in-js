# Career Page Discovery Pipeline - Implementation Tasks

## 📋 **Task Overview**

This document breaks down the career page discovery pipeline implementation into **Epic Tasks** and **Atomic Subtasks** based on the design specifications. Each epic task will be reviewed upon completion before moving to the next.

## 🎯 **Pipeline Goal**

**Input**: List of companies from CSV
**Output**: Career page URLs with filter parameters in CSV format
**Process**: Find career pages → Navigate to job listings → Analyze filters → Generate metadata

## 📁 **Project Structure**

```
src/new-workflows/job-discovery/
├── index.js                    # Main workflow orchestrator (LangGraph)
├── decisionFunctions.js        # Workflow routing logic
├── TASKS.md                   # This task list
├── CAREER_PAGE_DISCOVERY_DESIGN_SPEC.md  # Complete pipeline design
├── FILTER_ANALYZER_NODE_DESIGN_SPEC.md   # Node 3 design
├── METADATA_CONSTRUCTOR_NODE_DESIGN_SPEC.md # Node 4 design
├── types.js                   # State schema and types
└── nodes/
    ├── careerPageFinderNode.js     # Node 1: Find career homepage
    ├── jobListingsNavigatorNode.js # Node 2: Navigate to job listings
    ├── filterAnalyzerNode.js       # Node 3: Analyze filters & parameters
    └── metadataConstructorNode.js  # Node 4: Generate metadata
```

## 🎯 **Epic Task 1: Project Structure & Foundation Setup**

### **Subtasks:**
- [ ] **1.1** Create `src/new-workflows/job-discovery/` folder structure
- [ ] **1.2** Create `types.js` with career discovery state schema
- [ ] **1.3** Create `index.js` with LangGraph workflow orchestrator
- [ ] **1.4** Create `decisionFunctions.js` with routing logic
- [ ] **1.5** Set up basic workflow with 4 nodes and linear flow
- [ ] **1.6** Create CSV input/output files structure

### **Success Criteria:**
- ✅ Folder structure created
- ✅ State schema defined following job-discovery pattern
- ✅ LangGraph workflow compiles without errors
- ✅ Linear flow: Node 1 → Node 2 → Node 3 → Node 4
- ✅ CSV files structure ready

---

## 🎯 **Epic Task 2: Node 1 - Career Page Finder**

### **Subtasks:**
- [ ] **2.1** Create `nodes/careerPageFinderNode.js`
- [ ] **2.2** Implement incognito Stagehand page creation
- [ ] **2.3** Implement AI-powered Google search with confidence threshold
- [ ] **2.4** Implement fallback domain construction patterns
- [ ] **2.5** Implement career page validation logic
- [ ] **2.6** Add error handling and status updates
- [ ] **2.7** Test with sample companies (Google, Microsoft, Meta)

### **Success Criteria:**
- ✅ Successfully finds career pages for test companies
- ✅ Handles AI search failures with fallback patterns
- ✅ Validates career pages correctly
- ✅ Updates state with career page URL
- ✅ Proper error handling and logging

---

## 🎯 **Epic Task 3: Node 2 - Job Listings Navigator**

### **Subtasks:**
- [ ] **3.1** Create `nodes/jobListingsNavigatorNode.js`
- [ ] **3.2** Implement career homepage loading in incognito page
- [ ] **3.3** Create local JSON store of common CTA phrases
- [ ] **3.4** Implement multiple tab testing for CTA phrases
- [ ] **3.5** Implement job listings page validation
- [ ] **3.6** Implement fallback URL suffix patterns
- [ ] **3.7** Add error handling and status updates
- [ ] **3.8** Test with discovered career pages

### **Success Criteria:**
- ✅ Successfully navigates to job listings pages
- ✅ Handles different CTA patterns across companies
- ✅ Falls back to URL suffixes when navigation fails
- ✅ Updates state with job listings URL
- ✅ Proper error handling and logging

---

## 🎯 **Epic Task 4: Node 3 - Filter Analyzer**

### **Subtasks:**
- [ ] **4.1** Create `nodes/filterAnalyzerNode.js`
- [ ] **4.2** Implement job listings page loading in Stagehand
- [ ] **4.3** Implement AI prompt for filter field discovery
- [ ] **4.4** Implement filter filling with sample values
- [ ] **4.5** Implement search submission and URL capture
- [ ] **4.6** Implement URL parameter extraction and mapping
- [ ] **4.7** Add error handling and status updates
- [ ] **4.8** Test with discovered job listings pages

### **Success Criteria:**
- ✅ Successfully discovers filter fields using AI
- ✅ Fills filters and captures resulting URLs
- ✅ Extracts meaningful parameter names and purposes
- ✅ Updates state with filtered job URL and parameters
- ✅ Proper error handling and logging

---

## 🎯 **Epic Task 5: Node 4 - Metadata Constructor**

### **Subtasks:**
- [ ] **5.1** Create `nodes/metadataConstructorNode.js`
- [ ] **5.2** Implement input data validation
- [ ] **5.3** Implement filter summary building
- [ ] **5.4** Implement CSV row creation
- [ ] **5.5** Implement CSV file append operations
- [ ] **5.6** Implement status updates and logging
- [ ] **5.7** Add error handling for file I/O
- [ ] **5.8** Test with complete pipeline data

### **Success Criteria:**
- ✅ Successfully validates all input data
- ✅ Creates properly formatted CSV rows
- ✅ Appends to existing CSV file correctly
- ✅ Updates status to "discovered"
- ✅ Proper error handling and logging

---

## 🎯 **Epic Task 6: LangGraph Workflow Integration**

### **Subtasks:**
- [ ] **6.1** Implement StateGraph with career discovery state schema
- [ ] **6.2** Add all 4 nodes to workflow using `addNode()`
- [ ] **6.3** Define linear edges between nodes using `addEdge()`
- [ ] **6.4** Set entry point and compile workflow
- [ ] **6.5** Implement CSV batch processing logic
- [ ] **6.6** Implement enhanced Stagehand client integration
- [ ] **6.7** Add workflow execution and error handling
- [ ] **6.8** Test complete pipeline with sample companies

### **Success Criteria:**
- ✅ LangGraph workflow executes all nodes correctly
- ✅ State channels are properly managed
- ✅ Errors are handled appropriately with state propagation
- ✅ CSV batch processing works correctly
- ✅ Browser management follows job-extraction pattern

---

## 🎯 **Epic Task 7: Testing & Validation**

### **Subtasks:**
- [ ] **7.1** Create test companies CSV with sample data
- [ ] **7.2** Test each node individually with sample data
- [ ] **7.3** Test complete pipeline with 5-10 companies
- [ ] **7.4** Validate CSV output format and data quality
- [ ] **7.5** Test error scenarios and recovery
- [ ] **7.6** Test browser management and cleanup
- [ ] **7.7** Performance testing with larger batches
- [ ] **7.8** Documentation and usage examples

### **Success Criteria:**
- ✅ All nodes work correctly with test data
- ✅ Complete pipeline processes companies successfully
- ✅ CSV output matches expected format
- ✅ Error handling works as designed
- ✅ Performance is acceptable for batch processing

---

## 🎯 **Epic Task 8: Production Readiness**

### **Subtasks:**
- [ ] **8.1** Add comprehensive logging throughout pipeline
- [ ] **8.2** Implement monitoring and metrics collection
- [ ] **8.3** Add configuration management for batch sizes and delays
- [ ] **8.4** Implement scheduling with node-cron
- [ ] **8.5** Add backup and recovery procedures for CSV files
- [ ] **8.6** Create deployment and setup documentation
- [ ] **8.7** Add monitoring alerts for failures
- [ ] **8.8** Final testing with production-like data

### **Success Criteria:**
- ✅ Pipeline is production-ready with proper logging
- ✅ Configuration is flexible and well-documented
- ✅ Scheduling works correctly with node-cron
- ✅ Backup and recovery procedures are in place
- ✅ Monitoring and alerting are configured

---

## 📊 **Review Questions for Each Epic Task:**

### **Epic Task 1-2: Foundation & Node 1**
- [ ] Does the LangGraph workflow structure follow the design spec?
- [ ] Does Node 1 handle AI search and fallback patterns correctly?
- [ ] Is browser management following the job-extraction pattern?
- [ ] Are errors handled gracefully with proper state updates?

### **Epic Task 3-4: Nodes 2-3**
- [ ] Does Node 2 successfully navigate to job listings pages?
- [ ] Does Node 3 discover filters and construct URLs correctly?
- [ ] Are AI prompts working as designed?
- [ ] Is state passing between nodes working correctly?

### **Epic Task 5-6: Node 4 & Integration**
- [ ] Does Node 4 create proper CSV rows and append to file?
- [ ] Is the complete LangGraph workflow executing correctly?
- [ ] Are all state channels being managed properly?
- [ ] Is CSV batch processing working as expected?

### **Epic Task 7-8: Testing & Production**
- [ ] Does the complete pipeline work with test companies?
- [ ] Is error handling robust and production-ready?
- [ ] Is performance acceptable for batch processing?
- [ ] Is monitoring and logging comprehensive?

---

## 🚀 **Implementation Notes**

### **Key Design Principles:**
1. **Simplicity**: CSV-based status tracking, no complex state management
2. **Reliability**: Incognito pages, fallback strategies, error handling
3. **Efficiency**: Batch processing, configurable limits
4. **Maintainability**: Clear node separation, simple interfaces
5. **Extensibility**: Easy to add new filter types or discovery methods

### **Following Existing Patterns:**
- **LangGraph Structure**: Follow job-discovery and easyApply patterns
- **State Management**: Follow job-extraction pattern with pure functions
- **Browser Management**: Use enhancedStagehandClient from shared utils
- **Error Handling**: Follow easyApply pattern with graceful degradation
- **CSV Processing**: Follow job-discovery pattern with batch processing

### **Critical Success Factors:**
- Proper browser cleanup after each node
- Robust error handling that doesn't stop the pipeline
- Accurate CSV status tracking for failed companies
- Efficient batch processing with configurable limits
- Comprehensive logging for debugging and monitoring 
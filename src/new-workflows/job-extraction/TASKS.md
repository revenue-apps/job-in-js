# Job Extraction Workflow - Implementation Tasks

## 📋 **Task Overview**

This document breaks down the job extraction workflow implementation into **Epic Tasks** and **Atomic Subtasks**. Each epic task will be reviewed upon completion before moving to the next.

## ⚠️ **Important Implementation Note**

**Use DynamoDB Utilities**: All DynamoDB operations should use the existing utility functions from `src/shared/utils/dynamoDB.js` instead of direct AWS SDK calls. This ensures:
- Consistent error handling and logging
- Modern AWS SDK v3 usage
- Built-in retry mechanisms
- Centralized configuration management

**Available Utilities:**
- `insertItem()` - Single item insertion with ID generation
- `getItem()` - Retrieve items by key
- `updateItem()` - Update existing items
- `queryItems()` - Query items with conditions
- `insertItemsWithRetry()` - Batch operations with retry logic
- `deleteItem()` - Delete items by key

## 📚 **Reference Documents**

### **Technical Specifications**
- **TECH_IMPL.md**: Complete technical implementation details
- **DESIGN_SPEC.md**: Detailed design specifications
- **README.md**: High-level overview and API documentation

### **Implementation References**
- **State Schema**: See `TECH_IMPL.md` - State Management section
- **DynamoDB Schema**: See `TECH_IMPL.md` - DynamoDB Schema section
- **Node Specifications**: See `TECH_IMPL.md` - Node Implementation Details section
- **Configuration Format**: See `TECH_IMPL.md` - Configuration Management section
- **Error Handling**: See `TECH_IMPL.md` - Error Handling Strategy section

## 🎯 **Epic Task 1: Project Structure & Configuration Setup**

### **Subtasks:**
1. **Create Directory Structure**
   - [x] Create `src/new-nodes/processing/` directory
   - [x] Create `src/new-nodes/analysis/` directory
   - [x] Create `src/new-nodes/mapping/` directory
   - [x] Create `src/new-nodes/validation/` directory
   - [x] Create `src/new-workflows/job-extraction/nodes/` directory
   - [x] Create `src/new-workflows/job-extraction/utils/` directory
   - [x] Create `src/new-workflows/job-extraction/config/domains/` directory

2. **Create Configuration Files**
   - [x] Create `src/new-workflows/job-extraction/config/domains/software_engineering.json`
   - [x] Create `src/new-workflows/job-extraction/config/domains/data_science.json`
   - [x] Create `src/new-workflows/job-extraction/config/domains/education.json`
   - [x] Create `src/new-workflows/job-extraction/config/quality.json`

3. **Create State Management Files**
   - [x] Create `src/shared/utils/jobExtractionState.js`
   - [x] Create `src/shared/utils/jobExtractionConfig.js`

4. **Create Utility Files**
   - [x] Create `src/new-workflows/job-extraction/utils/jobExtractionConfig.js`
   - [x] Create `src/new-workflows/job-extraction/utils/jobExtractionMetrics.js`

**Review Questions for Epic Task 1:**
- [x] Are all directories created correctly?
- [x] Are configuration files properly structured?
- [x] Is state management schema complete?
- [x] Are utility functions properly organized?

---

## 🎯 **Epic Task 2: Common Node Implementation**

### **Subtasks:**
1. **Job Loader Node**
   - [x] Create `src/new-nodes/processing/jobLoaderNode.js`
   - [x] Implement DynamoDB query logic using `getItem()` utility with correct primary key `jd_id`
   - [x] Add job status validation
   - [x] Add error handling for job not found
   - [x] Add job data preparation logic

2. **Content Extractor Node**
   - [x] Create `src/new-nodes/processing/contentExtractorNode.js`
   - [x] Use AI prompting with `page.extract()` for content extraction
   - [x] Convert from class to pure function for LangGraph compatibility
   - [x] Fix state management: return updated state instead of `{success, data, metadata}`
   - [x] Add proper error handling for missing page/job data
   - [x] Add timeout handling for page navigation
   - [x] Use simple schema for raw text extraction
   - [x] Test with real job URLs

### **cursormesseditup Checklist:**
- [x] Use correct `page` object from state instead of Stagehand client
- [x] Convert ContentExtractorNode class to pure function
- [x] Fix state management to return updated state directly
- [x] Use AI prompting with `page.extract()` for intelligent content extraction
- [x] Add timeout handling for page navigation
- [x] Use simple schema for raw text extraction
- [x] Add validation for extracted content quality
- [x] Test with different job platforms (LinkedIn, Indeed, etc.)
- [x] Ensure error handling doesn't break workflow state

3. **Job Analyzer Node**
   - [ ] Create `src/new-nodes/analysis/jobAnalyzerNode.js`
   - [ ] Implement basic details extraction (title, company, location, salary, experience)
   - [ ] Add OpenAI integration for extraction
   - [ ] Add confidence scoring logic
   - [ ] Add raw text preservation logic

4. **Domain Classifier Node**
   - [x] Create `src/new-nodes/analysis/domainClassifierNode.js`
   - [x] Implement multi-domain classification logic
   - [x] Add confidence scoring for each domain
   - [x] Add primary domain selection logic
   - [x] Add sub-domain identification

5. **Experience Detector Node**
   - [x] Create `src/new-nodes/mapping/experienceDetectorNode.js`
   - [x] Implement experience level detection logic
   - [x] Add seniority classification (junior, mid, senior, principal)
   - [x] Add confidence scoring for experience level
   - [x] Add influence logic for analysis depth

6. **Dimension Mapper Node**
   - [x] Create `src/new-nodes/mapping/dimensionMapperNode.js`
   - [x] Implement domain configuration loading
   - [x] Add dimension mapping logic
   - [x] Add missing data handling
   - [x] Add confidence scoring for dimensions

7. **Quality Validator Node**
   - [x] Create `src/new-nodes/validation/qualityValidatorNode.js`
   - [x] Implement completeness validation
   - [x] Add confidence threshold validation
   - [x] Add cross-validation logic
   - [x] Add quality metrics generation

8. **Storage Node**
   - [ ] Create `src/new-nodes/validation/storageNode.js`
   - [ ] Implement DynamoDB storage logic using `insertItem()` utility
   - [ ] Add status update logic using `updateItem()` utility (discovered → extracted)
   - [ ] Add metadata storage
   - [ ] Add bulk storage operations using `insertItemsWithRetry()` utility

**Review Questions for Epic Task 2:**
- [x] Do all nodes handle errors properly?
- [x] Is state management consistent across nodes?
- [ ] Are AI integrations working correctly?
- [x] Is data flow between nodes smooth?
- [x] Are all DynamoDB operations using utility functions?

---

## 🎯 **Epic Task 3: SKIPPED - LangGraph Orchestration**

### **Status: NOT REQUIRED**
- **Reason**: Using LangGraph's built-in StateGraph orchestration
- **Implementation**: Orchestration handled by `StateGraph` in `index.js`
- **Benefits**: Automatic state management, error handling, and flow control

### **LangGraph Orchestration Features:**
- ✅ Automatic state transitions between nodes
- ✅ Built-in error handling and propagation
- ✅ State channel management
- ✅ Workflow compilation and execution
- ✅ No custom orchestrator needed

**Note**: Epic Task 3 is invalid for our LangGraph-based approach. The `StateGraph` provides all orchestration functionality we need.

---

## 🎯 **Epic Task 4: Main Workflow Implementation**

### **Subtasks:**
1. **LangGraph Workflow Definition**
   - [ ] Create `src/new-workflows/job-extraction/index.js`
   - [ ] Implement StateGraph creation with proper channels
   - [ ] Add all 8 nodes to workflow using `addNode()`
   - [ ] Define edges between nodes using `addEdge()`
   - [ ] Set entry point using `setEntryPoint()`
   - [ ] Compile workflow using `compile()`

2. **State Schema Implementation**
   - [ ] Define LangGraph state channels (job_data, extracted_content, analysis_results, etc.)
   - [ ] Implement state validation for each channel
   - [ ] Add state transition logic between nodes
   - [ ] Add checkpoint management using metadata

3. **Node Wrapper Implementation**
   - [ ] Create node wrapper functions for LangGraph compatibility
   - [ ] Implement state channel updates based on node type
   - [ ] Add error handling with state propagation
   - [ ] Add metadata tracking for each node execution

4. **LangGraph Workflow Runner**
   - [ ] Implement `workflow.invoke()` execution logic
   - [ ] Add state persistence using DynamoDB utilities
   - [ ] Add progress tracking through metadata
   - [ ] Add completion handling with final state

**Review Questions for Epic Task 4:**
- [ ] Does LangGraph workflow execute all nodes correctly?
- [ ] Are state channels properly managed?
- [ ] Are errors handled appropriately with state propagation?
- [ ] Is the workflow resumable through LangGraph state?
- [ ] Are all state persistence operations using DynamoDB utilities?
- [ ] Are node wrappers properly updating state channels?

---

## 🎯 **Epic Task 5: API Integration**

### **Subtasks:**
1. **API Route Implementation**
   - [x] Create `src/api/routes/jobExtraction.js`
   - [x] Implement POST endpoint for job extraction
   - [x] Add input validation
   - [x] Add response formatting
   - [x] Add error handling

2. **API Integration with Workflow**
   - [x] Connect API to workflow execution
   - [x] Add job ID validation using `getItem()` utility
   - [x] Add domain parameter handling
   - [x] Add options parameter handling

3. **Response Handling**
   - [x] Implement success response format
   - [x] Add error response format
   - [x] Add progress response format
   - [x] Add quality metrics in response

**Review Questions for Epic Task 5:**
- [x] Does API handle all input scenarios?
- [x] Are responses properly formatted?
- [x] Is error handling comprehensive?
- [x] Is integration with workflow working?
- [x] Are all DynamoDB operations using utility functions?

---

## 🎯 **Epic Task 6: Testing & Validation**

### **Subtasks:**
1. **Unit Tests**
   - [ ] Create test files for each node
   - [ ] Implement node-specific tests
   - [ ] Add error scenario tests
   - [ ] Add state transition tests
   - [ ] Add DynamoDB utility integration tests

2. **Integration Tests**
   - [ ] Create end-to-end workflow tests
   - [ ] Add DynamoDB integration tests using utility functions
   - [ ] Add API endpoint tests
   - [ ] Add browser automation tests

3. **Performance Tests**
   - [ ] Add load testing
   - [ ] Add memory usage tests
   - [ ] Add timeout handling tests
   - [ ] Add concurrent job tests

4. **Quality Validation**
   - [ ] Test with real job URLs
   - [ ] Validate extraction accuracy
   - [ ] Test domain classification
   - [ ] Test quality metrics

**Review Questions for Epic Task 6:**
- [ ] Do all tests pass?
- [ ] Is extraction accuracy acceptable?
- [ ] Are performance metrics within limits?
- [ ] Is error handling working correctly?
- [ ] Are DynamoDB utility functions properly tested?

---

## 🎯 **Epic Task 7: Documentation & Deployment**

### **Subtasks:**
1. **Documentation Updates**
   - [ ] Update README with implementation details
   - [ ] Add API documentation
   - [ ] Add configuration documentation
   - [ ] Add troubleshooting guide
   - [ ] Add DynamoDB utilities usage documentation

2. **Deployment Preparation**
   - [ ] Add environment variables
   - [ ] Add deployment scripts
   - [ ] Add monitoring setup
   - [ ] Add logging configuration

3. **Final Validation**
   - [ ] Test complete workflow
   - [ ] Validate all configurations
   - [ ] Check error handling
   - [ ] Verify data storage using DynamoDB utilities

**Review Questions for Epic Task 7:**
- [ ] Is documentation complete and accurate?
- [ ] Is deployment ready?
- [ ] Are all configurations working?
- [ ] Is the system production-ready?
- [ ] Are all DynamoDB operations using utility functions?

---

## 📊 **Progress Tracking**

### **Epic Task Status:**
- [x] **Epic Task 1**: Project Structure & Configuration Setup
- [x] **Epic Task 2**: Common Node Implementation
- [x] **Epic Task 3**: SKIPPED - LangGraph Orchestration
- [x] **Epic Task 4**: Main Workflow Implementation
- [x] **Epic Task 5**: API Integration
- [ ] **Epic Task 6**: Testing & Validation
- [ ] **Epic Task 7**: Documentation & Deployment

### **Overall Progress:**
- **Completed**: 5/7 Epic Tasks
- **In Progress**: 0/7 Epic Tasks
- **Pending**: 2/7 Epic Tasks

---

## 🔄 **Review Process**

After each epic task completion:
1. **Review Questions**: Answer all review questions for the epic task
2. **Code Review**: Validate implementation against requirements
3. **Testing**: Ensure all subtasks are working correctly
4. **Documentation**: Update relevant documentation
5. **DynamoDB Utilities Check**: Verify all DynamoDB operations use utility functions
6. **Commit & Push**: If approved, commit and push changes
7. **Next Epic**: Move to next epic task with any necessary adjustments

### **Change Management:**
- If changes are needed during an epic task, document them
- Update subsequent epic tasks and subtasks accordingly
- Review changes with stakeholders before proceeding
- Ensure all documentation reflects the changes
- Verify DynamoDB utility usage across all implementations 
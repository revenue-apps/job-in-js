# Job Extraction Workflow - Technical Implementation

## 🏗️ **Architecture Overview**

### **Workflow Flow**
```
Job ID → Load Job from DDB → Content Extraction → Job Analyzer (basic details) → 
Domain Classification → Experience Detection → Dimension Mapping → Quality Validation → Storage
```

### **Node Organization**
- **Common Nodes**: `src/new-nodes/` (reusable across workflows)
- **Job-Specific Nodes**: `src/new-workflows/job-extraction/nodes/` (workflow-specific)

## 📁 **Project Structure**

```
src/
├── new-nodes/                    # Common nodes (reusable)
│   ├── processing/
│   │   ├── jobLoaderNode.js
│   │   └── contentExtractorNode.js
│   ├── analysis/
│   │   ├── jobAnalyzerNode.js
│   │   └── domainClassifierNode.js
│   ├── mapping/
│   │   ├── dimensionMapperNode.js
│   │   └── experienceDetectorNode.js
│   └── validation/
│       ├── qualityValidatorNode.js
│       └── storageNode.js
├── new-workflows/job-extraction/
│   ├── index.js                  # Main workflow
│   ├── nodes/                    # Job-specific nodes
│   │   ├── jobExtractionOrchestratorNode.js
│   │   └── jobExtractionValidatorNode.js
│   ├── utils/
│   │   ├── jobExtractionConfig.js
│   │   └── jobExtractionMetrics.js
│   └── config/
│       ├── domains/
│       │   ├── software_engineering.json
│       │   ├── data_science.json
│       │   └── education.json
│       └── quality.json
└── shared/utils/
    ├── jobExtractionState.js
    └── jobExtractionConfig.js
```

## 🗄️ **DynamoDB Schema**

### **Universal Job Descriptions Table**
```json
{
  "id": "job_abc123",
  "url": "https://linkedin.com/jobs/view/...",
  "status": "extracted",
  "workflow_state": {
    "current_step": "domain_classification_complete",
    "workflow_status": "running",
    "checkpoint": {
      "node": "domain_classifier",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "data": { /* serialized node state */ }
    }
  },
  "raw_content": {
    "full_text": "Complete job description text...",
    "structured_html": "<div>Job description HTML...</div>",
    "extracted_at": "2024-01-15T10:30:00.000Z"
  },
  "basic_details": {
    "job_title": "Senior Software Engineer",
    "company_name": "Google",
    "location": "San Francisco, CA",
    "salary_info": "$150k-$200k annually",
    "experience_level": "senior"
  },
  "domain_analysis": {
    "all_classifications": [
      {
        "domain": "software_engineering",
        "sub_domain": "development",
        "confidence": 0.85,
        "reasoning": "Strong technical skills mentioned"
      }
    ],
    "selected_domain": {
      "domain": "software_engineering",
      "sub_domain": "development",
      "confidence": 0.85
    }
  },
  "extracted_dimensions": {
    "core": {
      "title": "Senior Software Engineer",
      "company": "Google",
      "location": "San Francisco, CA"
    },
    "domain_specific": {
      "software_engineering": {
        "programming_languages": ["Python", "JavaScript"],
        "frameworks": ["React", "Django"],
        "databases": ["PostgreSQL", "Redis"]
      }
    }
  },
  "analysis_metadata": {
    "extracted_at": "2024-01-15T10:30:00.000Z",
    "confidence_score": 0.87,
    "domain": "software_engineering",
    "sub_domain": "development",
    "experience_level": "senior",
    "platform": "linkedin",
    "quality_score": 0.92,
    "workflow_version": "1.0"
  }
}
```

### **Workflow State Table**
```json
{
  "job_id": "job_abc123",
  "workflow_id": "extraction_workflow_123",
  "status": "running",
  "current_step": "domain_classification",
  "checkpoint": {
    "node": "domain_classifier",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "data": { /* serialized node state */ }
  },
  "error": null,
  "created_at": "2024-01-15T10:25:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 **State Management**

### **Job Extraction State Schema**
```typescript
interface JobExtractionState {
  // Input
  jobId: string;
  domain: string;
  options: {
    extractRawContent: boolean;
    validateQuality: boolean;
    confidenceThreshold: number;
  };
  
  // Processing
  currentStep: string;
  currentJob: JobExtractionResult | null;
  error: JobExtractionError | null;
  workflowStatus: 'running' | 'stopped' | 'completed';
  
  // Browser/AI
  page: any;
  agent: any;
  
  // Results
  qualityMetrics: {
    confidence: number;
    completenessScore: number;
    processingTime: number;
    success: boolean;
  };
  
  // Checkpoint for resume capability
  checkpoint: {
    node: string;
    timestamp: string;
    data: any;
  };
}
```

## 🎯 **Node Implementation Details**

### **Job Loader Node**
- **Purpose**: Load single job from DynamoDB by ID
- **Input**: Job ID
- **Output**: Job data with URL and metadata
- **Key Features**:
  - Query DynamoDB for job by ID
  - Validate job status is "discovered"
  - Load job URL and existing metadata
  - Handle job not found scenarios
  - Prepare job for extraction process

### **Content Extractor Node**
- **Purpose**: Extract raw content from job URL
- **Input**: Job URL
- **Output**: Raw HTML/text content
- **Key Features**:
  - Navigate to job URL using Stagehand
  - Extract full DOM content (HTML + text)
  - Platform-agnostic extraction
  - Rate limiting and error handling
  - Store raw content for future re-analysis

### **Job Analyzer Node**
- **Purpose**: Extract basic company/job details
- **Input**: Raw job content
- **Output**: Basic job details + complete original text
- **Key Features**:
  - Extract only essential details (title, company, location, salary, experience)
  - Keep complete original text
  - Simple, reliable extraction
  - No domain-specific logic
  - Store basic details and raw text

### **Domain Classifier Node**
- **Purpose**: Multi-domain classification with confidence scores
- **Input**: Job title and description
- **Output**: Multiple domain classifications with confidence scores
- **Key Features**:
  - AI-based multi-domain classification
  - Confidence scoring for each domain classification
  - Primary domain selection based on confidence threshold
  - Support for jobs that span multiple domains
  - Sub-domain identification

### **Experience Level Detector Node**
- **Purpose**: Determine job seniority level
- **Input**: Job title, description, and requirements
- **Output**: Experience level classification
- **Key Features**:
  - Seniority level detection (junior, mid, senior, principal)
  - Based on title keywords, requirements, responsibilities
  - Confidence scoring for level classification
  - Influences analysis depth and required dimensions

### **Dimension Mapper Node**
- **Purpose**: Map extracted data to configured dimensions
- **Input**: Structured job data + domain configuration
- **Output**: Mapped dimensions with values
- **Key Features**:
  - Load domain-specific dimension configuration
  - Map extracted data to configured dimensions
  - Handle missing or partial data
  - Validate against required dimensions
  - Generate confidence scores for each dimension

### **Quality Validator Node**
- **Purpose**: Validate extraction quality and completeness
- **Input**: Mapped dimensions and metadata
- **Output**: Quality assessment and validation results
- **Key Features**:
  - Check completeness against required dimensions
  - Validate confidence scores against threshold
  - Cross-validate extracted data
  - Flag jobs for manual review if needed
  - Generate quality metrics

### **Storage Node**
- **Purpose**: Store results in DynamoDB
- **Input**: Validated job extraction results
- **Output**: Updated job records with status "extracted"
- **Key Features**:
  - Store structured job data
  - Store raw content for re-analysis
  - Update job status from "discovered" to "extracted"
  - Store analysis metadata and quality metrics
  - Handle bulk storage operations

## 🔄 **Error Handling Strategy**

### **Immediate Error Stopping**
- **Stop on Error**: Workflow stops immediately when any node fails
- **Error State**: Failed nodes set workflowStatus to 'stopped'
- **Error Logging**: Comprehensive error tracking with node identification
- **No Cascading**: Prevents error propagation to downstream nodes

### **Resume Capability (Low Priority)**
- **Checkpoint System**: Each node saves state checkpoint
- **Resume Points**: Can resume workflow from any failed node
- **State Persistence**: Workflow state stored in DynamoDB
- **Manual Resume**: API endpoint to resume failed workflows

## 📊 **Configuration Management**

### **Domain Configuration (software_engineering.json)**
```json
{
  "domain": "software_engineering",
  "sub_domains": {
    "development": {
      "dimensions": {
        "programming_languages": {
          "required": true,
          "confidence_threshold": 0.8
        },
        "frameworks": {
          "required": false,
          "confidence_threshold": 0.7
        }
      },
      "experience_levels": {
        "junior": { "required_dimensions": 2 },
        "senior": { "required_dimensions": 4 },
        "principal": { "required_dimensions": 6 }
      }
    }
  }
}
```

### **Quality Configuration (quality.json)**
```json
{
  "confidence_thresholds": {
    "basic_extraction": 0.8,
    "domain_classification": 0.7,
    "dimension_mapping": 0.6
  },
  "completeness_thresholds": {
    "core_dimensions": 0.9,
    "domain_dimensions": 0.7
  },
  "quality_metrics": {
    "min_confidence": 0.7,
    "min_completeness": 0.8
  }
}
```

## 🚀 **Performance Optimizations**

### **AI Optimization**
- **Prompt Engineering**: Optimized prompts for better extraction
- **Model Selection**: Use appropriate models for different tasks
- **Caching**: Cache common AI responses
- **Batch Processing**: Process similar jobs together

### **Browser Optimization**
- **Session Reuse**: Reuse browser sessions for same domain
- **Rate Limiting**: Platform-specific rate limiting
- **Error Recovery**: Automatic retry with exponential backoff
- **Resource Management**: Proper cleanup of browser resources

### **Database Optimization**
- **Batch Operations**: Use DynamoDB batch operations
- **Indexing**: Optimize queries with proper indexes
- **Caching**: Cache frequently accessed configurations
- **Connection Pooling**: Efficient database connections

## 🔍 **Monitoring & Logging**

### **Metrics**
- **Processing Time**: Time per job and per node
- **Success Rate**: Percentage of successful extractions
- **Quality Scores**: Average confidence and completeness scores
- **Error Rates**: Error frequency by node and type

### **Logging**
- **Structured Logging**: JSON format for easy parsing
- **Node-Level Logs**: Detailed logs for each node
- **Error Tracking**: Comprehensive error information
- **Performance Logs**: Timing and resource usage

## 🧪 **Testing Strategy**

### **Unit Tests**
- **Node Testing**: Test each node independently
- **Configuration Testing**: Validate configuration files
- **Error Handling**: Test error scenarios
- **State Management**: Test state transitions

### **Integration Tests**
- **Workflow Testing**: End-to-end workflow tests
- **Database Testing**: DynamoDB integration tests
- **API Testing**: API endpoint tests
- **Browser Testing**: Stagehand integration tests

### **Performance Tests**
- **Load Testing**: Multiple concurrent jobs
- **Stress Testing**: High-volume processing
- **Memory Testing**: Resource usage monitoring
- **Timeout Testing**: Long-running job handling

## 🔐 **Security Considerations**

### **Data Protection**
- **Encryption**: Encrypt sensitive data in transit and at rest
- **Access Control**: Role-based access to workflows
- **Audit Logging**: Track all data access and modifications
- **Data Retention**: Define data retention policies

### **API Security**
- **Authentication**: Secure API endpoints
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Validate all inputs
- **Error Handling**: Secure error messages

## 📈 **Future Enhancements**

### **Phase 2: Advanced Features**
- **Platform-Specific Optimization**: Platform-specific DOM readers
- **Advanced AI Models**: Fine-tuned models for job extraction
- **Real-time Processing**: Stream processing capabilities
- **Advanced Analytics**: Job market insights and trends

### **Phase 3: Scale & Performance**
- **Distributed Processing**: Multi-node processing
- **Caching Layer**: Redis for performance
- **Queue System**: Background job processing
- **Auto-scaling**: Dynamic resource allocation 
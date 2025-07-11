# Job Extraction Workflow - Design Specification

## Workflow Architecture

### State Schema
```typescript
interface JobExtractionState {
  // Input
  jobId: string;                       // Single job ID from DynamoDB
  domain: string;                      // Target domain (e.g., "software_engineering")
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
  page: any;                           // Browser page instance
  agent: any;                          // AI agent instance
  
  // Results
  qualityMetrics: {
    confidence: number;
    completenessScore: number;
    processingTime: number;
    success: boolean;
  };
  
  // Checkpoint for resume capability (low priority)
  checkpoint: {
    node: string;
    timestamp: string;
    data: any;
  };
}
```

### Workflow Nodes

#### 1. Job Loader Node
**Purpose**: Load single job from DynamoDB by ID
**Input**: Job ID
**Output**: Job data with URL and metadata
**Key Features**:
- Query DynamoDB for job by ID
- Validate job status is "discovered"
- Load job URL and existing metadata
- Handle job not found scenarios
- Prepare job for extraction process

#### 2. Job Content Extractor Node
**Purpose**: Extract raw content from single job URL
**Input**: Job URL from loaded job
**Output**: Raw HTML/text content for the job
**Key Features**:
- Navigate to job URL
- Extract full page content (HTML + text)
- Handle different job platforms (LinkedIn, Indeed, etc.)
- Rate limiting and error handling
- Store raw content for future re-analysis

#### 3. Job Analyzer Node
**Purpose**: Use AI to extract structured job information
**Input**: Raw job content
**Output**: Structured job data
**Key Features**:
- OpenAI-powered content analysis
- Extract core job information (title, company, location)
- Platform-specific extraction strategies
- Confidence scoring for each extraction
- Fallback to rule-based extraction if AI fails

#### 4. Domain Classifier Node
**Purpose**: Identify job domain and sub-domain with multi-domain scoring
**Input**: Job title and description
**Output**: Multiple domain classifications with confidence scores
**Key Features**:
- AI-based multi-domain classification
- Confidence scoring for each domain classification
- Primary domain selection based on confidence threshold
- Support for jobs that span multiple domains
- Sub-domain identification (development, testing, architecture)
- Support for multiple domains (software_engineering, data_science, etc.)

#### 5. Experience Level Detector Node
**Purpose**: Determine job seniority level
**Input**: Job title, description, and requirements
**Output**: Experience level classification
**Key Features**:
- Seniority level detection (junior, mid, senior, principal)
- Based on title keywords, requirements, and responsibilities
- Confidence scoring for level classification
- Influences analysis depth and required dimensions

#### 6. Dimension Mapper Node
**Purpose**: Map extracted data to configured dimensions
**Input**: Structured job data + domain configuration
**Output**: Mapped dimensions with values
**Key Features**:
- Load domain-specific dimension configuration
- Map extracted data to configured dimensions
- Handle missing or partial data
- Validate against required dimensions
- Generate confidence scores for each dimension

#### 7. Quality Validator Node
**Purpose**: Validate extraction quality and completeness
**Input**: Mapped dimensions and metadata
**Output**: Quality assessment and validation results
**Key Features**:
- Check completeness against required dimensions
- Validate confidence scores against threshold
- Cross-validate extracted data
- Flag jobs for manual review if needed
- Generate quality metrics

#### 8. Storage Node
**Purpose**: Store results in DynamoDB
**Input**: Validated job extraction results
**Output**: Updated job records with status "extracted"
**Key Features**:
- Store structured job data
- Store raw content for re-analysis
- Update job status from "discovered" to "extracted"
- Store analysis metadata and quality metrics
- Handle bulk storage operations

## Node Implementation Details

### Job Loader Node
```javascript
export const jobLoaderNode = async (state) => {
  const { jobId } = state;
  
  try {
    // Load job from DynamoDB
    const job = await getJobFromDynamoDB(jobId);
    
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }
    
    if (job.status !== 'discovered') {
      throw new Error(`Job ${jobId} has status ${job.status}, expected 'discovered'`);
    }
    
    return {
      ...state,
      currentJob: {
        id: job.id,
        url: job.url,
        company: job.company,
        domain: job.domain,
        filters: job.filters,
        status: job.status
      },
      currentStep: 'job_loaded'
    };
    
  } catch (error) {
    return {
      ...state,
      error: { jobId, error: error.message },
      currentStep: 'job_loading_failed'
    };
  }
};
```

### Job Content Extractor Node
```javascript
export const jobContentExtractorNode = async (state) => {
  const { currentJob, page, agent } = state;
  
  if (!currentJob) {
    return {
      ...state,
      error: { error: 'No job loaded for extraction' },
      currentStep: 'extraction_failed'
    };
  }
  
  try {
    // Navigate to job page
    await page.goto(currentJob.url, { waitUntil: 'networkidle' });
    
    // Extract content based on platform
    const content = await extractJobContent(page, currentJob.url);
    
    const extractedContent = {
      url: currentJob.url,
      rawHtml: content.html,
      fullText: content.text,
      platform: detectPlatform(currentJob.url),
      extractedAt: new Date().toISOString()
    };
    
    return {
      ...state,
      extractedContent,
      currentStep: 'content_extraction_complete'
    };
    
  } catch (error) {
    return {
      ...state,
      error: { url: currentJob.url, error: error.message },
      currentStep: 'extraction_failed'
    };
  }
};
```

### Job Analyzer Node
```javascript
export const jobAnalyzerNode = async (state) => {
  const { extractedContent, domain } = state;
  
  if (!extractedContent) {
    return {
      ...state,
      error: { error: 'No content extracted for analysis' },
      currentStep: 'analysis_failed'
    };
  }
  
  try {
    // AI-powered job analysis
    const analysis = await analyzeJobContent(extractedContent, domain);
    
    const analyzedJob = {
      url: extractedContent.url,
      jobData: analysis.structuredData,
      confidence: analysis.confidence,
      platform: extractedContent.platform
    };
    
    return {
      ...state,
      analyzedJob,
      currentStep: 'job_analysis_complete'
    };
    
  } catch (error) {
    return {
      ...state,
      error: { url: extractedContent.url, error: error.message },
      currentStep: 'analysis_failed'
    };
  }
};
```

### Domain Classifier Node
```javascript
export const domainClassifierNode = async (state) => {
  const { analyzedJobs } = state;
  const classifiedJobs = [];
  
  for (const job of analyzedJobs) {
    try {
      // Classify domain and sub-domain
      const classification = await classifyJobDomain(job.jobData);
      
      classifiedJobs.push({
        ...job,
        domain: classification.domain,
        subDomain: classification.subDomain,
        domainConfidence: classification.confidence
      });
      
    } catch (error) {
      // Handle classification errors
      state.failedJobs.push({ url: job.url, error: error.message });
    }
  }
  
  return {
    ...state,
    classifiedJobs,
    currentStep: 'domain_classification_complete'
  };
};
```

### Experience Level Detector Node
```javascript
export const experienceLevelDetectorNode = async (state) => {
  const { classifiedJobs } = state;
  const jobsWithExperience = [];
  
  for (const job of classifiedJobs) {
    try {
      // Detect experience level
      const experienceLevel = await detectExperienceLevel(job.jobData);
      
      jobsWithExperience.push({
        ...job,
        experienceLevel: experienceLevel.level,
        experienceConfidence: experienceLevel.confidence
      });
      
    } catch (error) {
      // Handle detection errors
      state.failedJobs.push({ url: job.url, error: error.message });
    }
  }
  
  return {
    ...state,
    jobsWithExperience,
    currentStep: 'experience_detection_complete'
  };
};
```

### Dimension Mapper Node
```javascript
export const dimensionMapperNode = async (state) => {
  const { jobsWithExperience, domain } = state;
  const mappedJobs = [];
  
  // Load domain configuration
  const domainConfig = await loadDomainConfig(domain);
  
  for (const job of jobsWithExperience) {
    try {
      // Map to configured dimensions
      const mappedDimensions = await mapToDimensions(
        job.jobData, 
        domainConfig, 
        job.experienceLevel
      );
      
      mappedJobs.push({
        ...job,
        extractedDimensions: mappedDimensions.dimensions,
        dimensionConfidence: mappedDimensions.confidence
      });
      
    } catch (error) {
      // Handle mapping errors
      state.failedJobs.push({ url: job.url, error: error.message });
    }
  }
  
  return {
    ...state,
    mappedJobs,
    currentStep: 'dimension_mapping_complete'
  };
};
```

### Quality Validator Node
```javascript
export const qualityValidatorNode = async (state) => {
  const { mappedJobs, options } = state;
  const validatedJobs = [];
  const qualityMetrics = {
    totalProcessed: mappedJobs.length,
    totalValidated: 0,
    totalFailed: 0,
    averageConfidence: 0,
    completenessScore: 0
  };
  
  for (const job of mappedJobs) {
    try {
      // Validate quality and completeness
      const validation = await validateJobQuality(job, options);
      
      if (validation.passed) {
        validatedJobs.push({
          ...job,
          qualityScore: validation.score,
          validationNotes: validation.notes
        });
        qualityMetrics.totalValidated++;
      } else {
        // Flag for manual review
        state.failedJobs.push({ 
          url: job.url, 
          error: 'Quality validation failed',
          validationDetails: validation
        });
        qualityMetrics.totalFailed++;
      }
      
    } catch (error) {
      // Handle validation errors
      state.failedJobs.push({ url: job.url, error: error.message });
    }
  }
  
  // Calculate metrics
  qualityMetrics.averageConfidence = calculateAverageConfidence(validatedJobs);
  qualityMetrics.completenessScore = calculateCompletenessScore(validatedJobs);
  
  return {
    ...state,
    validatedJobs,
    qualityMetrics,
    currentStep: 'quality_validation_complete'
  };
};
```

### Storage Node
```javascript
export const storageNode = async (state) => {
  const { validatedJobs, extractedContent } = state;
  const storedJobs = [];
  
  for (const job of validatedJobs) {
    try {
      // Find corresponding raw content
      const rawContent = extractedContent.find(c => c.url === job.url);
      
      // Prepare storage data
      const storageData = {
        id: generateJobId(job.url),
        url: job.url,
        status: 'extracted',
        rawContent: {
          fullText: rawContent.fullText,
          structuredHtml: rawContent.rawHtml,
          extractedAt: rawContent.extractedAt
        },
        jobData: {
          title: job.jobData.title,
          company: job.jobData.company,
          location: job.jobData.location,
          salary: job.jobData.salary,
          experienceLevel: job.experienceLevel,
          domain: job.domain,
          subDomain: job.subDomain
        },
        extractedDimensions: job.extractedDimensions,
        analysisMetadata: {
          extractedAt: new Date().toISOString(),
          confidenceScore: job.dimensionConfidence,
          domain: job.domain,
          subDomain: job.subDomain,
          experienceLevel: job.experienceLevel,
          platform: job.platform,
          qualityScore: job.qualityScore
        }
      };
      
      // Store in DynamoDB
      await storeJobDescription(storageData);
      storedJobs.push(storageData);
      
    } catch (error) {
      // Handle storage errors
      state.failedJobs.push({ url: job.url, error: error.message });
    }
  }
  
  return {
    ...state,
    storedJobs,
    currentStep: 'storage_complete'
  };
};
```

## Configuration Management

### Domain Configuration Loading
```javascript
export const loadDomainConfig = async (domain) => {
  // Load from configuration file or database
  const config = await loadConfig(`domains/${domain}.json`);
  
  return {
    coreDimensions: config.core_dimensions,
    subDomains: config.sub_domains,
    experienceLevels: config.experience_levels,
    extractionPatterns: config.extraction_patterns
  };
};
```

### Platform-Specific Extraction
```javascript
export const extractJobContent = async (page, url) => {
  const platform = detectPlatform(url);
  
  switch (platform) {
    case 'linkedin':
      return await extractLinkedInContent(page);
    case 'indeed':
      return await extractIndeedContent(page);
    case 'glassdoor':
      return await extractGlassdoorContent(page);
    default:
      return await extractGenericContent(page);
  }
};
```

## Error Handling Strategy

### Immediate Error Stopping
- **Stop on Error**: Workflow stops immediately when any node fails
- **Error State**: Failed nodes set workflowStatus to 'stopped'
- **Error Logging**: Comprehensive error tracking with node identification
- **No Cascading**: Prevents error propagation to downstream nodes

### Retry Logic
```javascript
export const retryWithFallback = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Exponential backoff
      await delay(Math.pow(2, attempt) * 1000);
    }
  }
};
```

### Quality Validation
```javascript
export const validateJobQuality = async (job, options) => {
  const { confidenceThreshold = 0.8 } = options;
  
  // Check confidence scores
  const avgConfidence = calculateAverageConfidence(job.extractedDimensions);
  if (avgConfidence < confidenceThreshold) {
    return { passed: false, score: avgConfidence, notes: 'Low confidence' };
  }
  
  // Check completeness
  const completeness = calculateCompleteness(job.extractedDimensions);
  if (completeness < 0.7) {
    return { passed: false, score: completeness, notes: 'Incomplete data' };
  }
  
  return { passed: true, score: avgConfidence, notes: 'Validation passed' };
};
```

### Resume Capability (Low Priority)
- **Checkpoint System**: Each node saves state checkpoint
- **Resume Points**: Can resume workflow from any failed node
- **State Persistence**: Workflow state stored in DynamoDB
- **Manual Resume**: API endpoint to resume failed workflows

## Performance Optimizations

### Batch Processing
- Process multiple jobs from same platform together
- Reuse browser sessions for same domain
- Cache platform-specific extraction patterns

### Caching Strategy
- Cache domain configurations
- Cache successful extraction patterns
- Cache AI responses for similar content

### Quality Assurance
- Confidence scoring for each dimension
- Completeness validation
- Cross-validation of extracted data

## Future Enhancements

### Dimension Discovery (Separate Workflow)
- Automatic detection of new job dimensions
- Human-in-the-loop approval system
- Integration with existing dimension configurations

### Quality Improvement (Separate Workflow)
- Continuous learning from extraction results
- Pattern recognition for common extraction errors
- Automated quality improvement suggestions

### Domain Expansion (Separate Workflow)
- Add new domains and sub-domains
- Cross-domain learning and pattern sharing
- Automated domain configuration generation 
# Active Context: PPT Translation App

## Current Work Focus
The project is in the initial setup phase, focusing on initializing the Memory Bank files to document the project structure and progress. The first file (productContext.md) has been created successfully. Next steps involve creating the remaining Memory Bank files and then moving to infrastructure setup with AWS CDK.

## Recent Changes
- Created productContext.md to outline the product's purpose, problems solved, functionality, and user experience goals.
- Updated the project plan based on user feedback, confirming the use of Lambda for S3 event triggering, packaging the translation app in a container for ECS Fargate, and enabling Spot mode for cost savings.

## Next Steps
- Complete the initialization of all Memory Bank files (projectbrief.md, systemPatterns.md, techContext.md, and progress.md).
- Proceed to Task 2: Set up infrastructure using AWS CDK, including S3, Lambda, ECS Fargate, ECR, and Amplify.
- After Memory Bank initialization, update this file to reflect the transition to implementing user stories.

## Important Patterns and Preferences
- **Event-Driven Architecture**: Use S3 events to trigger Lambda, which in turn starts ECS Fargate tasks.
- **Cost Optimization**: ECS Fargate tasks configured for Spot mode with fallback to on-demand.
- **Extensibility**: Design for dynamic Bedrock model selection to allow future changes without major rewrites.
- **Documentation Practices**: Update Memory Bank files after each significant task to maintain context across sessions.

## Learnings and Insights
- S3 cannot directly trigger ECS Fargate; Lambda serves as the intermediary, as confirmed from AWS documentation patterns.
- The translation app will be containerized and pushed to ECR before deployment, ensuring a streamlined process.

# Tech Context: PPT Translation App

## Technologies Used
- **Frontend**: React for building the web interface, providing a lightweight and responsive user experience.
- **Backend Processing**: Python with the `python-pptx` library for handling PPT file manipulation, integrated into a Docker container for ECS Fargate.
- **Cloud Services**: 
  - AWS S3 for object storage with presigned URLs.
  - AWS Lambda for event triggering.
  - AWS ECS Fargate (with Spot mode) for running containerized tasks.
  - Amazon Bedrock for LLM-based translation (starting with Claude 3.7).
  - AWS Amplify for hosting and deploying the React web app.
- **Infrastructure as Code**: AWS CDK for defining and deploying all AWS resources in a repeatable manner.
- **Containerization**: Docker for packaging the translation application.

## Development Setup
- **Environment**: Develop in a standard Node.js environment for the frontend and Python for the backend. Use VSCode or similar IDE with extensions for AWS, Docker, and React.
- **Dependencies**:
  - Frontend: React, AWS SDK for JavaScript.
  - Backend: Python 3.8+, `python-pptx`, AWS SDK for Python (Boto3), and Bedrock client library.
- **Tools**: 
  - Docker for building and testing containers.
  - AWS CLI and CDK CLI for local testing and deployment.
  - Git for version control and collaboration.

## Technical Constraints
- **Region**: Default to us-east-1 for AWS services, but configurable via CDK.
- **Cost Management**: Limit Fargate tasks to Spot instances where possible, with monitoring via AWS CloudWatch.
- **Scalability**: Amplify and ECS Fargate handle auto-scaling based on demand.
- **Security**: Use IAM roles for least-privilege access; ensure all interactions with S3 and Bedrock are via secure, authenticated channels.
- **Compatibility**: Ensure the solution works across modern browsers and devices, with fallback mechanisms for interruptions (e.g., Spot task failures).

## Dependencies
- **External Libraries**: 
  - `python-pptx` for PPT parsing and modification.
  - AWS SDKs for integration with S3, Lambda, ECS, and Bedrock.
- **Internal Dependencies**: The web app depends on AWS services; the Fargate container depends on the ECR image repository.
- **Version Management**: Use semantic versioning for CDK stacks and container images; pin dependencies in package.json and requirements.txt to avoid breaking changes.

## Tool Usage Patterns
- **AWS CDK**: For provisioning resources; run `cdk deploy` to apply changes.
- **Docker**: Build images with `docker build` and push to ECR using AWS CLI.
- **Testing**: Use Jest for React unit tests and integration tests for AWS services via LocalStack or similar for local simulation.

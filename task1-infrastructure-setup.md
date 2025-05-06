# Task 1 Specification: Infrastructure Setup with AWS CDK

## User Story
As a developer, I want to provision AWS infrastructure using CDK so that the PPT Translation App can be deployed reliably and scalably, ensuring all resources are defined in code for consistency.

## Design Details
- Use AWS CDK to define resources including S3 buckets, Lambda functions, ECS Fargate clusters, ECR repositories, and Amplify apps.
- Configure S3 buckets with event notifications to trigger Lambda.
- Set up ECS Fargate with Spot mode for cost optimization, including capacity providers for fallback to on-demand instances.
- Implement IAM roles for secure inter-service communication.
- Ensure the stack is modular and reusable, with parameters for easy configuration (e.g., region).

## Execution Details
- Update the existing CDK project in the 'cdk' directory.
- Add TypeScript code to define the necessary stacks:
  - S3 Stack: Create two buckets with appropriate policies.
  - Lambda Stack: Define the Lambda function with event source mappings.
  - ECS Fargate Stack: Configure task definitions, services, and Spot capacity providers.
  - ECR Stack: Set up the repository for Docker images.
  - Amplify Stack: Configure the Amplify app for the React frontend.
- Run 'cdk synth' to generate CloudFormation templates.
- Deploy with 'cdk deploy' to provision resources.
- Use Git to commit changes after deployment.

## Test Scope
- Verify resource creation in the AWS Console (e.g., check S3 buckets, Lambda functions).
- Test CDK commands locally: Ensure 'cdk synth' produces valid templates without errors.
- Integration tests: Simulate S3 events to trigger Lambda and confirm ECS task initiation.
- Edge cases: Test Spot instance interruptions and fallback mechanisms; validate IAM permissions.

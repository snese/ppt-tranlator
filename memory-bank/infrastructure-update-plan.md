# Infrastructure Update Plan for PowerPoint Translator Project

## Overview
This document outlines the updates made to the infrastructure setup for the PowerPoint Translator project to ensure compatibility, security, and local testing capabilities.

## Updates to Dockerfile
- **Python Version**: Updated the base image in `translator-app/Dockerfile` to use Python 3.11, the latest stable version, for optimal compatibility and robust security.
  - Previous Version: Python 3.8
  - New Version: Python 3.11

## Updates to Translator Application
- **Local Testing**: Modified `translator-app/main.py` to support local testing on the user's machine by integrating a local file path input. This allows seamless use of AWS Bedrock for translating PPTX files directly on the system.
  - Command for local testing: `python main.py --input <input_pptx_file> --output <output_pptx_file>`
- **Default Language Configuration**: Configured the translator application to default the input language to 'auto (en-US)' and the output language to 'zh-TW' for streamlined and consistent functionality.
  - Default Source Language: 'auto (en-US)'
  - Default Target Language: 'zh-TW'
- **S3 Integration for Cloud Deployment**: Added functionality to `translator-app/main.py` to support cloud deployment mode with S3 integration in two distinct ways:
  - **Local Execution Mode**: Processes local files directly on the user's system.
  - **Cloud Deployment Mode**: Downloads input files from an S3 bucket, processes them, and uploads the translated output back to an S3 bucket.
    - Command for cloud mode: `python main.py --s3-input-bucket <input_bucket> --s3-input-key <input_key> --s3-output-bucket <output_bucket> --s3-output-key <output_key>`

## Next Steps
- **Build and Push Docker Image**: Build the updated Docker image for both x86 and ARM architectures to ensure compatibility on the user's Mac with an M3 Pro chip, and push it to Amazon Elastic Container Registry (ECR).
- **Deploy Infrastructure**: Proceed with deploying the infrastructure using AWS CDK with the specified AWS profile `gd-developer`.
- **Testing**: Perform thorough testing across all deployed components (S3 buckets, Lambda functions, ECS Fargate clusters, ECR repositories, and Amplify apps) to confirm they are operational as per the requirements in 'task1-infrastructure-setup.md'.
- **Issue Resolution**: If any issues are encountered during deployment or testing, create detailed GitHub issues with precise problem descriptions, reproduction steps, expected vs. actual behavior, relevant errors/logs, potential solutions/workarounds, and priority assessment.

## Documentation
- All relevant documentation has been updated to reflect these changes. Further updates will be made as subsequent tasks are completed as detailed in the project plan.
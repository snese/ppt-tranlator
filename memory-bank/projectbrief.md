# Project Brief: PPT Translation App

## Project Overview
This project involves developing a web-based application for translating PPT files to Traditional Chinese (Taiwan). The app will feature a simple interface for file uploads, progress tracking, and downloads, leveraging AWS services for storage, processing, and deployment. The solution will be fully defined using AWS CDK for infrastructure as code, ensuring scalability and maintainability.

## Core Requirements
- **Web Interface**: A lightweight React app hosted on AWS CloudFront + S3 for user uploads, translation requests, and downloads.
- **Storage**: Use AWS S3 with presigned URLs for secure file uploads and downloads.
- **Processing**: Trigger translation via S3 events to AWS Lambda, which starts an ECS Fargate task (in Spot mode) to handle PPT processing and translation using Amazon Bedrock (Claude 3.7).
- **Translation**: Auto-detect source language and translate to Traditional Chinese (Taiwan), with extensibility for other languages and models.
- **Infrastructure**: Package the entire solution using AWS CDK for deployment, including all AWS resources.
- **Security and Cost**: Ensure secure access via presigned URLs and optimize costs with Fargate Spot instances.

## Project Goals
- **Efficiency**: Automate the translation process to reduce manual effort and time.
- **User-Centric Design**: Provide a seamless experience with real-time feedback and easy access.
- **Scalability**: Build a system that can handle varying loads using serverless and containerized components.
- **Extensibility**: Design for future enhancements, such as supporting additional languages and dynamic Bedrock model selection.
- **Documentation**: Maintain comprehensive project documentation in the Memory Bank to track progress and decisions.

## Scope
- In-scope: Core features including upload, translation, download, and infrastructure setup.
- Out-of-scope: Advanced features like user authentication or multi-language support beyond the initial setup (to be added in future iterations).

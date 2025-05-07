# Task 3: React Web Interface on CloudFront + S3

## Objective
Build and deploy a lightweight web app to serve as the user interface for the PowerPoint Translator project, hosted on AWS S3 with CloudFront distribution.

## User Story
As a user, I want an intuitive interface to:
- Log in using account and password through the CloudFront portal with OAuth authentication.
- Upload PPTX files for translation.
- Track the progress of the translation process.
- Download translated files through presigned URLs.

## Design Details
- Use React for the frontend, creating components for:
  - **Login**: Implement OAuth authentication using AWS Cognito, accessible via CloudFront portal.
  - **File Upload**: Interface for uploading PPTX files using presigned URLs to S3.
  - **Progress Tracker**: Display the status of translation processes.
  - **Download**: Provide links or buttons to download translated files using presigned URLs.
- Integrate with AWS services using the AWS SDK for JavaScript to interact with S3 (via presigned URLs), Cognito for authentication, and potentially other services for status updates.
- Ensure the WebUI is hosted on S3 with CloudFront distribution for secure and scalable access.

## Execution Details
1. Develop the React application in the 'web-ui' directory:
   - Update or create necessary components for login, file upload, progress tracking, and download functionalities.
   - Configure AWS SDK with appropriate credentials and endpoints for S3 and Cognito interactions.
2. Set up the build process to generate static files suitable for hosting on S3.
3. Deploy the React app static files to an S3 bucket, and configure CloudFront distribution for secure access as defined in the infrastructure.

## Test Scope
- **Unit Tests**: Create unit tests for React components to ensure individual functionalities (login form, upload button, progress bar, download link) work as expected.
- **Integration Tests**: Test integration with AWS services, confirming that:
  - OAuth login via Cognito works through the CloudFront portal.
  - File uploads to S3 using presigned URLs are successful.
  - Progress tracking reflects the actual status of translation.
  - Downloads of translated files via presigned URLs function correctly.
- **End-to-End Tests**: Simulate complete user flows from login to download, verifying the entire process meets the test success conditions outlined in the product specification.

## Notes
- Ensure the WebUI adheres to the test success conditions specified in the product specification, including login via CloudFront portal, upload/download through presigned URLs, and progress tracking.
- Address any UI/UX considerations for a seamless user experience, such as responsive design and clear feedback during file processing.
- If issues are encountered during implementation or testing, create detailed GitHub issues with precise problem descriptions, reproduction steps, expected vs. actual behavior, relevant errors/logs, potential solutions/workarounds, and priority assessment.
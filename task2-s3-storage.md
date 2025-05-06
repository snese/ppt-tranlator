# Task 2 Specification: S3 Storage with Presigned URLs

## User Story
As a user, I want to securely upload and download PPT files using presigned URLs so that I can manage files without direct access to the S3 bucket, ensuring privacy and ease of use.

## Design Details
- Configure two S3 buckets: one for original files and one for translated files.
- Use presigned URLs for temporary, secure access to upload files and download translated results.
- Set up S3 event notifications to trigger Lambda functions on file uploads.
- Implement bucket policies for least-privilege access and integrate with the web app for URL generation.

## Execution Details
- In the CDK code, define S3 buckets with appropriate configurations.
- Add Lambda functions or API endpoints to generate presigned URLs.
- Ensure event notifications are set up for the original files bucket to trigger processing.
- Test URL generation and expiration in a development environment.
- Commit changes to Git after implementation.

## Test Scope
- Verify presigned URL generation and functionality for upload and download.
- Test URL expiration and security by attempting access after expiry.
- Simulate S3 events to ensure notifications work correctly.
- Edge cases: Test with large files, invalid URLs, and permission denials.

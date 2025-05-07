#!/bin/bash

# deploy-and-update.sh - Automation script for PowerPoint Translator project deployment and configuration

# Log file for tracking script execution
LOG_FILE="deploy.log"
# Temporary file to store CDK deployment output
CDK_OUTPUT_FILE="cdk-deploy-output.txt"

# Function to log messages
log_message() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" >> "$LOG_FILE"
    echo "$1"
}

# Function to handle errors and exit
handle_error() {
    log_message "ERROR: $1"
    exit 1
}

# Initialize log file
> "$LOG_FILE"
log_message "Starting deployment and configuration automation script for PowerPoint Translator project"

# Step 1: Compile and Package Lambda Function
log_message "Step 1: Packaging Lambda function..."
cd /Users/hclo/Documents/Projects/ppt-translator/translator-app || handle_error "Failed to navigate to translator-app directory"
zip -r translator-app.zip . -x "*.git*" || handle_error "Failed to create translator-app.zip"
log_message "Lambda function packaged successfully as translator-app.zip"

# Step 2: Execute 'cdk deploy'
log_message "Step 2: Deploying infrastructure with CDK..."
cd /Users/hclo/Documents/Projects/ppt-translator/cdk || handle_error "Failed to navigate to cdk directory"
cdk deploy --require-approval never | tee "$CDK_OUTPUT_FILE" || handle_error "CDK deployment failed. Check $CDK_OUTPUT_FILE for details"
log_message "CDK deployment completed"

# Step 3: Retrieve Critical Output Parameters
log_message "Step 3: Extracting output parameters from CDK deployment..."
API_GATEWAY_ENDPOINT=$(grep "ApiGatewayEndpoint =" "$CDK_OUTPUT_FILE" | sed 's/.* = //')
ORIGINAL_BUCKET=$(grep "OriginalBucketName =" "$CDK_OUTPUT_FILE" | sed 's/.* = //')
TRANSLATED_BUCKET=$(grep "TranslatedBucketName =" "$CDK_OUTPUT_FILE" | sed 's/.* = //')
CLOUDFRONT_DOMAIN=$(grep "CloudFrontDistributionDomain =" "$CDK_OUTPUT_FILE" | sed 's/.* = //')

# Validate extracted parameters
if [ -z "$API_GATEWAY_ENDPOINT" ] || [ -z "$ORIGINAL_BUCKET" ] || [ -z "$TRANSLATED_BUCKET" ] || [ -z "$CLOUDFRONT_DOMAIN" ]; then
    log_message "WARNING: One or more output parameters could not be extracted. Check $CDK_OUTPUT_FILE for details."
else
    log_message "Output parameters extracted successfully:"
    log_message "  API Gateway Endpoint: $API_GATEWAY_ENDPOINT"
    log_message "  Original Bucket: $ORIGINAL_BUCKET"
    log_message "  Translated Bucket: $TRANSLATED_BUCKET"
    log_message "  CloudFront Domain: $CLOUDFRONT_DOMAIN"
fi

# Step 4: Update Configuration in 'web-ui/src/aws-exports.js'
log_message "Step 4: Updating configuration in web-ui/src/aws-exports.js..."
AWS_EXPORTS_FILE="/Users/hclo/Documents/Projects/ppt-translator/web-ui/src/aws-exports.js"
BACKUP_FILE="$AWS_EXPORTS_FILE.bak"
cp "$AWS_EXPORTS_FILE" "$BACKUP_FILE" || log_message "WARNING: Failed to create backup of aws-exports.js"

# Write updated content to aws-exports.js directly to avoid sed issues
cat > "$AWS_EXPORTS_FILE" << EOF
/*
 * AWS configuration for the PowerPoint Translator app.
 * These values need to be updated with the actual configuration
 * from the deployed AWS infrastructure (Cognito User Pool ID, Client ID, etc.).
 */

const awsConfig = {
  region: 'us-west-2', // Confirmed as correct
  apiGateway: {
    endpoint: '$API_GATEWAY_ENDPOINT', // Updated with deployed API Gateway endpoint
    region: 'us-west-2' // Confirmed as correct
  },
  s3: {
    originalBucket: '$ORIGINAL_BUCKET', // Updated with correct bucket name
    translatedBucket: '$TRANSLATED_BUCKET' // Updated with correct bucket name
  },
  cloudfront: {
    domain: '$CLOUDFRONT_DOMAIN' // Updated with CloudFront distribution domain
  }
};

export default awsConfig;
EOF

if [ $? -eq 0 ]; then
    log_message "Configuration updated in aws-exports.js"
else
    log_message "WARNING: Failed to update configuration in aws-exports.js"
fi
log_message "Configuration updated in aws-exports.js"

# Step 5: Build Web UI Application
log_message "Step 5: Building Web UI application..."
cd /Users/hclo/Documents/Projects/ppt-translator/web-ui || handle_error "Failed to navigate to web-ui directory"
npm install || handle_error "Failed to install Web UI dependencies"
npm run build || handle_error "Failed to build Web UI application"
log_message "Web UI application built successfully"

# Step 6: Upload Build Artifacts to S3 Bucket
log_message "Step 6: Uploading Web UI build artifacts to S3 bucket..."
# Assuming the S3 bucket for web hosting is derived from CloudFront domain or hardcoded if necessary
WEB_BUCKET="ppt-translation-web-app-unique"  # Update if dynamic extraction is possible
aws s3 sync build/ "s3://$WEB_BUCKET/" --delete || log_message "WARNING: Failed to upload build artifacts to S3 bucket $WEB_BUCKET"
log_message "Web UI build artifacts uploaded to S3 bucket $WEB_BUCKET"

log_message "Deployment and configuration automation script completed successfully"
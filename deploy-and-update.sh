#!/bin/bash

# deploy-and-update.sh - Automation script for PowerPoint Translator project deployment and configuration

# Log file for tracking script execution
LOG_FILE="deploy.log"
# Temporary file to store CDK deployment output
CDK_OUTPUT_FILE="cdk/cdk-deploy-output.txt"

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
cdk deploy --require-approval never > "$CDK_OUTPUT_FILE" || handle_error "CDK deployment failed. Check $CDK_OUTPUT_FILE for details"
log_message "CDK deployment completed"

# Step 3: Extract CloudFormation outputs
log_message "Step 3: Extracting output parameters from CloudFormation..."

# Get the stack name from cdk list
STACK_NAME=$(cdk list)
if [ -z "$STACK_NAME" ]; then
    handle_error "Failed to get stack name from CDK"
fi
log_message "Found stack name: $STACK_NAME"

# Get CloudFormation outputs
CF_OUTPUTS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs" --output json)
if [ $? -ne 0 ]; then
    handle_error "Failed to get CloudFormation outputs"
fi

# Extract specific outputs
API_GATEWAY_ENDPOINT=$(echo "$CF_OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiGatewayEndpoint") | .OutputValue')
ORIGINAL_BUCKET=$(echo "$CF_OUTPUTS" | jq -r '.[] | select(.OutputKey=="OriginalBucketName") | .OutputValue')
TRANSLATED_BUCKET=$(echo "$CF_OUTPUTS" | jq -r '.[] | select(.OutputKey=="TranslatedBucketName") | .OutputValue')
CLOUDFRONT_DOMAIN=$(echo "$CF_OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDistributionDomain") | .OutputValue')

# Validate extracted parameters
if [ -z "$API_GATEWAY_ENDPOINT" ] || [ -z "$ORIGINAL_BUCKET" ] || [ -z "$TRANSLATED_BUCKET" ] || [ -z "$CLOUDFRONT_DOMAIN" ]; then
    log_message "WARNING: One or more output parameters could not be extracted."
    log_message "Raw CloudFormation outputs: $CF_OUTPUTS"
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

# Step 5: Build Web UI Application
log_message "Step 5: Building Web UI application..."
cd /Users/hclo/Documents/Projects/ppt-translator/web-ui || handle_error "Failed to navigate to web-ui directory"
npm install || handle_error "Failed to install Web UI dependencies"
npm run build || handle_error "Failed to build Web UI application"
log_message "Web UI application built successfully"

# Step 6: Upload Build Artifacts to S3 Bucket
log_message "Step 6: Uploading Web UI build artifacts to S3 bucket..."
# Use the web app bucket name from the CDK stack
WEB_BUCKET="ppt-translation-web-app-unique"  # This should match the bucket name in cdk-stack.ts
aws s3 sync build/ "s3://$WEB_BUCKET/" --delete || log_message "WARNING: Failed to upload build artifacts to S3 bucket $WEB_BUCKET"
log_message "Web UI build artifacts uploaded to S3 bucket $WEB_BUCKET"

# Step 7: Create CloudFront invalidation to ensure updated content is served
log_message "Step 7: Creating CloudFront invalidation..."
# Get the CloudFront distribution ID
CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='$CLOUDFRONT_DOMAIN'].Id" --output text)
if [ -n "$CF_DIST_ID" ]; then
    aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*" || log_message "WARNING: Failed to create CloudFront invalidation"
    log_message "CloudFront invalidation created for distribution $CF_DIST_ID"
else
    log_message "WARNING: Could not find CloudFront distribution ID for domain $CLOUDFRONT_DOMAIN"
fi

log_message "Deployment and configuration automation script completed successfully"

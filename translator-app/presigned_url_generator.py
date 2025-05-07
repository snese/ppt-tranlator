import json
import boto3
import os
import logging
from botocore.exceptions import ClientError

# Set up logging with detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def generate_presigned_url(bucket_name, object_key, operation='get_object', expiration=3600):
    """
    Generate a presigned URL for the specified S3 object and operation.
    
    Args:
        bucket_name (str): Name of the S3 bucket.
        object_key (str): Key of the object in the S3 bucket.
        operation (str): Operation to perform, either 'get_object' or 'put_object'. Default is 'get_object'.
        expiration (int): Time in seconds for the presigned URL to remain valid. Default is 3600 (1 hour).
        
    Returns:
        str: Presigned URL for the specified operation on the S3 object.
    """
    s3_client = boto3.client('s3')
    try:
        response = s3_client.generate_presigned_url(
            ClientMethod=operation,
            Params={'Bucket': bucket_name, 'Key': object_key},
            ExpiresIn=expiration
        )
        logger.info(f"Generated presigned URL for {operation} on {bucket_name}/{object_key}")
        return response
    except ClientError as e:
        logger.error(f"Error generating presigned URL: {e}")
        raise Exception(f"Failed to generate presigned URL: {str(e)}")

def lambda_handler(event, context):
    """
    Lambda function handler to generate presigned URLs for S3 operations.
    
    Args:
        event (dict): Lambda event data containing bucket name, object key, operation, and expiration time.
        context (object): Lambda context object.
        
    Returns:
        dict: Response with status code and presigned URL or error message.
    """
    logger.info("Lambda event received: %s", json.dumps(event))
    
    try:
        # Extract parameters from the event
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        bucket_name = body.get('bucket_name')
        object_key = body.get('object_key')
        operation = body.get('operation', 'get_object')
        expiration = int(body.get('expiration', 3600))
        
        if not bucket_name or not object_key:
            return {
                'statusCode': 400,
                'body': json.dumps("Missing required parameters: bucket_name and object_key are required")
            }
        
        if operation not in ['get_object', 'put_object']:
            return {
                'statusCode': 400,
                'body': json.dumps("Invalid operation: must be 'get_object' or 'put_object'")
            }
        
        # Generate presigned URL
        presigned_url = generate_presigned_url(bucket_name, object_key, operation, expiration)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'presigned_url': presigned_url,
                'bucket_name': bucket_name,
                'object_key': object_key,
                'operation': operation,
                'expiration': expiration
            })
        }
    except Exception as e:
        logger.error(f"Error in lambda_handler: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error generating presigned URL: {str(e)}")
        }
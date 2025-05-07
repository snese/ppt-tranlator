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

def generate_presigned_url(s3_bucket_name, s3_object_key, operation='get_object', expiration=3600, content_type=None):
    """
    Generate a presigned URL for the specified S3 object and operation.
    
    Args:
        s3_bucket_name (str): Name of the S3 bucket.
        s3_object_key (str): Key of the object in the S3 bucket.
        operation (str): Operation to perform, either 'get_object' or 'put_object'. Default is 'get_object'.
        expiration (int): Time in seconds for the presigned URL to remain valid. Default is 3600 (1 hour).
        content_type (str): Content type of the file (for put_object operations)
        
    Returns:
        str or dict: Presigned URL for get_object or presigned POST data for put_object
    """
    s3_client = boto3.client('s3')
    try:
        # For put_object operations, use presigned POST which works better with browsers
        if operation == 'put_object':
            # Generate a presigned POST URL which works better with browser uploads
            response = s3_client.generate_presigned_post(
                Bucket=s3_bucket_name,
                Key=s3_object_key,
                Fields={
                    'Content-Type': content_type if content_type else 'application/octet-stream'
                },
                Conditions=[
                    {'Content-Type': content_type if content_type else 'application/octet-stream'},
                    ['content-length-range', 1, 100 * 1024 * 1024]  # 100MB max file size
                ],
                ExpiresIn=expiration
            )
            logger.info(f"Generated presigned POST URL for {s3_bucket_name}/{s3_object_key}")
            return response
        else:
            # For GET operations, use the regular presigned URL
            params = {'Bucket': s3_bucket_name, 'Key': s3_object_key}
            response = s3_client.generate_presigned_url(
                ClientMethod=operation,
                Params=params,
                ExpiresIn=expiration
            )
            logger.info(f"Generated presigned URL for {operation} on {s3_bucket_name}/{s3_object_key}")
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
    
    # Handle OPTIONS request for CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT',
                'Access-Control-Allow-Credentials': 'true'
            },
            'body': ''
        }
    
    try:
        # Extract parameters from the event
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        s3_bucket_name = body.get('bucket_name')
        s3_object_key = body.get('object_key')
        operation = body.get('operation', 'put_object')  # Default to put_object for uploads
        expiration = int(body.get('expiration', 3600))
        content_type = body.get('fileType')
        
        if not s3_bucket_name or not s3_object_key:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT',
                    'Access-Control-Allow-Credentials': 'true',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps("Missing required parameters: bucket_name and object_key are required")
            }
        
        if operation not in ['get_object', 'put_object']:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT',
                    'Access-Control-Allow-Credentials': 'true',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps("Invalid operation: must be 'get_object' or 'put_object'")
            }
        
        # Generate presigned URL or POST data
        presigned_data = generate_presigned_url(s3_bucket_name, s3_object_key, operation, expiration, content_type)
        
        # For put_object operations with presigned POST
        if operation == 'put_object' and isinstance(presigned_data, dict) and 'url' in presigned_data:
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT',
                    'Access-Control-Allow-Credentials': 'true',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'post_data': presigned_data,
                    'bucket_name': s3_bucket_name,
                    'object_key': s3_object_key,
                    'operation': operation,
                    'expiration': expiration
                })
            }
        else:
            # For get_object operations with presigned URL
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT',
                    'Access-Control-Allow-Credentials': 'true',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'presigned_url': presigned_data,
                    'bucket_name': s3_bucket_name,
                    'object_key': s3_object_key,
                    'operation': operation,
                    'expiration': expiration
                })
            }
    except Exception as e:
        logger.error(f"Error in lambda_handler: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT',
                'Access-Control-Allow-Credentials': 'true',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(f"Error generating presigned URL: {str(e)}")
        }

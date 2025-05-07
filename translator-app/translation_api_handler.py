import json
import boto3
import os
import logging
import uuid
import traceback
import datetime
from botocore.exceptions import ClientError
from debug_utils import setup_logger, log_event, handle_debug_request, handle_health_check

# Set up logging with detailed format
logger = setup_logger(__name__)

def lambda_handler(event, context):
    """
    Lambda function handler to handle translation API requests.
    
    Args:
        event (dict): Lambda event data
        context (object): Lambda context object
        
    Returns:
        dict: Response with status code and appropriate data
    """
    # Log the event with sensitive data redacted
    log_event(event, context, logger)
    
    # Get origin from request headers for CORS
    origin = '*'
    headers = event.get('headers', {})
    if headers and 'origin' in headers:
        origin = headers['origin']
    elif headers and 'Origin' in headers:
        origin = headers['Origin']
    
    logger.info(f"Request origin: {origin}")
    
    cors_headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,X-Request-ID',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    }
    
    # Handle OPTIONS request for CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        logger.info("Handling OPTIONS preflight request")
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }
    
    try:
        # Route the request based on the path and method
        path = event.get('path', '')
        method = event.get('httpMethod', '')
        
        logger.info(f"Processing request: {method} {path}")
        
        # Handle debug and health check endpoints
        if '/debug' in path and method == 'GET':
            return handle_debug_request(event, cors_headers, logger)
        elif '/health' in path and method == 'GET':
            return handle_health_check(event, cors_headers, logger)
        elif '/translate' in path and method == 'POST':
            return handle_translate_request(event, cors_headers)
        elif '/status' in path and method == 'GET':
            return handle_status_request(event, cors_headers)
        elif '/result' in path and method == 'GET':
            return handle_result_request(event, cors_headers)
        else:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({
                    'error': f'Unsupported path or method: {method} {path}',
                    'timestamp': datetime.datetime.now().isoformat()
                })
            }
    except Exception as e:
        logger.error(f"Unhandled exception: {e}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': f'Internal server error: {str(e)}',
                'timestamp': datetime.datetime.now().isoformat()
            })
        }

def handle_translate_request(event, cors_headers):
    """Handle translation requests"""
    try:
        # Parse the request body
        body = json.loads(event.get('body', '{}'))
        
        # Extract parameters
        file_key = body.get('fileKey')
        source_language = body.get('sourceLanguage', 'en')
        target_language = body.get('targetLanguage', 'zh-TW')
        
        # Validate required parameters
        if not file_key:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({
                    'error': 'Missing required parameter: fileKey'
                })
            }
        
        # Generate a unique job ID
        job_id = str(uuid.uuid4())
        
        # In a real implementation, you would start the translation process here
        # For now, we'll just return a job ID
        logger.info(f"Translation job initiated: {job_id} for file {file_key} from {source_language} to {target_language}")
        
        # Trigger the main translation Lambda function
        try:
            # Create a synthetic S3 event to trigger the main Lambda function
            lambda_client = boto3.client('lambda')
            
            # Get the original bucket name from environment variable or use a default
            original_bucket = os.environ.get('ORIGINAL_BUCKET', 'ppt-translation-original')
            
            # Get the TranslationLambda function name from environment variable
            translation_lambda_name = os.environ.get('TRANSLATION_LAMBDA_NAME', '')
            
            # If no name provided, fail with a clear error
            if not translation_lambda_name:
                logger.error("TRANSLATION_LAMBDA_NAME environment variable not set")
                return {
                    'statusCode': 500,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'error': 'Translation Lambda name not configured'
                    })
                }
                
            logger.info(f"Using translation lambda name: {translation_lambda_name}")
            
            # If the name doesn't include the full ARN, try to construct it
            if ':function:' not in translation_lambda_name:
                # Get the AWS region and account ID
                sts_client = boto3.client('sts')
                account_id = sts_client.get_caller_identity()['Account']
                region = boto3.session.Session().region_name
                
                # Construct the full ARN
                translation_lambda_arn = f"arn:aws:lambda:{region}:{account_id}:function:{translation_lambda_name}"
                logger.info(f"Constructed Lambda ARN: {translation_lambda_arn}")
            else:
                translation_lambda_arn = translation_lambda_name
            
            logger.info(f"Using translation lambda ARN: {translation_lambda_arn}")
            
            # Create a synthetic S3 event
            s3_event = {
                'Records': [
                    {
                        's3': {
                            'bucket': {
                                'name': original_bucket
                            },
                            'object': {
                                'key': file_key
                            }
                        }
                    }
                ],
                'jobId': job_id,
                'sourceLanguage': source_language,
                'targetLanguage': target_language
            }
            
            # Log the event we're about to send
            logger.info(f"Invoking Lambda {translation_lambda_arn} with event: {json.dumps(s3_event)}")
            
            # Invoke the main translation Lambda function asynchronously
            try:
                response = lambda_client.invoke(
                    FunctionName=translation_lambda_arn,
                    InvocationType='Event',  # Asynchronous invocation
                    Payload=json.dumps(s3_event)
                )
                
                logger.info(f"Successfully triggered translation Lambda for job {job_id}, response status code: {response['StatusCode']}")
                
                # Return the job ID to the client
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'jobId': job_id,
                        'status': 'processing',
                        'message': f'Translation job {job_id} started for file {file_key}',
                        'timestamp': datetime.datetime.now().isoformat()
                    })
                }
            except Exception as e:
                logger.error(f"Error invoking Lambda: {e}")
                logger.error(f"Exception traceback: {traceback.format_exc()}")
                return {
                    'statusCode': 500,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'error': f'Failed to start translation job: {str(e)}',
                        'timestamp': datetime.datetime.now().isoformat()
                    })
                }
        except Exception as e:
            logger.error(f"Error in translation request: {e}")
            logger.error(traceback.format_exc())
            return {
                'statusCode': 500,
                'headers': cors_headers,
                'body': json.dumps({
                    'error': f'Failed to process translation request: {str(e)}',
                    'timestamp': datetime.datetime.now().isoformat()
                })
            }
    except Exception as e:
        logger.error(f"Error parsing request: {e}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({
                'error': f'Invalid request: {str(e)}',
                'timestamp': datetime.datetime.now().isoformat()
            })
        }

def handle_status_request(event, cors_headers):
    """Handle translation status check requests"""
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        job_id = query_params.get('jobId')
        
        if not job_id:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({
                    'error': 'Missing required parameter: jobId',
                    'timestamp': datetime.datetime.now().isoformat()
                })
            }
        
        # In a real implementation, you would check the status of the translation job
        # For now, we'll just return a mock status
        logger.info(f"Checking status for job: {job_id}")
        
        # Mock status - in a real implementation, this would come from a database or other storage
        status = 'completed'  # or 'processing', 'failed', etc.
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'jobId': job_id,
                'status': status,
                'progress': 100,  # percentage
                'timestamp': datetime.datetime.now().isoformat()
            })
        }
    except Exception as e:
        logger.error(f"Error checking status: {e}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': f'Failed to check translation status: {str(e)}',
                'timestamp': datetime.datetime.now().isoformat()
            })
        }

def handle_result_request(event, cors_headers):
    """Handle translation result requests"""
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        job_id = query_params.get('jobId')
        
        if not job_id:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({
                    'error': 'Missing required parameter: jobId',
                    'timestamp': datetime.datetime.now().isoformat()
                })
            }
        
        # In a real implementation, you would retrieve the result of the translation job
        # For now, we'll just return a mock result
        logger.info(f"Getting result for job: {job_id}")
        
        # Mock result - in a real implementation, this would come from a database or S3
        translated_file_key = f"translated_{job_id}.pptx"
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'jobId': job_id,
                'status': 'completed',
                'fileKey': translated_file_key,
                'timestamp': datetime.datetime.now().isoformat()
            })
        }
    except Exception as e:
        logger.error(f"Error getting result: {e}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': f'Failed to get translation result: {str(e)}',
                'timestamp': datetime.datetime.now().isoformat()
            })
        }

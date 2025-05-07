import json
import boto3
import os
import logging
import uuid
import traceback
from botocore.exceptions import ClientError

# Set up logging with detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def lambda_handler(event, context):
    """
    Lambda function handler to handle translation API requests.
    
    Args:
        event (dict): Lambda event data
        context (object): Lambda context object
        
    Returns:
        dict: Response with status code and appropriate data
    """
    logger.info("Lambda event received: %s", json.dumps(event))
    
    # Common CORS headers for all responses
    cors_headers = {
        'Access-Control-Allow-Origin': '*',  # Allow all origins for now, will be restricted in production
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
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
        
        if '/translate' in path and method == 'POST':
            return handle_translate_request(event, cors_headers)
        elif '/status' in path and method == 'GET':
            return handle_status_request(event, cors_headers)
        elif '/result' in path and method == 'GET':
            return handle_result_request(event, cors_headers)
        else:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps("Invalid endpoint or method")
            }
    except Exception as e:
        logger.error(f"Error in lambda_handler: {e}")
        logger.error(f"Exception traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps(f"Error processing request: {str(e)}")
        }

def handle_translate_request(event, cors_headers):
    """Handle POST /translate requests"""
    try:
        # Extract parameters from the event
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        file_key = body.get('fileKey')
        source_language = body.get('sourceLanguage', 'en')
        target_language = body.get('targetLanguage', 'es')
        
        if not file_key:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps("Missing required parameter: fileKey")
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
                ]
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
                        'message': f'Translation job {job_id} started for file {file_key}'
                    })
                }
            except Exception as e:
                logger.error(f"Error invoking Lambda: {e}")
                logger.error(f"Exception traceback: {traceback.format_exc()}")
                return {
                    'statusCode': 500,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'error': f'Failed to start translation job: {str(e)}'
                    })
                }
                                logger.info(f"Found matching function: {actual_function_name}")
                                
                                response = lambda_client.invoke(
                                    FunctionName=actual_function_name,
                                    InvocationType='Event',
                                    Payload=json.dumps(s3_event)
                                )
                                logger.info(f"Successfully triggered translation Lambda with name {actual_function_name}")
                            else:
                                raise Exception(f"No matching Lambda functions found for {base_name}")
                        except Exception as inner_e:
                            logger.error(f"Error in fallback Lambda invocation: {inner_e}")
                            raise inner_e
                    else:
                        raise e
                
                # Return the job ID to the client
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'jobId': job_id,
                        'status': 'processing',
                        'message': f'Translation job {job_id} started for file {file_key}'
                    })
                }
            except Exception as e:
                logger.error(f"Error invoking Lambda: {e}")
                logger.error(f"Exception traceback: {traceback.format_exc()}")
                return {
                    'statusCode': 500,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'error': f'Failed to start translation job: {str(e)}'
                    })
                }
        except Exception as e:
            logger.error(f"Error triggering translation Lambda: {e}")
            logger.error(f"Exception traceback: {traceback.format_exc()}")
            # Continue even if there's an error triggering the Lambda
            # In a production environment, you might want to handle this differently
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'jobId': job_id,
                'status': 'SUBMITTED',
                'fileKey': file_key,
                'sourceLanguage': source_language,
                'targetLanguage': target_language
            })
        }
    except Exception as e:
        logger.error(f"Error in handle_translate_request: {e}")
        logger.error(f"Exception traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps(f"Error initiating translation: {str(e)}")
        }

def handle_status_request(event, cors_headers):
    """Handle GET /status requests"""
    try:
        # Extract job ID from query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        job_id = query_params.get('jobId')
        
        if not job_id:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps("Missing required parameter: jobId")
            }
        
        # In a real implementation, you would check the status of the translation job
        # For now, we'll just return a mock status
        logger.info(f"Checking status for job ID: {job_id}")
        
        # Simulate different statuses based on job ID
        # In a real implementation, you would check a database or other storage
        status = "IN_PROGRESS"
        progress = 0  # Start with 0% progress
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'jobId': job_id,
                'status': status,
                'progress': progress
            })
        }
    except Exception as e:
        logger.error(f"Error in handle_status_request: {e}")
        logger.error(f"Exception traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps(f"Error checking translation status: {str(e)}")
        }

def handle_result_request(event, cors_headers):
    """Handle GET /result requests"""
    try:
        # Extract job ID from query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        job_id = query_params.get('jobId')
        
        if not job_id:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps("Missing required parameter: jobId")
            }
        
        # In a real implementation, you would retrieve the result of the translation job
        # For now, we'll just return a mock result
        logger.info(f"Getting result for job ID: {job_id}")
        
        # Simulate a completed translation
        # In a real implementation, you would retrieve the result from a database or S3
        translated_file_key = f"translated-{job_id}.pptx"
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'jobId': job_id,
                'status': 'COMPLETED',
                'translatedFileKey': translated_file_key
            })
        }
    except Exception as e:
        logger.error(f"Error in handle_result_request: {e}")
        logger.error(f"Exception traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps(f"Error getting translation result: {str(e)}")
        }

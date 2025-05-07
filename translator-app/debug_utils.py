import logging
import json
import traceback
import os
import boto3
import datetime

def setup_logger(name):
    """Configure a logger with consistent formatting and appropriate level"""
    log_level = os.environ.get('LOG_LEVEL', 'INFO')
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    
    logger = logging.getLogger(name)
    logger.setLevel(numeric_level)
    
    # Add consistent formatting
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

def log_event(event, context=None, logger=None):
    """Log incoming event with sensitive data redacted"""
    if logger is None:
        logger = setup_logger('event_logger')
        
    event_copy = event.copy() if event else {}
    
    # Redact sensitive information if present
    if 'headers' in event_copy and event_copy['headers']:
        if 'Authorization' in event_copy['headers']:
            event_copy['headers']['Authorization'] = '[REDACTED]'
    
    logger.info(f"Event received: {json.dumps(event_copy)}")
    if context:
        logger.info(f"Context: RequestId: {context.aws_request_id}, "
                   f"Function: {context.function_name}, "
                   f"Remaining time: {context.get_remaining_time_in_millis()}ms")
    
    return event_copy

def handle_debug_request(event, cors_headers, logger=None):
    """Handle debug information requests"""
    if logger is None:
        logger = setup_logger('debug_handler')
    
    # Handle OPTIONS request for CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        logger.info("Handling OPTIONS preflight request for debug endpoint")
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }
        
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        debug_type = query_params.get('type', 'system')
        
        if debug_type == 'system':
            # Return system information
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'environment': dict(os.environ),
                    'region': boto3.session.Session().region_name,
                    'lambda_function': os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'unknown'),
                    'lambda_version': os.environ.get('AWS_LAMBDA_FUNCTION_VERSION', 'unknown'),
                    'memory_limit': os.environ.get('AWS_LAMBDA_FUNCTION_MEMORY_SIZE', 'unknown'),
                    'log_group': os.environ.get('AWS_LAMBDA_LOG_GROUP_NAME', 'unknown'),
                    'log_stream': os.environ.get('AWS_LAMBDA_LOG_STREAM_NAME', 'unknown'),
                    'timestamp': datetime.datetime.now().isoformat()
                })
            }
        elif debug_type == 'config':
            # Return configuration information
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'original_bucket': os.environ.get('ORIGINAL_BUCKET', 'unknown'),
                    'translated_bucket': os.environ.get('TRANSLATED_BUCKET', 'unknown'),
                    'translation_lambda': os.environ.get('TRANSLATION_LAMBDA_NAME', 'unknown'),
                    'timestamp': datetime.datetime.now().isoformat()
                })
            }
        else:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': f'Unknown debug type: {debug_type}'})
            }
    except Exception as e:
        logger.error(f"Error in debug endpoint: {e}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)})
        }

def handle_health_check(event, cors_headers, logger=None):
    """Handle health check requests"""
    if logger is None:
        logger = setup_logger('health_check')
    
    # Handle OPTIONS request for CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        logger.info("Handling OPTIONS preflight request for health endpoint")
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }
        
    try:
        # Check S3 buckets
        s3_client = boto3.client('s3')
        original_bucket = os.environ.get('ORIGINAL_BUCKET')
        translated_bucket = os.environ.get('TRANSLATED_BUCKET')
        
        s3_status = {
            'original_bucket': {
                'name': original_bucket,
                'exists': False,
                'accessible': False
            },
            'translated_bucket': {
                'name': translated_bucket,
                'exists': False,
                'accessible': False
            }
        }
        
        # Check if buckets exist and are accessible
        try:
            s3_client.head_bucket(Bucket=original_bucket)
            s3_status['original_bucket']['exists'] = True
            s3_status['original_bucket']['accessible'] = True
        except Exception as e:
            logger.error(f"Error checking original bucket: {e}")
        
        try:
            s3_client.head_bucket(Bucket=translated_bucket)
            s3_status['translated_bucket']['exists'] = True
            s3_status['translated_bucket']['accessible'] = True
        except Exception as e:
            logger.error(f"Error checking translated bucket: {e}")
        
        # Check translation Lambda
        lambda_client = boto3.client('lambda')
        translation_lambda_name = os.environ.get('TRANSLATION_LAMBDA_NAME')
        
        lambda_status = {
            'name': translation_lambda_name,
            'exists': False,
            'accessible': False
        }
        
        try:
            lambda_client.get_function(FunctionName=translation_lambda_name)
            lambda_status['exists'] = True
            lambda_status['accessible'] = True
        except Exception as e:
            logger.error(f"Error checking translation Lambda: {e}")
            # Try with region specified explicitly
            try:
                lambda_client = boto3.client('lambda', region_name='us-west-2')
                lambda_client.get_function(FunctionName=translation_lambda_name)
                lambda_status['exists'] = True
                lambda_status['accessible'] = True
                logger.info(f"Successfully found Lambda in us-west-2 region: {translation_lambda_name}")
            except Exception as region_e:
                logger.error(f"Error checking translation Lambda in us-west-2 region: {region_e}")
        
        # Determine overall health status
        is_healthy = (
            s3_status['original_bucket']['accessible'] and
            s3_status['translated_bucket']['accessible'] and
            lambda_status['accessible']
        )
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'status': 'healthy' if is_healthy else 'unhealthy',
                'timestamp': datetime.datetime.now().isoformat(),
                's3': s3_status,
                'lambda': lambda_status
            })
        }
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.datetime.now().isoformat()
            })
        }

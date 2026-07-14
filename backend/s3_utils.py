import boto3
import os
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
import logging
from io import BytesIO

# Configure logging
logger = logging.getLogger(__name__)

# Load AWS credentials from environment variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION")

# Initialize the S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

def upload_file_obj_to_s3(file_obj: BytesIO, object_name: str) -> str:
    """
    Uploads a file-like object (in-memory) to an S3 bucket and returns the public URL.

    :param file_obj: The in-memory file object (BytesIO).
    :param object_name: The name of the object in the S3 bucket.
    :return: The public URL of the uploaded file, or None if the upload fails.
    """
    if not all([AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME, AWS_REGION]):
        logger.error("AWS credentials or S3 bucket name are not configured.")
        return None

    try:
        s3_client.upload_fileobj(
            file_obj, 
            AWS_S3_BUCKET_NAME, 
            object_name,
            ExtraArgs={'ContentType': 'image/jpeg'}  # Only set content type
        )
        
        # Construct the public URL
        public_url = f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{object_name}"

        logger.info(f"Successfully uploaded in-memory object to {public_url}")
        return public_url

    except (NoCredentialsError, PartialCredentialsError):
        logger.error("AWS credentials not found or incomplete.")
        return None
    except Exception as e:
        logger.error(f"An error occurred while uploading to S3: {e}")
        return None

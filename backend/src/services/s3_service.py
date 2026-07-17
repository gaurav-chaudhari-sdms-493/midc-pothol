import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
import logging
from io import BytesIO
from ..config.settings import get_settings

# Configure logging
logger = logging.getLogger(__name__)

settings = get_settings()

# Initialize the S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
)

def upload_file_obj_to_s3(file_obj: BytesIO, object_name: str) -> str:
    """
    Uploads a file-like object (in-memory) to an S3 bucket and returns the public URL.

    :param file_obj: The in-memory file object (BytesIO).
    :param object_name: The name of the object in the S3 bucket.
    :return: The public URL of the uploaded file, or None if the upload fails.
    """
    if not all([settings.aws_access_key_id, settings.aws_secret_access_key, settings.aws_s3_bucket_name]):
        logger.error("AWS credentials or S3 bucket name are not configured.")
        return None

    try:
        s3_client.upload_fileobj(
            file_obj, 
            settings.aws_s3_bucket_name, 
            object_name,
            ExtraArgs={'ContentType': 'image/jpeg'}
        )
        
        # Construct the public URL
        public_url = f"https://{settings.aws_s3_bucket_name}.s3.amazonaws.com/{object_name}"

        logger.info(f"Successfully uploaded in-memory object to {public_url}")
        return public_url

    except (NoCredentialsError, PartialCredentialsError):
        logger.error("AWS credentials not found or incomplete.")
        return None
    except Exception as e:
        logger.error(f"An error occurred while uploading to S3: {e}")
        return None

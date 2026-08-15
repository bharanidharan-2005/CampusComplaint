"""Centralized DRF exception handler for consistent API error responses."""
import logging

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('campus')


def custom_exception_handler(exc, context):
    """Wrap DRF errors in a uniform envelope and log server errors."""
    response = exception_handler(exc, context)

    if response is None:
        logger.exception('Unhandled exception: %s', exc)
        return Response(
            {
                'error': 'An unexpected error occurred. Please try again later.',
                'detail': str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    request = context.get('request')
    view = context.get('view')
    logger.warning(
        'API error %s %s -> %s: %s',
        getattr(request, 'method', ''),
        getattr(request, 'path', ''),
        getattr(view, '__class__', ''),
        response.data,
    )

    if isinstance(response.data, dict):
        detail = response.data.get('detail', response.data)
    else:
        detail = response.data

    response.data = {
        'error': True,
        'status_code': response.status_code,
        'detail': detail,
    }
    return response

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Organization, NeedItem
from .serializers import OrganizationSerializer, NeedItemSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    """
    Search endpoint for organizations and needs.
    
    Query Parameters:
    - q: Search query string (required)
    - type: Type to search in ('organization', 'need', 'all') (default: 'all')
    - priority: Priority filter for needs ('CRITICAL', 'ESSENTIAL', 'NICE') (optional)
    - org_type: Organization type filter (optional)
    - limit: Number of results to return (default: 50, max: 100)
    - offset: Pagination offset (default: 0)
    
    Examples:
    - /api/search/?q=hospital&type=organization
    - /api/search/?q=stethoscope&type=need&priority=CRITICAL
    - /api/search/?q=national&limit=25&offset=0
    """
    
    query = request.query_params.get('q', '').strip()
    search_type = request.query_params.get('type', 'all')  # 'organization', 'need', 'all'
    priority = request.query_params.get('priority', '')
    org_type = request.query_params.get('org_type', '')
    limit = int(request.query_params.get('limit', 50))
    offset = int(request.query_params.get('offset', 0))
    
    # Validate query
    if not query or len(query) < 2:
        return Response(
            {'error': 'Search query must be at least 2 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Cap limit at 100
    limit = min(limit, 100)
    
    results = {
        'organizations': [],
        'needs': [],
        'total': 0
    }
    
    # Search Organizations
    if search_type in ('organization', 'all'):
        org_query = Organization.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )
        
        # Filter by organization type if provided
        if org_type:
            org_query = org_query.filter(org_type=org_type)
        
        # Apply pagination
        org_results = org_query[offset:offset + limit]
        results['organizations'] = OrganizationSerializer(org_results, many=True).data
    
    # Search Needs
    if search_type in ('need', 'all'):
        need_query = NeedItem.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        ).select_related('section', 'section__organization')
        
        # Filter by priority if provided
        if priority:
            need_query = need_query.filter(priority=priority)
        
        # Apply pagination
        need_results = need_query[offset:offset + limit]
        results['needs'] = NeedItemSerializer(need_results, many=True).data
    
    # Calculate total
    results['total'] = len(results['organizations']) + len(results['needs'])
    
    return Response(results, status=status.HTTP_200_OK)

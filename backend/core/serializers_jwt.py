"""
Custom JWT serializers that include additional user information in tokens.
"""
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that includes user role and other info in the token.
    This ensures the backend can access user.role without additional queries.
    """
    
    @classmethod
    def get_token(cls, user):
        """
        Override to add custom claims to the token.
        """
        token = super().get_token(user)
        
        # Add user information to the access token only (not refresh)
        # This prevents issues with token refresh validation
        token['user_id'] = user.id
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = getattr(user, 'role', 'DONOR')
        
        return token
    
    def validate(self, attrs):
        """
        Validate and add user data to the response.
        """
        data = super().validate(attrs)
        
        # Add user information to response
        user = self.user
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': getattr(user, 'role', 'DONOR'),
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': getattr(user, 'phone_number', ''),
        }
        
        return data


def get_tokens_for_user(user):
    """
    Generate both access and refresh tokens for a user.
    Used in registration and other places where tokens need to be created.
    """
    refresh = RefreshToken.for_user(user)
    
    # Add custom claims only to access token (don't modify refresh token)
    # This prevents token validation errors during refresh
    access_token = refresh.access_token
    access_token['user_id'] = user.id
    access_token['username'] = user.username
    access_token['email'] = user.email
    access_token['role'] = getattr(user, 'role', 'DONOR')
    
    return {
        'refresh': str(refresh),
        'access': str(access_token),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': getattr(user, 'role', 'DONOR'),
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': getattr(user, 'phone_number', ''),
        }
    }

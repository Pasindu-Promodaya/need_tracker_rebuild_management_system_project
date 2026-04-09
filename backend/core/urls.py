from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    OrganizationViewSet, 
    SectionViewSet, 
    NeedItemViewSet, 
    DocumentUploadViewSet,
    DonationViewSet,
    AdminApprovalViewSet,
    RegisterView,
    OrgAdminRegisterView,
    MeView,
    custom_login,
    forgot_password,
    reset_password,
)
from .search_views import search

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet)
router.register(r'sections', SectionViewSet)
router.register(r'needs', NeedItemViewSet)
router.register(r'documents', DocumentUploadViewSet)
router.register(r'donations', DonationViewSet)
router.register(r'admin/approvals', AdminApprovalViewSet, basename='admin_approval')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('search/', search, name='search'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/register-org-admin/', OrgAdminRegisterView.as_view(), name='auth_register_org_admin'),
    path('auth/login/', custom_login, name='custom_login'),
    path('auth/login-jwt/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
    path('auth/forgot-password/', forgot_password, name='auth_forgot_password'),
    path('auth/reset-password/', reset_password, name='auth_reset_password'),
    path('', include(router.urls)),
]
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView
)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

from django.conf.urls.static import static
from django.conf import settings

from .views import (
    UserViewSet,
    GroupViewSet,
    MembershipViewSet,
    AccessViewSet,
    SearchView,
    IndexMetadataView,
    SendMagnetView,
    RegisterView,
    UserMeView,
    VirusScanView,
    SharedJoinView,
    SharedLeaveView,
    SearchSuggestionsView,
    SharersCountView,
    ChangePasswordView,
    CommentsView,
    RatingViewSet,
    RecommendationView,
    FeedBackViewSet,
    MessageViewSet,
    ReportViewSet,
    ReportStatusUpdateView,
    ReportAdminView,
    ReportDetailView,
    ReportUpdateView,
    UsersFilesView,
)

# Schema view for API documentation
schema_view = get_schema_view(
   openapi.Info(
      title="PeerLink API",
      default_version='v1',
      description="API documentation for PeerLink Service",
   ),
   public=True,
   permission_classes=[permissions.AllowAny],
)

# Router for viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'memberships', MembershipViewSet)
router.register(r'access', AccessViewSet)
router.register(r'ratings', RatingViewSet)
router.register(r'feedback', FeedBackViewSet)
router.register(r'messages', MessageViewSet)
router.register(r'reports', ReportViewSet, basename='report')

# URL patterns
urlpatterns = [
    # API documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # User detail endpoint - must come before router.urls
    path('users/me/', UserMeView.as_view(), name='user-me'),

    # Include router URLs
    path('', include(router.urls)),

    # Authentication endpoints
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Custom views
    path('search/', SearchView.as_view(), name='search'),
    path('index-metadata/', IndexMetadataView.as_view(), name='index-metadata'),
    path('magnet/', SendMagnetView.as_view(), name='send_magnet'),
    path('virus-scan/', VirusScanView.as_view(), name='virus-scan'),
    path('shared-join/', SharedJoinView.as_view(), name='shared-join'),
    path('shared-leave/', SharedLeaveView.as_view(), name='shared-leave'),
    path('search/suggestions/', SearchSuggestionsView.as_view(), name='search-suggestions'),
    path('sharers-count/', SharersCountView.as_view(), name='sharers-count'),
    path('comments/', CommentsView.as_view(), name='comments'),
    path('users-files/', UsersFilesView.as_view(), name='users-files'),

    # Recommendations endpoint
    path('recommendations/', RecommendationView.as_view(), name='recommendations'),

    # Report endpoints
    path('reports/<int:pk>/status/', ReportStatusUpdateView.as_view(), name='report-status-update'),
    path('manage/reports/', ReportAdminView.as_view(), name='report_admin'),
    path('manage/reports/<int:pk>/', ReportDetailView.as_view(), name='report_detail'),
    path('manage/reports/<int:pk>/update/', ReportUpdateView.as_view(), name='report_update'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

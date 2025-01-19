from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import *
from rest_framework_simplejwt import views as jwt_views

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'membership', MembershipViewSet)

urlpatterns = router.urls + [
    path('search/', SearchView.as_view(), name='search'),
    path('index-metadata/', IndexMetadataView.as_view(), name='index-metadata'),
    path('token/', jwt_views.TokenObtainPairView.as_view(), name ='token_obtain_pair'),
    path('token/refresh/', jwt_views.TokenRefreshView.as_view(), name ='token_refresh'),
    path('logout/', LogoutView.as_view(), name ='logout'),
    path('send-magnet/', SendMagnetView.as_view(), name="send_magnet"),
]

from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path("ws/", consumers.MagnetLinkConsumer.as_asgi()),
    path("ws/chat/<str:group_id>/", consumers.GroupChatConsumer.as_asgi()),
]

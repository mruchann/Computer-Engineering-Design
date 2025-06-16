from django.apps import AppConfig


class PeerlinkServiceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'peerlink_service'

    def ready(self):
        from .scheduler import start
        start()

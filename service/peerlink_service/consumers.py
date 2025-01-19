import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class MagnetLinkConsumer(WebsocketConsumer):
    def connect(self):
        self.user = self.scope["user"]
        self.user_group_name = f"user_{self.user.id}"
        print("self.user", self.user_group_name)
        if self.user.is_authenticated:
            async_to_sync(self.channel_layer.group_add)(
                self.user_group_name,
                self.channel_name
            )
            self.accept()
        else:
            self.close()

    def disconnect(self, close_code):
        if hasattr(self, "user_group_name"):
            async_to_sync(self.channel_layer.group_discard)(
                self.user_group_name,
                self.channel_name
            )

    def receive(self, text_data):
        pass

    def magnet_message(self, event):
        message = event["message"]
        self.send(text_data=json.dumps({"magnet": message}))

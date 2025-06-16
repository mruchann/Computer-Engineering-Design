import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

from .models import Group, Message
from .serializers import MessageSerializer


class MagnetLinkConsumer(WebsocketConsumer):
    active_users = set()

    def connect(self):
        self.user = self.scope["user"]
        self.user_group_name = f"user_{self.user.id}"

        print("self.user", self.user_group_name)

        if self.user.is_authenticated:
            async_to_sync(self.channel_layer.group_add)(
                self.user_group_name,
                self.channel_name
            )
            MagnetLinkConsumer.active_users.add(self.user_group_name)
            self.accept()
        else:
            self.close()

    def disconnect(self, close_code):
        if hasattr(self, "user_group_name"):
            async_to_sync(self.channel_layer.group_discard)(
                self.user_group_name,
                self.channel_name
            )
            if self.user_group_name in MagnetLinkConsumer.active_users:
                MagnetLinkConsumer.active_users.remove(self.user_group_name)

    def receive(self, text_data):
        pass

    def magnet_message(self, event):
        message = event["message"]
        self.send(text_data=json.dumps({"magnet": message}))

    @classmethod
    def get_active_users(cls):
        return cls.active_users


class GroupChatConsumer(WebsocketConsumer):
    def connect(self):
        self.user = self.scope["user"]
        self.group_id = self.scope["url_route"]["kwargs"]["group_id"]
        self.group_name = f"chat_{self.group_id}"

        # Check if user is authenticated and is a member of the group
        if self.user.is_authenticated and self.user.groups.filter(id=self.group_id).exists():
            # Join the group channel
            async_to_sync(self.channel_layer.group_add)(
                self.group_name,
                self.channel_name
            )
            self.accept()
        else:
            self.close()

    def disconnect(self, close_code):
        # Leave the group channel
        if hasattr(self, "group_name"):
            async_to_sync(self.channel_layer.group_discard)(
                self.group_name,
                self.channel_name
            )

    def receive(self, text_data):
        # Parse the received message
        data = json.loads(text_data)
        message_content = data.get("message", "")
        
        if message_content:
            # Save the message to the database
            try:
                group = Group.objects.get(id=self.group_id)
                message = Message.objects.create(
                    group=group,
                    sender=self.user,
                    content=message_content
                )
                
                # Serialize the message
                serializer = MessageSerializer(message)
                message_data = serializer.data
                
                # Broadcast the message to the group
                async_to_sync(self.channel_layer.group_send)(
                    self.group_name,
                    {
                        "type": "chat_message",
                        "message": message_data
                    }
                )
            except Group.DoesNotExist:
                self.send(text_data=json.dumps({
                    "error": "Group not found"
                }))
    
    def chat_message(self, event):
        # Send message to WebSocket
        message = event["message"]
        self.send(text_data=json.dumps({
            "message": message
        }))

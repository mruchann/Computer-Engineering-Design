from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def send_message_to_user(user_id, message):
    channel_layer = get_channel_layer()
    group_name = f"user_{user_id}"
    print("group name", group_name)

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "magnet_message",  # corresponds to the method name in the consumer
            "message": message,
        },
    )

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Shared
from .consumers import MagnetLinkConsumer
from random import randint

THRESHOLD = 3
BACKUP_ON = True  # set to False if you don't want to be disturbed by backup messages while developing other stuff


def notify_users():
    if not BACKUP_ON:
        print("Backup is turned off.")
        return
    try:
        shared_files = Shared.objects.all()
        for shared_file in shared_files:
            if shared_file.currently_sharing_users.count() < THRESHOLD:
                active_users = MagnetLinkConsumer.get_active_users()
                print(active_users)

                idx = randint(0, len(active_users) - 1)

                send_message_to_group(list(active_users)[idx], "magnet_message", shared_file.magnetLink)
    except Exception as e:
        print("Exception occurred", e)


def send_message_to_group(group_name, type, message):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': type,
            'message': message
        }
    )


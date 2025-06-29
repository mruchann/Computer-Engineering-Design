# Generated by Django 5.1.4 on 2025-02-18 14:52

import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('peerlink_service', '0002_remove_torrent_uploaded_by_delete_download_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='group',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
        migrations.CreateModel(
            name='Access',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file_hash', models.CharField(editable=False, max_length=64)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='peerlink_service.group')),
            ],
            options={
                'unique_together': {('group', 'file_hash')},
            },
        ),
    ]

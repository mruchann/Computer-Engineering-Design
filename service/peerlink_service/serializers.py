from rest_framework import serializers
from .models import Access, FeedBack, User, Group, Membership, Rating, Shared, Message, Report

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined', 'groups', 'bio', 'location', 'photo',
                 'title', 'website', 'github', 'twitter', 'interests', 
                 'reputation_score', 'files_shared', 'total_downloads', 'last_active']
        read_only_fields = ['id', 'date_joined', 'reputation_score', 'files_shared', 'total_downloads', 'last_active']


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'aes_key']
        read_only_fields = ['id', 'aes_key']


class MembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Membership
        fields = ['id', 'user', 'group', 'date_joined', 'username', 'group_name']
        read_only_fields = ['date_joined']

class AccessSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Access
        fields = ['id', 'group', 'file_hash', 'group_name']

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_id = serializers.CharField(source='sender.id', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'group', 'sender', 'sender_username', 'sender_id', 'content', 'timestamp']
        read_only_fields = ['id', 'timestamp']

class RatingSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Rating
        fields = ['id', 'user', 'file_hash', 'rating', 'created_at', 'username']
        read_only_fields = ['id', 'created_at', 'username']

class SharedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shared
        fields = ['file_hash', 'file_name', 'magnetLink']

class FeedBackSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedBack
        fields = ['email', 'text', 'rate', 'date']

class ReportSerializer(serializers.ModelSerializer):
    file_name = serializers.CharField(source='file.name', read_only=True)
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)

    class Meta:
        model = Report
        fields = ['id', 'file', 'file_name', 'reporter', 'reporter_username', 'reason', 
                 'status', 'created_at', 'updated_at', 'admin_notes']
        read_only_fields = ['status', 'created_at', 'updated_at', 'admin_notes']

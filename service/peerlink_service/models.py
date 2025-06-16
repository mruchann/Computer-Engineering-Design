import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Group(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=200, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    aes_key = models.CharField(max_length=32, blank=True, editable=False, default="00000000000000000000000000000000")  

    def __str__(self):
        return f"{self.name} ({self.description})"


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    groups = models.ManyToManyField(Group, through='Membership', related_name='members')
    location = models.CharField(max_length = 200, unique = False, null = True)
    bio = models.CharField(max_length = 200, unique = False, null = True )
    photo = models.ImageField(upload_to = 'profile_photos/', null = True, blank = True)
    # New customization fields
    title = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(max_length=200, blank=True, null=True)
    github = models.URLField(max_length=200, blank=True, null=True)
    twitter = models.URLField(max_length=200, blank=True, null=True)
    interests = models.CharField(max_length=300, blank=True, null=True)
    # Activity and reputation tracking
    reputation_score = models.IntegerField(default=0)
    files_shared = models.IntegerField(default=0)
    total_downloads = models.IntegerField(default=0)
    last_active = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.email})"


# Each people may be a member of groups
class Membership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    date_joined = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'group')


# Message model for storing chat messages within groups
class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"Message from {self.sender.username} in {self.group.name} at {self.timestamp}"


# We keep track of the files of the groups that they have access to 
# User will be able to choose/create group when he decides to share a file
class Access(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    file_hash = models.CharField(max_length=64, blank=False, editable=False)

    class Meta:
        unique_together = ('group','file_hash')

    def __str__(self):
        return f"Access: Group={self.group.name}, File Hash={self.file_hash[:10]}..."


class Shared(models.Model):
    file_hash = models.CharField(primary_key=True, max_length=64, blank=False, editable=False)
    file_name = models.CharField(max_length=256, blank=False, editable=False)
    magnetLink = models.CharField(max_length=256, blank=False, editable=False)
    currently_sharing_users = models.ManyToManyField(User, related_name='currently_sharing_files')

    def __str__(self):
        return f"Shared: Currently Sharing Users={[user for user in self.currently_sharing_users.all()]}, File Hash={self.file_hash[:10]}..."


class Comment(models.Model):
    text = models.CharField(max_length=512, blank=False, editable=False)
    file_hash = models.CharField(max_length=64, blank=False, editable=False)

    def __str__(self):
        return f"Comment: Text={self.text}, File Hash={self.file_hash[:10]}..."


class Rating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file_hash = models.CharField(max_length=64, blank=False, editable=False)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'file_hash')

    def __str__(self):
        return f"Rating: User={self.user.username}, File Hash={self.file_hash[:10]}..., Rating={self.rating}"


class FeedBack(models.Model):
    email = models.CharField(max_length=64, blank=False, editable=False)
    text = models.CharField(max_length=512, blank=False, editable=False)
    rate = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    date = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        unique_together = ('email', 'text', 'rate', 'date')

    def __str__(self):
        return f"FeedBcak: Email={self.email}, Text={self.text[:10]}..., Rating={self.rating}"


class Report(models.Model):
    REPORT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    file = models.ForeignKey(Shared, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_files')
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=REPORT_STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    admin_notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report for {self.file.file_name} by {self.reporter.username}"
from datetime import timezone

import os
import uuid
from rest_framework import status, viewsets, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404, render
from django.http import JsonResponse
from django.db import IntegrityError
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import hashlib
import requests
import time
import secrets
from django.views.generic import ListView, DetailView, UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.contrib import messages
from django.db.models import Q

from django.utils import timezone

from .models import Access, FeedBack, User, Group, Membership, Shared, Comment, Rating, Message, Report
from .serializers import AccessSerializer, FeedBackSerializer, UserSerializer, GroupSerializer, MembershipSerializer, RatingSerializer, MessageSerializer, ReportSerializer
from .search import index_file, search_file, update_file
from .utils import send_message_to_user

from django.core.cache import cache

from django.db import utils as django_db_utils
from django.db.models import Avg, Count
from collections import Counter


# pk = Primary Key

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        """
        Optionally restricts the returned users,
        by filtering against query parameters in the URL.
        """
        queryset = User.objects.all()
        username = self.request.query_params.get('username', None)
        if username is not None:
            queryset = queryset.filter(username=username)
        return queryset

    @swagger_auto_schema(
        request_body=UserSerializer,
        responses={201: UserSerializer()}
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # DELETE /users/{pk}/
    def destroy(self, request, *args, **kwargs):
        try:
            user_id = kwargs.get("pk")
            user = get_object_or_404(User, id=user_id)
            user.delete()
            return Response({'detail': 'User deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    # POST /users/search/
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        query = request.GET.get("q", "").strip()

        if not query:
            return Response({"detail": "Query parameter 'q' is required."}, status=status.HTTP_400_BAD_REQUEST)

        users = User.objects.filter(username__icontains=query)
        serializer = self.get_serializer(users, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)
        
    # GET /users/online/
    @action(detail=False, methods=['get'], url_path='online')
    def online_users(self, request):
        """
        Returns a list of online users' IDs by checking which users are currently sharing files.
        A user is considered online if they are actively sharing at least one file.
        """
        from django.db.models import Prefetch
        
        # Get distinct users who are currently sharing files from the Shared model
        online_user_ids = Shared.objects.values_list('currently_sharing_users', flat=True).distinct()
        
        # Filter out None values
        online_user_ids = [str(uid) for uid in online_user_ids if uid is not None]
        
        return Response(online_user_ids, status=status.HTTP_200_OK)

    # GET /users/myProfile/
    @action(detail = False, methods = ['get'], url_path = 'myProfile')
    def my_profile(self, request):
        try:

            user = request.user

            username = user.username
            email = user.email
            date_joined = user.data_joined

            data = {
                'username': username,
                'email': email,
                'date_joined': date_joined.isoformat(),  # Convert datetime to string
            }
            return JsonResponse(data)

        except Exception as e:

            return Response({'detail': f'{e}'}, status=status.HTTP_404_NOT_FOUND)

    # PUT /users/updateName/
    @action(detail = False, methods = ['put'], url_path  = 'updateName')
    def update_profile(self, request):
        try:
            user_name = request.user.username

            new_name = request.data.get('new_name')

            user = get_object_or_404(User, username = user_name )

            user.username = new_name
            user.save()
            print(user_name)

            return Response({'detail': 'User name changed successfully.'}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:

            return Response({'detail': f'{e}'}, status=status.HTTP_404_NOT_FOUND)

    # PUT /users/updateEmail/
    @action(detail = False, methods = ['put'], url_path = 'updateEmail')
    def update_email(self, request):
        try:
            user_name = request.user.username

            new_email = request.data.get('new_email')

            user = get_object_or_404(User, username = user_name )

            user.email = new_email
            user.save()
            print(user_name)

            return Response({'detail': 'User email changed successfully.'}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:

            return Response({'detail': f'{e}'}, status=status.HTTP_404_NOT_FOUND)

    # PUT /users/updateBio/ 
    @action(detail = False, methods = ['put'], url_path = 'updateBio')  
    def update_bio(self, request):
        try:
            user_name = request.user.username

            new_bio = request.data.get('new_bio')

            user = get_object_or_404(User, username = user_name)

            user.bio = new_bio 
            user.save()

            return Response({'detail': 'User bio changed successfully.'}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:

            return Response({'detail': f'{e}'}, status=status.HTTP_404_NOT_FOUND)

    # PUT /users/updateLocation/ 
    @action(detail = False, methods = ['put'], url_path = 'updateLocation')  
    def update_location(self, request):
        try:
            user_name = request.user.username

            new_location = request.data.get('new_location')

            user = get_object_or_404(User, username = user_name)

            user.location = new_location 
            user.save()

            return Response({'detail': 'User location changed successfully.'}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:

            return Response({'detail': f'{e}'}, status=status.HTTP_404_NOT_FOUND)

    # PUT /users/updatePhoto
    @action(detail = False, methods = ['put'], url_path = 'updatePhoto')
    def update_photo(self, request):
        try:
            user = request.user
            user.photo = request.FILES.get('photo')
            user.save()
            return Response({'photo_url': user.photo.url})

        except Exception as e:

            return Response({'detail': f'{e}'}, status=status.HTTP_404_NOT_FOUND)

    # PUT /users/updateTitle/
    @action(detail = False, methods = ['put'], url_path = 'updateTitle')  
    def update_title(self, request):
        try:
            user = request.user
            new_title = request.data.get('new_title')
            user.title = new_title 
            user.save()
            return Response({'detail': 'User title updated successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'{e}'}, status=status.HTTP_400_BAD_REQUEST)
            
    # PUT /users/updateWebsite/
    @action(detail = False, methods = ['put'], url_path = 'updateWebsite')  
    def update_website(self, request):
        try:
            user = request.user
            new_website = request.data.get('new_website')
            user.website = new_website 
            user.save()
            return Response({'detail': 'User website updated successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'{e}'}, status=status.HTTP_400_BAD_REQUEST)
            
    # PUT /users/updateGithub/
    @action(detail = False, methods = ['put'], url_path = 'updateGithub')  
    def update_github(self, request):
        try:
            user = request.user
            new_github = request.data.get('new_github')
            user.github = new_github 
            user.save()
            return Response({'detail': 'User GitHub profile updated successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'{e}'}, status=status.HTTP_400_BAD_REQUEST)
            
    # PUT /users/updateTwitter/
    @action(detail = False, methods = ['put'], url_path = 'updateTwitter')  
    def update_twitter(self, request):
        try:
            user = request.user
            new_twitter = request.data.get('new_twitter')
            user.twitter = new_twitter 
            user.save()
            return Response({'detail': 'User Twitter profile updated successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'{e}'}, status=status.HTTP_400_BAD_REQUEST)
            
    # PUT /users/updateInterests/
    @action(detail = False, methods = ['put'], url_path = 'updateInterests')  
    def update_interests(self, request):
        try:
            user = request.user
            new_interests = request.data.get('new_interests')
            user.interests = new_interests 
            user.save()
            return Response({'detail': 'User interests updated successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'{e}'}, status=status.HTTP_400_BAD_REQUEST)
            
    # GET /users/stats/
    @action(detail = False, methods = ['get'], url_path = 'stats')
    def get_user_stats(self, request):
        try:
            user = request.user
            
            # Get user activity stats
            stats = {
                'reputation_score': user.reputation_score,
                'files_shared': user.files_shared,
                'total_downloads': user.total_downloads,
                'last_active': user.last_active,
                'date_joined': user.date_joined,
                'groups_count': user.groups.count(),
            }
            
            return Response(stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'{e}'}, status=status.HTTP_400_BAD_REQUEST)

    # PUT /users/deleteUser/
    @action(detail = False, methods = ['put'], url_path = 'deleteUser')
    def delete_user(self, request):
        try:
            user_name = request.user.username
            user = get_object_or_404(User, username = user_name )

            user.delete()

            return Response({'detail': 'User deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:

            return Response({'detail': f'{e}'}, status=status.HTTP_404_NOT_FOUND)
       
class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    #permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # GET /groups/
    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    # GET /groups/{pk}/
    def retrieve(self, request, *args, **kwargs):
        try:
            group_id = kwargs.get("pk")
            group = Group.objects.get(id=group_id)
            serializer = self.get_serializer(group)
            return Response(serializer.data)
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

    # POST /groups/
    def create(self, request, *args, **kwargs):
        name, description = request.data["name"], request.data["description"]
        aes_key = secrets.token_hex(16)
        #aes_key = request.data.get("aes_key", "00000000000000000000000000000000")
        group = Group.objects.create(name=name, description=description, aes_key=aes_key)
        serializer = self.get_serializer(group)
        return Response(serializer.data)

    # DELETE /groups/{pk}/
    def destroy(self, request, *args, **kwargs):
        try:
            group_id = kwargs.get("pk")
            group = get_object_or_404(Group, id=group_id)
            group.delete()
            return Response({'detail': 'Group deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except Group.DoesNotExist:
            return Response({'detail': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

    # GET /groups/groupkeys/<grup_id> 
    @action(detail=False, methods=['get'], url_path='groupkeys/(?P<group_id>[^/]+)')
    def get_key(self, request, group_id=None):
        try:
            group = Group.objects.get(id=group_id)

            return Response({"aes_key": group.aes_key})
        except Group.DoesNotExist:
            return Response({"detail": "Key not found."}, status=status.HTTP_404_NOT_FOUND)

    # GET /groups/keys/<hash> 
    @action(detail=False, methods=['get'], url_path='keys/(?P<file_hash>[^/]+)')
    def getCryptoKey(self, request, file_hash = None):
        try:
            access = get_object_or_404(Access,file_hash = file_hash )

            aes_key = access.group.aes_key

            return Response({"aes_key": aes_key}, status=status.HTTP_200_OK)
        except Group.DoesNotExist:
            return Response({"detail": "Key not found."}, status=status.HTTP_404_NOT_FOUND)

    # GET /groups/my-groups/
    @action(detail=False, methods=['get'], url_path='my-groups')
    def get_user_groups(self, request):
        """Returns the groups that the current user belongs to."""
        user = request.user
        user_groups = user.groups.all() 
        serializer = self.get_serializer(user_groups, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MembershipViewSet(mixins.CreateModelMixin,
                       mixins.ListModelMixin,
                       mixins.DestroyModelMixin,
                       viewsets.GenericViewSet):
    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer
    # permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='Add')
    def add(self, request):
        user = get_object_or_404(User, id=request.data.get('username'))
        group = get_object_or_404(Group, id=request.data.get('group'))
        
        try:
            membership = Membership.objects.create(user=user, group=group)
            serializer = self.get_serializer(membership)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response(
                {'detail': 'User is already a member of this group.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # GET /memberships/
    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    # POST /memberships/add/
    @action(detail=False, methods=['post'], url_path='add')
    def add_membership(self, request):
        user = User.objects.get(username=request.data['username'])
        group = Group.objects.get(name=request.data['group'])
        try:
            Membership.objects.create(user=user, group=group)
            return Response({'detail': 'User added to the group successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': 'User is already in the group.'}, status=status.HTTP_400_BAD_REQUEST)

    # POST /membership/delete/
    @action(detail=False, methods=['post'], url_path='delete')
    def delete_membership(self, request):
        user = get_object_or_404(User, id=request.data['user'])
        group = get_object_or_404(Group, id=request.data['group'])
        try:
            membership = get_object_or_404(Membership, user=user, group=group)
            membership.delete()
            return Response({'detail': 'Membership deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'detail': 'Membership is not found.'}, status=status.HTTP_400_BAD_REQUEST)

    # User can reach his memberships via this endpoint
    @action(detail=False, methods=['get'], url_path='my_memberships')
    def my_memberships(self, request):
        try:
            """
            Get all memberships for the currently logged-in user.
            """
            memberships = Membership.objects.filter(user=request.user)
            serializer = self.get_serializer(memberships, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'{e}'}, status=status.HTTP_404_NOT_FOUND)


class SearchView(APIView):

    # You can comment it if you want to access it via API
    # Otherwise, you need to provide some valid credentials!
    # permission_classes = (IsAuthenticated, ) 

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'query', openapi.IN_QUERY,
                description="Search term",
                type=openapi.TYPE_STRING,
                required=True
            )
        ]
    )
    def get(self, request):
        try:
            user = request.user
            search_term = request.query_params.get("query", "")
            group_id = request.query_params.get("group", "")
            search_by_metadata = request.query_params.get("filter", "filename")

            print("HERE", search_by_metadata)

            # You cannot search via api since you need to log in

            user_groups = [Group.objects.get(id=uuid.UUID(group_id))] if group_id != "" else user.groups.all()

            allowed_file_hashes = Access.objects.filter(group__in=user_groups).values_list("file_hash", flat=True)

            # If you want to search via web interface localhost,
            # Comment out above and use below

            # allowed_file_hashes = []
            print(allowed_file_hashes)
            files = search_file(search_term, allowed_file_hashes, search_by_metadata)
            for file in files:
                access = Access.objects.filter(file_hash=file["hash"])[0]
                file["group"] = access.group.name

            print(files)
            return Response(files)
        except Exception as e:
            print(e)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request):
        try:
            user = request.user
            magnetLink = request.data['magnetLink']
            update_fields = request.data['updateFields']

            response = update_file(magnetLink, update_fields)
            return Response(response)

        except Exception as e:
            print(e)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# TO DO
# Add here necessary API endopoints after migrations 
class AccessViewSet(viewsets.ModelViewSet):
    queryset = Access.objects.all()
    serializer_class = AccessSerializer

    # GET /access/
    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)
    
    # POST /access/
    def create(self, request, *args, **kwargs):
        try:
            group, file_hash = request.data['group'], request.data['file_hash']
            group = Group.objects.get(id=group)
            access = Access.objects.create(group=group, file_hash=file_hash)
            serializer = self.get_serializer(access)
            return Response(serializer.data)
        except django_db_utils.IntegrityError:
            return Response({'detail': 'Already has access.'}, status=status.HTTP_400_BAD_REQUEST)

    # POST /access/delete/
    @action(detail=False, methods=['post'], url_path='delete')
    def delete_access(self, request):
        try: 
            group_name, file_hash = request.data['group'], request.data['file_hash']
            group = Group.objects.get(name=group_name)
            access = Access.objects.get(group=group, file_hash=file_hash)
            access.delete()
            return Response({'detail': 'Access deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except django_db_utils.IntegrityError:
            return Response({'detail': 'Access is not found.'}, status=status.HTTP_400_BAD_REQUEST)

    # POST /access/Delete/
    @action(detail=False, methods=['post'], url_path='Delete')
    def delete_access(self, request):
        try: 
            group, file_hash = request.data['group'], request.data['file_hash']
            group = Group.objects.get(id=group)
            access = Access.objects.get(group=group, file_hash=file_hash)
            access.delete()
            return Response({'detail': 'Access deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except django_db_utils.IntegrityError:
            return Response({'detail': 'Access is not found.'}, status=status.HTTP_400_BAD_REQUEST)


class IndexMetadataView(APIView):
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        """Index file metadata in Elasticsearch"""
        try:
            metadata = {
                **request.data,
                'owner_id': str(request.user.id),
                'owner_username': request.user.username,
            }

            # COMMENT BELOW WHEN CLIENT SENDS REQUEST TO ACCESS ENDPOINT
            # THIS IS  UNCOMMENTED FOR TESTING
            #all_groups = list(Group.objects.all())

            #for group in all_groups:
            #    Access.objects.create(group=group, file_hash=request.data.get('hash'))
            ################################################################

            # Index the metadata in Elasticsearch
            index_file(metadata)
            
            return Response({
                "message": "File metadata indexed successfully"
            })
        except Exception as e:
            print(str(e))
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SendMagnetView(APIView):
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        magnetLink = request.data.get('magnetLink')
        if not magnetLink:
            return Response(
                {"error": "Magnet link is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            send_message_to_user(request.user.id, magnetLink)
            return Response({"message": "Magnet link sent successfully"})
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RegisterView(APIView):
    permission_classes = []

    def post(self, request):
        try:
            username = request.data.get('username')
            email = request.data.get('email')
            password = request.data.get('password')

            if User.objects.filter(username=username).exists():
                return Response(
                    {"detail": "Username already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if User.objects.filter(email=email).exists():
                return Response(
                    {"detail": "Email already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )

            public_group = Group.objects.get(name='Public Share')
            Membership.objects.create(user=user, group=public_group)

            return Response({
                "message": "User registered successfully",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        try:
            print("received the request!")
            user = request.user
            current_password = request.data.get('old_password')
            new_password = request.data.get('new_password')
            
            # Validate that current password is correct
            if not user.check_password(current_password):
                return Response(
                    {"detail": "Current password is incorrect"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate new password meets requirements
            if len(new_password) < 8:
                return Response(
                    {"detail": "Password must be at least 8 characters long"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set the new password
            user.set_password(new_password)
            user.save()
            
            
            return Response(
                {"detail": "Password updated successfully"},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserMeView(APIView):
    """
    View to retrieve the current authenticated user's details
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)


class VirusScanView(APIView):
    # Use Django's cache to store pending scans instead of class variable
    # This ensures data persists across requests and server restarts

    def get(self, request):
        """Get pending scans for the current user"""
        user_id = str(request.user.id)
        cache_key = f"pending_scans_{user_id}"
        pending = cache.get(cache_key, [])
        return Response(pending)

    def post(self, request):
        try:
            file_path = request.data.get('file_path')
            file_name = request.data.get('file_name', os.path.basename(file_path))

            if not file_path:
                return Response(
                    {"error": "File path is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Calculate file hash
            sha256_hash = hashlib.sha256()
            with open(file_path, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            file_hash = sha256_hash.hexdigest()

            scan_id = str(uuid.uuid4())
            scan_info = {
                'id': scan_id,
                'file_path': file_path,
                'file_name': file_name,
                'file_hash': file_hash,
                'status': 'scanning',
                'created_at': timezone.now().isoformat(),
                'user_id': str(request.user.id),
            }

            # Add to pending scans using cache
            user_id = str(request.user.id)
            cache_key = f"pending_scans_{user_id}"
            pending_scans = cache.get(cache_key, [])
            pending_scans.append(scan_info)
            cache.set(cache_key, pending_scans)

            # VirusTotal API configuration
            API_KEY = '4ebb95cb86457fadcee0a5152428bb96a2097394015909f02aecbcaf302e32ae'  # Move to environment variables
            headers = {
                "accept": "application/json",
                "x-apikey": API_KEY
            }

            upload_url = "https://www.virustotal.com/api/v3/files"
            with open(file_path, 'rb') as file:
                files = {'file': file}
                upload_response = requests.post(
                    upload_url,
                    headers=headers,
                    files=files
                )

            if upload_response.status_code != 200:
                self._update_scan_status(user_id, scan_id, 'failed')
                return Response(
                    {"error": "Failed to upload file to VirusTotal"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            analysis_id = upload_response.json()['data']['id']

            analysis_url = f"https://www.virustotal.com/api/v3/analyses/{analysis_id}"
            max_attempts = 10
            attempts = 0

            while attempts < max_attempts:
                analysis_response = requests.get(
                    analysis_url,
                    headers=headers
                )

                if analysis_response.status_code != 200:
                    self._update_scan_status(user_id, scan_id, 'failed')
                    return Response(
                        {"error": "Failed to get analysis results"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                analysis_data = analysis_response.json()

                print("Virus scanning is", analysis_data['data']['attributes']['status'])
                if analysis_data['data']['attributes']['status'] == 'completed':
                    stats = analysis_data['data']['attributes']['stats']
                    is_malicious = stats['malicious'] > 0

                    self._update_scan_status(user_id, scan_id, 'completed')

                    print(is_malicious)
                    return Response({
                        "is_safe": not is_malicious,
                        "stats": stats,
                        "scan_id": scan_id
                    })

                attempts += 1
                time.sleep(60)

            return Response(
                {"error": "Analysis timed out"},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _update_scan_status(self, user_id, scan_id, status):
        """Helper method to update scan status using cache"""
        cache_key = f"pending_scans_{user_id}"
        pending_scans = cache.get(cache_key, [])

        for idx, scan in enumerate(pending_scans):
            if scan['id'] == scan_id:
                if status == 'completed' or status == 'failed':
                    # Remove completed or failed scans
                    pending_scans.pop(idx)
                else:
                    # Update status for pending scans
                    scan['status'] = status
                break

        # Update cache with modified list
        cache.set(cache_key, pending_scans)

def handler404(request, exception):
    return render(request, '404.html', status=404)


class SharedJoinView(APIView):
    """
    This endpoint is used to retrieve the details about which users share which files in the network. This is useful for
    backup mechanism, because we will check if a file is being shared by enough users or not.
    """
    # permission_classes = [IsAuthenticated]

    # POST /shared-join/
    def post(self, request):
        user = request.user
        hash = request.data.get('hash', None)
        file_name = request.data.get('filename', None)
        magnetLink = request.data.get('magnetLink')

        # this if is entered when this function is called from leechFile -> torrent.on('done', ...).
        # we don't have access to file's absolute path or hash there but magnetLink is enough to uniquely define the row.
        # also the row must have been created before because somebody else called seedFile surely, and now we are leeching it.
        if not hash and not file_name:
            try:
                shared = Shared.objects.get(magnetLink=magnetLink)
                shared.currently_sharing_users.add(user)
                return Response({ 'detail': 'User added to pool of file sharers.' }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({ 'error': str(e) }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            shared = Shared.objects.get_or_create(file_hash=hash, file_name=file_name, magnetLink=magnetLink)[0]
            shared.currently_sharing_users.add(user)
            return Response({ 'detail': 'User added to pool of file sharers.' }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({ 'error': str(e) }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SharedLeaveView(APIView):
    # permission_classes = [IsAuthenticated]

    # GET /shared-leave/
    def get(self, request):
        user = request.user
        try:
            print("before", user.currently_sharing_files.all())
            user.currently_sharing_files.clear()
            print("after", user.currently_sharing_files.all())
            return Response({ 'detail': 'User removed from the pool of file sharers.' }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({ 'error': str(e) }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SearchSuggestionsView(APIView):
    def get(self, request):
        user = request.user
        search_term = request.query_params.get("query", "")
        group_id = request.query_params.get("group", "")
        search_by_metadata = request.query_params.get("filter", "filename")

        # You cannot search via api since you need to log in
        print(search_by_metadata)

        user_groups = [Group.objects.get(id=uuid.UUID(group_id))] if group_id != "" else user.groups.all()

        allowed_file_hashes = Access.objects.filter(group__in=user_groups).values_list("file_hash", flat=True)

        # If you want to search via web interface localhost,
        # Comment out above and use below

        # allowed_file_hashes = []

        response = search_file(search_term, allowed_file_hashes, search_by_metadata)

        suggestions = set()

        for res in response:
            if len(suggestions) == 5:
                break
            if search_by_metadata in res:
                suggestions.add(res[search_by_metadata])

        return Response(list(suggestions))


class SharersCountView(APIView):
    def get(self, request):
        try:
            user = request.user
            file_hash = request.query_params.get("file_hash")
        
            shared = Shared.objects.get(file_hash=file_hash)
        
            return Response({
                'count': shared.currently_sharing_users.count()
            })
        except Exception as e:
            print(e)
            return Response({
                'count': 0    
            })

class CommentsView(APIView):
    def get(self, request):
        try:
            user = request.user

            file_hash = request.query_params.get("file_hash")

            comments = Comment.objects.filter(file_hash=file_hash)

            result = []

            for comment in comments:
                result.append(comment.text)

            return Response(result)
        except Exception as e:
            print(e)
            return Response([])

    def post(self, request):
        try:
            user = request.user
            comment = request.data.get('comment')
            file_hash = request.data.get('file_hash')

            Comment.objects.create(file_hash=file_hash, text=comment)
            return Response({'detail': 'Comment created successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(e)
            return Response({ 'error': str(e) }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UsersFilesView(APIView):
    def get(self, request):
        try:
            user = request.user
            allowed_file_hashes = Access.objects.filter(group__in=user.groups.all()).values_list("file_hash", flat=True)

            files = search_file(str(user.id), allowed_file_hashes, "owner_id")
            for file in files:
                access = Access.objects.filter(file_hash=file["hash"])[0]
                file["group"] = access.group.name

            print("in UsersFilesView:", files)
            return Response(files)

        except Exception as e:
            print(e)
            return Response([])


class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    # POST /ratings/
    def create(self, request, *args, **kwargs):
        try:
            file_hash = request.data.get('file_hash')
            rating_value = request.data.get('rating')
            
            # Validate input
            if not file_hash or not rating_value:
                return Response({'detail': 'File hash and rating are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Try to find existing rating from this user for this file
            try:
                rating = Rating.objects.get(user=request.user, file_hash=file_hash)
                rating.rating = rating_value
                rating.save()
                serializer = self.get_serializer(rating)
                return Response(serializer.data)
            except Rating.DoesNotExist:
                # Create new rating
                rating = Rating.objects.create(
                    user=request.user,
                    file_hash=file_hash,
                    rating=rating_value
                )
                serializer = self.get_serializer(rating)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # GET /ratings/file/{file_hash}/
    @action(detail=False, methods=['get'], url_path='file/(?P<file_hash>[^/.]+)')
    def get_file_ratings(self, request, file_hash=None):
        try:
            ratings = Rating.objects.filter(file_hash=file_hash)
            serializer = self.get_serializer(ratings, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # GET /ratings/average/{file_hash}/
    @action(detail=False, methods=['get'], url_path='average/(?P<file_hash>[^/.]+)')
    def get_average_rating(self, request, file_hash=None):
        try:
            result = Rating.objects.filter(file_hash=file_hash).aggregate(
                average=Avg('rating'),
                count=Count('rating')
            )
            return Response({
                'average': round(result['average'], 1) if result['average'] else 0,
                'count': result['count']
            })
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # GET /ratings/user/
    @action(detail=False, methods=['get'], url_path='user')
    def get_user_ratings(self, request):
        try:
            ratings = Rating.objects.filter(user=request.user)
            serializer = self.get_serializer(ratings, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Fetch user's ratings
            user_ratings = Rating.objects.filter(user=request.user)
            
            # If user has no ratings, return popular files
            if not user_ratings.exists():
                return self._get_popular_files(request)
            
            # Get users with similar tastes
            user_file_hashes = user_ratings.values_list('file_hash', flat=True)
            
            # Find other users who rated the same files
            similar_users = Rating.objects.filter(
                file_hash__in=user_file_hashes
            ).exclude(
                user=request.user
            ).values_list('user', flat=True).distinct()
            
            # Get files rated highly by similar users that the current user hasn't rated
            recommended_files = Rating.objects.filter(
                user__in=similar_users,
                rating__gte=4  # Only consider 4 or 5 star ratings
            ).exclude(
                file_hash__in=user_file_hashes
            ).values_list('file_hash', flat=True)
            
            # Count occurrences of each file_hash
            file_counts = Counter(recommended_files)
            
            # Sort by frequency
            sorted_files = [file_hash for file_hash, _ in file_counts.most_common(20)]  # Increased to 20 to account for duplicates
            
            # Get actual file data from Elasticsearch (reusing search_file function)
            # Access check: Only include files the user has access to
            user_groups = request.user.groups.all()
            allowed_file_hashes = Access.objects.filter(group__in=user_groups).values_list("file_hash", flat=True)
            
            # Find the intersection of recommended files and files the user has access to
            accessible_recommendations = set(sorted_files).intersection(set(allowed_file_hashes))
            
            if not accessible_recommendations:
                return self._get_popular_files(request)
                
            # Get full file details
            result = []
            for file_hash in accessible_recommendations:
                # Try to find file in Shared model
                try:
                    shared_file = Shared.objects.get(file_hash=file_hash)
                    # Get additional details from Elasticsearch
                    es_results = search_file_by_hash(file_hash, list(allowed_file_hashes))
                    if es_results:
                        result.extend(es_results)
                except Shared.DoesNotExist:
                    # If not in Shared, just use Elasticsearch
                    es_results = search_file_by_hash(file_hash, list(allowed_file_hashes))
                    if es_results:
                        result.extend(es_results)
            
            # Filter out duplicates by hash
            unique_results = {}
            for file_data in result:
                file_hash = file_data.get('hash')
                if file_hash and (file_hash not in unique_results or 'id' in file_data):
                    access = Access.objects.filter(file_hash=file_hash)[0]
                    file_data["group"] = access.group.name
                    unique_results[file_hash] = file_data

            return Response(list(unique_results.values())[:10])  # Limit to 10 recommendations
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def _get_popular_files(self, request):
        # Get top-rated files overall
        top_rated_files = Rating.objects.values('file_hash').annotate(
            avg_rating=Avg('rating'),
            num_ratings=Count('rating')
        ).filter(
            avg_rating__gte=4,  # At least 4 stars
            num_ratings__gte=1  # At least 1 rating
        ).order_by('-avg_rating', '-num_ratings')[:20]  # Increased to 20 to account for duplicates
        
        # Extract the file hashes
        file_hashes = [item['file_hash'] for item in top_rated_files]
        
        # Only include files the user has access to
        user_groups = request.user.groups.all()
        allowed_file_hashes = Access.objects.filter(group__in=user_groups).values_list("file_hash", flat=True)
        accessible_files = set(file_hashes).intersection(set(allowed_file_hashes))
        
        # Get file details
        result = []
        for file_hash in accessible_files:
            es_results = search_file_by_hash(file_hash, list(allowed_file_hashes))
            if es_results:
                result.extend(es_results)

        # Filter out duplicates by hash
        unique_results = {}
        for file_data in result:
            file_hash = file_data.get('hash')
            if file_hash and (file_hash not in unique_results or 'id' in file_data):
                access = Access.objects.filter(file_hash=file_hash)[0]
                file_data["group"] = access.group.name
                unique_results[file_hash] = file_data

        return Response(list(unique_results.values())[:10])  # Limit to 10 recommendations

# Helper function to search by hash
def search_file_by_hash(file_hash, allowed_file_hashes):
    try:
        from .search import search_file
        return search_file(file_hash, allowed_file_hashes, "hash")
    except Exception as e:
        print(f"Error searching file by hash: {e}")
        return []


# TO DO
# Add here necessary API endopoints after migrations 
class FeedBackViewSet(viewsets.ModelViewSet):
    queryset = FeedBack.objects.all()
    serializer_class = FeedBackSerializer

    # GET /FeedBack/
    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)
    
    # POST /FeedBack/
    def create(self, request, *args, **kwargs):
        try:
            email = request.data['email']
            text = request.data['text']
            rate = request.data['rate']
            # date = request.data['date']

            feed_back = FeedBack.objects.create(email = email, text = text, rate = rate)

            serializer = self.get_serializer(feed_back)
            
            return Response(serializer.data)
        except django_db_utils.IntegrityError:
            return Response({'detail': 'Already has the same FeedBack.'}, status=status.HTTP_400_BAD_REQUEST)


    # POST /feedback/load/
    @action(detail=False, methods=['post'], url_path='load')
    def search_feedback(self, request):
        try: 

            feed_backs = None
            serializer = None

            print(request.data['ordering'])

            ordering = request.data['ordering']

            feed_backs = feed_backs = FeedBack.objects.all().order_by(ordering)
            
            # if ordering == '-rate':
            #     feed_backs = feed_backs = FeedBack.objects.all().order_by('rate')
            # elif ordering == '-date':
            #     feed_backs = FeedBack.objects.all().order_by('date')
            # else:
            #     feed_backs = FeedBack.objects.all()

            serializer = FeedBackSerializer(feed_backs, many=True)
            return Response(serializer.data)
        except django_db_utils.IntegrityError:
            return Response({'detail': 'Feedbkac is not found.'}, status=status.HTTP_400_BAD_REQUEST)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Optionally restricts the returned messages,
        by filtering against group ID in the URL.
        """
        queryset = Message.objects.all()
        group_id = self.request.query_params.get('group_id', None)
        if group_id is not None:
            # Check if the user is a member of the group
            if not self.request.user.groups.filter(id=group_id).exists():
                return Message.objects.none()
            queryset = queryset.filter(group__id=group_id)
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Create a new message
        """
        group_id = request.data.get('group')
        content = request.data.get('content')

        # Check if user is a member of the group
        try:
            group = Group.objects.get(id=group_id)
            if not request.user.groups.filter(id=group_id).exists():
                return Response(
                    {"detail": "You are not a member of this group."},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Group.DoesNotExist:
            return Response(
                {"detail": "Group not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create the message
        message = Message.objects.create(
            group=group,
            sender=request.user,
            content=content
        )

        # Send the message via WebSocket (will be handled by the consumer)
        from .consumers import GroupChatConsumer
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync

        channel_layer = get_channel_layer()
        group_name = f"chat_{group_id}"
        
        serializer = self.get_serializer(message)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "chat_message",
                "message": serializer.data
            }
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='group/(?P<group_id>[^/.]+)')
    def group_messages(self, request, group_id=None):
        """
        Get all messages for a specific group
        """
        try:
            # Check if the user is a member of the group
            if not request.user.groups.filter(id=group_id).exists():
                return Response(
                    {"detail": "You are not a member of this group."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get the messages for this group
            messages = Message.objects.filter(group__id=group_id).order_by('timestamp')
            serializer = self.get_serializer(messages, many=True)
            return Response(serializer.data)
        
        except Group.DoesNotExist:
            return Response(
                {"detail": "Group not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Report.objects.all()
        return Report.objects.filter(reporter=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            # Get the file_hash from the request
            file_hash = request.data.get('file')
            if not file_hash:
                return Response(
                    {'detail': 'File hash is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if the Shared object exists
            try:
                shared_file = Shared.objects.get(file_hash=file_hash)
            except Shared.DoesNotExist:
                return Response(
                    {'detail': 'File not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Create the report with the Shared object
            serializer = self.get_serializer(data={
                'file': shared_file.file_hash,  # Use the file_hash as the primary key
                'reason': request.data.get('reason'),
                'reporter': request.user.id
            })
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReportStatusUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        admin_notes = request.data.get('admin_notes')

        if new_status not in dict(Report.REPORT_STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        report.status = new_status
        if admin_notes:
            report.admin_notes = admin_notes
        report.save()

        if new_status == 'APPROVED':
            # Delete the reported file
            report.file.delete()

        return Response(ReportSerializer(report).data)


class ReportAdminView(LoginRequiredMixin, UserPassesTestMixin, ListView):
    model = Report
    template_name = 'admin/report_list.html'
    context_object_name = 'reports'
    paginate_by = 20

    def test_func(self):
        return self.request.user.is_staff

    def get_queryset(self):
        queryset = Report.objects.select_related('file', 'reporter').order_by('-created_at')
        
        # Filter by status
        status = self.request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Search functionality
        search_query = self.request.GET.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(file__file_name__icontains=search_query) |
                Q(reporter__username__icontains=search_query) |
                Q(reason__icontains=search_query) |
                Q(admin_notes__icontains=search_query)
            )
        
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['status_choices'] = Report.REPORT_STATUS_CHOICES
        context['current_status'] = self.request.GET.get('status', '')
        context['search_query'] = self.request.GET.get('search', '')
        return context


class ReportDetailView(LoginRequiredMixin, UserPassesTestMixin, DetailView):
    model = Report
    template_name = 'admin/report_detail.html'
    context_object_name = 'report'

    def test_func(self):
        return self.request.user.is_staff

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['status_choices'] = Report.REPORT_STATUS_CHOICES
        return context


class ReportUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Report
    template_name = 'admin/report_update.html'
    fields = ['status', 'admin_notes']
    success_url = reverse_lazy('report_admin')

    def test_func(self):
        return self.request.user.is_staff

    def form_valid(self, form):
        report = form.save(commit=False)
        old_status = Report.objects.get(pk=report.pk).status
        new_status = report.status
        
        # Save the report first
        report.save()
        
        # Then handle file deletion if status changed to APPROVED
        if old_status != 'APPROVED' and new_status == 'APPROVED':
            file_to_delete = report.file
            file_to_delete.delete()
            messages.success(self.request, f'Report #{report.id} approved and file deleted.')
        else:
            messages.success(self.request, f'Report #{report.id} updated successfully.')
            
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['status_choices'] = Report.REPORT_STATUS_CHOICES
        return context


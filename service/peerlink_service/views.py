import django.db.utils
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Group, Membership
from .serializers import UserSerializer, GroupSerializer, MembershipSerializer
from .search import index_file, search_file
from .utils import send_message_to_user


class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    # GET /users/
    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    # GET /users/{pk}/
    def retrieve(self, request, *args, **kwargs):
        try:
            user_id = kwargs.get("pk")
            user = User.objects.get(id=user_id)
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    # POST /users/
    def create(self, request, *args, **kwargs):
        username, email, password = request.data["username"], request.data["email"], request.data["password"]
        user = User.objects.create_user(username=username, email=email, password=password)
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    # POST /users/login/
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'detail': 'Username and password are required.', 'success': False}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if user is not None:
            return Response({'detail': 'Login successful.', 'success': True}, status=status.HTTP_200_OK)
        else:
            return Response({'detail': 'Invalid credentials.', 'success': False}, status=status.HTTP_401_UNAUTHORIZED)


class GroupViewSet(ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

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
        group = Group.objects.create(name=name, description=description)
        serializer = self.get_serializer(group)
        return Response(serializer.data)


class MembershipViewSet(ModelViewSet):
    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer

    # POST /membership/add/
    @action(detail=False, methods=['post'], url_path='add')
    def add_membership(self, request):
        user = get_object_or_404(User, id=request.data['user'])
        group = get_object_or_404(Group, id=request.data['group'])
        try:
            Membership.objects.create(user=user, group=group)
            return Response({'detail': 'User added to the group successfully.'}, status=status.HTTP_201_CREATED)
        except django.db.utils.IntegrityError:
            return Response({'detail': 'User is already in the group.'}, status=status.HTTP_400_BAD_REQUEST)


class SearchView(APIView):

    permission_classes = (IsAuthenticated, )

    def get(self, request):
        try:
            search_term = request.query_params["query"]
            response = search_file(search_term)
            return Response(response, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({ "error": str(e) }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IndexMetadataView(APIView):

    permission_classes = (IsAuthenticated, )

    def post(self, request):
        try:
            print(request.data)
            response = index_file(request.data)
            return Response({
                "message": "File metadata indexed successfully",
                "id": response["_id"]}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({ "error": str(e) }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):

    permission_classes = (IsAuthenticated, )

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class SendMagnetView(APIView):
    permission_classes = (IsAuthenticated, )

    def get(self, request):
        user = request.user
        send_message_to_user(user.id, "magnet:?xt=urn:btih:f0b84b9dc7f8be5dcd3d54a971d7fe25fdaaaffc&dn=13_Curves_and_Surfaces.pptx&tr=ws%3A%2F%2F144.122.71.171%3A8080%2Fannounce")
        return Response(status=status.HTTP_200_OK)

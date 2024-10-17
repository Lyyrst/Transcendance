# Django imports
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.hashers import check_password
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.http import JsonResponse, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone, crypto
from django.views import View
from django.views.generic.edit import UpdateView
from django.conf import settings
from urllib.parse import quote

# DRF imports
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView

# DRF SimpleJWT imports
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

# Local imports
from .models import CustomUser, Match, Tournament
from .serializers import RegisterSerializer, UpdatePasswordSerializer
from .utils import check_token_status, generate_random_password, generate_verification_code

# Third-party imports
import requests
import base64

# Python standard library imports
from datetime import timedelta

from cryptography.fernet import Fernet
from django.core.mail import send_mail
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings
import random
from django.utils.timezone import localtime

User = get_user_model() 

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)

            refresh_token = request.data.get('refresh')

            if refresh_token:
                refresh_token_obj = RefreshToken(refresh_token)
                
                user_id = refresh_token_obj['user_id']
                
                user = User.objects.filter(id=user_id).first()
                if user is None:
                    return JsonResponse({'error': 'User does not exist'}, status=401)

            return response
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=401)

class RegisterView(APIView):
    def put(self, request):
        username = request.data.get('username')
        
        user = CustomUser()
        for user in CustomUser.objects.all():
            decrypted_username = user.decrypt_data(user.username)
            if decrypted_username == username:
                return JsonResponse({"ok": False, "error": "Username already exists."})

        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return JsonResponse({"ok": True, "username": user.username})
        return JsonResponse({"ok": False}, status=400)


class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        try:
            user = None
            for u in CustomUser.objects.all():
                decrypted_username = u.decrypt_data(u.username)
                if decrypted_username == username:
                    user = u
                    break
            if user is None:
                return JsonResponse({"ok": False, "error": "Invalid credentials"})

            if user.check_password(password):
                if user.tfa:
                    return JsonResponse({"ok": 'tfa', 'username': username, 'password': password})

                login(request, user)
                user.update_last_activity()

                refresh = RefreshToken.for_user(user)
                response = JsonResponse({
                    "ok": True,
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "token_refresh_required": False,
                })

                response.set_cookie(
                    'accessToken', str(refresh.access_token), max_age=3600, secure=True, samesite='Lax'
                )
                response.set_cookie(
                    'refreshToken', str(refresh), max_age=86400, secure=True, samesite='Lax'
                )
                return response
            else:
                return JsonResponse({"ok": False, "error": "Invalid credentials"})

        except Exception as e:
            return JsonResponse({"ok": False, "error": str(e)})


class LogoutView(APIView):
    def post(self, request):
        current_user = request.user
        
        if current_user.is_authenticated:
            current_user.is_online = False
            current_user.save()
            
            logout(request)

            response = JsonResponse({"ok": True})
            response.delete_cookie('accessToken')
            response.delete_cookie('refreshToken')
        else:
            response = JsonResponse({"ok": False, "error": "User is not authenticated."})

        return response

class GetUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        encoded_pfp = None

        if user.is_encrypted:
            username = user.decrypt_data(user.username)
            lang = user.decrypt_data(user.lang)
        else:
            username = user.username
            lang = user.lang
            
        if user.pfp:
            encoded_pfp = base64.b64encode(user.pfp).decode('utf-8')

        has_password = user.password is not None and user.password != ""
        has_tournament = user.tournament is not None

        isStarted = False
        if has_tournament:
            isStarted = user.tournament.isStarted

        has_mail = False
        if user.email is not None and user.email != "":
            try:
                validate_email(user.decrypt_data(user.email))
                has_mail = True
            except ValidationError:
                has_mail = False

        return JsonResponse({
            "ok": True,
            "username": username,
            "lang": lang,
            "pfp": f"data:image/png;base64,{encoded_pfp}" if encoded_pfp else None,
            "hasPassword": has_password,
            'tfa': user.tfa,
            'mail': has_mail,
            'isTournament': has_tournament,
            'isStarted': isStarted,
        })


class GetUserInformations(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.update_last_activity()

        username = request.data.get('username')

        if not username:
            return Response({
                "ok": False,
                "message": "Username is required."
            })

        all_users = CustomUser.objects.all()
        target_user = None

        for user in all_users:
            decrypted_username = user.decrypt_data(user.username) if user.is_encrypted else user.username
            if decrypted_username == username:
                target_user = user
                break

        if not target_user:
            return Response({
                "ok": False,
                "message": "User not found."
            })

        encoded_pfp = None

        if target_user.is_encrypted:
            username = target_user.decrypt_data(target_user.username)
        else:
            username = target_user.username

        if target_user.pfp:
            encoded_pfp = base64.b64encode(target_user.pfp).decode('utf-8')

        match_history = []
        for match in target_user.match_history.all():
            match_history.append({
                "is_pong": match.is_pong,
                "is_tournament": match.is_tournament,
                "date_played": match.date_played.strftime("%d/%m/%Y %H:%M"),
                "winner": match.winner,
                "winner_score": match.winner_score,
                "looser": match.looser,
                "looser_score": match.looser_score,
            })

        user_info = {
            "username": username,
            "pfp": f"data:image/png;base64,{encoded_pfp}" if encoded_pfp else None,
            "match_history": match_history
        }

        return Response({
            "ok": True,
            "user": user_info
        })



class UpdateLanguageView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        new_lang = request.data.get('lang')

        user.update_last_activity()

        if not new_lang:
            return JsonResponse({"ok": False, "error": "No language provided"})

        current_lang = user.decrypt_data(user.lang)

        if new_lang == current_lang:
            return JsonResponse({"ok": False, "error": "New language is the same as the current language"})

        user.lang = user.encrypt_data(new_lang)

        user.save()

        return JsonResponse({"ok": True})


class UpdatePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    PASSWORD_MAX_LENGTH = 30

    def patch(self, request):
        user = request.user
        user.update_last_activity()
        serializer = UpdatePasswordSerializer(data=request.data)

        if serializer.is_valid():
            currentPassword = serializer.validated_data['currentPassword']
            newPassword = serializer.validated_data['newPassword']

            if not user.check_password(currentPassword):
                return JsonResponse({"ok": False, "error": "Current password is incorrect"})

            if currentPassword == newPassword:
                return JsonResponse({"ok": False, "error": "New password cannot be the same as the current password"})
            
            if len(newPassword) > self.PASSWORD_MAX_LENGTH:
                return JsonResponse({"ok": False, "error": f"Password cannot exceed {self.PASSWORD_MAX_LENGTH} characters"})

            user.set_password(newPassword)
            user.save()
            update_session_auth_hash(request, user)

            return JsonResponse({"ok": True})
        
        return JsonResponse({"ok": False, "errors": serializer.errors})

class UpdateUsernameView(APIView):
    permission_classes = [IsAuthenticated]
    USERNAME_MAX_LENGTH = 32

    def patch(self, request):
        user = request.user
        user.update_last_activity()
        new_username = request.data.get('username', '').strip()

        if user.is_42auth:
            return JsonResponse({"ok": False, "error": "42 account can't change their username"})
        if not new_username:
            return JsonResponse({"ok": False, "error": "New username cannot be empty"})
        if '42' in new_username:
            return JsonResponse({"ok": False, "error": "42 is forbidden is username"})
        if len(new_username) > self.USERNAME_MAX_LENGTH:
            return JsonResponse({"ok": False, "error": f"Username cannot exceed {self.USERNAME_MAX_LENGTH} characters"})

        if new_username == user.decrypt_data(user.username):
            return JsonResponse({"ok": False, "error": "New username cannot be the same as the current username"})

        for user in CustomUser.objects.all():
            decrypted_username = user.decrypt_data(user.username)
            if decrypted_username == new_username:
                return JsonResponse({"ok": False, "error": "Username already exists."})

        if CustomUser.objects.filter(username=new_username).exists():
            return JsonResponse({"ok": False, "error": "Username already taken"})

        if user.is_encrypted:
            user.username = user.encrypt_data(new_username)
        else:
            user.username = new_username

        user.save()

        return JsonResponse({"ok": True, "username": new_username})

class UpdateProfilePictureView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    MAX_FILE_SIZE = 1 * 1024 * 1024

    def patch(self, request):
        user = request.user
        user.update_last_activity()
        
        if 'pfp' not in request.FILES:
            return JsonResponse({"ok": False, "error": "No profile picture provided"})
        
        profile_picture = request.FILES['pfp']
        
        if profile_picture.content_type != 'image/png':
            return JsonResponse({"ok": False, "error": "Only PNG images are allowed"})
        
        if profile_picture.size > self.MAX_FILE_SIZE:
            return JsonResponse({"ok": False, "error": "File size exceeds 5MB limit"})
        
        user.pfp = profile_picture.read()
        user.save()

        return JsonResponse({"ok": True, "message": "Profile picture updated successfully"})

class DeleteProfilePictureView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.update_last_activity()

        if user.pfp:
            user.pfp = None
            user.save()
            return JsonResponse({"ok": True, "message": "Profile picture deleted successfully."})
        else:
            return JsonResponse({"ok": False, "error": "No profile picture to delete."})


class GetProfilePictureView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user.update_last_activity()

        if user.pfp:
            encoded_pfp = base64.b64encode(user.pfp).decode('utf-8')
            return JsonResponse({
                "ok": True,
                "pfp": f"data:image/png;base64,{encoded_pfp}"
            })
        else:
            return JsonResponse({"ok": False, "error": "Profile picture not found"})


class SearchUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        search_string = request.data.get('search_string', '').strip().lower()
        current_user = request.user
        current_user.update_last_activity()
        friends = current_user.friends.all()

        if not search_string:
            return JsonResponse({'ok': False, 'error': 'empty search string'})

        all_users = CustomUser.objects.exclude(
            id__in=friends.values_list('id', flat=True)
        ).exclude(id=current_user.id)

        matching_users = []
        for user in all_users:
            decrypted_username = user.decrypt_data(user.username)
            if search_string in decrypted_username.lower():
                matching_users.append({
                    "id": user.id,
                    "username": decrypted_username
                })
            if len(matching_users) >= 5:
                break

        return JsonResponse({
            "ok": True,
            "users": matching_users
        })


class AddFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        friend_username = request.data.get('username')

        if not friend_username:
            return JsonResponse({"ok": False, "error": "No username provided."})

        current_user = request.user
        current_user.update_last_activity()
        if current_user.is_encrypted:
            current_username = current_user.decrypt_data(current_user.username)
        else:
            current_username = current_user.username

        if current_username == friend_username:
            return JsonResponse({"ok": False, "error": "You cannot add yourself as a friend."})

        for existing_friend in current_user.friends.all():
            if existing_friend.is_encrypted:
                decrypted_friend_username = existing_friend.decrypt_data(existing_friend.username)
            else:
                decrypted_friend_username = existing_friend.username

            if decrypted_friend_username == friend_username:
                return JsonResponse({"ok": False, "error": "This user is already your friend."})

        all_users = CustomUser.objects.all()
        friend = None
        for user in all_users:
            if user.is_encrypted:
                decrypted_username = user.decrypt_data(user.username)
            else:
                decrypted_username = user.username

            if decrypted_username == friend_username:
                friend = user
                break

        if friend is None:
            return JsonResponse({"ok": False, "error": "User not found."})

        current_user.friends.add(friend)
        current_user.save()

        return JsonResponse({"ok": True, "message": f"{friend.username} has been added as a friend."})


class GetFriendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_user = request.user
        current_user.update_last_activity()

        friends = current_user.friends.all()
        friend_list = []

        expiration_time = timedelta(minutes=15)

        for friend in friends:
            is_online = False
            if not friend.is_online:
                is_online = False

            elif friend.last_activity and (timezone.now() - friend.last_activity) < expiration_time:
                is_online = True
            else:
                friend.is_online = False
                friend.save()

            decrypted_username = friend.decrypt_data(friend.username)

            friend_list.append({
                "id": friend.id,
                "username": decrypted_username,
                "is_online": is_online,
            })

        if not friend_list:
            return JsonResponse({
                "ok": False,
                "message": "No friends found."
            })

        return JsonResponse({
            "ok": True,
            "friends": friend_list
        })


class RemoveFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        current_user = request.user
        friend_username = request.data.get('username')

        if not friend_username:
            return JsonResponse({"ok": False, "message": "No username provided."})

        friend_to_remove = CustomUser.objects.filter(username=friend_username).first()

        if not friend_to_remove:
            all_users = CustomUser.objects.all()
            friend_to_remove = next((user for user in all_users if user.decrypt_data(user.username) == friend_username), None)

        if friend_to_remove and friend_to_remove in current_user.friends.all():
            current_user.friends.remove(friend_to_remove)
            current_user.save()
            return JsonResponse({"ok": True, "message": "Friend has been removed."})
        else:
            return JsonResponse({"ok": False, "message": "Friend not found in your friend list."})


class OAuth42Login(APIView):
    def get(self, request):
        redirect_uri_encoded = quote(settings.REDIRECT_URI)
        url = (
            f"https://api.intra.42.fr/oauth/authorize"
            f"?client_id={settings.CLIENT_ID}"
            f"&redirect_uri={redirect_uri_encoded}"
            f"&response_type=code"
            f"&scope=public"
        )
        return JsonResponse({"redirect_url": url})

class OAuth42Callback(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.GET.get('code')

        if not code:
            return HttpResponse('<script>localStorage.setItem("error", "no_code"); window.close();</script>')

        token_response = requests.post('https://api.intra.42.fr/oauth/token', data={
            'grant_type': 'authorization_code',
            'client_id': settings.CLIENT_ID,
            'client_secret': settings.CLIENT_SECRET,
            'redirect_uri': settings.REDIRECT_URI,
            'code': code
        })

        if token_response.status_code != 200:
            return HttpResponse('<script>localStorage.setItem("error", "auth_failed"); window.close();</script>')

        token_data = token_response.json()
        access_token = token_data.get('access_token')

        user_info_response = requests.get('https://api.intra.42.fr/v2/me', headers={
            'Authorization': f'Bearer {access_token}'
        })

        if user_info_response.status_code != 200:
            return HttpResponse('<script>localStorage.setItem("error", "user_info_failed"); window.close();</script>')

        user_info = user_info_response.json()
        username = user_info.get('login')

        existing_user_42 = None
        existing_user = None
        userDecrypt = CustomUser()

        for user in CustomUser.objects.all():
            decrypted_username = userDecrypt.decrypt_data(user.username) if user.is_encrypted else user.username
            
            if decrypted_username == username + "42":
                existing_user_42 = user
                break
        
        if existing_user_42:
            if existing_user_42.is_42auth:
                login(request, existing_user_42)
                existing_user_42.update_last_activity()
            else:
                return JsonResponse({"ok": False, "error": "User with '42' does not have 42auth enabled."})

        else:
            for user in CustomUser.objects.all():
                decrypted_username = userDecrypt.decrypt_data(user.username) if user.is_encrypted else user.username
                
                if decrypted_username == username:
                    existing_user = user
                    break
            
            if existing_user:
                if existing_user.is_42auth:
                    login(request, existing_user)
                    existing_user.update_last_activity()
                else:
                    new_user = CustomUser(
                        lang='en',
                        is_42auth=True
                    )
                    new_user.username = userDecrypt.encrypt_data(username + "42")
                    new_user.save()
                    login(request, new_user)
                    new_user.update_last_activity()
            else:
                new_user = CustomUser(
                    username=userDecrypt.encrypt_data(username + '42'),
                    lang='en',
                    is_42auth=True
                )
                new_user.save()
                login(request, new_user)
                new_user.update_last_activity()

        current_user = existing_user_42 if existing_user_42 else (existing_user if existing_user else new_user)
        refresh = RefreshToken.for_user(current_user)

        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        response = HttpResponse('<script>window.close();</script>')
        response.set_cookie('accessToken', access_token, httponly=False, secure=True)
        response.set_cookie('refreshToken', refresh_token, httponly=False, secure=True)

        return response

class GetUserDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_encrypted:
            user_data = {
                "username": user.decrypt_data(user.username),
                "email": user.decrypt_data(user.email),
                "lastActivity": user.last_activity,
            }

        return JsonResponse({
            "ok": True,
            "userData": user_data
        })

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_user = request.user
        password = request.data.get('password')

        if not password:
            return JsonResponse({"ok": False, "error": "Password is required."})

        if not check_password(password, current_user.password):
            return JsonResponse({"ok": False, "error": "Incorrect password."})

        current_user.delete()

        return JsonResponse({"ok": True, "message": "Your account has been successfully deleted."})

class DeleteEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        
        user.email = None
        user.tfa = False
        user.save()

        return JsonResponse({"ok": True, "message": "Email deleted and TFA disabled."})

class NewMailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email = request.data.get('email')
        current_user = request.user

        if not email:
            return JsonResponse({'ok': False, 'error': 'Email is required.'})
        if email == "currentMail":
            email = current_user.decrypt_data(current_user.email)
        elif CustomUser.objects.filter(email=email).exists():
            return JsonResponse({"ok": False, "error": "This email is already in use."})

        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({'ok': False, 'error': 'Invalid email format.'})

        current_user.email = email
        if current_user.is_encrypted:
            current_user.email = current_user.encrypt_data(email)


        new_password = generate_random_password()
        current_user.set_password(new_password)
        current_user.save()

        subject = 'Your password for Transcendence'
        message = f'Your new password: {new_password}'
        from_email = settings.EMAIL_HOST_USER
        recipient_list = [current_user.decrypt_data(email)]

        try:
            send_mail(subject, message, from_email, recipient_list)
            return JsonResponse({'ok': True, 'message': 'Email sent successfully.'})
        except Exception as e:
            return JsonResponse({'ok': False, 'error': str(e), 'from email': from_email})

class UpdateEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get('email')
        
        try:
            validate_email(new_email)
        except ValidationError:
            return JsonResponse({"ok": False, "error": "Invalid email format."})
        
        if CustomUser.objects.filter(email=new_email).exists():
            return JsonResponse({"ok": False, "error": "This email is already in use."})
        
        user = request.user
        user.email = user.encrypt_data(new_email)
        user.save()

        return JsonResponse({"ok": True, "message": "Email updated successfully."})

class TwoFactorActivateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email = request.data.get('email')
        user = request.user

        if not email:
            return JsonResponse({"ok": False, "error": "Email is required"})
        if CustomUser.objects.filter(email=email).exists():
            return JsonResponse({"ok": False, "error": "This email is already in use."})
        if email == "currentMail":
            email = user.decrypt_data(user.email)
        elif user.email is not None and user.decrypt_data(user.email) != "":
            try:
                validate_email(user.decrypt_data(user.email))
            except ValidationError:
                return JsonResponse({'ok': False, 'error': 'you already have a mail'})

        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({"ok": False, "error": "Invalid email address"})

        user.email = email
        if user.is_encrypted:
            user.email = user.encrypt_data(email)
        user.tfa = True
        user.save()

        return JsonResponse({"ok": True, "message": "2FA activated successfully"})

class TwoFactorSetupView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = None
        for u in CustomUser.objects.all():
            decrypted_username = u.decrypt_data(u.username)
            if decrypted_username == username:
                user = u
                break
        if user is None:
            return JsonResponse({"ok": False, "error": "Invalid credentials"})
        if not user.check_password(password):
            return JsonResponse({'ok': False, 'error': 'invalid credentials'})

        if not user.tfa:
            return JsonResponse({'ok': False, 'error': '2FA not active'})

        verification_code = generate_verification_code()

        subject = 'Your Two-Factor Authentication Verification Code'
        message = f'Your verification has a 5 min duration : {verification_code}'
        from_email = settings.EMAIL_HOST_USER
        recipient_list = [user.decrypt_data(user.email)]

        try:
            send_mail(subject, message, from_email, recipient_list)
            user.verification_code = verification_code
            user.verification_code_created_at = timezone.now()
            user.save()
            return JsonResponse({'ok': True})
        except Exception as e:
            return JsonResponse({'ok': False, 'error': str(e), 'from email': from_email})

class TwoFactorVerifyView(APIView):
    def post(self, request):
        code = request.data.get('code')
        
        username = request.data.get('username')
        password = request.data.get('password')

        user = None
        for u in CustomUser.objects.all():
            decrypted_username = u.decrypt_data(u.username)
            if decrypted_username == username:
                user = u
                break
        if user is None:
            return JsonResponse({"ok": False, "error": "Invalid credentials"})
        if not user.check_password(password):
            return JsonResponse({'ok': False, 'error': 'invalid credentials'})
        
        if user.verification_code != code:
            return JsonResponse({'ok': False, 'error': 'Invalid code'})
        
        expiration_time = user.verification_code_created_at + timedelta(minutes=5)
        if timezone.now() > expiration_time:
            user.verification_code = None
            user.verification_code_created_at = None
            user.save()
            return JsonResponse({'ok': False, 'error': 'Code expired'})
        user.verification_code = None
        user.verification_code_created_at = None
        user.save()
        login(request, user)
        user.update_last_activity()
        refresh = RefreshToken.for_user(user)
        response =  JsonResponse({
            "ok": True,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "token_refresh_required": False,
        })
        response.set_cookie(
            'accessToken', str(refresh.access_token), max_age=3600, secure=True, samesite='Lax'
        )
        response.set_cookie(
            'refreshToken', str(refresh), max_age=86400, secure=True, samesite='Lax'
        )
        return response

class ValidateGameSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        points = data.get('points')
        ballSpeed = data.get('ballSpeed')
        theme = data.get('theme')
        playerOne = data.get('playerOne')
        playerTwo = data.get('playerTwo')
        is_tournament = request.data.get('is_tournament')
        user = request.user

        try:
            points = int(points)
            if not (1 <= points <= 10):
                return JsonResponse({"ok": False, "error": "Points must be an integer between 1 and 10."})
        except (ValueError, TypeError):
            return JsonResponse({"ok": False, "error": "Points must be a valid integer."})
        
        if ballSpeed not in ["slow", "normal", "fast"]:
            return JsonResponse({"ok": False, "error": "Ball speed must be 'slow', 'normal', or 'fast'."})

        valid_themes = ["theme1", "theme2", "theme3", "theme4"]
        if theme not in valid_themes:
            return JsonResponse({"ok": False, "error": "Theme must be one of 'theme1', 'theme2', 'theme3', 'theme4'."})

        if len(playerOne) > 32:
            return JsonResponse({"ok": False, "error": "Player One username must not exceed 32 characters."})
        if len(playerTwo) > 32:
            return JsonResponse({"ok": False, "error": "Player Two username must not exceed 32 characters."})

        if not playerOne:
            playerOne = user.decrypt_data(user.username)
        if not playerTwo:
            playerTwo = "Donald42"

        match = Match.objects.create(
            player1_username=playerOne,
            player1_score=0,
            player2_username=playerTwo,
            player2_score=0,
            is_pong=True,
            is_tournament=is_tournament,
            date_played=timezone.now,
        )

        user = request.user
        user.last_match = match
        user.save()

        return JsonResponse({
            "ok": True,
            "points": points,
            "ballSpeed": ballSpeed,
            "theme": theme,
            "playerOne": playerOne,
            "playerTwo": playerTwo,
            "isTournament": is_tournament,
        })

class ValidateBattleSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        points = data.get('points')
        shot = data.get('shot')
        theme = data.get('theme')
        playerOne = data.get('playerOne')
        playerTwo = data.get('playerTwo')
        user = request.user

        try:
            points = int(points)
            if not (1 <= points <= 6):
                return JsonResponse({"ok": False, "error": "Points must be an integer between 1 and 6."})
        except (ValueError, TypeError):
            return JsonResponse({"ok": False, "error": "Points must be a valid integer."})
        
        try:
            shot = int(shot)
            if not (1 <= shot <= 3):
                return JsonResponse({"ok": False, "error": "Shots must be an integer between 1 and 3."})
        except (ValueError, TypeError):
            return JsonResponse({"ok": False, "error": "Shots must be a valid integer."})

        valid_themes = ["one", "two", "tree"]
        if theme not in valid_themes:
            return JsonResponse({"ok": False, "error": "Theme must be one of 'one', 'two', 'tree'."})

        if len(playerOne) > 32:
            return JsonResponse({"ok": False, "error": "Player One username must not exceed 32 characters."})
        if len(playerTwo) > 32:
            return JsonResponse({"ok": False, "error": "Player Two username must not exceed 32 characters."})

        if not playerTwo:
            playerTwo = "Donald42"
        if not playerOne:
            playerOne = user.decrypt_data(user.username)

        match = Match.objects.create(
            player1_username=playerOne,
            player1_score=0,
            player2_username=playerTwo,
            player2_score=0,
            is_pong=False,
            date_played = timezone.now,
        )

        user = request.user
        user.last_match = match
        user.save()

        return JsonResponse({
            "ok": True,
            "points": points,
            "shot": shot,
            "theme": theme,
            "playerOne": playerOne,
            "playerTwo": playerTwo,
        })

class RecordMatchResultView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        winner = request.data.get('winner')
        winner_score = request.data.get('winner_score')
        looser_score = request.data.get('looser_score')
        is_tournament = request.data.get('is_tournement', False)

        if winner == user.last_match.player1_username:
            looser = user.last_match.player2_username
        else:
            looser = user.last_match.player1_username
        
        match = Match.objects.create(
            is_pong=request.data.get('is_pong'),
            is_tournament=is_tournament,
            winner=winner,
            winner_score=winner_score,
            looser=looser,
            looser_score=looser_score,
            is_end=True,
        )
        
        if user.match_history.count() > 10:
            oldest_match = user.match_history.order_by('date_played').first()
            if oldest_match:
                user.match_history.remove(oldest_match)
        user.match_history.add(match)
        user.last_match = match
        user.save()

        if is_tournament:
            tournament = user.tournament
            first_match = tournament.matches_to_play.filter(is_end=False).first()

            if first_match:
                first_match.is_pong= True
                first_match.winner = winner
                first_match.winner_score = winner_score
                first_match.looser = looser
                first_match.looser_score = looser_score
                first_match.is_end = True
                first_match.save()
            if not first_match:
                return JsonResponse({"ok": False, "error": "No matches to play in this tournament"})
            user.tournament = tournament
            user.save()

        return JsonResponse({'ok': True})

class LastMatchInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.last_match:
            match = user.last_match
            
            match_info = {
                "winner": match.winner,
                "winner_score": match.winner_score,
                "looser": match.looser,
                "looser_score": match.looser_score,
                "is_pong": match.is_pong,
                'is_tournement': match.is_tournament,
            }
            return Response({"ok": True, "last_match": match_info})
        
        return Response({"ok": False, "error": "No last match found."})

class CreateTournamentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data
        ball_speed = data.get('ballSpeed')
        theme = data.get('theme')
        points = data.get('points')
        
        if user.tournament:
            return JsonResponse({"ok": False, "error": "you already have a tournament"})
        if ball_speed not in ['slow', 'normal', 'fast']:
            return JsonResponse({"ok": False, "error": "Invalid ball speed"})
        if theme not in ['theme1', 'theme2', 'theme3', 'theme4']:
            return JsonResponse({"ok": False, "error": "Invalid theme"})
        try:
            points = int(points)
            if not (1 <= points <= 10):
                return JsonResponse({"ok": False, "error": "Points must be an integer between 1 and 10."})
        except (ValueError, TypeError):
            return JsonResponse({"ok": False, "error": "Points must be a valid integer."})

        user.tournament = Tournament.objects.create(
            ball_speed=ball_speed,
            theme=theme,
            points=points,
            needPlayers=True,
        )
        user.save()

        return JsonResponse({"ok": True, "message": "Tournament created successfully"})

class AddUsersAndGenerateMatchesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data
        usernames = data.get('usernames', [])

        if not isinstance(usernames, list):
            return JsonResponse({"ok": False, "error": "Usernames must be a list."})

        usernames = [username.strip() for username in usernames if isinstance(username, str) and username.strip()]

        if len(usernames) not in [4, 8, 16]:
            return JsonResponse({"ok": False, "error": "Number of players must be 4, 8, or 16"})

        if len(usernames) != len(set(usernames)):
            return JsonResponse({"ok": False, "error": "Usernames must be unique."})

        for username in usernames:
            if len(username) > 8:
                return JsonResponse({"ok": False, "error": "Usernames must be 8 characters or less."})

        
        try:
            tournament = user.tournament
        except Tournament.DoesNotExist:
            return JsonResponse({"ok": False, "error": "Tournament not found"})

        tournament.usernames = usernames
        tournament.generate_matches()
        tournament.needPlayers = False
        tournament.isStarted = True
        tournament.save()
        user.tournament = tournament
        user.save()

        return JsonResponse({"ok": True})

class NextMatchesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            tournament = user.tournament
        except Tournament.DoesNotExist:
            return JsonResponse({"ok": False, "error": "Tournament not found"})

        first_match = tournament.matches_to_play.filter(is_end=False).first()

        if not first_match:
            return JsonResponse({"ok": "noMatch", "error": "No matches to play in this tournament"})

        return JsonResponse({
            "ok": True,
            "ballSpeed": tournament.ball_speed,
            "theme": tournament.theme,
            "points": tournament.points,
            "player1": first_match.player1_username,
            "player2": first_match.player2_username,
            "isTournament": True,
        })

class NextRoundView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        tournament = user.tournament
        
        matches = tournament.matches_to_play.all()
        
        if not matches:
            return JsonResponse({"ok": False, "error": "No matches to process"})

        losers = [match.looser for match in matches]

        remaining_usernames = list(set(tournament.usernames) - set(losers))

        tournament.matches_to_play.clear()

        if len(remaining_usernames) == 1:
            tournament.winner = remaining_usernames[0]
            tournament.save()
            return JsonResponse({
                "ok": True,
                "winner": remaining_usernames[0]
            })
        elif len(remaining_usernames) == 0:
            return JsonResponse({"ok": False, "error": "No remaining players"})

        tournament.usernames = remaining_usernames
        tournament.generate_matches()
        tournament.save()

        user.tournament = tournament
        user.save()
        
        return JsonResponse({
            "ok": True,
            "matches": [{
                "player1": match.player1_username,
                "player2": match.player2_username,
            } for match in tournament.matches_to_play.all()]
        })

class TournamentStateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        tournament = user.tournament

        if not tournament:
            return JsonResponse({'ok': False, 'needPlayers': False, 'message': 'no tournament'})
        if tournament.winner:
            return JsonResponse({'ok': True, 'winner': tournament.winner})
        if tournament.needPlayers:
            return JsonResponse({'ok': True, 'needPlayers': True, 'message': 'not started, need players list'})
        
        matches = tournament.matches_to_play.all()

        match_list = []
        for match in matches:
            match_list.append({
                "isEnd": match.is_end,
                "player1": match.player1_username,
                "player2": match.player2_username,
                "winner": match.winner,
                "winner_score": match.winner_score,
                "looser": match.looser,
                "looser_score": match.looser_score,
            })

        return JsonResponse({
            "ok": True,
            'needPlayers': False,
            "matches": match_list,
        })

class CloseTournamentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.tournament.delete()
        user.tournament = None
        user.save()
        

        return JsonResponse({"ok": True, "message": "Tournament closed successfully"})

class MatchHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        match_history = user.match_history.all()

        match_list = []
        for match in match_history:
            match_data = {
                'is_pong': match.is_pong,
                'is_tournament': match.is_tournament,
                'date_played': localtime(match.date_played).strftime("%d/%m/%Y %H:%M"),
                'winner': match.winner,
                'winner_score': match.winner_score,
                'looser': match.looser,
                'looser_score': match.looser_score,
            }
            match_list.append(match_data)

        return JsonResponse({
            'ok': True,
            'match_history': match_list
        })

from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.models import User
from rest_framework.validators import UniqueValidator
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import re

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8, max_length=30)
    password_confirm = serializers.CharField(write_only=True, required=True, min_length=8, max_length=30)
    lang = serializers.CharField(required=False, allow_blank=True, default='en')

    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'password_confirm', 'email', 'tfa', 'pfp', 'lang']
    
    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if len(value) > 30:
            raise serializers.ValidationError("Password cannot exceed 30 characters.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not re.search(r'[\W_]', value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        if value.lower() in ['password', '123456', 'qwerty']:
            raise serializers.ValidationError("Password is too common.")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        self.validate_password(attrs['password'])

        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        
        username = validated_data['username']
        if len(username) > 32:
            raise serializers.ValidationError({"username": "Le nom d'utilisateur ne peut pas dépasser 32 caractères."})
        if '42' in username:
            raise serializers.ValidationError({"username": "cannot contain the sequence '42'."})

        temp_user = self.Meta.model()

        encrypted_username = temp_user.encrypt_data(username)
        encrypted_email = temp_user.encrypt_data(validated_data.get('email', ''))
        encrypted_lang = temp_user.encrypt_data(validated_data.get('lang', 'en'))

        user = self.Meta.model(
        username=encrypted_username,
        email=encrypted_email,
        tfa=validated_data.get('tfa', False),
        pfp=validated_data.get('pfp', None),
        lang=encrypted_lang
        )
        
        user.set_password(validated_data['password'])
        user.save()
        
        return user



class UpdatePasswordSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(required=True, write_only=True)
    newPassword = serializers.CharField(required=True, write_only=True, min_length=8)
    newPasswordConfirm = serializers.CharField(required=True, write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs['newPassword'] != attrs['newPasswordConfirm']:
            raise serializers.ValidationError({"newPassword": "New passwords do not match."})
        
        password_regex = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,30}$')

        if not password_regex.match(attrs['newPassword']):
            raise serializers.ValidationError({
                "newPassword": (
                    "Password must be 8-30 characters long, contain at least one uppercase letter, "
                    "one lowercase letter, one digit, and one special character."
                )
            })
        
        return attrs
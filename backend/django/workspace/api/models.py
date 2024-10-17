from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from cryptography.fernet import Fernet
import base64
from django.conf import settings
import random
from django.contrib.postgres.fields import ArrayField

class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

from django.db import models
from django.core.exceptions import ValidationError

class Tournament(models.Model):
    BALL_SPEED_CHOICES = [
        ('slow', 'Slow'),
        ('normal', 'Normal'),
        ('fast', 'Fast'),
    ]

    THEME_CHOICES = [
        ('theme1', 'Theme 1'),
        ('theme2', 'Theme 2'),
        ('theme3', 'Theme 3'),
        ('theme4', 'Theme 4'),
    ]

    PLAYER_COUNT_CHOICES = [
        (4, '4 Players'),
        (8, '8 Players'),
        (16, '16 Players'),
    ]

    usernames = ArrayField(
        models.CharField(max_length=150),
        size=16,
        blank=True,
        null=True,
    )
    ball_speed = models.CharField(max_length=6, choices=BALL_SPEED_CHOICES, default='normal')
    points = models.IntegerField(default=1)
    theme = models.CharField(max_length=6, choices=THEME_CHOICES, default='theme1')
    number_of_players = models.IntegerField(choices=PLAYER_COUNT_CHOICES, default=4)
    matches_to_play = models.ManyToManyField('Match', blank=True)
    isStarted = models.BooleanField(default=False)
    needPlayers = models.BooleanField(default=False)
    winner = models.CharField(max_length=100, null=True, blank=True)

    def clean(self):
        if not (1 <= self.points <= 10):
            raise ValidationError("Points must be between 1 and 10.")
        
        if self.usernames.count() != self.number_of_players:
            raise ValidationError(f"Number of players must be {self.number_of_players}.")

    def generate_matches(self):
        users = list(self.usernames)

        if len(users) % 2 != 0:
            raise ValidationError("The number of players must be even to generate matches.")

        self.matches_to_play.clear()

        random.shuffle(users)

        for i in range(0, len(users), 2):
            player1 = users[i]
            player2 = users[i + 1]
            
            match = Match.objects.create(
                player1_username=player1,
                player2_username=player2
            )
            
            self.matches_to_play.add(match)

        self.save()

    def __str__(self):
        return f"Tournament with {self.number_of_players} players"


class Match(models.Model):
    player1_username = models.CharField(max_length=150)
    player1_score = models.IntegerField(default=0)
    player2_username = models.CharField(max_length=150)
    player2_score = models.IntegerField(default=0)
    is_pong = models.BooleanField(default=False)
    is_tournament = models.BooleanField(default=False)
    date_played = models.DateTimeField(auto_now_add=True)
    winner = models.CharField(max_length=150)
    winner_score = models.IntegerField(default=0)
    looser = models.CharField(max_length=150)
    looser_score = models.IntegerField(default=0)
    is_end = models.BooleanField(default=False)


class CustomUser(AbstractBaseUser):
    username = models.CharField(unique=True)
    email = models.EmailField(blank=True, null=True)
    tfa = models.BooleanField(default=False)
    pfp = models.BinaryField(blank=True, null=True)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    verification_code_created_at = models.DateTimeField(blank=True, null=True)
    lang = models.CharField(default='en')
    friends = models.ManyToManyField('self', symmetrical=False, related_name='friends_of', blank=True)
    is_online = models.BooleanField(default=False)
    last_activity = models.DateTimeField(null=True, blank=True)
    is_encrypted = models.BooleanField(default=True)
    is_42auth = models.BooleanField(default=False)
    last_match = models.ForeignKey(Match, on_delete=models.SET_NULL, null=True, blank=True, related_name="last_match_of_user")
    match_history = models.ManyToManyField(Match, related_name='user_history', blank=True)
    tournament = models.ForeignKey(Tournament, on_delete=models.SET_NULL, null=True, blank=True, related_name='players')

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def encrypt_data(self, data):
        cipher_suite = Fernet(settings.SECRET_KEY.encode())
        return base64.urlsafe_b64encode(cipher_suite.encrypt(data.encode())).decode()

    def decrypt_data(self, encrypted_data):
        if not isinstance(encrypted_data, str) or len(encrypted_data) == 0:
            return encrypted_data 
        try:
            cipher_suite = Fernet(settings.SECRET_KEY.encode())
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            return cipher_suite.decrypt(decoded_data).decode()
        except Exception as e:
            return encrypted_data
    
    def set_password(self, raw_password):
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.username

    def update_last_activity(self):
        self.last_activity = timezone.now()
        self.is_online = True
        self.save()


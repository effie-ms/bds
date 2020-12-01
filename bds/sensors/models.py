from django.core.validators import FileExtensionValidator
from django.db import models

from sensors.helpers import random_files_path


class Upload(models.Model):
    name = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}_{self.created_at}"


class SensorFile(models.Model):
    upload = models.ForeignKey(Upload, on_delete=models.PROTECT)
    name = models.CharField(max_length=255)
    file = models.FileField(
        upload_to=random_files_path,
        validators=[FileExtensionValidator(allowed_extensions=["txt"])],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

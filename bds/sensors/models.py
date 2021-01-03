from django.core.validators import FileExtensionValidator, MinValueValidator
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
    truncation_start = models.FloatField(
        verbose_name="Truncation start (time [s])",
        validators=[MinValueValidator(0)],
        null=True,
    )
    truncation_end = models.FloatField(
        verbose_name="Truncation end (time [s])",
        validators=[MinValueValidator(0)],
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Annotation(models.Model):
    sensor_file = models.ForeignKey(SensorFile, on_delete=models.CASCADE)
    title = models.CharField(max_length=20)
    start = models.FloatField(
        verbose_name="Window start (time)", validators=[MinValueValidator(0)], default=0
    )
    end = models.FloatField(
        verbose_name="Window end (time)", validators=[MinValueValidator(0)], default=0
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} [{round(self.start, 3)}; {round(self.end, 3)}]"

# Generated by Django 2.2.17 on 2020-11-29 19:11

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models

import sensors.helpers


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Upload",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="SensorFile",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                (
                    "file",
                    models.FileField(
                        upload_to=sensors.helpers.random_files_path,
                        validators=[
                            django.core.validators.FileExtensionValidator(
                                allowed_extensions=["txt"]
                            )
                        ],
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "upload",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT, to="sensors.Upload"
                    ),
                ),
            ],
        ),
    ]

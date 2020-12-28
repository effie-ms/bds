# Generated by Django 2.2.17 on 2020-12-27 14:08

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sensors", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Annotation",
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
                ("title", models.CharField(max_length=20)),
                ("start", models.FloatField(verbose_name="Window start (time)")),
                ("end", models.FloatField(verbose_name="Window end (time)")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "sensor_file",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="sensors.SensorFile",
                    ),
                ),
            ],
        ),
    ]
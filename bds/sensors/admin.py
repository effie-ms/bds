from django.contrib import admin

from sensors.models import Annotation, SensorFile, Upload


admin.site.register([Upload, SensorFile, Annotation])

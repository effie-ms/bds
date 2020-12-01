from django.contrib import admin

from sensors.models import SensorFile, Upload


admin.site.register([Upload, SensorFile])

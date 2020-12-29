from rest_framework import serializers

from sensors.models import Annotation, SensorFile, Upload


class SensorFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorFile
        fields = "__all__"


class UploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Upload
        fields = "__all__"


class AnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = "__all__"

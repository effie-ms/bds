from rest_framework import serializers

from sensors.models import Annotation, SensorFile, Upload


class SensorFileSerializer(serializers.ModelSerializer):
    annotations_count = serializers.SerializerMethodField()

    class Meta:
        model = SensorFile
        fields = "__all__"

    def get_annotations_count(self, obj):
        return Annotation.objects.filter(sensor_file=obj).count()


class UploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Upload
        fields = "__all__"


class AnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = "__all__"

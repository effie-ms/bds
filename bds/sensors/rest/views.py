import json
from collections import OrderedDict

from django.shortcuts import get_object_or_404

from rest_framework import viewsets
from rest_framework.response import Response

from bds.pagination import SpaPagination
from sensors.helpers import get_sensor_data
from sensors.models import SensorFile, Upload
from sensors.rest.serializers import SensorFileSerializer, UploadSerializer


class SensorFileViewSet(viewsets.ModelViewSet):
    queryset = SensorFile.objects.all().order_by("name")
    serializer_class = SensorFileSerializer
    filterset_fields = ["upload"]

    def retrieve(self, request, pk=None):
        queryset = SensorFile.objects.all()
        sensor_file = get_object_or_404(queryset, pk=pk)
        serializer = SensorFileSerializer(sensor_file)
        data = {"data": json.dumps(get_sensor_data(sensor_file.file.path))}
        data.update(serializer.data)
        return Response(data)


class UploadPagination(SpaPagination):
    def get_paginated_response(self, data):
        return Response(
            OrderedDict(
                [
                    ("count", self.count),
                    ("next", self.get_next_link()),
                    ("previous", self.get_previous_link()),
                    ("results", data),
                ]
            )
        )


class UploadViewSet(viewsets.ModelViewSet):
    queryset = Upload.objects.all().order_by("-created_at")
    serializer_class = UploadSerializer
    pagination_class = UploadPagination

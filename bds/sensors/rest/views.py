import json
from collections import OrderedDict

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from bds.pagination import SpaPagination
from sensors.helpers import get_sensor_data
from sensors.models import Annotation, SensorFile, Upload
from sensors.rest.serializers import (
    AnnotationSerializer,
    SensorFileSerializer,
    UploadSerializer,
)


# from django.utils.decorators import method_decorator
# from django.views.decorators.cache import cache_page


class SensorFileViewSet(viewsets.ModelViewSet):
    queryset = SensorFile.objects.all().order_by("name")
    serializer_class = SensorFileSerializer
    filterset_fields = ["upload"]

    # @method_decorator(cache_page(60*60*2))
    @action(detail=False, methods=["get"])
    def data(self, request, **kwargs):
        query_params = request.query_params.dict()
        data = {}

        if "sensor_file" in query_params.keys():
            sensor_file = SensorFile.objects.get(pk=query_params["sensor_file"])
            if sensor_file:
                serializer = SensorFileSerializer(sensor_file)
                sensor_file_data = get_sensor_data(
                    sensor_file.file.path,
                    truncate_start=sensor_file.truncation_start,
                    truncate_end=sensor_file.truncation_end,
                    only_pressure=False,
                )

                data = {
                    "data": json.dumps(sensor_file_data),
                    "min_time": min(sensor_file_data["Time [s]"]),
                    "max_time": max(sensor_file_data["Time [s]"]),
                    "max_pressure": max(sensor_file_data["P [hPa]"]),
                    "points_number": len(sensor_file_data["Time [s]"]),
                }
                data.update(serializer.data)

        return Response(data)

    # @method_decorator(cache_page(60*60*2))
    @action(detail=False, methods=["get"])
    def all_pressure_data(self, request, **kwargs):
        query_params = request.query_params.dict()
        data = {}

        if "sensor_file" in query_params.keys():
            sensor_file = SensorFile.objects.get(pk=query_params["sensor_file"])
            if sensor_file:
                serializer = SensorFileSerializer(sensor_file)

                sensor_file_data = get_sensor_data(
                    sensor_file.file.path,
                    truncate_start=None,
                    truncate_end=None,
                    only_pressure=True,
                )

            data = {
                "data": json.dumps(sensor_file_data),
                "min_time": min(sensor_file_data["Time [s]"]),
                "max_time": max(sensor_file_data["Time [s]"]),
                "points_number": len(sensor_file_data["Time [s]"]),
            }
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


class AnnotationViewSet(viewsets.ModelViewSet):
    queryset = Annotation.objects.all().order_by("-created_at")
    serializer_class = AnnotationSerializer
    filterset_fields = ["sensor_file"]

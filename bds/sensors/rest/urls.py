from django.urls import include, re_path

from rest_framework.routers import SimpleRouter

from sensors.rest.views import AnnotationViewSet, SensorFileViewSet, UploadViewSet


router = SimpleRouter(trailing_slash=False)
router.register(r"uploads", UploadViewSet, basename="api-uploads")
router.register(r"files", SensorFileViewSet, basename="api-files")
router.register(r"annotations", AnnotationViewSet, basename="api-annotations")

urlpatterns = [
    re_path(r"^", include(router.urls)),
]

from django.urls import include, path


urlpatterns = [
    path("auth/", include("accounts.jwt.urls")),
    path("user/", include("accounts.rest.urls")),
    path("", include("sensors.rest.urls")),
]

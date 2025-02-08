from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlotViewSet

router = DefaultRouter()
router.register(r'plots', PlotViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 
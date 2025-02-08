from rest_framework import viewsets
from .models import Plot
from .serializers import PlotSerializer

class PlotViewSet(viewsets.ModelViewSet):
    queryset = Plot.objects.all()
    serializer_class = PlotSerializer

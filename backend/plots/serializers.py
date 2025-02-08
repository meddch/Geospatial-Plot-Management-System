from rest_framework import serializers
from .models import Plot

class PlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plot
        fields = ['id', 'name', 'geometry', 'created_at']
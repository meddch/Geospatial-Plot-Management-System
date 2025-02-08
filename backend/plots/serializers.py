from rest_framework import serializers
from django.contrib.gis.geos import GEOSGeometry
from .models import Plot

class PlotSerializer(serializers.ModelSerializer):
    coordinates = serializers.JSONField()

    class Meta:
        model = Plot
        fields = ['id', 'name', 'coordinates', 'area', 'exploitation', 
                 'crop_type', 'has_manager', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Convert GeoJSON to GEOS geometry
        geojson = validated_data.pop('coordinates')
        coordinates = GEOSGeometry(str(geojson))
        return Plot.objects.create(coordinates=coordinates, **validated_data)

    def to_representation(self, instance):
        # Convert GEOS geometry to GeoJSON
        representation = super().to_representation(instance)
        representation['coordinates'] = eval(instance.coordinates.json)
        return representation 
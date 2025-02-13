from rest_framework import serializers
from django.contrib.gis.geos import GEOSGeometry, GEOSException
from .models import Plot
import json

class PlotSerializer(serializers.ModelSerializer):
    coordinates = serializers.JSONField()

    class Meta:
        model = Plot
        fields = ['id', 'name', 'coordinates', 'area', 'exploitation', 
                 'crop_type', 'has_manager', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Convert GeoJSON to GEOS geometry
        geojson = validated_data.pop('coordinates')
        try:
            coordinates = GEOSGeometry(str(geojson))  # Convert GeoJSON to GEOS geometry
        except GEOSException as e:
            raise serializers.ValidationError({'coordinates': 'Invalid GeoJSON data.'})
        return Plot.objects.create(coordinates=coordinates, **validated_data)

    def update(self, instance, validated_data):
        geojson = validated_data.pop('coordinates', None)
        if geojson:
            try:
                coordinates = GEOSGeometry(str(geojson))  # Convert GeoJSON to GEOS geometry
                instance.coordinates = coordinates
            except GEOSException as e:
                raise serializers.ValidationError({'coordinates': 'Invalid GeoJSON data.'})
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        # Convert GEOS geometry to GeoJSON
        representation = super().to_representation(instance)
        representation['coordinates'] = json.loads(instance.coordinates.json)  # Safe conversion
        return representation
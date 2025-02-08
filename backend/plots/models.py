from django.contrib.gis.db import models

class Plot(models.Model):
    name = models.CharField(max_length=255)
    coordinates = models.GeometryField(srid=4326)
    area = models.FloatField()
    exploitation = models.CharField(max_length=255, default='Bouskoura')
    crop_type = models.CharField(max_length=255, blank=True)
    has_manager = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name 
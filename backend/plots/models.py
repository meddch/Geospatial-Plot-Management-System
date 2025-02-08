from django.contrib.gis.db import models

class Plot(models.Model):
    name = models.CharField(max_length=100)
    geometry = models.PolygonField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
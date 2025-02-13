from django.contrib.gis.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _

class Plot(models.Model):
    # Crop type choices
    class CropType(models.TextChoices):
        CEREALS = 'cereals', _('Cereals')
        VEGETABLES = 'vegetables', _('Vegetables')
        FRUITS = 'fruits', _('Fruits')
        OTHER = 'other', _('Other')

    # Fields
    name = models.CharField(max_length=255, unique=True, verbose_name=_('Plot Name'))
    coordinates = models.GeometryField(srid=4326, verbose_name=_('Coordinates'))
    area = models.FloatField(validators=[MinValueValidator(0)], verbose_name=_('Area (ha)'))
    exploitation = models.CharField(max_length=255, default='', verbose_name=_('Exploitation'))
    crop_type = models.CharField(
        max_length=255,
        choices=CropType.choices,
        blank=True,
        verbose_name=_('Crop Type')
    )
    has_manager = models.BooleanField(default=False, verbose_name=_('Has Manager'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Created At'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Updated At'))

    # Custom manager
    objects = models.Manager()

    class Meta:
        verbose_name = _('Plot')
        verbose_name_plural = _('Plots')
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['exploitation']),
            models.Index(fields=['crop_type']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Add custom logic before saving (if needed)
        super().save(*args, **kwargs)
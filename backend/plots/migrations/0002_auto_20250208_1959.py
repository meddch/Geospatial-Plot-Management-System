# Generated by Django 3.2.25 on 2025-02-08 19:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plots', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='plot',
            name='crop_type',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='plot',
            name='exploitation',
            field=models.CharField(default='Bouskoura', max_length=255),
        ),
        migrations.AddField(
            model_name='plot',
            name='has_manager',
            field=models.BooleanField(default=False),
        ),
    ]

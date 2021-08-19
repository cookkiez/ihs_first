from django.contrib import admin
from .models import ElectricMeterData, AirFlowData
# Register your models here.

admin.site.register(ElectricMeterData)
admin.site.register(AirFlowData)
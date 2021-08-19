from django.db import models
from django.utils.timezone import now

# Create your models here.
"""class PLC(models.Model):
    name = models.CharField(max_length=60, default="Temp")
    def __str__(self):
        return self.name

class Sensor(models.Model):
    plc = models.ForeignKey(PLC, blank = True, null = True, on_delete=models.CASCADE)
    dataType = models.CharField(max_length=60, default="Temperature")

    def __str__(self):
        return self.plcId + " " + self.dataType

class SensorData(models.Model):
    date = models.DateField()
    data = models.FloatField()
    # plc = models.IntegerField(default=0)
    # dataType = models.CharField(max_length=20, default="temperature")
    sensor = models.ForeignKey(Sensor, blank = True, null = True, on_delete=models.CASCADE)

    def __str__(self):
        return self.date + " " + self.data + " " + self.plc + " " + self.dataType"""


class CustomDateTimeField(models.DateTimeField):
    def value_to_string(self, obj):
        val = self.value_from_object(obj)
        if val:
            val.replace(microsecond=0)
            return val.isoformat()
        return ''

def get_class_str(cls):
    return " ".join(
        [str(attribute) for attribute in dir(cls) if not a.startswith("__") and \
            not callable(getattr(cls), a)]
    )


class Alarm(models.Model):
    alarm_type = models.CharField(max_length=10)
    start_time = models.DateTimeField(default=now)
    end_time = models.DateTimeField(default=now)
    alarm_text = models.CharField(max_length=100, default="")
    alarm_name = models.CharField(max_length=50, default="")

    def __str__(self):
        return get_class_str(self)

        
class ElectricMeterData(models.Model):
    kilo_watt_h = models.FloatField()
    voltage_L1_N = models.FloatField()
    voltage_L2_N  = models.FloatField()
    voltage_L3_N = models.FloatField()
    voltage_L1_L2 = models.FloatField()
    voltage_L2_L3 = models.FloatField()
    voltage_L3_L1 = models.FloatField()
    current_L1 = models.FloatField()
    current_L2 = models.FloatField()
    current_L3 = models.FloatField()
    date_time = models.DateTimeField(default=now)

    def __str__(self):
        return get_class_str(self)

class AirFlowData(models.Model):
    liter_per_second = models.FloatField()
    liter_per_minute = models.FloatField()
    liter_per_hour = models.FloatField()
    air_volume = models.FloatField()
    date_time = models.DateTimeField(default=now)

    def __str__(self):
        return get_class_str(self)

class MachineState(models.Model):
    # Run, stop, error
    current_state = models.CharField(max_length=20)
    current_counted_packages = models.IntegerField(default=0)
    date_time = models.DateTimeField(default=now)
    
    # Robot position? če se to sploh da, to bi dodal kr neki kompleksnost aplikaciji

    def __str__(self):
        return get_class_str(self)

class TagsToGet(models.Model):
    tag_name = models.CharField(max_length=50)
    active = models.BooleanField(default=True)
    display_name = models.CharField(max_length=50, default="")
    unit = models.CharField(max_length=50, default="")

    def __str__(self):
        return get_class_str(self)

class TagsData(models.Model):
    tag_name = models.CharField(max_length=50)
    tag_data = models.FloatField(default=0)  
    date_time = models.DateTimeField(default=now)

    def __str__(self):
        return get_class_str(self)

class Limit(models.Model):
    indicator_name = models.CharField(max_length=50)
    limit_upper = models.FloatField(default=999)
    limit_lower = models.FloatField(default=0)

    def __str__(self):
        return get_class_str(self)

class Emails(models.Model):
    email = models.CharField(max_length=50)
    active = models.BooleanField(default=True)

    def __str__(self):
        return get_class_str(self)

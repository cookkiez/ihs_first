from rest_framework import serializers
from .models import ElectricMeterData, AirFlowData, Alarm, MachineState, \
    TagsToGet, TagsData, Limit, Emails

"""class PLCSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = PLC
        fields = ('id', 'name')

class SensorSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = Sensor
        fields = ('id', 'plc', 'dataType')

class SensorDataSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = SensorData
        fields = ('id', 'date', 'data', 'sensor')"""

class ElMeterDataSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = ElectricMeterData
        fields = (
            'id', 'kilo_watt_h', 'voltage_L1_N', 'voltage_L2_N', 'voltage_L3_N', 
            'voltage_L1_L2', 'voltage_L2_L3', 'voltage_L3_L1', 'current_L1', 
            'current_L2', 'current_L3', 'date_time'
        )

class AirFlowDataSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = AirFlowData
        fields = (
            'id', 'liter_per_second', 'liter_per_minute', 'liter_per_hour', 
            'air_volume', 'date_time'
        )

class AlarmSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Alarm
        fields = (
            'id', 'alarm_type', 'start_time', 'end_time', 'alarm_text', 'alarm_name'
        )

class MachineStateSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = MachineState
        fields = (
            'id', 'current_state', 'current_counted_packages', 'date_time'
        )

class TagsSerizalizer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = TagsToGet
        fields = (
            'id', 'tag_name', 'active', 'display_name', 'unit'
        )

class TagsDataSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = TagsData
        fields = (
            'id', 'tag_name', 'tag_data', 'date_time'
        )

class LimitSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Limit
        fields = (
            'id', 'indicator_name', 'limit_upper', 'limit_lower'
        )

class EmailSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Emails
        fields = (
            "id", "email", "active"
        )
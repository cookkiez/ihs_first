# Generated by Django 3.2.4 on 2021-07-14 13:15

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AirFlowData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('liter_per_second', models.FloatField()),
                ('liter_per_minute', models.FloatField()),
                ('liter_per_hour', models.FloatField()),
                ('air_volume', models.FloatField()),
                ('date_time', models.DateTimeField(default=django.utils.timezone.now)),
            ],
        ),
        migrations.CreateModel(
            name='Alarm',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alarm_type', models.CharField(max_length=10)),
                ('start_time', models.DateTimeField(default=django.utils.timezone.now)),
                ('end_time', models.DateTimeField(default=django.utils.timezone.now)),
                ('alarm_text', models.CharField(default='', max_length=100)),
                ('alarm_name', models.CharField(default='', max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name='ElectricMeterData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('kilo_watt_h', models.FloatField()),
                ('voltage_L1_N', models.FloatField()),
                ('voltage_L2_N', models.FloatField()),
                ('voltage_L3_N', models.FloatField()),
                ('voltage_L1_L2', models.FloatField()),
                ('voltage_L2_L3', models.FloatField()),
                ('voltage_L3_L1', models.FloatField()),
                ('current_L1', models.FloatField()),
                ('current_L2', models.FloatField()),
                ('current_L3', models.FloatField()),
                ('date_time', models.DateTimeField(default=django.utils.timezone.now)),
            ],
        ),
        migrations.CreateModel(
            name='MachineState',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('current_state', models.CharField(max_length=10)),
                ('current_counted_packages', models.IntegerField(default=0)),
            ],
        ),
    ]
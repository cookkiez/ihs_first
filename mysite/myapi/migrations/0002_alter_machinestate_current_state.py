# Generated by Django 3.2.4 on 2021-07-15 06:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapi', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='machinestate',
            name='current_state',
            field=models.CharField(max_length=20),
        ),
    ]

# Generated by Django 3.2.4 on 2021-08-02 07:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapi', '0006_tagstoget_active'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tagstoget',
            name='active',
            field=models.BooleanField(default=True),
        ),
    ]

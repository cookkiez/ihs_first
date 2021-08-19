from django.urls import include, path
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
"""router.register(r'plcs', views.PLCViewSet)
router.register(r'sensor', views.SensorViewSet)
router.register(r'sensorData', views.SensorDataViewSet)"""
router.register(r'electricMeter', views.ElectricMeterDataViewSet)
router.register(r'airflow', views.AirFlowDataViewSet)
router.register(r'alarm', views.AlarmViewSet)
router.register(r'state', views.MachineStateViewSet)
router.register(r'tags', views.TagsViewSet)
router.register(r'tags_data', views.TagsDataViewSet)
router.register(r'limits', views.LimitViewSet)
router.register(r'email', views.EmailViewSet)
router.register(r'sendEmail', views.send_email)

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]
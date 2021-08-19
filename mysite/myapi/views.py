from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.generics import ListAPIView
from rest_framework.generics import CreateAPIView
from rest_framework.generics import DestroyAPIView
from rest_framework.generics import UpdateAPIView
from .serializers import ElMeterDataSerializer, AirFlowDataSerializer, \
    AlarmSerializer, MachineStateSerializer, TagsSerizalizer, \
    TagsDataSerializer, LimitSerializer, EmailSerializer
from .models import ElectricMeterData, AirFlowData, Alarm, MachineState,\
     TagsToGet, TagsData, Limit, Emails
from rest_framework.response import Response
from rest_framework import status
from django.db.models.functions import Coalesce
from django.core.mail import send_mail, EmailMessage
import time
from rest_framework.throttling import UserRateThrottle, BaseThrottle
import json

MAX_ELEMENTS_IN_TABLE = 10000

class CustomThrottle(BaseThrottle):
# def allow_request(self, request, view):
#     """
#     Return `True` if the request should be allowed, `False` otherwise.
#     """
#     return random.randint(1, 10) != 1

    def wait(self):
        """
        Optionally, return a recommended number of seconds to wait before
        the next request.
        """
        cu_second = 60
        return cu_second

class CustomThrottleOverhead(CustomThrottle,UserRateThrottle):   # or AnonRateThrottle
    scope = 'user_sec'


class send_email(viewsets.ModelViewSet):
    """
        Endpoint for sending emails.

        sendEmail/{id}: for individual actions
    """
    throttle_classes= [CustomThrottleOverhead]
    queryset = ElectricMeterData.objects.all()
    serializer_class = ElMeterDataSerializer

    def create(self, request, *args, **kwargs):
        print("Send email")
        #print(request.data)
        all_emails = Emails.objects.all()
        emails_to_send = []
        for email in all_emails:
            if email.active:
                emails_to_send.append(email.email)
        """send_mail(
            'Report from data monitoring system',
            request.data["message"],                
            'from@example.com',
            emails_to_send,
            fail_silently=False,
        )"""
        with open("report.json", "w") as emailfile:
            json.dump(request.data, emailfile, indent=4)
        import os 
        dir_path = os.path.dirname(os.path.realpath(__file__)) 
        print(dir_path)   
        with open("report.json", "r") as outfile:
            email = EmailMessage(
                "Report from data monitoring system",
                request.data["message"],
                "diplomatest12@gmail.com",
                emails_to_send,
            )
            email.attach("report.json", request.data["dict"], "application/json")
            email.send()

        return Response([], status=status.HTTP_201_CREATED)


"""class PLCViewSet(viewsets.ModelViewSet):
    queryset = PLC.objects.all()
    serializer_class = PLCSerializer

class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer

class SensorDataViewSet(viewsets.ModelViewSet):
    queryset = SensorData.objects.all()
    serializer_class = SensorDataSerializer"""

class ElectricMeterDataViewSet(viewsets.ModelViewSet):
    """
        Endpoint for CRUD operations to over data of electric meter.

        electricMeter/{id}: for individual actions
    """
    queryset = ElectricMeterData.objects.all()
    serializer_class = ElMeterDataSerializer
    

    def create(self, request, *args, **kwargs):
        qq = ElectricMeterData.objects.all()
        while len(qq) >= MAX_ELEMENTS_IN_TABLE:
            el_to_del = qq[0]
            self.perform_destroy(el_to_del)
            qq = ElectricMeterData.objects.all()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        print("Fire", len(ElectricMeterData.objects.all()))
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class AirFlowDataViewSet(viewsets.ModelViewSet):
    """
        Endpoint for CRUD operations to over data of airflow sensor.

        airflow/{id}: for individual actions
    """
    queryset = AirFlowData.objects.all()
    serializer_class = AirFlowDataSerializer


    def create(self, request, *args, **kwargs):
        qq = AirFlowData.objects.all()
        while len(qq) > MAX_ELEMENTS_IN_TABLE:
            el_to_del = qq[0]
            self.perform_destroy(el_to_del)
            qq = AirFlowData.objects.all()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        print("Air", len(AirFlowData.objects.all()))
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class AlarmViewSet(viewsets.ModelViewSet):
    """
        Endpoint for CRUD operations over alarms.

        alarm/{id}: for individual actions
    """
    queryset = Alarm.objects.all()
    serializer_class = AlarmSerializer
    

    def create(self, request, *args, **kwargs):
        qq = Alarm.objects.all()
        while len(qq) >= MAX_ELEMENTS_IN_TABLE:
            el_to_del = qq[0]
            self.perform_destroy(el_to_del)
            qq = Alarm.objects.all()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        print("Water", len(Alarm.objects.all()))
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class MachineStateViewSet(viewsets.ModelViewSet):
    """
        Endpoint for CRUD operations over machine state.

        state/{id}: for individual actions
    """
    queryset = MachineState.objects.all()
    serializer_class = MachineStateSerializer
    

    def create(self, request, *args, **kwargs):
        qq = MachineState.objects.all()
        while len(qq) >= MAX_ELEMENTS_IN_TABLE:
            el_to_del = qq[0]
            self.perform_destroy(el_to_del)
            qq = MachineState.objects.all()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        print("Gas", len(MachineState.objects.all()))
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class TagsViewSet(viewsets.ModelViewSet):
    """
        Endpoint for CRUD operations over tags to get.

        tags/{id}: for individual actions
    """
    queryset = TagsToGet.objects.all()
    serializer_class = TagsSerizalizer

    def create(self, request, *args, **kwargs):
        qq = TagsToGet.objects.all()
        while len(qq) >= MAX_ELEMENTS_IN_TABLE:
            el_to_del = qq[0]
            self.perform_destroy(el_to_del)
            qq = TagsToGet.objects.all()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        print("Crystal", len(TagsToGet.objects.all()))
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class TagsDataViewSet(viewsets.ModelViewSet):
    """
        Endpoint for CRUD operations over tags to get.

        tags/{id}: for individual actions
    """
    queryset = TagsData.objects.all()
    serializer_class = TagsDataSerializer
    
    def create(self, request, *args, **kwargs):
        qq = TagsData.objects.all()
        while len(qq) >= MAX_ELEMENTS_IN_TABLE:
            el_to_del = qq[0]
            self.perform_destroy(el_to_del)
            qq = TagsData.objects.all()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        print("Crystal", len(TagsData.objects.all()))
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class LimitViewSet(viewsets.ModelViewSet):
    """
        Endpoint for CRUD operations over limits.

        limits/{id}: for individual actions
    """
    queryset = Limit.objects.all()
    serializer_class = LimitSerializer
    
    def create(self, request, *args, **kwargs):
        qq = Limit.objects.all()
        while len(qq) >= MAX_ELEMENTS_IN_TABLE:
            el_to_del = qq[0]
            self.perform_destroy(el_to_del)
            qq = Limit.objects.all()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        print("Sapphire", len(Limit.objects.all()))
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class EmailViewSet(viewsets.ModelViewSet):
    """
        Endpoint for CRUD operations over limits.

        emails/{id}: for individual actions
    """
    queryset = Emails.objects.all()
    serializer_class = EmailSerializer
    
    def create(self, request, *args, **kwargs):
        qq = Emails.objects.all()
        while len(qq) >= MAX_ELEMENTS_IN_TABLE:
            el_to_del = qq[0]
            self.perform_destroy(el_to_del)
            qq = Emails.objects.all()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        print("Mails", len(Emails.objects.all()))
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
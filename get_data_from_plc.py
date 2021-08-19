# Library imports the program needs to function, google them 
# if you want to know more :)

# For connecting to PLC
from opcua import Client, ua
from opcua.common.subscription import SubHandler

# For sending data to server
import requests

# For periodical data reading
from time import sleep

# For multi-threading
import threading

# For getting current time
from datetime import datetime

# For writing excel files
import xlsxwriter

# URL for server, use localhost if server running on this computer
# otherwise change localhost to IP address of device running server
api_link = "http://localhost:8000/"

# Data about alarms and warnings for tracking when an either has been 
# activated first
alarms_data = {}


# Keep record if machine in automatic or manual state
avtomatika_seznam = [] 

def do_alarms(alarm_type):
    """
        Function called when multi-threading for subscriptions on alarms and 
        warnings. Creates new connection to PLC and subscribes for data changes
        in ALARMS DB or WARNINGS DB.

        :param alarm_type: "error" for subscribing to alarms or 
                           "warning" for subscribing to warnings
    """

    # Create connection to PLC, enter URL of OPC UA server here (copy from tia)
    connection = Client("opc.tcp://192.168.75.10:4840")
    connection.session_timeout = 30000
    connection.connect()

    if alarm_type == "alarm" :
        # Create object that will handle notifications for change of data
        handler_alarm = MySubHandlerAlarmsWarnings(alarm_type)

        # Create subscription and give it the object that handles notifications
        # first parameter is "period" (period with which the PLC will send notifications in ms)
        sub_alarm = connection.create_subscription(1000, handler_alarm)

        # Get ALARMS DB
        var_alarm = connection.get_node('ns=3;s="ALARMS"')

        # Subscribe to data changes for ALARMS DB elements
        # when tag in ALARMS.Doors is changed, the handler_alarm will be notified
        sub_alarm.subscribe_data_change(var_alarm.get_children())
    else: 
        # Identical as alarms, just for warnings
        handler_warning = MySubHandlerAlarmsWarnings(alarm_type)
        sub_warning = connection.create_subscription(1000, handler_warning)

        var_warning = connection.get_node('ns=3;s="WARNINGS"')
        handle_warning = sub_warning.subscribe_data_change(var_warning.get_children())

    
class MySubHandlerAlarmsWarnings(SubHandler):
    """
        Object that will handle subscriptions and notifications from the PLC. 
        Meant for alarms and warnings.
    """
    def __init__(self, handler_type):
        """
            Create instance of MySubHandler

            :param handler_type: Sets the type of handler for this instance ('alarm' or 'warning')
        """
        self.type = handler_type

    def datachange_notification(self, node, val, data):
        """
            Function will be called everytime data that this handler is subscribed to changes.

            :param self: instance of this object
            :param node: the node (DB or tag) which data has changed
            :param val: if node is a tag, then this is actual value of the tag. If node is DB
                        then value of this variable is useless
            :param data: 
        """
        # Output some values, for debugging if needed
        print()
        # Output type of this instance (alarm or warning)
        print(self.type)
        # Uncomment next row to also output current value of the node that changed
        #print(node, val)
        # Output name of node that changed
        print(node)

        # Save name of changed node in special variable
        key = node

        # Get current time and store it in a string with specified format 
        # check datetime.strftime docs for more
        var_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

        # Check if this node has already been changed before
        if key not in alarms_data:
            # If node hasn't been changed before, create new placeholder dictionary in alarms_data
            alarms_data[key] = {
                "state": "End",
                "time": var_now
            }
        else: 
            # If node has been changed before, check its state
            if alarms_data[key]["state"] == "Start":
                """
                    If state is "Start", this means that the alarm/warning already has a stored 
                    starting time (when the alarm triggered first) and now we can send data for
                    this alarm/warning to the server to be saved in the database
                """

                # Update state, so we know that this alarm has been resolved
                alarms_data[key]["state"] = "End"

                """  
                    Make a POST (google HTTP methods) request to the server. First parameter of function is URL of server
                    (eg. "http://localhost:8000/alarm/"), second parameter is the data to be stored 
                    (data has to be same as database structure). End time of alarm/warning (time when
                    resolved) is set by the server, so we don't have to set it here. 
                """
                response_alarm = requests.post(
                    api_link + "alarm/",
                    data={
                        "alarm_type": self.type,
                        "alarm_text": "Alarm text",
                        "alarm_name": str(key).split("=")[2],
                        "start_time": alarms_data[key]["time"]
                    },
                )
                print(self.type, response_alarm)
            else:
                """
                    If state is not "Start", this means that the alarm/warning has already been resolved (or hasn't been
                    triggered yet) and that it has been activated again, so we set the state to "Start" and store the current time 
                    in its dictionary. Starting time will be sent to the server when this alarm/warning is resolved.
                """
                alarms_data[key]["state"] = "Start"
                alarms_data[key]["time"] = var_now


class IzmenaHandler(SubHandler):
    def datachange_notification(self, node, val, data):
        workbook = xlsxwriter.Workbook('hello.xlsx')
        print(node, val)
        worksheet = workbook.add_worksheet()
        
        response_alarm = requests.get(api_link + "alarm/",)
        print(response_alarm.json())
        worksheet.write('A1', 'Ime alarma')
        worksheet.write('B1', 'Začetni čas')
        worksheet.write('C1', 'Končni čas')
        for i, alarm in enumerate(response_alarm.json()):
            stevec = i + 2
            worksheet.write("A" + str(stevec), alarm["alarm_name"])
            worksheet.write("B" + str(stevec), alarm["start_time"])
            worksheet.write("C" + str(stevec), alarm["end_time"])


        global avtomatika_seznam
        worksheet.write('E1', 'Ali je avtomatika')
        worksheet.write('F1', 'čas')
        prejsna_vrednost_avtomatike = avtomatika_seznam[0]
        sestevek_ur = [0, 0]
        for i, auto in enumerate(avtomatika_seznam):
            stevec = i + 2
            worksheet.write("E" + str(stevec), auto["val"])
            worksheet.write("F" + str(stevec), auto["datum"])

            if prejsna_vrednost_avtomatike["val"] != auto["val"]:
                prejsni_datum = datetime.strptime(prejsna_vrednost_avtomatike["datum"], "%Y-%m-%d %H:%M:%S.%f")
                trenutni_datum = datetime.strptime(auto["datum"], "%Y-%m-%d %H:%M:%S.%f")
                razlika = trenutni_datum - prejsni_datum
                text = ""
                if prejsna_vrednost_avtomatike["val"] == 1:
                    text = "Stroj je bil v avtomatiki"
                else: 
                    text = "Stroj ni bil v avtomatiki"
                ure = int(razlika.total_seconds() / 3600)
                minute = int((razlika.total_seconds() % 3600) / 60)
                sekunde = int((razlika.total_seconds() % 3600) % 60)
                sestevek_ur[prejsna_vrednost_avtomatike["val"]] += razlika.total_seconds()
                worksheet.write("G" + str(stevec), " ".join([text, "Ure:", str(ure), "Minute:", str(minute), "Sekunde: ", str(sekunde)]))
                prejsna_vrednost_avtomatike = auto
        
        ure_false = int(sestevek_ur[0] / 3600)
        minute_false = int((sestevek_ur[0] % 3600) / 60)
        sekunde_false = int((sestevek_ur[0] % 3600) % 60)

        ure_true = int(sestevek_ur[1] / 3600)
        minute_true = int((sestevek_ur[1] % 3600) / 60)
        sekunde_true = int((sestevek_ur[1] % 3600) % 60)

        worksheet.write("H1", "Stroj ni bil v avtomatiki")
        worksheet.write("H2", " ".join(["Ure:", str(ure_false), "Minute:", str(minute_false), "Sekunde: ", str(sekunde_false)]))

        worksheet.write("I1", "Stroj je bil v avtomatiki")
        worksheet.write("I2", " ".join(["Ure:", str(ure_true), "Minute:", str(minute_true), "Sekunde: ", str(sekunde_true)]))

        workbook.close()

"""
    The main loop of the program starts here
"""

# Create connection to the PLC
connection = Client("opc.tcp://192.168.75.10:4840")
connection.session_timeout = 30000

# Create two additional threads, on each of them call the "do_alarms" function
threading.Thread(target=do_alarms("alarm"), args=(1,), daemon=True)
threading.Thread(target=do_alarms("warning"), args=(1,), daemon=True)

izmena_handler = IzmenaHandler()
sub_izmena = connection.create_subscription(500, izmena_handler)
var_izmena = connection.get_node('ns=3;s="ALARMS"."General"."TiskanjePorocila"')
handle_izmena = sub_izmena.subscribe_data_change(var_izmena)

while True:

    avtomatika = connection.get_node('ns=3;s="ALARMS"."General"."Automatika"')
    ali_je_auto = avtomatika.get_value()
    avtomatika_seznam.append({
        "val": ali_je_auto, 
        "datum": datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    })

    print(ali_je_auto)

    sleep(5)
    pass


"""
# Example of looping for data getting data out of DB "fb_ReadVoltMeterAndAirflow_DB"

i = 0
while i < 10000:
    i += 1
    # connection.connect()
    print("Connected to server and fetching")
    # Get server status data
    connection.connect()
    status = connection.get_node("i=2256")

    var_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

    # Get the electric meter and airflow data to read
    static_data = connection.get_node('ns=3;s="fb_ReadVoltMeterAndAirflow_DB".Static')
    static_data_children = static_data.get_children()
    vals = connection.get_values(static_data_children)

    # Send data to the api
    response_electric = requests.post(
        api_link + "electricMeter/",
        data={
            "kilo_watt_h": vals[0],
            "voltage_L1_N": vals[1],
            "voltage_L2_N": vals[2],
            "voltage_L3_N": vals[3],
            "voltage_L1_L2": vals[4],
            "voltage_L2_L3": vals[5],
            "voltage_L3_L1": vals[6],
            "current_L1": vals[7],
            "current_L2": vals[8],
            "current_L3": vals[9],
            "date_time": var_now
        },
    )

    response_airflow = requests.post(
        api_link + "airflow/",
        data={
            "liter_per_second": vals[10],
            "liter_per_minute": vals[11],
            "liter_per_hour": vals[12],
            "air_volume": vals[14],
            "date_time": var_now
        },
    )

    # Counters data, to determine the number of packages that were produced
    #cnt1 = connection.get_node('ns=3;s="LF1".Cnt1.Pack.Accu')
    #cnt1_val = cnt1.get_value()
    #cnt2 = connection.get_node('ns=3;s="LF2".Cnt1.Pack.Accu')
    #cnt2_val = cnt2.get_value()
    #cnt = cnt2_val + cnt1_val
    

    cnt = vals[15]

    response_state = requests.post(
        api_link + "state/",
        data={
            "current_state": status.get_value().State.name,
            "current_counted_packages": cnt,
            "date_time": var_now
        },
    )

    tags_to_get = requests.get(api_link + "tags/").json()

    print(tags_to_get)

    for tag in tags_to_get:
        if tag["active"]:
            data = connection.get_node('ns=3;s=' + tag["tag_name"])
            response_tag = requests.post(api_link + "tags_data/", data={
            "tag_name": tag["tag_name"],
            "tag_data": data.get_value(),
            "date_time": var_now
            })
            print("Tag", response_tag)
        else:
            pass

    print(
        "Electric:",
        response_electric,
        "Airflow:",
        response_airflow,
        "State:",
        response_state,
    )
    connection.disconnect()
    sleep(10)
"""

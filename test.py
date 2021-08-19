from opcua import Client, ua # ta ua bi blo fajn pogledat točno vse kaj lahko delaš
from opcua.common.subscription import SubHandler
import sqlite3
import os
import requests
import numpy

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(THIS_DIR, "mysite", "db.sqlite3")

class MyHandler(SubHandler):
    def datachange_notification(self, node, val, data):
        """
        called for every datachange notification from server
        """
        print()
        print()
        print("ALARM")
        # print(node, val, data)
        pass

# ip fetching
"""devices = []
for dev in os.popen("arp -a"): devices.append(dev)

devices = devices[3:]
ips = []
for dev in devices:
    print(dev)
    dev = list(dict.fromkeys(dev.split(" ")))
    # To je zato da vzameš sam lokalne in da vse default gatewaye vržeš stran, da slučajno ne pingaš nekaj kar ne bi smel
    try:
        if "192.168." in dev[1] and not("254" in dev[1] or "255" in dev[1]): 
            ips.append(dev[1])
    except:
        pass

print(ips)for ip in ips:
    try:
        c = Client(url=f"opc.tcp://{ip}:4840")
        c.connect()
        c.disconnect()
        print(ip, "Is an OPC server")
    except:
        print(ip, "Not an OPC server")"""
# rabiš pač url od serverja -> to bi lahko bil problem
c = Client("opc.tcp://desktop-btr449q:62640/IntegrationObjects/ServerSimulator")
# c = Client("opc.tcp://192.168.100.55:4840")
# c = Client("opc.tcp://192.168.75.10:4840")
c.session_timeout = 30000
#print(c.find_servers_on_network())
c.connect()
# c.load_type_definitions()

root = c.get_root_node()

# za machine status - in pol dobiš vn z get_value().StartTime npr
status = c.get_node("i=2256")
print(status.get_value().State, dir(status.get_value().State), status.get_value().State.name)
"""
var = c.get_node('ns=3;s="fb_ReadVoltMeterAndAirflow_DB".Static')
var_child = var.get_children()

sql = sqlite3.connect(DATA_DIR)
cursor = sql.cursor()
vals = c.get_values(var_child)
print(vals)

response = requests.post("http://localhost:8000/electricMeter/", data={
    "watt_h": vals[0],
    "voltage_L1_N1": vals[1],
    "voltage_L2_N1": vals[2],
    "voltage_L3_N1": vals[3],
    "voltage_L1_L2": vals[4],
    "voltage_L2_L3": vals[5],
    "voltage_L3_L1": vals[6],
    "current_L1": vals[7],
    "current_L2": vals[8],
    "current_L3": vals[9],
})
print(response)"""
"""response = requests.post("http://localhost:8000/airflow/", data={
    "liter_per_second": vals[10],
    "liter_per_minute": vals[11],
    "liter_per_hour": vals[12],
    "air_volume": vals[14],
})
print(response)"""
#cursor.execute(query, params)
#sql.commit()
#sql.close()

c.disconnect()


# handler = MyHandler()
# sub = c.create_subscription(500, handler)


# tle lahko hitr s temle nastane problem
# verjetno bo treba neko query funkcijo napisat ko bo iskala tisto kar iščemo
# ker tole je preveč specifično -> verjetno morem uporabit tisto "get_objects" in pol iz tistega vn potegnt podatke
# tole ne bo tok easy ko sm mislu :D
# ns=3 je pomoje 
"""var = c.get_node('ns=3;s="FB_OPC_UA_DB_1"')

var_child = var.get_children()
# print(var.get_browse_name(), var.get_display_name())
print(var_child[0].get_children())
handle = sub.subscribe_data_change(var_child[0].get_children())
# Event notifier bi lahko bil uporabna stvar, samo zele ne vem še nič o tem
# print(var.get_event_notifier())   
# var.set_event_notifier()
var_arr = []
for val in var_child[0].get_children()[0].get_children():
    var_arr.append(val)
#    data_val = val.get_data_value()
    # print(val.get_node_class())
    # print(val.get_value())
    # print(data_val)
    # print(data_val.SourceTimestamp, data_val.Value)

handle = sub.subscribe_data_change(var_arr)"""

# Lahko subscribaš na alarme in ko se nek alarm nekje sproži boš dobil notification
"""var = c.get_node('ns=3;s="ALARMS"')
print(var.get_children())
handle = sub.subscribe_data_change(var.get_children())
i = 0
while True:
    if i > 1000000000:
        print("HLO")
        i = 0
    i += 1"""
# var = c.get_node('ns=3;s="FB_OPC_UA_DB_1"."OPC data"."Data_Int"')
# print(var.get_value())
# print(c.get_namespace_array())
# print(var.get_data_value())
# var.set_value(4.2)
# print(var.get_value())

#query = """create table test (
#        id integer primary key,
#        num real not null);
#        """

#query = """
#        insert into test 
#        (num) values (?) -> ta ? pomeni, da boš to dal kot spremenljivko pol
#        """

# aa = var.get_value()

# cursor.execute(query, [aa]) # kadar insertaš lahko daš zravn še variable samo morejo bit kot array če ne ni nč

# vedno ko daš insert moreš dat še commit
# sql.commit() 
# record = cursor.fetchall()
# print(record)


# sql = sqlite3.connect("./mysite/db.sqlite3")
# cursor = sql.cursor()
# cursor.execute("select * from myapi_airflowdata")
# print(len(cursor.fetchall()))
# sql.close()
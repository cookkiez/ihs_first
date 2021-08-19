import requests
from random import randint
from datetime import datetime, timedelta
from pprint import pprint

def r():
    return randint(0, 500)

# curr_packs = 0
"""for i in range(100):
    response = requests.post("http://localhost:8000/electricMeter/", data={
        "kilo_watt_h": r(),
        "voltage_L1_N": r(),
        "voltage_L2_N": r(),
        "voltage_L3_N": r(),
        "voltage_L1_L2": r(),
        "voltage_L2_L3": r(),
        "voltage_L3_L1": r(),
        "current_L1": r(),
        "current_L2": r(),
        "current_L3": r(),
        "date_time": datetime.datetime.now()
    })
    print(response)

    response = requests.post("http://localhost:8000/airflow/", data= {
        "liter_per_second": r(),
        "liter_per_minute": r(),
        "liter_per_hour": r(),
        "air_volume": r(),
        "date_time": datetime.datetime.now()
    })
    print(response)

    response = requests.post("http://localhost:8000/alarm/", data={
        "alarm_type": "warning" if r() > 250 else "error",
        "start_time": datetime.datetime.now(),
        "end_time": datetime.datetime.now() + datetime.timedelta(hours=2),
        "alarm_text": "text",
        "alarm_name": "name"
    })
    print(response)
    curr_packs += r()
    response = requests.post("http://localhost:8000/state/", data={
        "current_state": "Running" if r() > 250 else "Stopped", 
        "current_counted_packages": curr_packs
    })

    print(i, response)
"""

api_endpoints = [
    "http://localhost:8000/electricMeter/",        
]
for endpoint in api_endpoints:
    response = requests.get(endpoint)
    all_states = response.json()
    all_states = all_states[-605:]
    state_prev = None
    to_add = 0
    for state in all_states:
        if endpoint == "http://localhost:8000/state/":
            curr_packs = state["current_counted_packages"]
            response = None
            if state_prev is not None:
                prev_packs = state_prev["current_counted_packages"]
                if curr_packs == prev_packs:
                    print(state, "Equal to previous", state_prev, to_add)#, response)
                elif curr_packs < prev_packs:
                    to_add += prev_packs
                    print(state, "Less than previous", state_prev, to_add)
                else:
                    print(state, "more than previous,", state_prev)
                new_state = state.copy()
                new_state["current_counted_packages"] += to_add
                response = requests.put(endpoint + str(new_state["id"]) + "/", data={
                    "current_state": new_state["current_state"], 
                    "current_counted_packages": new_state["current_counted_packages"],
                    "date_time": new_state["date_time"]
                })
            else:
                print(state, "None", state_prev)
                response = requests.put(endpoint + str(state["id"]) + "/", data=state)
        else:
            curr_kwh = state["kilo_watt_h"]
            if state_prev is not None:
                prev_kwh = state_prev["kilo_watt_h"]
                if curr_kwh < prev_kwh:
                    to_add += prev_kwh - curr_kwh
                new_state = state.copy()
                new_state["kilo_watt_h"] += to_add
                response = requests.put(
                    endpoint + str(new_state["id"]) + "/", data=new_state
                )
        print(response)
        state_prev = state
        #print(state)


"""

api_endpoints = [
    "http://localhost:8000/state/", "http://localhost:8000/electricMeter/", "http://localhost:8000/airflow/",
    "http://localhost:8000/alarm/", "http://localhost:8000/tags_data/",           
]
for endpoint in api_endpoints:
    print(endpoint)
    print()
    print()
    response = requests.get(endpoint)
    all_dats = response.json()
    if endpoint == "http://localhost:8000/alarm/":
        all_dats = all_dats[-68:]
    else:
        all_dats = all_dats[-190:]
    for days_to_add in range(1, 15):
        for dat in all_dats:
            print(dat)
            print("Last Dats", dat)
            new_data = None
            if endpoint == "http://localhost:8000/alarm/":
                start_date = datetime.strptime(dat["start_time"], "%Y-%m-%dT%H:%M:%S.%f%z")
                start_date += timedelta(days=days_to_add)
                end_date = datetime.strptime(dat["end_time"], "%Y-%m-%dT%H:%M:%S.%f%z")
                end_date += timedelta(days=days_to_add)
                new_data = dat.copy()
                new_data["start_time"] = start_date.strftime("%Y-%m-%dT%H:%M:%S.%f%z")
                new_data["end_time"] = end_date.strftime("%Y-%m-%dT%H:%M:%S.%f%z")
                print("New dats", new_data)

            else:
                date_var = datetime.strptime(dat["date_time"], "%Y-%m-%dT%H:%M:%S.%f%z")
                date_var += timedelta(days=days_to_add)
                    
                new_data = dat.copy()
                new_data["date_time"] = date_var.strftime("%Y-%m-%dT%H:%M:%S.%f%z")
                print("New dats", new_data)
        
            response = requests.post(endpoint, data=new_data)
            print(response)
"""

print("Finished")

import requests


url = 'http://192.168.75.12/StorageCardSD/Logs/Alarm_log0.csv'
r = requests.get(url, allow_redirects=True)
print(r.headers.get('content-type'))
open('test', 'wb').write(r.content)
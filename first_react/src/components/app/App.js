import React, { Component } from 'react';
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs"
import { Spinner } from 'react-bootstrap';
import './App.css';
import { Alarm } from '../alarm/alarm';
import { Comparison } from '../comparison/comparison';
import { AirElecData } from '../airElecData/airElecData';
//import { General } from '../general/general';
import { TagsToGet } from '../tagsToGet/tagsToGet';
import { Historic } from '../historic/historic';
import { Limits } from '../limits/limits';

export const LABEL_FONT_SIZE = 14

// Link to the api server, for data fetching reasons
export const api_link = "http://localhost:8000/"

// All keys for electric data. These are attributes of the objects
// the user can select which to display on the graphs
const electricKeys = [
  'voltage_L1_N', 'voltage_L2_N', 'voltage_L3_N',
  'voltage_L1_L2', 'voltage_L2_L3', 'voltage_L3_L1', 'current_L1',
  'current_L2', 'current_L3', 'liter_per_hour',
  'air_volume', "liter_per_second",
]

// All keys for airflow data. These are attributes of the objects
// the user can select which to display on the graphs
const airflowKeys = [
  "liter_per_minute", "kilo_watt_h"
]

export var indicator_map = {
  'voltage_L1_N': "Voltage on L1 (V)", 'voltage_L2_N': "Voltage on L2 (V)", 'voltage_L3_N': "Voltage on L3 (V)",
  'voltage_L1_L2': "Voltage between <br/>L1 and L2 (V)", 'voltage_L2_L3': "Voltage between <br/>L2 and L3 (V)",
  'voltage_L3_L1': "Voltage between <br/>L1 and L3 (V)", 'current_L1': "Current on L1 (A)",
  'current_L2': "Current on L2 (A)", 'current_L3': "Current on L3 (A)",
  'liter_per_hour': "Liters per hour <br/>(L/h)", 'air_volume': "Air volume (m³)",
  "liter_per_second": "Liters per <br/>second (L/s)", "liter_per_minute": "Liters per minute (L/m)",
  "kilo_watt_h": "Kilo watt hours (kWh)"
}

export var indicator_map_no_new_line = {
  'voltage_L1_N': "Voltage on L1 (V)", 'voltage_L2_N': "Voltage on L2 (V)", 'voltage_L3_N': "Voltage on L3 (V)",
  'voltage_L1_L2': "Voltage between L1 and L2 (V)", 'voltage_L2_L3': "Voltage between L2 and L3 (V)",
  'voltage_L3_L1': "Voltage between L1 and L3 (V)", 'current_L1': "Current on L1 (A)",
  'current_L2': "Current on L2 (A)", 'current_L3': "Current on L3 (A)",
  'liter_per_hour': "Liters per hour (L/h)", 'air_volume': "Air volume (m³)",
  "liter_per_second": "Liters per second (L/s)", "liter_per_minute": "Liters per minute (L/m)",
  "kilo_watt_h": "Kilo watt hours (kWh)"
}

export var units = {
  'voltage_L1_N': "V", 'voltage_L2_N': "V", 'voltage_L3_N': "V",
  'voltage_L1_L2': "V", 'voltage_L2_L3': "V",
  'voltage_L3_L1': "V", 'current_L1': "A",
  'current_L2': "A", 'current_L3': "A",
  'liter_per_hour': "L/h", 'air_volume': "m³",
  "liter_per_second": "L/s", "liter_per_minute": "L/m",
  "kilo_watt_h": "kWh"
}

export function checkIndicatorMap(key) {
  return (indicator_map[key] !== undefined) ? indicator_map[key] : key
}

export function checkIndicatorMapNoNewLine(key) {
  return (indicator_map_no_new_line[key] !== undefined) ? indicator_map_no_new_line[key] : key
}

export function checkUnits(key) {
  return (units[key] !== undefined) ? units[key] : ""
}

const tabsMap = {
  "Main EnPIs": true, "Secondary EnPIs": false, "Alarms": false,
  "Data comparison": false, "Tags": false, "Historic analysis": false
}


// Main component of the application
export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      electricMeterData: [],
      airflowData: [],
      alarmData: [],
      machineStateData: [],
      tagsData: [],
      tags: [],
      limits: [],
      limitsLoaded: false,
      tagsDataLoaded: false,
      tagsLoaded: false,
      machineLoaded: false,
      alarmLoaded: false,
      airLoaded: false,
      elLoaded: false,
      limitsSet: false,
      placeholder: "Loading",
      limsBackground: "",
      currentActiveTab: "Main EnPIs"
    };
    this.limitsRef = React.createRef()
    this.mainRef = React.createRef()
    this.secondaryRef = React.createRef()
    this.alarmRef = React.createRef()
    this.comparisonRef = React.createRef()
    this.tagsRef = React.createRef()
    this.historyRef = React.createRef()
  }

  // Function fetches data from api and saves it to the given 
  // attribute of the state
  fetchData(appendix, dataToSave, loaded) {
    fetch(api_link + appendix)
      .then(response => {
        if (response.status > 400) {
          return this.setState(() => {
            return { placeholder: "Something went wrong!" };
          });
        }
        return response.json();
      })
      .then(data => {
        if (loaded === "limitsLoaded") {
          if (!this.state.limitsSet) {
            this.setState({
              limitsSet: true
            })
          }
        }
        this.setState(() => {
          return {
            [dataToSave]: data,
            [loaded]: true
          };
        });
      });
  }

  callFetchData() {
    console.log("App is fetching data")
    this.fetchData("electricMeter/", "electricMeterData", "elLoaded")
    this.fetchData("airflow/", "airflowData", "airLoaded")
    this.fetchData("alarm/", "alarmData", "alarmLoaded")
    this.fetchData("state/", "machineStateData", "machineLoaded")
    this.fetchData("tags/", "tags", "tagsLoaded")
    this.fetchData("tags_data/", "tagsData", "tagsDataLoaded")
    this.fetchData("limits/", "limits", "limitsLoaded")
    //this.mainRef.current.setActive()
    //this.timeout = setTimeout(this.callFetchData.bind(this), 10000)
  }

  checkLimits() {
    if (this.state.limitsLoaded && this.state.limitsSet && this.limitsRef.current !== null) {
      var limsWarn = this.limitsRef.current.getWarning()
      var bg = ""
      if (this.state.limsBackground !== "#FF0000" && limsWarn) {
        bg = "#FF0000"
      }
      this.setState({
        limsBackground: bg
      }, () => {
        document.querySelector("#uncontrolled-tab-example-tab-Limits").style = { backgroundColor: bg }
        this.timeout = setTimeout(this.checkLimits.bind(this), 1000)
      })
    } else {
      this.timeout = setTimeout(this.checkLimits.bind(this), 1000)
    }
  }

  // When the component is loaded, fetch data from the server 
  // and store it in the component state
  componentDidMount() {
    this.callFetchData()
    this.checkLimits()
  }

  componentWillUnmount() {
    clearTimeout(this.timeout)
  }

  scrollToTop() {
    window.scrollTo(0, 0)
  }

  updateActive(newActive) {
    var oldActive = this.state.currentActiveTab
    this[tabsMap[oldActive]].current.setActive()
  }

  render() {
    var airflowData, electricData, alarm,
      compare, tags,
      historic, limits = <></>
    var map = {
      "Main EnPIs": airflowData, "Secondary EnPIs": electricData, "Alarms": alarm,
      "Data comparison": compare, "Tags": tags, "Historic analysis": historic
    }
    var spinner = <Spinner
      style={{
        position: "fixed",
        top: 50,
        right: 50,
        width: "50px",
        height: "50px",
        color: "#3a8ac0"
      }}
      animation="border"
      role="status"></Spinner>
    // Check if data has been loaded and if so, create the right element and 
    // store it in a variable, so it can later be displayed
    if (true || (this.state.tagsLoaded && this.state.tagsDataLoaded)) {
      tags = <TagsToGet ref={this.tagsRef} />
    }
    if (this.state.alarmLoaded) {
      if (this.state.airLoaded && this.state.elLoaded && this.state.currentActiveTab === "Main EnPIs") {
        airflowData = <AirElecData
          data={{ el: this.state.electricMeterData, air: this.state.airflowData, state: this.state.machineStateData }}
          alarmData={this.state.alarmData}
          appendix="airflow/"
          keys={airflowKeys}
          chartTitle="Main EnPIs"
          to_sum="liter_per_minute"
          to_compare="kilo_watt_h"
          ref={this.mainRef}
          activeTab={true}
        />
      }
      if (this.state.elLoaded && this.state.airLoaded && this.state.currentActiveTab === "Secondary EnPIs") {
        electricData = <AirElecData
          data={{ el: this.state.electricMeterData, air: this.state.airflowData, state: this.state.machineStateData }}
          appendix="electricMeter/"
          alarmData={this.state.alarmData}
          keys={electricKeys}
          to_sum="current_L2"
          chartTitle="Secondary EnPIs"
          to_compare="current_L1"
          ref={this.secondaryRef}
          activeTab={false}
        />
      }
      if (this.state.alarmLoaded && this.state.currentActiveTab === "Alarms") {
        alarm = <Alarm data={this.state.alarmData} ref={this.alarmRef} />
      }

      if (this.state.machineLoaded) {
        //general = <General data={this.state.machineStateData} />
      }

      if (this.state.airLoaded && this.state.elLoaded && this.state.tagsLoaded && this.state.tagsDataLoaded) {
        if (this.state.currentActiveTab === "Data comparison") {
          compare = <Comparison
            tags={this.state.tags}
            data={
              {
                electric: this.state.electricMeterData,
                air: this.state.airflowData,
                tags_data: this.state.tagsData
              }}
            ref={this.comparisonRef}
          />
        }
        if (this.state.currentActiveTab === "Historic analysis") {
          historic = <Historic
            tags={this.state.tags}
            data={{
              electric: this.state.electricMeterData,
              air: this.state.airflowData,
              tags_data: this.state.tagsData,
              state: this.state.machineStateData
            }}
            ref={this.historyRef}
          />
        }
        if (this.state.limitsLoaded) {
          limits = <Limits
            limits={this.state.limits}
            tags={this.state.tags}
            data={{
              electric: this.state.electricMeterData,
              air: this.state.airflowData,
              tags_data: this.state.tagsData
            }}
            ref={this.limitsRef}
          />
        }
      }
    }

    if (this.state.elLoaded &&
      this.state.airLoaded &&
      this.state.alarmLoaded) {
      spinner = <></>
    }

    console.log("Rendering app", this.state.currentActiveTab)

    return (
      <>
        <div>
          {
            // Create tabs for each element of the application - for electric data, airflow data and alarm data
          }
          <Tabs defaultActiveKey="airflowData" id="uncontrolled-tab-example" onClick={(event) => {
            this.scrollToTop()
            //this.updateActive(event.target.outerText)
            this.setState({
              currentActiveTab: event.target.outerText
            })
          }}
            style={{ backgroundColor: this.state.limsBackground }}
          >
            <Tab eventKey="airflowData" title="Main EnPIs">
              {
                // Display graph created by the displayGraph component
                airflowData
              }
            </Tab>
            <Tab eventKey="electricData" title="Secondary EnPIs">
              {
                // Display electric data component
                electricData
              }
            </Tab>
            <Tab eventKey="alarms" title="Alarms">
              {
                // Display created Alarm component
                alarm
              }
            </Tab>
            <Tab eventKey="comparison" title="Data comparison">
              {
                // Display comparison component
                compare
              }
            </Tab>
            <Tab eventKey="tags" title="Tags">
              {
                // Display tags component
                tags
              }
            </Tab>
            <Tab eventKey="Historic" title="Historic analysis">
              {
                historic
              }
            </Tab>
            <Tab eventKey="Limits" title="Indicator limits" >
              {
                limits
              }
            </Tab>
          </Tabs>
          {spinner}
        </div>
      </>
    )
  }
}

export default App;

/* */
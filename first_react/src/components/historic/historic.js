import React, { Component } from 'react';
import { DisplayGraph, getDataColumn } from '../graph/graph';
import Select from "react-select"
import Moment from 'moment';
import { Card } from 'react-bootstrap';
import { checkIndicatorMapNoNewLine, checkUnits, units } from '../app/App';
import { Heatmap } from '../graph/heatmap';
import { api_link } from '../app/App';


function hasOneDayPassed() {
    // get today's date. eg: "7/37/2007"
    var date = new Date().toLocaleDateString();

    // if there's a date in localstorage and it's equal to the above: 
    // inferring a day has yet to pass since both dates are equal.
    if (localStorage.yourapp_date === date)
        return false;

    // this portion of logic occurs when a day has passed
    localStorage.yourapp_date = date;
    return true;
}

export class Historic extends Component {
    constructor(props) {
        super(props)
        var temp_data = this.props.data
        temp_data = this.getTagsData(this.props.tags, temp_data.tags_data, temp_data)
        var flat = this.flattenData(temp_data)
        var all_keys = this.getKeysOfArrOfDicts(flat)
        this.state = {
            activeTab: false,
            data: flat,
            selectKeys: all_keys,
            currSelected: "liter_per_minute",
            periods: [
                { value: 7, label: "this week" },
                { value: 30, label: "this month" },
                { value: 6 * 30, label: "this 6 months" },
                { value: 365, label: "this year" },
                { value: 14, label: "last week" },
                { value: 60, label: "last month" },
                { value: 2 * 365, label: "last year" },
            ],
            intervals: [
                { value: 1, label: "daily" },
                { value: 7, label: "weekly" },
                { value: 30, label: "monthly" },
                { value: 365, label: "yearly" },
            ],
            interval: 7,
            intervalText: "weekly",
            intervalledData: {},
            currentPeriod: 7,
            currentPeriod_label: "this week",
            oldPeriod: 14,
            oldPeriod_label: "last week",
            currentData: [],
            oldData: [],
            split: false,
            currentRunning: [],
            oldRunning: []
        }

        this.currDataGraph = React.createRef()
        this.oldDataGraph = React.createRef()
        this.heatmapRef = React.createRef()
    }

    getI(len, smallest, i) {
        return len - smallest + i
    }



    getTagsData(tags, data, all_data) {
        var to_return = Object.assign({}, all_data)
        //to_return["electric"] = []
        var tags_data = {}

        tags.map(tag => {
            if (tag.active) {
                tags_data[tag.tag_name] = []
                data.map(el => {
                    if (tag.tag_name === el.tag_name) {
                        tags_data[tag.tag_name].push({
                            [tag.tag_name]: el.tag_data,
                            "date_time": el.date_time
                        })
                    }
                    return el
                })
            }
            return tag
        })
        to_return["tags_data"] = tags_data
        return to_return
    }


    getKeysOfArrOfDicts(dict) {
        if (dict.length < 1) { return [] }

        var first = dict
        var keys = []
        for (var key in first) {
            if (!(key.includes("id")) && !(key.includes("date_time"))) {
                keys.push({ label: checkIndicatorMapNoNewLine(key), value: key })
            }
        }
        return keys
    }

    add_to_to_push(to_push, to_add, type) {
        for (var i in to_add) { to_push[i] = to_add[i] }
        return to_push
    }

    goOverData(data, key, to_return) {
        data[key].map(el => {
            for (var key in el) {
                if (key !== "id" && key !== "date_time") {
                    if (to_return[key] === undefined) { to_return[key] = [] }
                    to_return[key].push({ [key]: el[key], "date_time": el["date_time"] })
                }
            }
            return el
        })
        return to_return
    }

    flattenData(data) {
        var to_return = {}

        to_return = this.goOverData(data, "electric", to_return)
        to_return = this.goOverData(data, "air", to_return)
        to_return = this.goOverData(data, "state", to_return)
        for (var tag in data["tags_data"]) { to_return[tag] = data["tags_data"][tag] }

        return to_return
    }

    checkAndPush(period, diff, period_label, data, el) {
        if (period_label.split(" ")[0] === "last") {
            if (period / 2 < diff && diff < period) { data.push(el) }
        } else {
            if (diff < period && diff >= 0) { data.push(el) }
        }
        return data
    }

    getRounded(num) {
        return Number((Math.round(num * 100) / 100).toFixed(2))
    }

    getVals(data, key, running_data) {
        var len = data.length
        if (len < 2) { return [-1, -1, -1, -1, -1, -1, -1, -1] }
        var oldVal = data[len - 2][key]
        var currVal = data[len - 1][key]
        var sum = 0
        var max = 0, min = 99999999
        data.reduce((a, v) => {
            sum += v[key]
            if (v[key] < min) { min = v[key] }
            if (v[key] > max) { max = v[key] }
            return sum
        })
        if (key === "kilo_watt_h") {
            sum = data[len - 1][key]
            sum = sum - data[0][key]
        }
        var avgVal = sum / len
        var percentage = ((currVal - oldVal) / oldVal) * 100
        var per_unit = -1
        if (running_data.length > 0) {
            var current_running = running_data[running_data.length - 1]["current_counted_packages"]
            var current_running_first = running_data[0]["current_counted_packages"]

            per_unit = sum / (current_running - current_running_first)
        }
        return [
            this.getRounded(oldVal), this.getRounded(avgVal),
            this.getRounded(percentage), this.getRounded(currVal),
            this.getRounded(max), this.getRounded(min),
            this.getRounded(per_unit)
        ]
    }

    getOneCard(vals, title, w, index) {
        return (
            <Card key={index + title} style={{ margin: 5, padding: 10, width: w }}>
                <h4 key={index + "2"}>{title}</h4>
                <div key={index + "3"} className="container-fluid row align-items-center">
                    <div key={index + "4"}>
                        <div key={index + "5"} style={{ fontSize: "20px" }}>
                            Average consumption: {vals[1]} {units[this.state.currSelected]}
                        </div>
                        <div key={index + "6"} style={{ fontSize: "20px" }}>
                            Max consumption: {vals[4]} {units[this.state.currSelected]}
                        </div>
                        <div key={index + "7"} style={{ fontSize: "20px" }}>
                            Min consumption: {vals[5]} {units[this.state.currSelected]}
                        </div>
                        <div key={index + "8"} style={{ fontSize: "20px" }}>
                            Per unit consumption: {vals[6]} ({units[this.state.currSelected]})/unit
                        </div>
                    </div>
                </div>
            </Card>
        )
    }

    getCards() {
        var valsCurr = this.getVals(this.state.currentData, this.state.currSelected, this.state.currentRunning)
        var valsOld = this.getVals(this.state.oldData, this.state.currSelected, this.state.oldRunning)
        return (
            <>
                {
                    this.getOneCard(valsCurr, "Summary of " + this.state.currentPeriod_label, "25rem", -1)
                }
                {
                    this.getOneCard(valsOld, "Summary of " + this.state.oldPeriod_label, "25rem", -23)
                }
            </>
        )
    }

    getIntervalCards() {
        var intervalledData = this.state.intervalledData
        var allVals = []
        for (var interval in intervalledData) {
            if (interval < 0) { continue }
            var data = intervalledData[interval]
            var vals = this.getVals(data, this.state.currSelected, this.state.currentRunning)
            allVals.push(vals)
        }
        var intervalText = this.state.intervalText.slice(0, -2)
        if (intervalText === "dai") { intervalText = "day" }
        return (
            <>
                <div className="container-fluid row align-items-center">
                    {
                        allVals.map((vals, index) => {
                            if (index === 0) { index = "0 (this " + intervalText + ")" }
                            if (index === 1) { index = "1 (last " + intervalText + ")" }
                            var title = intervalText + " " + index
                            return this.getOneCard(vals, title, "25rem", index)
                        })
                    }
                </div>
            </>
        )
    }

    splitData() {
        var curr_all_data = this.state.data[this.state.currSelected]
        var curr_all_running = this.state.data["current_counted_packages"]
        var curr_period = this.state.currentPeriod
        var old_period = this.state.oldPeriod
        var current_data = []
        var old_data = []
        var current_running = []
        var old_running = []
        var today = Moment(new Date())
        curr_all_data.map(el => {
            var el_date = Moment(new Date(el.date_time))
            var diff = today.diff(el_date, "days")
            current_data = this.checkAndPush(curr_period, diff, this.state.currentPeriod_label, current_data, el)
            old_data = this.checkAndPush(old_period, diff, this.state.oldPeriod_label, old_data, el)
            return el
        })

        curr_all_running.map(el => {
            var el_date = Moment(new Date(el.date_time))
            var diff = today.diff(el_date, "days")
            current_running = this.checkAndPush(curr_period, diff, this.state.currentPeriod_label, current_running, el)
            old_running = this.checkAndPush(old_period, diff, this.state.oldPeriod_label, old_running, el)
            return el
        })

        this.currDataGraph.current.changeData(getDataColumn(current_data, [this.state.currSelected]))
        this.oldDataGraph.current.changeData(getDataColumn(old_data, [this.state.currSelected]))
        this.currDataGraph.current.changeTitle(this.state.currentPeriod_label)
        this.oldDataGraph.current.changeTitle(this.state.oldPeriod_label)
        this.setState({
            currentData: current_data,
            oldData: old_data,
            currentRunning: current_running,
            oldRunning: old_running,
            split: true
        })
    }

    intervalData() {
        var curr_all_data = this.state.data[this.state.currSelected]
        var curr_interval = this.state.interval
        var today = Moment(new Date())

        var intervalledData = {}

        curr_all_data.map(el => {
            var el_date = Moment(new Date(el.date_time))
            var diff = today.diff(el_date, "days")
            var index = Math.floor(diff / curr_interval)
            if (intervalledData[index] === undefined) { intervalledData[index] = [] }
            intervalledData[index].push(el)
            return el
        })

        this.setState({
            intervalledData: intervalledData
        }, () => {
            this.getIntervalCards()
        })
    }

    sendReport() {
        var data = this.state.data
        var today = Moment(new Date())
        var to_return = {}
        var message = "Report of all indicators for last 24 hours at " + today.format("HH:mm:ss, DD.MM.yyyy") + "\n\n"
        var dict = {}
        for (var key in data) {
            if (key === "current_state" || key === "date_time" || key === "id") { continue }
            var curr_data = data[key]
            to_return[key] = []
            var el = undefined
            for (var i = 0; i < curr_data.length; i++) {
                el = curr_data[i]
                var el_date = Moment(new Date(el["date_time"]))
                var diff = today.diff(el_date, "days")
                if (diff === 3) {
                    to_return[key].push(el[key])
                }
            }

            var sum = 0, max = -1, min = 999999
            for (var j = 0; j < to_return[key].length; j++) {
                el = to_return[key][j]
                sum += el
                if (min > el) { min = el }
                if (max < el) { max = el }
            }

            var avg = sum / to_return[key].length
            var curr = to_return[key][to_return[key].length - 1]
            var unit = checkUnits(key)
            message += " - Indicator: " + checkIndicatorMapNoNewLine(key) + "\n" +
                "    Last read value: " + this.getRounded(curr) + unit + "\n" +
                "    Average of read value: " + this.getRounded(avg) + unit + "\n" +
                "    Maximum read value: " + this.getRounded(max) + unit + "\n" +
                "    Minimum read value: " + this.getRounded(min) + unit + "\n\n"
            dict[key] = {
                lastReadValue: this.getRounded(curr),
                averageValue: this.getRounded(avg),
                maxValue: this.getRounded(max),
                minValue: this.getRounded(min),
                unit: unit
            }
        }
        fetch(api_link + "sendEmail/", {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ "message": message, "dict": JSON.stringify(dict, null, 4) })
        })
    }

    setActive() {
        this.setState({
            activeTab: !this.state.activeTab
        }, () => {
            if (this.state.activeTab) {

            }
        })
    }

    componentDidMount() {
        this.splitData()
        this.intervalData()
        if (hasOneDayPassed()) {
            this.sendReport()
        }
    }

    updateHeatmap() {
        this.heatmapRef.current.updateAndDataKey(this.state.currSelected, this.state.data[this.state.currSelected])
    }

    render() {
        var cards = <></>
        if (this.state.split) {
            cards = this.getCards()
        }
        return (
            <>
                <div>
                    <div className="container-fluid row align-items-center">
                        <Card className="col-6" style={{ margin: 10, padding: 10 }}>
                            <div className="container-fluid row align-items-center">
                                <div className="col-6">
                                    <h5>Select indicator for comparison of historic data</h5>
                                    <Select menuPlacement="auto" options={this.state.selectKeys} onChange={(item) => {
                                        this.setState({
                                            currSelected: item.value
                                        }, () => { this.splitData(); this.intervalData(); this.updateHeatmap() })
                                    }} defaultValue={this.state.currSelected} placeholder={checkIndicatorMapNoNewLine(this.state.currSelected)} />
                                </div>
                                <div className="col-6">
                                    <h5>Select time period to compare</h5>
                                    First graph:
                                    <Select menuPlacement="auto" options={this.state.periods} onChange={(item) => {
                                        this.setState({
                                            currentPeriod: item.value,
                                            currentPeriod_label: item.label
                                        }, () => { this.splitData() })
                                    }} defaultValue="weekly" placeholder="this week" />
                                    Second graph:
                                    <Select menuPlacement="auto" options={this.state.periods} onChange={(item) => {
                                        this.setState({
                                            oldPeriod: item.value,
                                            oldPeriod_label: item.label
                                        }, () => { this.splitData() })
                                    }} defaultValue="weekly" placeholder="last week" />
                                </div>
                            </div>
                        </Card>
                        {
                            cards
                        }
                    </div>
                    <Card style={{ margin: 10, padding: 10 }}>
                        <div className="container-fluid row align-items-center">
                            <DisplayGraph
                                data={getDataColumn(this.state.data[this.state.currSelected], [this.state.currSelected])}
                                doubleAxis={false}
                                chartTitle={this.state.currentPeriod_label}
                                ml={0.07}
                                w={0.47}
                                ref={this.currDataGraph}
                            />

                            <DisplayGraph
                                data={getDataColumn(this.state.data[this.state.currSelected], [this.state.currSelected])}
                                doubleAxis={false}
                                chartTitle={this.state.oldPeriod_label}
                                ml={0.07}
                                w={0.47}
                                ref={this.oldDataGraph}
                            />
                        </div>
                    </Card>
                    <div className="container-fluid row align-items-center" style={{ height: 700 }}>
                        <Card className="col-5" style={{ margin: 10, padding: 10, height: 700, marginLeft: 75, }}>
                            <div className="container-fluid row align-items-center" tyle={{ height: 700 }}>
                                <Heatmap
                                    data={this.state.data[this.state.currSelected]}
                                    selKey={this.state.currSelected}
                                    ref={this.heatmapRef}
                                />
                            </div>
                        </Card>
                        <Card className="col-6" style={{ margin: 10, padding: 0, marginLeft: 50 }}>
                            <Card.Header className="text-center" style={{ margin: 0 }}>
                                Analyze all time data in chosen intervals for indicator {checkIndicatorMapNoNewLine(this.state.currSelected)}
                            </Card.Header>
                            <Card.Body>
                                <div>
                                    Choose interval
                                </div>
                                <Select className="col-6" menuPlacement="auto" options={this.state.intervals} onChange={(item) => {
                                    this.setState({
                                        interval: item.value,
                                        intervalText: item.label
                                    }, () => { this.intervalData() })
                                }} defaultValue="weekly" placeholder="weekly" />
                                {
                                    this.getIntervalCards()
                                }
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </>
        )
    }
}
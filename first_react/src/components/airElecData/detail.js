import { Component } from "react";
import { DisplayGraph, getDataColumn } from '../graph/graph.js';
import React from "react";
import Button from "react-bootstrap/Button"
import Moment from "moment";
import DatePicker from "react-date-picker"
import { Card } from "react-bootstrap";
import { Distribution } from "../graph/distribution.js";
import { Subplots } from "../graph/subplots.js";
import { checkIndicatorMapNoNewLine, units } from "../app/App.js";

export class Detail extends Component {

    constructor(props) {
        super(props)

        var temp = new Date()
        temp.setMonth(temp.getMonth() - 1)
        this.state = {
            data: this.props.graphData,
            graphData: this.props.graphData,
            chartTitle: this.props.chartTitle,
            keys: [],
            currDay: new Date(),
            prevMonth: temp,
            visibility: false,
            oldVal: 0,
            percentage: 0,
            currVal: 0,
            avgVal: 0,
            distributionData: [],
            lastWeekVals: { max: 0, min: 9999999, avg: 0, sum: 0, cnt: 0 },
            thisWeekVals: { max: 0, min: 9999999, avg: 0, sum: 0, cnt: 0 }
        }

        this.graphElement = React.createRef();
        this.distributionElement = React.createRef();
        this.subplotsElements = React.createRef();
    }

    getRounded(num) {
        return Number((Math.round(num * 100) / 100).toFixed(2))
    }

    checkMaxMin(max, min, val) {
        if (val < min) { min = val }
        if (val > max) { max = val }
        return [max, min]
    }

    getOldVal() {
        var sum = 0
        var maxVal = 0, minVal = 9999999
        var lastWeekVals = { max: 0, min: 9999999, avg: 0, sum: 0, cnt: 0 },
            today = Moment(new Date()),
            thisWeekVals = { max: 0, min: 9999999, avg: 0, sum: 0, cnt: 0 }
        this.state.data.reduce((a, v) => {
            var val = v[this.state.keys[0]]
            sum += val;
            [maxVal, minVal] = this.checkMaxMin(maxVal, minVal, val)
            var el_date = Moment(new Date(v["date_time"]))
            var diff = today.diff(el_date, "days")
            var temp_min = 0, temp_max = 0
            //console.log(diff, today.format("MMMM, DD"), el_date.format("MMMM, DD"), val)
            if (diff < 7) {
                [temp_max, temp_min] = this.checkMaxMin(thisWeekVals.max, thisWeekVals.min, val)
                thisWeekVals.max = this.getRounded(temp_max)
                thisWeekVals.min = this.getRounded(temp_min)
                thisWeekVals.sum += val
                thisWeekVals.cnt++
            } else if (diff < 14) {
                [temp_max, temp_min] = this.checkMaxMin(lastWeekVals.max, lastWeekVals.min, val)
                lastWeekVals.max = this.getRounded(temp_max)
                lastWeekVals.min = this.getRounded(temp_min)
                lastWeekVals.sum += val
                lastWeekVals.cnt++
            }
            lastWeekVals.avg = this.getRounded(lastWeekVals.sum / lastWeekVals.cnt)
            thisWeekVals.avg = this.getRounded(thisWeekVals.sum / thisWeekVals.cnt)
            return sum
        }, 0)
        var len = this.state.data.length - 1
        var currVal = this.state.data[len][this.state.keys[0]]
        var avgVal = (sum - currVal) / len
        var oldVal = this.state.data[len - 1][this.state.keys[0]]
        var percentage = currVal - oldVal
        percentage = (percentage / oldVal) * 100
        percentage = this.getRounded(percentage)
        currVal = this.getRounded(currVal)
        oldVal = this.getRounded(oldVal)
        avgVal = this.getRounded(avgVal)
        this.setState({
            oldVal: oldVal,
            currVal: currVal,
            percentage: percentage,
            avgVal: avgVal,
            maxVal: this.getRounded(maxVal),
            minVal: this.getRounded(minVal),
            thisWeekVals: thisWeekVals,
            lastWeekVals: lastWeekVals
        })
    }

    changeKey(key) {
        var visible = this.state.visibility
        //if (this.state.keys.length === 0) { visible = true }
        if (this.state.keys[0] === key[0]) { visible = !visible }
        else { visible = true }
        this.setState({
            keys: key,
            visibility: visible
        }, () => {
            this.setState({
                distributionData: this.state.data.map(el => {
                    return el[key[0]]
                }),
                chartTitle: "All time data for " + checkIndicatorMapNoNewLine(key[0])
            }, () => {
                this.distributionElement.current.changeData(this.state.distributionData)
                this.distributionElement.current.changeTitle(this.state.keys[0])
                this.subplotsElements.current.changeKey(this.state.keys[0])
                this.graphElement.current.changeData(getDataColumn(this.state.data, this.state.keys))
                this.graphElement.current.changeTitle(this.state.chartTitle)
                if (visible) { this.getOldVal() }
            })
        })
    }

    changeData(data) {
        var visible = this.state.visibility
        //console.log(this.state.currDay, this.state.prevMonth)
        this.setState({
            data: data
        }, () => {
            //console.log(this.state.currDay, this.state.prevMonth)
            this.subplotsElements.current.getData(this.state.data)
            this.dateFilter()
            //this.graphElement.current.changeData(getDataColumn(this.state.data, this.state.keys))
            if (visible) { this.getOldVal() }
        })

    }

    getNumber(date) {
        return Number(Moment(date).format("YYYYMDDHHmmss"))
    }

    dateFilter = () => {
        var dats = this.state.data
        var newData = dats.map(el => {
            if (this.getNumber(this.state.prevMonth) <= this.getNumber(new Date(el.date_time)) &&
                this.getNumber(new Date(el.date_time)) <= this.getNumber(this.state.currDay)) {
                return el
            } else { return null }
        })
        newData = newData.filter(el => { return el !== null })
        this.setState({
            graphData: newData,
            filtered: true,
            distributionData: newData.map(el => {
                return el[this.state.keys[0]]
            })
        }, () => {
            this.graphElement.current.changeData(getDataColumn(this.state.graphData, this.state.keys))
            this.distributionElement.current.changeData(this.state.distributionData)
            this.distributionElement.current.changeTitle(this.state.keys[0])
        })
    }

    render() {
        return (
            <Card style={{
                display: (this.state.visibility) ? "block" : "none",
                marginLeft: "50px",
                width: "95%"
            }}>
                <Card.Header>
                    <h2 style={{ textAlign: "center" }}><i>{checkIndicatorMapNoNewLine(this.state.keys[0])}</i></h2>
                </Card.Header>

                <Card.Body>
                    <div className="container-fluid row align-items-center">
                        <div className="col-2" id="date1">
                            <DatePicker
                                onChange={(event) => {
                                    this.setState({
                                        prevMonth: event
                                    })
                                }}
                                value={this.state.prevMonth}
                            />
                        </div>

                        <div className="col-2" id="date2">
                            <DatePicker
                                onChange={(event) => {
                                    this.setState({
                                        currDay: event
                                    })
                                }}
                                value={this.state.currDay}
                            />
                        </div>

                        <Button
                            onClick={this.dateFilter}
                            style={{ minHeight: "5px", height: "60px", width: "180px" }}
                        >
                            Filter graph by date
                        </Button>

                        <Card style={{ marginLeft: "50px", width: "25rem" }}>
                            <Card.Body>
                                <div>
                                    <div style={{ fontSize: "20px" }}>
                                        Average consumption: {this.state.avgVal} {units[this.state.keys[0]]}
                                    </div>
                                    <div style={{ fontSize: "20px" }}>
                                        Previous consumption: {this.state.oldVal} {units[this.state.keys[0]]}
                                    </div>
                                    <div style={{ fontSize: "20px" }}>
                                        Current consumption: {this.state.currVal} {units[this.state.keys[0]]}
                                    </div>
                                    <div style={{ fontSize: "20px" }}>
                                        Consumption increase: {this.state.percentage}%
                                    </div>
                                    <div style={{ fontSize: "20px" }}>
                                        Max consumption: {this.state.maxVal} {units[this.state.keys[0]]}
                                    </div>
                                    <div style={{ fontSize: "20px" }}>
                                        Min consumption: {this.state.minVal} {units[this.state.keys[0]]}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        <Card style={{ marginLeft: "20px", width: "30rem" }}>
                            <Card.Body>
                                <div>
                                    <div style={{ fontSize: "20px" }}>
                                        This week average consumption: {this.state.thisWeekVals.avg} {units[this.state.keys[0]]}
                                    </div>
                                    <div style={{ fontSize: "20px" }}>
                                        This week max consumption: {this.state.thisWeekVals.max} {units[this.state.keys[0]]}
                                    </div>
                                    <div style={{ fontSize: "20px" }}>
                                        This week min consumption: {this.state.thisWeekVals.min} {units[this.state.keys[0]]}
                                    </div>
                                    <div style={{ fontSize: "20px" }}>
                                        Previous week average consumption: {this.state.lastWeekVals.avg} {units[this.state.keys[0]]}
                                    </div>
                                    <div style={{ fontSize: "20px" }}>
                                        Previous week max consumption: {this.state.lastWeekVals.max} {units[this.state.keys[0]]}
                                    </div>
                                    <div style={{ fontSize: "20px" }}>
                                        Previous week min consumption: {this.state.lastWeekVals.min} {units[this.state.keys[0]]}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                    </div>

                    <div className="container-fluid row align-items-center">

                        <div className="col-6">
                            <DisplayGraph
                                ref={this.graphElement}
                                id="electricGraph" chartTitle={this.state.chartTitle}
                                data={getDataColumn(this.state.graphData, this.state.keys)}
                                w={0.4}
                                ml={0.05}
                            />
                        </div>

                        <Distribution
                            w={0.4}
                            ml={0.05}
                            chartTitle={this.state.keys[0]}
                            data={this.state.data.map(el => {
                                return el[this.state.keys[0]]
                            })}
                            ref={this.distributionElement}
                        />
                    </div>
                    <Card>
                        <Card.Header>
                            <h4 style={{ textAlign: "center" }}>
                                <i>7 day analysis for this indicator</i>
                            </h4>

                        </Card.Header>
                        <div className="container-fluid row align-items-center">
                            <Subplots
                                ref={this.subplotsElements}
                                data={this.state.graphData}
                                keySub={this.state.keys[0]}
                            />
                        </div>
                    </Card>
                </Card.Body>
            </Card>
        )
    }
}
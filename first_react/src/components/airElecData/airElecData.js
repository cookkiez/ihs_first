import { Component } from "react";
import { DisplayGraph, getDataColumn } from '../graph/graph.js';
import React from "react";
import Moment from "moment";
import { Gauge } from "../graph/gauge.js";
import { api_link, checkIndicatorMapNoNewLine } from "../app/App.js";
import { Detail } from "./detail.js";
import { Pie } from "../graph/pie.js";
import { Card } from "react-bootstrap";
import { units } from "../app/App.js";

// Function that removes an element from the given array
// eslint-disable-next-line
function removeEl(array, el) {
    const index = array.indexOf(el);
    if (index > -1) {
        array.splice(index, 1);
    }
}


export class AirElecData extends Component {

    constructor(props) {
        super(props)

        var flat = this.flattenData(this.props.data)

        var maxes = undefined
        if (this.props.chartTitle === "Main EnPIs") {
            maxes = [30, flat[flat.length - 2]["kilo_watt_h"] * 2]
        }
        else { maxes = [600, 600, 600, 800, 800, 800, 10, 10, 10, 10, 60, 60] }

        this.state = {
            activeTab: this.props.activeTab,
            keysToDisplay: [...this.props.keys],
            keys: this.props.keys,
            data: flat,
            graphData: [],
            to_sum: this.props.to_sum,
            to_compare: this.props.to_compare,
            select_keys: this.getSelectKeys(this.props.keys),
            cumLoaded: false,
            chartTitle: this.props.chartTitle,
            appendix: this.props.appendix,
            filtered: false,
            maxes: maxes,
            lastWeekVals: { max: 0, min: 9999999, avg: 0, sum: 0, cnt: 0 },
            thisWeekVals: { max: 0, min: 9999999, avg: 0, sum: 0, cnt: 0 }
        }
        // Create a reference, so that data of the graphs can be changed 
        // eg. hide data for an attribute
        this.detailElement = React.createRef();
        this.graphElementCum = React.createRef();
        this.gaugeReferences = this.props.keys.map(key => {
            return React.createRef()
        })
        this.graphElementLiter = React.createRef()
        this.graphElementWatt = React.createRef()
        this.pieRef1 = React.createRef()
        this.pieRef2 = React.createRef()
        this.pieRef3 = React.createRef()
    }

    add_to_to_push(to_push, to_add) {
        for (var i in to_add) { to_push[i] = to_add[i] }
        return to_push
    }

    flattenData(data) {
        var to_return = []
        var smallest = 1000000000
        for (var key in data) {
            //if (key === "state") {continue}
            if (smallest > data[key].length) { smallest = data[key].length }
        }
        for (var i = 0; i < smallest; i++) {
            var to_push = {}
            to_push = this.add_to_to_push(to_push, data["air"][data["air"].length - 1 - i])
            to_push = this.add_to_to_push(to_push, data["el"][data["el"].length - 1 - i])
            to_push = this.add_to_to_push(to_push, data["state"][data["state"].length - 1 - i])
            to_return.push(to_push)
        }
        return to_return.reverse()
    }


    getSelectKeys(keys) {
        return keys.map(key => {
            return {
                label: key, value: key
            }
        })
    }

    componentDidMount() {
        this.dateFilter()
        this.getSumOfElement(this.state.to_sum)
        this.setState({ cumLoaded: true })
        this.fetchData()
    }

    componentWillUnmount() {
        clearTimeout(this.timeout)
    }

    getSumOfElement(element) {
        var sum = 0
        var temp_data = [...this.state.data]
        var sumArray = this.state.data.map((el, index) => {
            sum += el[element]
            temp_data[index]["sum_" + element] = sum
            return sum
        })
        this.setState({ data: temp_data })
        return sumArray
    }

    download(event) {
        event.preventDefault()

        var output = JSON.stringify(getDataColumn(this.state.data, this.state.keysToDisplay).data, null, 4)

        const blob = new Blob([output]);
        const fileDownloadUrl = URL.createObjectURL(blob);
        this.setState({ fileDownloadUrl: fileDownloadUrl },
            () => {
                this.dofileDownload.click();
                URL.revokeObjectURL(fileDownloadUrl);
                this.setState({ fileDownloadUrl: "" })
            })
    }

    fetchData() {
        console.log("AirElec is fetching data")
        fetch(api_link + "airflow/")
            .then(response => {
                if (response.status > 400) {
                    return this.setState(() => {
                        return { placeholder: "Something went wrong!" };
                    });
                }
                return response.json();
            })
            .then(dataAir => {
                fetch(api_link + "state/")
                    .then(response => {
                        if (response.status > 400) {
                            return this.setState(() => {
                                return { placeholder: "Something went wrong!" };
                            });
                        }
                        return response.json();
                    }).then(dataState => {
                        fetch(api_link + "electricMeter/")
                            .then(response => {
                                if (response.status > 400) {
                                    return this.setState(() => {
                                        return { placeholder: "Something went wrong!" };
                                    });
                                }
                                return response.json();
                            })
                            .then(dataEl => {
                                var flat = this.flattenData({ air: dataAir, el: dataEl, state: dataState })
                                this.setState(() => {
                                    return {
                                        data: flat,
                                    };
                                }, () => {
                                    this.getSumOfElement(this.state.to_sum)
                                    this.gaugeReferences.map((ref, i) => {
                                        ref.current.changeValue(
                                            [Number((Math.round(this.state.data[this.state.data.length - 1][this.state.keys[i]] * 100) / 100).toFixed(2))]
                                        )
                                        return 0
                                    })
                                    //this.dateFilter()
                                    if (this.state.chartTitle === "Main EnPIs") {
                                        var temp = [...this.state.data]
                                        //temp = temp.slice(Math.max(temp.length - 150, 0))
                                        var today = Moment(new Date())
                                        var newTemp = []
                                        temp.map(el => {
                                            var el_date = Moment(new Date(el.date_time))
                                            var diff = today.diff(el_date, "days")
                                            if (diff < 7) {
                                                newTemp.push(el)
                                            }
                                            return el
                                        })
                                        this.getOldVal("liter_per_minute", newTemp)
                                        this.getOldVal("kilo_watt_h", newTemp)
                                        var m = this.state.maxes
                                        if (this.state["kilo_watt_h_oldVal"] !== undefined) { m[1] = this.state["kilo_watt_h_oldVal"] }
                                        else { m[1] = flat[flat.length - 2]["kilo_watt_h"] }
                                        this.setState({
                                            maxes: m
                                        }, () => {
                                            this.gaugeReferences[1].current.changeMax(this.state.maxes[1] * 2)
                                        })
                                        this.graphElementLiter.current.changeData(getDataColumn(newTemp, ["liter_per_minute"]))
                                        this.graphElementWatt.current.changeData(getDataColumn(newTemp, ["kilo_watt_h"]))
                                    }
                                    this.detailElement.current.changeData(this.state.data)
                                    if (this.state.appendix !== "airflow/") { this.updatePies() }
                                    this.timeout = setTimeout(this.fetchData.bind(this), 30000)
                                });
                            });
                    })
            });
    }

    switchCum = (event) => {
        var temp = this.state.to_sum
        var new_sum = this.state.to_compare
        var new_cmp = temp
        this.setState({
            to_compare: new_cmp,
            to_sum: new_sum
        }, () => {
            if (this.state.to_sum === "kilo_watt_h") {
                this.graphElementCum.current.changeData(getDataColumn(this.state.data,
                    [this.state.to_sum, this.state.to_compare]))
            } else {
                this.graphElementCum.current.changeData(getDataColumn(this.state.data,
                    ["sum_" + this.state.to_sum, this.state.to_compare]))
            }
        })
    }

    dropdownSelected = (selectedItem) => {
        if (selectedItem) {
            var key = selectedItem.label
            if (this.state.to_compare === key) { return 0 }
            else {
                this.setState({
                    to_compare: key
                }, () => {
                    if (this.state.to_sum === "kilo_watt_h") {
                        this.graphElementCum.current.changeData(getDataColumn(this.state.data,
                            [this.state.to_sum, this.state.to_compare]))
                    } else {
                        this.graphElementCum.current.changeData(getDataColumn(this.state.data,
                            ["sum_" + this.state.to_sum, this.state.to_compare]))
                    }
                })
            }
        }
    }

    getNumber(date) {
        return Number(Moment(date).format("YYYYMDDHHmmss"))
    }

    dateFilter = () => {
        var dats = this.state.data
        /*var newData = dats.map(el => {
            if (this.getNumber(this.state.prevMonth) <= this.getNumber(new Date(el.date_time)) &&
                                        this.getNumber(new Date(el.date_time)) <= this.getNumber(this.state.currDay)) {
                return el
            } else {
                return null
            }
        })
        newData = newData.filter(el => {
            return el !== null
        })*/
        this.setState({
            graphData: dats,
            filtered: true
        }, () => {
            //this.detailElement.current.changeData(getDataColumn(this.state.graphData, this.state.keysToDisplay))
        })
    }

    updatePies() {
        this.pieRef1.current.updateData(this.getTempDataPies(["current_L1", "current_L2", "current_L3"]))
        this.pieRef2.current.updateData(this.getTempDataPies(["voltage_L2_L3", "voltage_L1_L2", "voltage_L3_L1"]))
        this.pieRef3.current.updateData(this.getTempDataPies(["voltage_L2_N", "voltage_L1_N", "voltage_L3_N"]))
    }

    getTempDataPies(keys) {
        var temp = {}
        Object.keys(this.state.data[this.state.data.length - 1]).map(key => {
            if (keys.indexOf(key) !== -1) {
                temp[key] = 0
            }
            return key
        })
        this.state.data.map(el => {
            Object.keys(el).map(key => {
                if (keys.indexOf(key) !== -1) {
                    temp[key] = el[key]
                }
                return key
            })
            return el
        })
        return temp
    }

    getPies() {
        if (this.state.chartTitle === "Main EnPIs") {
            var temp = [...this.state.data]
            //temp = temp.slice(Math.max(temp.length - 100, 0))
            var today = Moment(new Date())
            var newTemp = []
            temp.map(el => {
                var el_date = Moment(new Date(el.date_time))
                var diff = today.diff(el_date, "days")
                if (diff < 7) { newTemp.push(el) }
                return el
            })
            return (
                <>
                    <div className="container-fluid row">
                        <DisplayGraph
                            ref={this.graphElementLiter}
                            id={"graph_liter_per_minute"}
                            data={getDataColumn(newTemp, ["liter_per_minute"])}
                            w={0.47}
                            h={550}
                            chartTitle="Data of liters per minute for this week"
                        />

                        <DisplayGraph
                            ref={this.graphElementWatt}
                            id={"graph_kilo_watt_h"}
                            data={getDataColumn(newTemp, ["kilo_watt_h"])}
                            w={0.47}
                            h={550}
                            chartTitle="Data of kWh for this week"
                        />
                    </div>
                </>
            )
        }
        else {
            return (
                <div className="container-fluid row ">
                    <Card style={{ margin: "10px", marginLeft: "100px", marginTop: "5px" }}>
                        <Card.Header className="text-center">
                            Comparison of current consumption on electric phases
                        </Card.Header>
                        <Pie
                            ref={this.pieRef1}
                            data={this.getTempDataPies(["current_L1", "current_L2", "current_L3"])}
                        />
                    </Card>
                    <Card style={{ margin: "10px", marginTop: "5px" }}>
                        <Card.Header className="text-center">
                            Comparison of voltage consumption between electric phases
                        </Card.Header>
                        <Pie
                            ref={this.pieRef2}
                            data={this.getTempDataPies(["voltage_L2_L3", "voltage_L1_L2", "voltage_L3_L1"])}
                        />
                    </Card>
                    <Card style={{ margin: "10px", marginRight: "5px", marginTop: "5px" }}>
                        <Card.Header className="text-center">
                            Comparison of voltage consumption on electric phases
                        </Card.Header>
                        <Pie
                            ref={this.pieRef3}
                            data={this.getTempDataPies(["voltage_L2_N", "voltage_L1_N", "voltage_L3_N"])}
                        />
                    </Card>
                </div>
            )
        }
    }

    getSelect() {

        if (this.state.chartTitle === "Secondary EnPIs") {
            /*
                                        <div className="col-sm-3 col-md-3 col-lg-3">
                                            <h5>Select data to see correlation with {this.state.to_sum} </h5>
                                            <Select menuPlacement="auto" options={this.state.select_keys} onChange={this.dropdownSelected} />
                                        </div>
                                        */
            return (
                <>
                </>
            )
        } else {
            /* return (
                 <div className="col-sm-3 col-md-3 col-lg-3">
                     <Button onClick={this.switchCum}>
                         Switch indicator and indicator to sum
                     </Button>
                 </div>
             )*/
        }
    }

    setActive() {
        this.setState({
            activeTab: !this.state.activeTab
        }, () => {
            if (this.state.activeTab) {
                
            } else {
                clearTimeout(this.timeout)
            }
        })
    }

    getGauges() {
        var w = "95%"
        var h = undefined
        if (this.state.chartTitle === "Main EnPIs") {
            w = "50%"
            h = "360px"
        }

        return (
            <Card className="mx-auto" style={{ margin: "20px", marginLeft: "40px", width: w, height: h }}>
                <div className="container-fluid row align-items-center">
                    {
                        this.state.keys.map((key, i) => {
                            var w = 250
                            var h = 240
                            if (this.state.chartTitle === "Main EnPIs") { w = 400; h = 350 }
                            var roundedNum = 0
                            roundedNum = Number((Math.round(this.state.data[this.state.data.length - 1][key] * 100) / 100).toFixed(2))
                            return (
                                <div
                                    className="col"
                                    onMouseEnter={e => {
                                        const container = e.target
                                        container.style.cursor = "pointer";
                                    }}
                                    onClick={() => {
                                        var curr_el = key
                                        this.detailElement.current.changeKey([curr_el])
                                    }}
                                    key={key}
                                    id={key}>

                                    <Gauge
                                        value={[roundedNum]}
                                        valueName={key}
                                        max={this.state.maxes[i]}
                                        ref={this.gaugeReferences[this.state.keys.indexOf(key)]}
                                        width={w}
                                        height={h}
                                    />
                                </div>
                            )
                        })
                    }
                </div>
            </Card>
        )
    }

    getRounded(num) {
        return Number((Math.round(num * 100) / 100).toFixed(2))
    }

    checkMaxMin(max, min, val) {
        if (val < min) { min = val }
        if (val > max) { max = val }
        return [max, min]
    }

    getOldVal(key, data) {
        var sum = 0
        var max = 0, min = 999999, avgVal = 0
        data.reduce((a, v) => {
            sum += v[key]
            if (v[key] > max) { max = v[key] }
            if (v[key] < min) { min = v[key] }
            [max, min] = this.checkMaxMin(max, min, v[key])
            return sum
        }, 0)
        var len = data.length - 1
        var currVal = data[len][key]
        avgVal = (sum - currVal) / len
        var oldVal = data[len - 1][key]
        var percentage = currVal - oldVal
        percentage = (percentage / oldVal) * 100
        if (key === "kilo_watt_h") {
            sum = data[len][key]
            sum = sum - this.state.data[this.state.data.length - len][key]
        }
        var per_unit = sum / (data[len]["current_counted_packages"] - this.state.data[this.state.data.length - len]["current_counted_packages"])
        this.setState({
            [key + "_oldVal"]: this.getRounded(oldVal),
            [key + "_currVal"]: this.getRounded(currVal),
            [key + "_percentage"]: this.getRounded(percentage),
            [key + "_avgVal"]: this.getRounded(avgVal),
            [key + "_max"]: this.getRounded(max),
            [key + "_min"]: this.getRounded(min),
            [key + "_per_unit"]: this.getRounded(per_unit)
        })
    }


    render() {
        var cum = <></>,
            g1 = <></>,
            cc = <></>
        if (this.state.cumLoaded) {
            /* if (this.state.to_sum === "liter_per_minute") {
                 cum = <DisplayGraph ref={this.graphElementCum} id={"sum_" + this.state.to_sum}
                     data={getDataColumn(this.state.data, ["sum_" + this.state.to_sum, this.state.to_compare])}
                     doubleAxis={true} secondAxisKey={this.state.to_compare} />
 
             } else if (this.state.to_sum === "kilo_watt_h") {
                 cum = <DisplayGraph ref={this.graphElementCum} id={"sum_" + this.state.to_sum}
                     data={getDataColumn(this.state.data, [this.state.to_sum, this.state.to_compare])}
                     doubleAxis={true} secondAxisKey={this.state.to_compare} />
             }*/

            g1 = <Detail
                ref={this.detailElement}
                graphData={this.state.data}
                keysToDisplay={[this.state.keys[0]]}
                chartTitle={"Overtime data for " + this.state.keys[0]}
            />
        }

        if (this.state.chartTitle === "Main EnPIs") {
            var text = ["Summary of " + checkIndicatorMapNoNewLine("liter_per_minute") + " for this week",
            "Summary of " + checkIndicatorMapNoNewLine("kilo_watt_h") + " for this week"]
            cc = this.state.keys.map((key, index) => {
                return (
                    <Card style={{ margin: "10px", width: "25rem", marginLeft: "25px" }}>
                        <Card.Body>
                            <div>
                                <h4>
                                    {text[index]}
                                </h4>
                                <div style={{ fontSize: "20px" }}>
                                    Average consumption: {this.state[key + "_avgVal"]} {units[key]}
                                </div>
                                <div style={{ fontSize: "20px" }}>
                                    Previous consumption: {this.state[key + "_oldVal"]} {units[key]}
                                </div>
                                <div style={{ fontSize: "20px" }}>
                                    Current consumption: {this.state[key + "_currVal"]} {units[key]}
                                </div>
                                <div style={{ fontSize: "20px" }}>
                                    Consumption increase: {this.state[key + "_percentage"]}%
                                </div>
                                <div style={{ fontSize: "20px" }}>
                                    Max consumption: {this.state[key + "_max"]} {units[key]}
                                </div>
                                <div style={{ fontSize: "20px" }}>
                                    Min consumption: {this.state[key + "_min"]} {units[key]}
                                </div>
                                <div style={{ fontSize: "20px" }}>
                                    Per unit consumption: {this.state[key + "_per_unit"]} ({units[key]})/unit
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                )
            })
        }

        return (
            <>
                <div className="container-fluid row align-items-center">
                    {
                        cc[0]
                    }
                    {
                        this.getGauges()
                    }
                    {
                        cc[1]
                    }
                </div>

                {
                    g1
                }

                {
                    this.getPies()
                }

                {
                    this.getSelect()
                }

                {
                    cum
                }

            </>
        )
    }
}

/* */
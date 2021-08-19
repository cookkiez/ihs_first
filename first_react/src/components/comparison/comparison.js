import { Component } from "react";
import React from "react";
import Select from "react-select"
import { LABEL_FONT_SIZE } from "../app/App";
import { DisplayGraph, getDataColumn } from "../graph/graph";
import { Card, Button } from "react-bootstrap";
import { Scatter } from "../graph/scatter";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import Moment from "moment";
import { Tooltip } from "react-bootstrap";
import { OverlayTrigger } from "react-bootstrap";
import { checkIndicatorMapNoNewLine } from "../app/App";
import { MultipleGraphs } from "../graph/multipleGraphs";
// eslint-disable-next-line
import Worker from "worker-loader!./distCorr"


// Function that removes an element from the given array
function removeEl(array, el) {
    const index = array.indexOf(el);
    if (index > -1) {
        array.splice(index, 1);
    }
}

export class Comparison extends Component {

    constructor(props) {
        super(props)
        var temp_data = this.props.data
        temp_data = this.getTagsData(this.props.tags, temp_data.tags_data, temp_data)
        temp_data = this.flattenData(temp_data)
        var temp = this.getKeysOfArrOfDicts(temp_data)

        this.state = {
            activeTab: false,
            data: temp_data,
            keys: temp[0],
            selectKeys: [temp[0][1].value, temp[0][5].value],
            keysToDraw: ["kilo_watt_h", "liter_per_second"],
            key: "liter_per_second",
            keys_for_graph: temp[1],
            keys_for_graph_2: [...temp[1]],
            r_coff: 0,
            distCorr: 0,
            options: {
                chart: {
                    zoomType: 'xy',
                    panKey: "ctrl",
                    panning: true,
                    height: 550,
                    width: window.innerWidth * 0.43,
                    //marginLeft: window.innerWidth * 0.05,
                    type: "scatter"
                },
                title: {
                    text: 'Comparison of chosen attribute to kilo watt hours',
                    align: 'left'
                },
                legend: {
                    enabled: true,
                    itemStyle: {
                        fontSize: LABEL_FONT_SIZE
                    }
                },
                xAxis: {
                    labels: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        }
                    },
                    title: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        },
                        text: "kilo watt_h"
                    }
                },
                yAxis: {
                    labels: {
                        format: '{value:10f}',
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        }
                    }
                },
                tooltip: {
                    shared: true,
                    formatter: function () {
                        return "kilo watt hours: " + this.x + " <br> " +
                            this.series.name.split(" ")[0] + ": " + this.y
                    }
                },
                plotOptions: {
                    series: {
                        turboThreshold: 0
                    }
                },
                series: []
            },
            optionsSum: {
                chart: {
                    zoomType: 'xy',
                    panKey: "ctrl",
                    panning: true,
                    height: 600,
                    width: window.innerWidth * 0.45,
                    //marginLeft: window.innerWidth * 0.075,
                    type: "scatter"
                },
                title: {
                    text: 'Comparison of sum of kilo watt hours and sum of liters per minute',
                    align: 'left'
                },
                legend: {
                    enabled: true,
                    itemStyle: {
                        fontSize: LABEL_FONT_SIZE
                    }
                },
                xAxis: {
                    labels: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        }
                    },
                },
                yAxis: [{
                    labels: {
                        format: '{value:10f}',
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        }
                    },
                    title: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        },
                        text: "Cumulative data liters per minute"
                    }
                }, {
                    labels: {
                        format: '{value:10f}',
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        }
                    },
                    title: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        },
                        text: "Cumulative data kilo watt hours"
                    },
                    opposite: true
                }],
                tooltip: {
                    shared: true,
                    style: {
                        fontSize: LABEL_FONT_SIZE
                    }
                },
                plotOptions: {
                    series: {
                        turboThreshold: 0
                    }
                },
                series: []
            }
        }
        // Create a reference, so that data of the graphs can be changed 
        // eg. hide data for an attribute
        this.graphElement = React.createRef();
        this.allIndicators = React.createRef()
        this.download = this.download.bind(this);
        this.multipleRef = React.createRef()
    }

    setActive() {
        this.setState({
            activeTab: !this.state.activeTab
        }, () => {
            if (this.state.activeTab) {
               
            }
        })
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
                        tags_data[tag.tag_name].push(el.tag_data)
                    }
                    return el
                })
            }
            return tag
        })
        to_return["tags_data"] = tags_data
        return to_return
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

    changeGraphData() {
        this.graphElement.current.changeData(this.state.data, this.state.keysToDraw)
        this.multipleRef.current.changeData(this.state.data)
    }

    componentDidMount() {
        this.changeGraphData()
        this.getSumOfElement("kilo_watt_h")
        this.getSumOfElement("liter_per_minute")
        var temp_data = this.state.data,
            sum_watt = [],
            sum_liter = [],
            dates = []
        temp_data = getDataColumn(temp_data, ["kilo_watt_h", "sum_liter_per_minute"])
        temp_data.data.map(element => {
            sum_watt.push(element["kilo_watt_h"])
            sum_liter.push(element["sum_liter_per_minute"])
            dates.push(element["date_time"])
            return 0
        })
        this.getR()
        this.doWorkerStuff()
        this.setState({
            optionsSum: {
                xAxis: {
                    categories: dates
                },
                series: [
                    {
                        data: sum_watt,
                        type: "area",
                        name: "Cumulative data of kilo watt hours",
                        yAxis: 1
                    },
                    {
                        data: sum_liter,
                        type: "area",
                        name: "Cumulative data of liters per minute",
                        yAxis: 0
                    }
                ]
            }
        })
    }

    add_to_to_push(to_push, to_add, type) {
        for (var i in to_add) { to_push[i] = to_add[i] }
        return to_push
    }

    getKeysOfArrOfDicts(dict) {
        if (dict.length < 1) { return [] }

        var first = dict[0]
        var keys = [],
            keys_graph = []
        for (var key in first) {
            if (!(key.includes("id")) && !(key.includes("date_time"))) {
                keys.push({ label: checkIndicatorMapNoNewLine(key), value: key })
                if (!(key.includes("sum"))) { keys_graph.push(key) }
            }
        }
        return [keys, keys_graph]
    }

    getI(len, smallest, i) {
        return len - smallest + i
    }

    flattenData(data) {
        var to_return = []
        var smallest = 1000000000
        for (var key in data) {
            if (key !== "tags_data") {
                if (smallest > data[key].length) { smallest = data[key].length }
            } else {
                for (var tagsKey in data[key]) {
                    if (smallest > data[key][tagsKey].length && data[key][tagsKey].length > 200) { smallest = data[key][tagsKey].length }
                }
            }
        }
        for (var i = 0; i < smallest; i++) {
            var to_push = {}
            to_push = this.add_to_to_push(to_push, data["air"][this.getI(data["air"].length, smallest, i)], "air")
            to_push = this.add_to_to_push(to_push, data["electric"][this.getI(data["electric"].length, smallest, i)], "electric")
            for (var key_data in data["tags_data"]) {
                if (data["tags_data"][key_data].length >= smallest) {
                    to_push[key_data] = data["tags_data"][key_data][this.getI(data["tags_data"][key_data].length, smallest, i)]
                }
            }
            to_return.push(to_push)
        }
        return to_return
    }

    getMean(data, key) {
        var sum = 0
        data.map(el => {
            return sum += el[key]
        })
        return sum / data.length
    }

    getSD(data, key, mean) {
        var sum = 0
        data.map(el => {
            return sum += Math.pow((el[key] - mean), 2)
        })
        return Math.sqrt((sum / data.length))
    }

    getSum(data, keys) {
        var sum = 0
        data.map(el => {
            return sum += el[keys[0]] * el[keys[1]]
        })
        return sum
    }

    getR() {
        var meanFirst = this.getMean(this.state.data, this.state.selectKeys[0])
        var meanSecond = this.getMean(this.state.data, this.state.selectKeys[1])
        var sdFirst = this.getSD(this.state.data, this.state.selectKeys[0], meanFirst)
        var sdSecond = this.getSD(this.state.data, this.state.selectKeys[1], meanSecond)

        var coff_r = 0

        var divisor = (this.state.data.length - 1) * sdFirst * sdSecond
        var to_divide = this.getSum(this.state.data, this.state.selectKeys) - this.state.data.length * meanFirst * meanSecond

        coff_r = to_divide / divisor
        this.setState({
            r_coff: this.getRounded(coff_r)
        })
    }

    dropdownSelected = (selectedItem) => {
        if (selectedItem) {
            var key = this.state.key
            var newKey = selectedItem.value
            var newKeys = this.state.keysToDraw
            newKeys.splice(newKeys.indexOf(key))
            this.setState({
                keysToDraw: newKeys,
                key: newKey
            }, () => {
                var newArr = this.state.keysToDraw
                newArr.push(newKey)
                this.setState({
                    keysToDraw: newArr
                }, () => {
                    this.changeGraphData()
                })
            })
        }
    }

    buttonClicked = (event) => {
        if (event.target.attributes[0].nodeName === "id") {
            var curr_el = event.target.attributes[0].nodeValue
            var temp = this.state.keys_for_graph_2
            if (temp.indexOf(curr_el) !== -1) { removeEl(temp, curr_el); }
            else { temp.push(curr_el) }
            this.allIndicators.current.changeData(getDataColumn(this.state.data, temp))
        }
    }

    buttonClickedMultiple = (event) => {
        if (event.target.attributes[0].nodeName === "id") {
            var curr_el = event.target.attributes[0].nodeValue
            this.multipleRef.current.changeKey(curr_el)
        }
    }

    download = (event) => {
        event.preventDefault()

        var output = JSON.stringify(getDataColumn(this.state.data, this.state.keys_for_graph_2).data, null, 4)

        const blob = new Blob([output]);
        const fileDownloadUrl = URL.createObjectURL(blob);
        this.setState({ fileDownloadUrl: fileDownloadUrl },
            () => {
                this.dofileDownload.click();
                URL.revokeObjectURL(fileDownloadUrl);
                this.setState({ fileDownloadUrl: "" })
            })
    }

    getRounded(num) {
        return Number((Math.round(num * 1000000) / 1000000).toFixed(6))
    }

    doWorkerStuff() {
        this.setState({
            distCorr: "Calculating distance correlation..."
        })
        const worker = new Worker()
        const data = this.state.data
        const keys = this.state.selectKeys
        worker.postMessage({
            data, keys
        })
        const compEl = this
        worker.onerror = (err) => {
            compEl.setState({
                distCorr: err.message
            })
        }
        worker.onmessage = (e) => {
            var { distCorr } = e.data
            compEl.setState({
                distCorr: this.getRounded(distCorr)
            })
        }
    }

    render() {
        return (
            <>
                <div className="container-fluid row align-items-center" style={{ marginLeft: "5px" }}>
                    <Card style={{ margin: "10px", padding: window.innerWidth * 0.015 + "px", }}>
                        <div className="container-fluid row align-items-center">
                            <div className="col-6">
                                <h5>Select indicator for x axis</h5>
                                <Select menuPlacement="auto" options={this.state.keys} onChange={(item) => {
                                    this.graphElement.current.changeXKey(item.value, this.state.data)
                                    var t = [...this.state.selectKeys]
                                    t[1] = item.value
                                    this.setState({
                                        selectKeys: t
                                    }, () => {
                                        this.getR()
                                        this.doWorkerStuff()
                                    })

                                }} defaultValue={this.state.keys[5]} />
                            </div>

                            <div className="col-6">
                                <h5>Select indicator for y axis</h5>
                                <Select menuPlacement="auto" options={this.state.keys} onChange={(item) => {
                                    this.graphElement.current.changeYKey(item.value, this.state.data)
                                    var t = [...this.state.selectKeys]
                                    t[0] = item.value
                                    this.setState({
                                        selectKeys: t
                                    }, () => {
                                        this.getR()
                                        this.doWorkerStuff()
                                    })
                                }} defaultValue={this.state.keys[1]} />
                            </div>
                            <OverlayTrigger placement="right" overlay={(props) => {
                                return (
                                    <Tooltip {...props}> R coefficient measures the linear correlation of two variables
                                        (-1 = negative correlation, 0 = no correlation (independent variables), 1 = positive correlation)</Tooltip>
                                )
                            }}>
                                <div style={{ marginTop: "10px" }} className="col-12">
                                    R coefficient for selected indicators: {this.state.r_coff}
                                </div>
                            </OverlayTrigger>

                            <OverlayTrigger placement="right" overlay={(props) => {
                                return (
                                    <Tooltip {...props}> Distance correlation measures the correlation of two variables
                                        (0 = no correlation (independent variables), 1 = both have same values),
                                        more accurate than R coefficient</Tooltip>
                                )
                            }}>
                                <div style={{ marginTop: "10px" }} className="col-12">
                                    Distance correlation coefficient for selected indicators: {this.state.distCorr}
                                </div>
                            </OverlayTrigger>
                        </div>
                        <Scatter
                            x={this.state.keys[5].value}
                            y={this.state.keys[1].value}
                            ref={this.graphElement}
                        />
                    </Card>


                    <Card style={{ margin: "10px", padding: window.innerWidth * 0.015 + "px" }}>
                        <div className="container-fluid row align-items-center">
                            <div className="col-9">
                                <DisplayGraph
                                    data={getDataColumn(this.state.data, this.state.keys_for_graph)}
                                    doubleAxis={false}
                                    chartTitle="Comparison of all indicators"
                                    ml={0.04}
                                    w={0.67}
                                    ref={this.allIndicators}
                                />
                            </div>
                            <div className="col-3">
                                <ToggleButtonGroup className="row mb-2" type="checkbox"
                                    style={{ marginRight: "0px", paddingRight: "0px" }}
                                    defaultValue={this.state.keys_for_graph.map(key => { return this.state.keys_for_graph.indexOf(key); })} >
                                    {
                                        // Buttons for toggling display of data in graph
                                        this.state.keys_for_graph.map(key => {
                                            return (
                                                <ToggleButton id={key} key={key} value={this.state.keys_for_graph.indexOf(key)}
                                                    variant="outline-success"
                                                    onClick={this.buttonClicked}
                                                    style={{
                                                        padding: 15 + "px",
                                                        margin: 10 + "px",
                                                    }}
                                                    className="rounded col-5">
                                                    {checkIndicatorMapNoNewLine(key)}
                                                </ToggleButton>
                                            )
                                        })
                                    }
                                </ToggleButtonGroup>
                            </div>
                        </div>
                        <div className="container-fluid row align-items-center">
                            <div className="col-5"></div>
                            <div className="row mb-2 ">
                                <OverlayTrigger placement="top" overlay={(props) => {
                                    return (
                                        <Tooltip {...props}>Generated report will contain all chosen variables</Tooltip>
                                    )
                                }}>
                                    <Button variant="info" onClick={this.download}>
                                        Generate report
                                    </Button>
                                </OverlayTrigger>

                            </div>
                        </div>
                    </Card>

                    <Card style={{ margin: "10px" }}>
                        <Card.Header className="text-center">
                            <h4>
                                <i>
                                    Click on a tag to display its graph, maximum 6 graphs at a time
                                </i>
                            </h4>
                        </Card.Header>
                        <div className="container-fluid row align-items-center">
                            <div className="">
                                <ToggleButtonGroup className="row mb-2" type="checkbox"
                                    style={{ marginRight: "0px", paddingRight: "0px", marginLeft: 10 }}
                                    defaultValue={this.state.keys_for_graph.map(key => { return this.state.keys_for_graph.indexOf(key); })} >
                                    {
                                        // Buttons for toggling display of data in graph
                                        this.state.keys_for_graph.map((key, i) => {
                                            return (
                                                <ToggleButton id={key} key={key} value={this.state.keys_for_graph.indexOf(key)}
                                                    variant="outline-secondary"
                                                    onClick={this.buttonClickedMultiple}
                                                    style={{
                                                        padding: 15 + "px",
                                                        margin: 10 + "px",
                                                    }}
                                                    className="rounded col-2">
                                                    {checkIndicatorMapNoNewLine(key)}
                                                </ToggleButton>
                                            )
                                        })
                                    }
                                </ToggleButtonGroup>
                            </div>
                            <div className="col-12">
                                <MultipleGraphs
                                    data={this.state.data}
                                    keys={[]}
                                    ref={this.multipleRef}
                                />
                            </div>

                        </div>
                    </Card>
                </div>
                <a href={this.state.fileDownloadUrl} hidden download={Moment(Date.now()).format('DD MMMM, HH;mm;ss') + ".json"} ref={e => this.dofileDownload = e}>download</a>
            </>
        )
    }
}
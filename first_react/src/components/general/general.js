import { Component } from "react";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { LABEL_FONT_SIZE } from "../app/App"
import { getDataColumn } from "../graph/graph";
import { api_link } from "../app/App";
import layout from "./layout.png"

export class General extends Component {
    constructor(props) {
        super(props)
        this.state = {
            machine_states_nums: [],
            counted_packages: [],
            data: this.props.data,
            current_state: "Loading state, please wait...",
            optionsBar: {
                chart: {
                    type: "bar",
                    inverted: false,
                    zoomType: 'xy',
                    panKey: "ctrl",
                    panning: true,
                    height: 550,
                    width: window.innerWidth * 0.95,
                    marginLeft: window.innerWidth * 0.075,
                },
                legend: {
                    enabled: true,
                    itemStyle: {
                        fontSize: LABEL_FONT_SIZE
                    }
                },
                xAxis: {
                    labels: {
                        style: { fontSize: LABEL_FONT_SIZE }
                    },
                    title: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        },
                    }
                },
                yAxis: {
                    labels: {
                        style: { fontSize: LABEL_FONT_SIZE }
                    }
                },
                tooltip: {
                    shared: true
                },
                series: []
            },
            optionsCounting: {
                chart: {
                    zoomType: 'xy',
                    panKey: "ctrl",
                    panning: true,
                    height: 550,
                    width: window.innerWidth * 0.95,
                    marginLeft: window.innerWidth * 0.075,
                },
                title: {
                    text: 'Number of overall counted packages over time',
                    align: 'left'
                },
                legend: {
                    enabled: true,
                    itemStyle: {
                        fontSize: LABEL_FONT_SIZE
                    }
                },
                xAxis: {
                    type: "datetime",
                    labels: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        }
                    },
                    title: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        },
                        text: ""
                    }
                },
                yAxis: {
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
                        text: ""
                    }
                },
                tooltip: {
                    shared: true,
                },
                series: []
            }
        }
    }

    linearizeData() {
        let data = this.state.data
        let temp_nums = {}
        let temp_packages = []
        let states = []
        let current_state = "Loading state, please wait..."
        data.map(el => {
            let el_state = el["current_state"]
            if (temp_nums[el_state] === undefined) { temp_nums[el_state] = 1; states.push(el_state) }
            temp_nums[el_state]++

            current_state = el["current_state"]
            return el_state
        })
        temp_packages = getDataColumn(data, ["current_counted_packages"])
        //console.log(temp_packages)
        let dates = [],
            series = []
        temp_packages.data.map(element => {
            dates.push(element.date_time)
            series.push(element.current_counted_packages)
            return 0
        })
        this.setState({
            machine_states_nums: temp_nums,
            counted_packages: temp_packages,
            current_state: current_state,
            optionsBar: {
                xAxis: {
                    categories: states,
                    title: {
                        text: null
                    }
                },
                yAxis: {
                    title: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        },
                        text: "In what state was the machine when data was read"
                    }
                },
                series: [
                    {
                        data: Object.keys(temp_nums).map(key => {
                            return temp_nums[key]
                        }),
                        name: "number"
                    }
                ]
            },
            optionsCounting: {
                xAxis: {
                    categories: dates
                },
                series: {
                    data: series,
                    type: "area",
                    name: "Number of packages"
                }
            }
        }, () => { })
    }

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
                this.setState(() => {
                    return {
                        data: data,
                    };
                }, () => {
                    this.linearizeData()
                });
            });
    }

    callFetchData() {
        console.log("General data is fetching data")
        this.fetchData("state/", "machineStateData", "machineLoaded")
        this.timeout = setTimeout(this.callFetchData.bind(this), 30000)
    }

    componentDidMount() {
        this.linearizeData()
        this.timeout = setTimeout(this.callFetchData.bind(this), 30000)
    }

    componentWillUnmount() {
        clearTimeout(this.timeout)
    }

    render() {
        return (
            <div>
                <h1>TODO General data</h1>
                <h1>TODO add machine state</h1>
                <h1>Current machine state is: <i>{this.state.current_state}</i></h1>

                <img src={layout} alt=""/>

                <HighchartsReact
                    highcharts={Highcharts}
                    options={this.state.optionsBar}
                    allowChartUpdate={true}
                />

                <HighchartsReact 
                    highcharts={Highcharts}
                    options={this.state.optionsCounting}
                    allowChartUpdate={true}
                />
            </div>
        )
    }
}
import { Component } from "react";
import React from "react";
import { checkIndicatorMapNoNewLine, LABEL_FONT_SIZE } from "../app/App";
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';


export class Scatter extends Component {
    constructor(props) {
        super(props)


        var width = (this.props.w !== undefined) ? this.props.w : 0.9
        this.state = {
            xKey: this.props.x,
            yKey: this.props.y,
            options: {
                chart: {
                    zoomType: 'xy',
                    panKey: "ctrl",
                    panning: true,
                    height: 550,
                    width: window.innerWidth * width,
                    //marginLeft: window.innerWidth * 0.05,
                    type: "scatter"
                },
                title: {
                    text: 'Comparison of ' + checkIndicatorMapNoNewLine(this.props.y) + " to " + checkIndicatorMapNoNewLine(this.props.x),
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
                        text: checkIndicatorMapNoNewLine(this.props.x)
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
                        text: checkIndicatorMapNoNewLine(this.props.y)
                    }
                },
                plotOptions: {
                    series: {
                        turboThreshold: 0
                    }
                },
                tooltip: {
                    shared: true,
                    /*formatter: function () {
                        return "kilo watt hours: " + this.x + " <br> " +
                            this.series.name.split(" ")[0] + ": " + this.y
                    }*/
                },
                series: []

            }
        }
    }

    componentDidMount() {

    }

    changeXKey(newKey, data) {
        this.setState({
            xKey: newKey
        }, () => {
            this.changeData(data)
        })
    }

    changeYKey(newKey, data) {
        this.setState({
            yKey: newKey
        }, () => {
            this.changeData(data)
        })
    }

    changeData(data) {
        var builtSeries = data.map(element => {
            return [
                element[this.state.xKey], element[this.state.yKey]
            ]
        })
        this.setState({
            options: {
                yAxis: {
                    title: {
                        text: checkIndicatorMapNoNewLine(this.state.yKey),
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        }
                    }
                },
                xAxis: {
                    title: {
                        text: checkIndicatorMapNoNewLine(this.state.xKey),
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        }
                    }
                },
                series: {
                    data: builtSeries,
                    name: checkIndicatorMapNoNewLine(this.state.xKey) + " vs " + checkIndicatorMapNoNewLine(this.state.yKey)
                },
                title: {
                    text: 'Comparison of ' + checkIndicatorMapNoNewLine(this.state.yKey) + " to " + checkIndicatorMapNoNewLine(this.state.xKey),
                    align: 'left'
                },
            }
        })
    }

    render() {
        return (
            <HighchartsReact highcharts={Highcharts}
                options={this.state.options}
                allowChartUpdate={true}
            />
        )
    }
}
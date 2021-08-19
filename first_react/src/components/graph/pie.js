import { Component } from "react";
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { LABEL_FONT_SIZE } from "../app/App";


export class Pie extends Component {
    constructor(props) {
        super(props)
        var temp = this.convertData(this.props.data)

        this.state = {
            data: temp,
            options: {
                chart: {
                    zoomType: 'xy',
                    panKey: "ctrl",
                    panning: true,
                    height: 550,
                    width: 600,
                    //marginLeft: window.innerWidth * marginLeft,
                    type: "pie",
                },
                title: {
                    style: {
                        fontSize: LABEL_FONT_SIZE
                    },
                    text: this.props.chartTitle,

                },
                legend: {
                    enabled: true,
                    itemStyle: {
                        fontSize: LABEL_FONT_SIZE
                    }
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                        }
                    },
                    series: {
                        turboThreshold: 0
                    }

                },
                tooltip: {
                    shared: true,
                    pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
                },
                series: [{
                    name: 'Indicators',
                    colorByPoint: true,
                    data: temp
                }]
            }
        }
    }

    convertData(data) {
        var to_return = []
        Object.keys(data).map(el => {
            if (el !== "date_time" && el !== "id") {
                to_return.push({
                    y: data[el],
                    name: el
                })
            }
            return el
        })
        return to_return
    }

    updateData(data) {
        this.setState({
            options: {
                series: [{
                    name: 'Indicators',
                    colorByPoint: true,
                    data: this.convertData(data)
                }]
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
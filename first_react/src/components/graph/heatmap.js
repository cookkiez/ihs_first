import React, { Component } from "react";
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import HC_more from "highcharts/highcharts-more";
import highchartsHeatmap from "highcharts/modules/heatmap";
import Moment from "moment";
import { checkIndicatorMapNoNewLine, LABEL_FONT_SIZE } from "../app/App";

HC_more(Highcharts);
highchartsHeatmap(Highcharts);


export class Heatmap extends Component {

    constructor(props) {
        super(props)
        this.state = {
            data: this.props.data,
            key: this.props.selKey,
            options: {
                chart: {
                    type: 'heatmap',
                    height: 680,
                    marginTop: 60,
                    marginLeft: 125,
                    marginBottom: 60,
                    plotBorderWidth: 1,
                    width: 800
                },
                title: {
                    text: "Average consumption of: " + checkIndicatorMapNoNewLine(this.props.selKey) + " in hourly intervals"
                },
                plotOptions: {
                    series: {
                        turboThreshold: 0
                    }
                },

                xAxis: {
                    categories: this.getDays(this.props.data),
                    title: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        },
                        text: "Last 7 days",
                    },
                    labels: {
                        rotation: 0
                    }
                },

                yAxis: {
                    categories: this.getHours(),
                    title: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        },
                        text: "Hours of the day",
                    },
                    reversed: true
                },
                colorAxis: {
                    min: 0,
                    minColor: '#FFFFFF',
                    maxColor: "#800000"
                },

                legend: {
                    align: 'right',
                    layout: 'vertical',
                    margin: 0,
                    verticalAlign: 'top',
                    y: 45,
                    symbolHeight: 530
                },

                tooltip: {
                    formatter: function () {
                        return "Day: " + this.series.chart.axes[0].categories[this.point.x] + "<br/>" +
                            "Hour interval: " + this.point.y + "-" + (this.point.y + 1) + "<br/>" +
                            "Average value: " + this.point.value
                    },
                    style: {
                        fontSize: 14,
                    }
                },

                series: [{
                    name: '',
                    borderWidth: 1,
                    data: [],
                    dataLabels: {
                        enabled: true,
                        color: '#000000'
                    }
                }],
            }
        }
    }

    updateAndDataKey(newKey, data) {
        var datas = this.getSeriesData(data, newKey)
        this.setState({
            key: newKey,
            data: data,
            options: {
                title: {
                    text: "Average consumption of: " + checkIndicatorMapNoNewLine(newKey) + " in hourly intervals"
                },
                xAxis: {
                    categories: this.getDays(data),
                    labels: {
                        rotation: 0
                    }
                },
                yAxis: {
                    categories: this.getHours(),
                },
                colorAxis: {
                    min: datas[1],
                    max: datas[2],
                    minColor: '#FFFFFF',
                    maxColor: "#800000"
                },
                series: [{
                    name: '',
                    borderWidth: 1,
                    data: datas[0],
                    dataLabels: {
                        enabled: true,
                        color: '#000000'
                    }
                }],
            }
        }, () => {
        })
    }


    getHours() {
        var hours = []
        for (var i = 0; i < 24; i++) { hours.push(i) }
        return hours
    }

    getSeriesData(data, key) {
        var today = Moment(new Date())
        var seriesData = []
        var counts = {}
        for (var i = 0; i < 24; i++) {
            counts[i] = {}
            for (var j = 0; j < 7; j++) {
                counts[i][j] = {
                    active: false,
                    els: [0]
                }
            }
        }
        data.map(el => {
            var el_date = Moment(new Date(el["date_time"]))
            var temp_el_date = Moment(Object.assign({}, el_date))
            var diff = today.endOf("day").diff(temp_el_date.endOf("day"), "days")
            if (diff < 7 && diff >= 0) {
                var h = Number(el_date.format("k"))
                counts[h][diff].els.push(el[key])
                counts[h][diff]["active"] = true
            }
            return el
        })
        var min = 9999999
        var max = -1
        for (var count_key in counts) {
            for (var index in counts[count_key]) {
                var els = [...counts[count_key][index]["els"]]
                var sum = 0
                for (var ii = 0; ii < els.length; ii++) {
                    var el = els[ii]
                    sum += el
                }
                var avg = sum / els.length
                if (counts[count_key][index]["active"]) {
                    if (avg < min) { min = avg }
                    if (avg > max) { max = avg }
                }
                seriesData.push([Number(index), Number(count_key), this.getRounded(avg)])
            }
        }
        return [seriesData, min, max]
    }

    getRounded(num) {
        return Number((Math.round(num * 100) / 100).toFixed(2))
    }

    getDays(data) {
        var today = Moment(new Date())
        var today2 = new Date()
        var days = []
        for (var i = 0; i < 7; i++) {
            var diff = today.diff(Moment(today2), "days")
            var day = Moment(today2).format("dddd")
            if (diff === 0) {
                day += " <br/>(Today)"
            } else if (diff === 1) {
                day += " <br/>(Yesterday)"
            }
            days.push(day)
            today2.setDate(today2.getDate() - 1)
        }
        /*var diffs = []
        data.map(el => {
            var el_date = Moment(new Date(el["date_time"]))
            var diff = today.diff(el_date, "days")
            if (diff < 7) {
                var day = el_date.format("dddd")
                if (days.indexOf(day) !== -1) {
                    diffs.push(diff)
                }
            }
            return el
        })*/
        return days
    }

    componentDidMount() {
        this.updateAndDataKey(this.state.key, this.state.data)
    }

    render() {
        return (
            <>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={this.state.options}
                    allowChartUpdate={true}
                />
            </>
        )
    }
}

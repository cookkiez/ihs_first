import { Component } from "react";
import { LABEL_FONT_SIZE } from "../app/App";
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import Moment from "moment";
import { Card } from "react-bootstrap";

export class Subplots extends Component {
    constructor(props) {
        super(props)

        var width = (this.props.w !== undefined) ? this.props.w : 0.42

        this.state = {
            optionsAll: [],
            data: this.props.data,
            key: this.props.keySub,
            options: {
                chart: {
                    zoomType: 'xy',
                    panKey: "ctrl",
                    panning: true,
                    height: 300,
                    width: window.innerWidth * width,
                    marginLeft: window.innerWidth * 0.04
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
                yAxis: {
                    labels: {
                        format: '{value:10f}',
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        }
                    },
                    title: {
                        text: this.props.keySub,
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        }
                    },
                },
                plotOptions: {
                    series: {
                        turboThreshold: 0
                    }
                },
                tooltip: {
                    shared: true,
                },
                series: []
            }
        }
    }

    componentDidMount() { this.getData(this.state.data) }

    changeKey(key) {
        this.setState({
            key: key
        }, () => {
            this.getData(this.state.data)
        })
    }

    updateData(data) {
        var opts = this.state.optionsAll
        opts[0].series.data.push(data[data.length - 1][this.state.key])
        opts[0].xAxis.categories.push(data[data.length - 1].date_time)
        this.setState({
            optionsAll: opts
        })
    }

    getData(data) {
        var today = new Date()
        var todayMoment = Moment(today)
        var optionsAll = []
        var dats = []
        var dates = []
        var days = []
        for (var i = 0; i < 7; i++) {
            optionsAll.push(Object.assign({}, this.state.options))
            dats.push([])
            dates.push([])
            days.push(Moment(today).format("dddd"))
            today.setDate(today.getDate() - 1)
        }
        data.map(el => {
            var el_date = Moment(new Date(el["date_time"]))
            var temp_el_date = Moment(new Date(el["date_time"]))
            var duration = todayMoment.endOf("day").diff(temp_el_date.endOf("day"), "days")
            if (duration >= 0 && duration < 7) {
                dats[duration].push(el[this.state.key])
                dates[duration].push(el_date.format("HH:mm:ss"))
            }
            return el
        })
        optionsAll = optionsAll.map((opts, i) => {
            var title = days[i]
            if (i === 0) { title = title + " (Today)"}
            else if (i === 1) { title = title + " (Yesterday)"}
            opts.series = [{
                name: title,
                data: dats[i],
                type: "spline"
            }]
            opts.xAxis = {
                labels: {
                    style: {
                        fontSize: LABEL_FONT_SIZE
                    }
                },
                categories: dates[i]
            }
            opts.title = {
                text: title
            }
            return opts
        })
        this.setState({
            optionsAll: optionsAll,
        })
    }

    getGraphs() {
        return this.state.optionsAll.map((options, i) => {
            return (
                <div className="col-6" key={"div" + i}>
                    <Card style={{ margin: "10px" }}>
                        <HighchartsReact
                            key={i}
                            highcharts={Highcharts}
                            options={options}
                            allowChartUpdate={true}
                        />
                    </Card>
                </div>
            )
        })


    }

    render() {
        return (
            <>
                {
                    this.getGraphs()
                }
            </>
        )
    }
}
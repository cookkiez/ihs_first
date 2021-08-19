import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import HC_more from "highcharts/highcharts-more";
import highchartsGauge from "highcharts/modules/solid-gauge";
import React, { Component } from 'react';
import { checkIndicatorMap, checkIndicatorMapNoNewLine } from "../app/App"
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

HC_more(Highcharts)
highchartsGauge(Highcharts)

export class Gauge extends Component {

    constructor(props) {
        super(props)
        this.chart = null
        let valueName = (this.props.valueName === undefined) ? "Value" : checkIndicatorMap(this.props.valueName)
        this.state = {
            valueName: valueName,
            key: this.props.valueName,
            originalOptions: {},
            gaugeOptions: {
                chart: {
                    type: 'solidgauge',
                    height: (this.props.height === undefined) ? 250 : this.props.height,
                    width: (this.props.width === undefined) ? 250 : this.props.width,
                    spacingTop: 0,
                    spacingRight: 0,
                    spacingBottom: 0,
                    spacingLeft: 0,
                    margin: [-10, -10, -10, -10],
                    events: {
                        click: this.props.click,
                        load: function () {
                            this.redraw()
                        }
                    },
                },

                title: "Test",

                pane: {
                    //center: ['50%', '50%'],
                    startAngle: -150,
                    endAngle: 150,
                    background: {
                        backgroundColor:
                            Highcharts.defaultOptions.legend.backgroundColor || '#EEE',
                        innerRadius: '60%',
                        outerRadius: '100%',
                        shape: 'arc'
                    }
                },

                exporting: {
                    enabled: false
                },

                tooltip: {
                    enabled: false
                },
                xAxis: {
                    tickmarkPlacement: 'on',
                    minPadding: 0,
                    maxPadding: 0
                },
                // the value axis
                yAxis: {
                    min: (this.props.min === undefined) ? 0 : this.props.min,
                    max: (this.props.max === undefined) ? 1000 : this.props.max,
                    stops: [
                        [0.1, '#DDDF0D'], // green
                        [0.5, '#55BF3B'], // yellow
                        [0.9, '#DF5353'] // red
                    ],
                    lineWidth: 0,
                    tickWidth: 0,
                    minorTickInterval: null,
                    tickAmount: 2,
                    gridLineWidth: 0,
                    minorGridLineWidth: 0,
                    minPadding: 0,
                    maxPadding: 0,
                    minRange: 0.001,
                    title: {
                        y: -50
                    },
                    labels: {
                        y: 30
                    }
                },

                series: [{
                    name: "Ime",
                    data: this.props.value,
                    dataLabels: {
                        format:
                            '<div style="text-align:center">' +
                            '<span style="font-size:25px">{y}</span><br/>' +
                            '<span style="font-size:12px;opacity:0.4">' +
                            valueName
                            + '</span>' +
                            '</div>'
                    },
                }],

                plotOptions: {
                    solidgauge: {
                        dataLabels: {
                            y: -25,
                            borderWidth: 0,
                            useHTML: true
                        }
                    },
                    series: {
                        turboThreshold: 0
                    }

                }
            }
        }
    }

    componentDidMount() {
        this.setState({
            originalOptions: this.state.gaugeOptions
        })
    }

    changeValue(val) {
        var opts = this.state.gaugeOptions
        //console.log(opts)
        opts.series = {
            name: "Ime",
            data: val,
            dataLabels: {
                format:
                    '<div style="text-align:center">' +
                    '<span style="font-size:25px">{y}</span><br/>' +
                    '<span style="font-size:12px;opacity:0.4">' +
                    this.state.valueName
                    + '</span>' +
                    '</div>'
            },
        }
        this.setState({
            gaugeOptions: opts
        })
    }

    changeMax(max) {
        var opts = this.state.gaugeOptions
        opts.yAxis.max = max
        this.setState({
            gaugeOptions: opts
        }, () => {
            //console.log(this.chart)
            //this.chart.redraw()
        })
    }

    changeColors(colors) {
        var opts = this.state.originalOptions
        opts.yAxis.stops = colors
        this.setState({
            gaugeOptions: opts
        }, () => {
            //console.log(this.chart)
            //this.chart.redraw()
        })
    }

    render() {
        this.chart = <HighchartsReact
            highcharts={Highcharts}
            options={this.state.gaugeOptions}
            allowChartUpdate={true}
            updateArgs={[true]}
        />
        return (
            <OverlayTrigger placement="bottom" overlay={(props) => {
                return (
                    <Tooltip {...props}>Click the gauge to display details for {checkIndicatorMapNoNewLine(this.state.key)}</Tooltip>
                )
            }}>
                <div>
                    {this.chart}
                </div>
            </OverlayTrigger>
        )
    }
}
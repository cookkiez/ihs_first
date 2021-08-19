import { Component } from "react";
import { Table } from "react-bootstrap";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highchartsGantt from "highcharts/modules/gantt";
import HC_more from "highcharts/highcharts-more";
import Moment from 'moment';
import { LABEL_FONT_SIZE, api_link } from "../app/App"


HC_more(Highcharts);
highchartsGantt(Highcharts);



// Component for displaying data about alarms

export class Alarm extends Component {

    // Function takes the data given as a parameter (prop) to the component and transforms it 
    // so it is suitable for the graph 
    getData(data) {
        var names = []
        //data = data.slice(-100)
        var two_weeks = new Date()
        two_weeks.setDate(two_weeks.getDate() - 7)
        var to_graph = []
        data.map((element, index) => {
            var curr_date = new Date(element.start_time)
            var end_date = new Date(element.end_time)
            if (Date.parse(curr_date) > Date.parse(two_weeks) && Date.parse(end_date) < Date.parse(new Date())) {

                // Have to make UTC timestamps for highcharts
                if (names.indexOf(element.alarm_name) === - 1) {
                    names.push(element.alarm_name)
                }

                to_graph.push({
                    start: Date.parse(element.start_time),
                    end: Date.parse(element.end_time),
                    y: names.indexOf(element.alarm_name)
                })
            }
            return element
        })
        return to_graph
    }

    getCategories(data) {
        var cats = []
        data.map((element, index) => {
            if (cats.indexOf(element.alarm_name) === -1) { cats.push(element.alarm_name) }
            return element.alarm_name
        })
        return cats
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

    getBarData(data) {
        var numWarnings = 0,
            numErrors = 0
        data.map(element => {
            if (element.alarm_type === "warning") { numWarnings++ }
            else if (element.alarm_type === "error") { numErrors++ }
            return 0
        })
        this.setState({
            optionsBar: {
                xAxis: {
                    categories: ["Warnings", "Errors"],
                    title: {
                        text: null
                    }
                },
                yAxis: {
                    title: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        },
                        text: "Number of errors versus number of warnings"
                    }
                },
                series: [
                    {
                        data: [numWarnings, numErrors],
                        name: "sum"
                    }
                ]
            }
        })
    }

    componentDidMount() {
        this.getBarData(this.props.data)
        var dats = this.getData(this.state.data)
        var cats = this.getCategories(this.state.data)
        this.updateGant(dats, cats)
        this.timeout = setTimeout(this.fetchData.bind(this), 30000)
    }

    componentWillUnmount() {
        clearTimeout(this.timeout)
    }

    updateGant(dats, cats) {
        this.setState({
            optionsGantt: {
                yAxis: {
                    categories: cats
                },
                series: [{
                    name: 'Alarms',
                    data: dats,
                }]
            }
        })
    }

    fetchData() {
        console.log("Alarms is fetching data")
        fetch(api_link + "alarm/")
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
                    var dats = this.getData(this.state.data)
                    var cats = this.getCategories(this.state.data)

                    this.updateGant(dats, cats)
                    this.getBarData(this.state.data)
                    this.timeout = setTimeout(this.fetchData.bind(this), 30000)
                });
            });
    }

    constructor(props) {
        super(props)
        // Component state
        var cats = this.getCategories(this.props.data)
        var yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        this.state = {
            activeTab: false,
            data: this.props.data,
            loaded: false,
            converted_data: [],
            barData: {},
            optionsBar: {
                chart: {
                    type: "bar",
                    zoomType: 'xy',
                    panKey: "ctrl",
                    panning: true,
                    height: 550,
                    width: window.innerWidth * 0.95,
                    marginLeft: window.innerWidth * 0.075,
                },
                title: {
                    text: 'Number of warnings vs number of errors recorded'
                },
                plotOptions: {
                    series: {
                        turboThreshold: 0
                    }
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
            // Options for the graph that is to be displayed
            optionsGantt: {
                chart: {
                    type: 'gantt',
                    zoomType: 'xy',
                    panKey: "ctrl",
                    panning: true,
                    height: 700,
                    width: window.innerWidth * 0.93,
                    marginLeft: window.innerWidth * 0.15,
                    marginRight: 0,
                    spacingRight: 0,
                    //scrollablePlotArea: { minHeight: 850, }
                },
                plotOptions: {
                    series: {
                        turboThreshold: 0
                    }
                },
                legend: {
                    enabled: true,
                    itemStyle: {
                        fontSize: LABEL_FONT_SIZE
                    }
                },
                title: {
                    text: 'Alarm history'
                },
                xAxis: [{
                    type: 'datetime',
                    labels: {
                        style: { fontSize: LABEL_FONT_SIZE },
                        formatter: function () {
                            var utc_time = this.value
                            var moment_date = Moment.utc(utc_time).local().format("DD MMMM, HH:mm:ss")
                            return moment_date
                        },
                    },
                    min: Moment.utc(yesterday).valueOf(),
                    max: Moment.utc(new Date()).valueOf(),
                }],
                scrollbar: {
                    enabled: true,
                    height: 25
                },
                tooltip: {
                    style: { fontSize: LABEL_FONT_SIZE },
                    formatter: function () {
                        var utc_start = this.x
                        var utc_end = this.x2
                        var moment_start = Moment.utc(utc_start).local().format("dddd, MMMM DD, HH:mm:ss")
                        var moment_end = Moment.utc(utc_end).local().format("dddd, MMMM DD, HH:mm:ss")
                        return "<h1><b>" + this.yCategory + "</b></h1><br>" +
                            "<div>Start: " + moment_start + "</div><br>" +
                            "<div>End: " + moment_end + "</div>"
                    }
                },
                yAxis: {
                    type: 'category',
                    labels: {
                        style: { fontSize: LABEL_FONT_SIZE },
                        padding: 0
                    },
                    title: {
                        style: {
                            fontSize: LABEL_FONT_SIZE
                        },
                    },
                    categories: cats,
                    scrollbar: { enabled: true, },
                    tickLength: 0
                },
                series: [{
                    name: 'Alarms',
                    data: this.getData(this.props.data),
                }]
            },
        }
    }



    // Return the HTML for this component, first make a table of all the alarms 
    // (this will probably be current alarms in the last version). The table has a fixed height
    // and is made to be scrollable, for better UX.
    // At the bottom of the component return a highcharts graph with the settings stored in 
    // component state

    // var d = this.getData()
    // <Charts data={d} originalData={d} data1={d} detailStart={d[0][0]}></Charts>
    render() {

        return (
            <>
                <div className="row justify-content-center" >
                    <div className="col-auto" style={{ width: "94.2%", marginBottom: 0, paddingBottom: 0, marginLeft: 1 }}>
                        <Table striped bordered hover responsive style={{ marginBottom: 0, paddingBottom: 0 }}>
                            <thead>
                                <tr>
                                    <th style={{ width: "200px" }}>#</th>
                                    <th style={{ width: "200px" }}>Alarm type</th>
                                    <th style={{ width: "300px" }}>Alarm name</th>
                                    <th style={{ width: "300px" }}>Start of alarm</th>
                                    <th style={{ width: "300px" }}>End of alarm</th>
                                </tr>
                            </thead>
                        </Table>
                    </div>
                    <div className="col-auto" style={{
                        overflowY: "scroll", height: "400px", width: "95%",
                        marginLeft: 20, marginTop: 0, paddingTop: 0
                    }}>
                        <Table striped bordered hover responsive >
                            <tbody>
                                {
                                    this.state.data.map(alarm => {
                                        return (
                                            <tr key={this.state.data.indexOf(alarm)}>
                                                <td style={{ width: "200px" }} key={"#" + this.state.data.indexOf(alarm)}>{this.state.data.indexOf(alarm)}</td>
                                                <td style={{ width: "200px" }} key={"#" + this.state.data.indexOf(alarm) + " " + alarm["alarm_type"]}>{alarm["alarm_type"]}</td>
                                                <td style={{ width: "300px" }} key={"#" + this.state.data.indexOf(alarm) + " " + alarm["alarm_name"]}>{alarm["alarm_name"]}</td>
                                                <td style={{ width: "300px" }} key={"#" + this.state.data.indexOf(alarm) + " " + alarm["start_time"] + "start"}>{alarm["start_time"]}</td>
                                                <td style={{ width: "300px" }} key={"#" + this.state.data.indexOf(alarm) + " " + alarm["end_time"] + "end"}>{alarm["end_time"]}</td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </Table>
                    </div>
                </div>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={this.state.optionsGantt}
                    allowChartUpdate={true}
                />

                <HighchartsReact
                    highcharts={Highcharts}
                    options={this.state.optionsBar}
                    allowChartUpdate={true}
                />
            </>
        )
    }
}

/*  */
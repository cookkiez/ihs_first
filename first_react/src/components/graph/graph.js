import Moment from 'moment';
import React, { Component } from 'react';
import "../app/App.css"
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { LABEL_FONT_SIZE, checkIndicatorMap, checkIndicatorMapNoNewLine } from "../app/App";

require("highcharts/modules/exporting")(Highcharts);

const ReactDOM = require('react-dom')


// Some hardcoded colours for the graphs
/*const colors = [
  ("rgb(106, 110, 229)", "rgba(106, 110, 229, .16)"), ("rgb(255, 153, 51)", "rgba(255, 153, 51, .16)"),
  ("rgb(255, 255, 51)", "rgba(255, 255, 51, .16)"), ("rgb(51, 255, 135)", "rgba(51, 255, 135, .16)"),
  ("rgb(51, 51, 255)", "rgba(51, 51, 255, .16)"), ("rgb(255, 102, 255)", "rgba(255, 102, 255, .16)"),
  ("rgb(102, 204, 0)", "rgba(102, 204, 0, .16)"), ("rgb(153, 51, 255)", "rgba(153, 51, 255, .16)"),
  ("rgb(192, 192, 192)", "rgba(192, 192, 192, .16)"), ("rgb(102, 255, 255)", "rgba(102, 255, 255, .16)"),
  ("rgb(0, 153, 76)", "rgba(0, 153, 76, .16)"), ("rgb(178, 102, 255)", "rgba(178, 102, 255, .16)")
]*/

// Function is made for extracting data and an array of keys fr the graphs
// Datetime objects are also formatted to look nicer.
export function getDataColumn(data, key) {
  var toReturn = data.map((row) => {
    Moment.locale('en')
    var dt = row["date_time"].split(".")[0]
    dt = Moment(dt).format('DD MMMM, HH:mm:ss')
    var t = {}
    key.map(curr_key => {
      t[curr_key] = row[curr_key]
      return 0
    })
    t["date_time"] = dt
    return t
  })
  return { data: toReturn, key: key }
}


// Component for displaying a graph  
export class DisplayGraph extends Component {
  constructor(props) {
    super(props)
    var highchartsData = this.getHighchartsData(this.props.data,
      this.props.secondAxisKey,
      this.props.doubleAxis)
    this.chartRef = React.createRef()
    var width = (this.props.w !== undefined) ? this.props.w : 0.95
    var marginLeft = (this.props.ml !== undefined) ? this.props.ml : 0.075
    var height = (this.props.h !== undefined) ? this.props.h : 550
    this.state = {
      data: this.props.data,
      doubleAxis: (this.props.secondAxisKey) ? true : false,
      secondAxisKey: this.props.secondAxisKey,
      width: width,
      height: height,
      marginL: marginLeft,
      chartTitle: this.props.chartTitle,
      optionsNormal: {
        chart: {
          zoomType: 'xy',
          panKey: "ctrl",
          panning: true,
          height: height,
          width: window.innerWidth * width,
          marginLeft: window.innerWidth * marginLeft,
        },
        title: {
          style: {
            fontSize: LABEL_FONT_SIZE
          },
          text: checkIndicatorMap(this.props.chartTitle),

        },
        legend: {
          enabled: true,
          itemStyle: {
            fontSize: LABEL_FONT_SIZE
          }
        },
        xAxis: {
          //categories: [],
          labels: {
            style: {
              fontSize: LABEL_FONT_SIZE
            }
          }
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
          }
        }],
        tooltip: { shared: true },
        plotOptions: {
          series: {
            turboThreshold: 0
          }
        },
        series: []
      },
      optionsCum: {
        chart: {
          zoomType: 'xy',
          panKey: "ctrl",
          panning: true,
          height: 550,
          width: window.innerWidth * width,
          marginLeft: window.innerWidth * marginLeft
        },
        title: {
          text: 'Comparing data to ' + checkIndicatorMapNoNewLine(this.props.data.key[0]),
          align: 'left'
        },
        legend: {
          enabled: true,
          itemStyle: {
            fontSize: LABEL_FONT_SIZE
          }
        },
        xAxis: {
          categories: highchartsData[2],
          labels: {
            style: {
              fontSize: LABEL_FONT_SIZE
            }
          }
        },
        yAxis: [{
          labels: {
            format: '{value:10f}',
            style: {
              fontSize: LABEL_FONT_SIZE
            }
          },
          title: {
            text: "Cumulative data: " + checkIndicatorMapNoNewLine(this.props.data.key[0]),
            style: {
              fontSize: LABEL_FONT_SIZE
            }
          },
          opposite: true
        }, { // Secondary yAxis
          gridLineWidth: 0,
          title: {
            text: checkIndicatorMapNoNewLine(this.props.secondAxisKey),
            style: {
              fontSize: LABEL_FONT_SIZE
            }
          },
          labels: {
            style: {
              fontSize: LABEL_FONT_SIZE
            }
          }
        }],
        plotOptions: {
          series: {
            turboThreshold: 0
          }
        },
        tooltip: { shared: true },
        series: [{
          name: "Cumulative data: " + checkIndicatorMapNoNewLine(this.props.data.key[0]),
          type: "area",
          yAxis: 0,
          data: highchartsData[0],
          color: Highcharts.getOptions().colors[0]
        }, {
          name: checkIndicatorMapNoNewLine(this.props.secondAxisKey),
          yAxis: 1,
          type: "line",
          data: highchartsData[1],
          color: Highcharts.getOptions().colors[7]
        },

        ]
      }
    }
  }

  changeTitle(t) {
    if (!this.state.doubleAxis) {
      this.setState({
        chartTitle: t
      })
    }
  }

  componentDidMount() {
    this.getNormalData(this.state.data)
  }

  getNormalData(data) {
    var temp_data = data.data,
      keys = data.key
    var all_data = keys.map(key => {
      return []
    })
    var dates = temp_data.map(element => {
      keys.map((key, index) => {
        all_data[index].push(element[key])
        return 0
      })
      return element["date_time"]
    })
    this.setState({
      optionsNormal: {
        chart: {
          zoomType: 'xy',
          panKey: "ctrl",
          panning: true,
          height: this.state.height,
          width: window.innerWidth * this.state.width,
          marginLeft: window.innerWidth * this.state.marginL,
        },
        title: { text: this.state.chartTitle, },
        xAxis: { categories: dates },
        tooltip: { shared: true },
        series: all_data.map((arr, index) => {
          return {
            data: arr,
            type: "area",
            opacity: 0.5,
            name: checkIndicatorMapNoNewLine(keys[index])
          }
        })
      }
    })
  }

  getHighchartsData(data, secondAxisKey, doubleAxis) {
    if (!doubleAxis) { return [[], []] }
    var arr1 = [],
      arr2 = [],
      dates = []
    data.data.map(element => {
      arr1.push(element[data.key[0]])
      arr2.push(element[secondAxisKey])
      dates.push(element["date_time"])
      return 0
    })
    return [arr1, arr2, dates]
  }

  // Function called to change the data of the graph (when user wants to hide/show 
  // data on the graph (button pressed on in App component))
  changeData = (data) => {
    this.setState({
      data: data
    }, () => {
      if (this.state.doubleAxis) {
        var compare_key = data.key[1]
        var highChartsData = this.getHighchartsData(this.state.data,
          compare_key,
          this.state.doubleAxis)
        this.setState({
          optionsCum: {
            title: {
              text: 'Comparing data to ' + checkIndicatorMapNoNewLine(data.key[0]),
            },
            xAxis: {
              categories: highChartsData[2]
            },
            yAxis: [{},
            {
              title: {
                text: compare_key
              }
            }],
            series: [
              {
                name: checkIndicatorMapNoNewLine(data.key[0]),
                data: highChartsData[0],
              }, {
                name: checkIndicatorMapNoNewLine(compare_key),
                data: highChartsData[1]
              }]
          }
        })
      } else {
        this.getNormalData(this.state.data)
      }
    })
  }

  // Old changeData -> To delete
  selectLine(event) {
    var d = document.querySelector("#" + event.value)
    var parent = ReactDOM.findDOMNode(d).parentNode
    if (parent.style.visibility === "hidden") { parent.style.visibility = "visible" }
    else { parent.style.visibility = "hidden" }
  }

  // Find the key that has the max value of all the others, so the graph can be nicely spaced.
  maxKey(keys, data) {
    var maxKey = -1
    var maxNum = -1
    data.map((d, index) => {
      Object.keys(d).map((dd) => {
        var m = d[dd]
        if (maxNum < m) { maxNum = m; maxKey = keys[index] }
        return 0
      })
      return 0
    })
    return maxKey
  }

  render() {
    // If no keys are given, return nothing
    var graph = <></>
    if (this.state.data.key.length === 0) { return (<></>) }
    if (this.state.doubleAxis) {
      graph = (
        <>
          <HighchartsReact highcharts={Highcharts}
            options={this.state.optionsCum}
            ref={this.chartRef}
            allowChartUpdate={true}
          />
        </>
      )
    }
    else {
      graph = (
        <>
          <HighchartsReact highcharts={Highcharts}
            options={this.state.optionsNormal}
            allowChartUpdate={true}
          />
        </>
      )
    }
    // Draw the graph with the given data and the given array of keys. Also add
    // a "Brush" element to make the graph "scrollable"
    return (
      <>
        {graph}
      </>
    )
  }
}

/* */
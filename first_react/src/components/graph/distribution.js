import { Component } from "react";
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { LABEL_FONT_SIZE } from "../app/App";



export class Distribution extends Component {
  constructor(props) {
    super(props)
    this.state = {
      options: {},
      binWidth_half: 0,
    }
  }

  getRounded(num) {
    return Number((Math.round(num * 100) / 100).toFixed(2))
  }

  binData(data) {
    var numOfBins = Math.ceil(Math.sqrt(data.length))
    var binWidth = (Math.max(...data) - Math.min(...data)) / numOfBins
    this.setState({
      binWidth_half: this.getRounded(binWidth * 0.5)
    })
    var binnedData = []
    var categories = []
    var firstValue = undefined
    var currEls = 0
    data.map(el => {
      if (firstValue === undefined) { firstValue = el }
      if (el - binWidth > firstValue) {
        binnedData.push(currEls);
        categories.push(this.getRounded((firstValue) + (binWidth * 0.5)))
        firstValue = el
        currEls = 0
      }
      currEls++
      return currEls
    })
    return [binnedData, categories]
  }

  changeData(data) {
    data = data.sort(function (a, b) {
      return a - b;
    });
    data = this.binData(data)
    this.setState({
      options: {
        xAxis: {
          categories: data[1],
          title: {
            text: "Value of indicator (&pm; " + this.state.binWidth_half + ")"
          }
        },
        series: [{
          name: "Distribution",
          data: data[0]
        }]
      }
    })
  }

  changeTitle(title) {
    this.setState({
      chartTitle: title
    })
  }

  componentDidMount() {
    var width = (this.props.w !== undefined) ? this.props.w : 0.95
    var marginLeft = (this.props.ml !== undefined) ? this.props.ml : 0.075
    var dats = this.props.data
    dats = dats.sort(function (a, b) {
      return a - b;
    });
    this.setState({
      options: {
        chart: {
          zoomType: 'xy',
          panKey: "ctrl",
          panning: true,
          height: 550,
          width: window.innerWidth * width,
          marginLeft: window.innerWidth * marginLeft,
          type: "bar",
        },
        title: {
          style: {
            fontSize: LABEL_FONT_SIZE
          },
          text: "Variable distribution",

        },
        legend: {
          enabled: true,
          itemStyle: {
            fontSize: LABEL_FONT_SIZE
          }
        },
        xAxis: {
          title: {
            style: {
              fontSize: LABEL_FONT_SIZE
            },
            text: ""
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
            text: "Number of readings"
          }
        }],
        tooltip: {
          shared: true,
          formatter: function () {
            return "Number of readings: " + this.y + "<br> " +
              "Value of indicator: " + this.x
          }
        },
        plotOptions: {
          series: {
            turboThreshold: 0
          }
        },
        series: [{
          name: "Distribution",
          data: dats
        }]
      }
    })
  }

  render() {

    return (
      <>
        <HighchartsReact highcharts={Highcharts}
          options={this.state.options}
          allowChartUpdate={true}
        />
      </>
    )
  }
}
import { Component } from "react";
import { DisplayGraph, getDataColumn } from '../graph/graph.js';
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import React from "react";
import Moment from "moment";
import { Button } from "react-bootstrap";

// All keys for airflow data. These are attributes of the objects
// the user can select which to display on the graphs
const airflowKeys = [
    "liter_per_second", "liter_per_minute", 'liter_per_hour', 
    'air_volume',
]

// Function that removes an element from the given array
function removeEl(array, el) {
    const index = array.indexOf(el);
    if (index > -1) {
        array.splice(index, 1);
    }
}


export class AirflowData extends Component {
    
    constructor (props) {
        super(props)
        this.state = {
            keysToDisplay: [...airflowKeys],
            data: this.props.data,
            cumLoaded: false
        }

        // Create a reference, so that data of the graphs can be changed 
        // eg. hide data for an attribute
        this.graphElement = React.createRef(); 
        this.download = this.download.bind(this);
    }

    componentDidMount() {
        this.getSumOfElement("liter_per_second")
        this.setState({cumLoaded: true})
    }
    
    getSumOfElement(element) {
        var sum = 0
        var temp_data = [...this.state.data]
        var sumArray = this.state.data.map((el, index) => {
            sum += el[element]
            temp_data[index]["sum_" + element] = sum
            return sum
        })
        this.setState({ data: temp_data})
        return sumArray
    }

    download (event) {
        event.preventDefault()

        var output = JSON.stringify(getDataColumn(this.state.data, this.state.keysToDisplay).data, null, 4)

        const blob = new Blob([output]);
        const fileDownloadUrl = URL.createObjectURL(blob);
        this.setState ({fileDownloadUrl: fileDownloadUrl}, 
        () => {
            this.dofileDownload.click(); 
            URL.revokeObjectURL(fileDownloadUrl); 
            this.setState({fileDownloadUrl: ""})
        })  
    }
    

    // function is called when one of the "select attribute" buttons has been clicked
    // The function checks whether data for the selected attribute is currently displayed or not 
    // and will display it if not and hide it if it is being displayed currently.
    buttonClicked = (event) => {
      var curr_el = event.target.outerText
      if (this.state.keysToDisplay.indexOf(curr_el) !== -1) { removeEl(this.state.keysToDisplay, curr_el); }
      else { this.state.keysToDisplay.push(curr_el) }
      this.graphElement.current.changeData(getDataColumn(this.state.data, this.state.keysToDisplay))
    }

    render () {
        var cum = <></>
        if (this.state.cumLoaded) {
            cum = (
                <>
                    <h3>Cumulative data</h3>
                    <DisplayGraph id="airflowGraphCumulative"
                        data={getDataColumn(this.state.data, ["sum_liter_per_second"])} />
                </>
            )
        }
        return (
            <>
                <h1>TODO: Airflow data</h1>
                <div >
                    <ToggleButtonGroup className="mb-2 container row" type="checkbox" 
                        defaultValue={airflowKeys.map(key => { return airflowKeys.indexOf(key); })}>
                        {
                            // Buttons for toggling display of data in graph
                            airflowKeys.map(key => {
                                return (
                                    <ToggleButton id={key} key={key} value={airflowKeys.indexOf(key)}
                                        variant="outline-success" onClick={this.buttonClicked} style={{
                                            padding: 15 + "px",
                                            margin: 10 + "px"
                                        }} className="rounded">
                                        {key}
                                    </ToggleButton>
                                )
                            })
                        }
                    </ToggleButtonGroup>
                </div>
                <div className="row mb-2">
                    <Button variant="success" style={{ marginLeft: 40 + "px"}} onClick={this.download}>
                        Generate report
                    </Button>
                </div>

                <DisplayGraph ref={this.graphElement} id="airflowGraph"
                    data={getDataColumn(this.state.data, this.state.keysToDisplay)} />

                {cum}

                <a href={this.state.fileDownloadUrl} hidden download={Moment(Date.now()).format('DD MMMM, HH;mm;ss') + ".json"}
                    ref={e => this.dofileDownload = e}>download</a>
            </>
        )
    }
}
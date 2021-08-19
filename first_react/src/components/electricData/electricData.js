import { Component } from "react";
import { DisplayGraph, getDataColumn } from '../graph/graph.js';
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import React from "react";
import Button from "react-bootstrap/Button"
import  Moment  from "moment";

// All keys for electric data. These are attributes of the objects
// the user can select which to display on the graphs
const electricKeys = [
    "kilo_watt_h", 'voltage_L1_N', 'voltage_L2_N', 'voltage_L3_N', 
    'voltage_L1_L2', 'voltage_L2_L3', 'voltage_L3_L1', 'current_L1', 
    'current_L2', 'current_L3'
]

// Function that removes an element from the given array
function removeEl(array, el) {
    const index = array.indexOf(el);
    if (index > -1) {
        array.splice(index, 1);
    }
}


export class ElectricData extends Component {
    
    constructor (props) {
        super(props)
        this.state = {
            keysToDisplay: [...electricKeys],
            data: this.props.data,
            cumLoaded: false
        }
        // Create a reference, so that data of the graphs can be changed 
        // eg. hide data for an attribute
        this.graphElement = React.createRef(); 
        this.download = this.download.bind(this);
    }

    componentDidMount () {
        this.getSumOfElement("watt_h")
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
    

    buttonClicked = (event) => {
      var curr_el = event.target.outerText
      if (this.state.keysToDisplay.indexOf(curr_el) !== -1) { removeEl(this.state.keysToDisplay, curr_el); }
      else { this.state.keysToDisplay.push(curr_el) }
      this.graphElement.current.changeData(getDataColumn(this.state.data, this.state.keysToDisplay))
    }

    render () {
        var cum = <></>
        if (this.state.cumLoaded) { 
            cum = <DisplayGraph id="wattSum" 
                data={ getDataColumn(this.state.data, ["sum_kilo_watt_h", "current_L3"])} 
                doubleAxis={true} secondAxisKey="current_L3"/> 
        }
        return (
            <> 
            <h1>TODO: Electric meter data</h1> 
            <div>  
                <ToggleButtonGroup className="mb-2 container row" type="checkbox"  
                 defaultValue={electricKeys.map(key => { return electricKeys.indexOf(key); })} >
                    {
                        // Buttons for toggling display of data in graph
                        electricKeys.map(key => {
                            return (
                                <ToggleButton id={key} key={key} value={electricKeys.indexOf(key)} variant="outline-success" onClick={this.buttonClicked} style={{
                                    padding: 15 + "px",
                                    margin: 10 + "px",
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
            
            <DisplayGraph ref={this.graphElement} id="electricGraph" 
                data={ getDataColumn(this.state.data, this.state.keysToDisplay)}/>
            {cum}
            <a href={this.state.fileDownloadUrl} hidden download={Moment(Date.now()).format('DD MMMM, HH;mm;ss') + ".json"} ref={e => this.dofileDownload = e}>download</a>

            </>
        )
    }
}
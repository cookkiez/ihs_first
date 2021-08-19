import React, { Component } from "react";
import { checkIndicatorMapNoNewLine } from "../app/App";
import { DisplayGraph, getDataColumn } from "./graph";


export class MultipleGraphs extends Component {
    constructor(props) {
        super(props)
        this.state = {
            data: this.props.data,
            keys: this.props.keys,
            graphs: {},
            chartRefs: this.props.keys.map(_ => {
                return React.createRef()
            })
        }
    }

    componentDidMount() { }

    changeData(data) {
        this.setState({
            data: data
        })
    }

    changeKey(key) {
        if (key.length < 1) { return } 
        var state_keys = this.state.keys
        var index = state_keys.indexOf(key)
        if (index !== -1) { state_keys.splice(index, 1) } 
        else { state_keys.push(key) }
        
        if (state_keys.length > 6) { state_keys.shift() }

        var newRefs = state_keys.map(_ => {
            return React.createRef()
        })

        this.setState({
            keys: state_keys,
            chartRefs: newRefs
        })
    }

    render() {
        return (
            <>
            <div className="container-fluid row">
            {
                this.state.keys.map((key, i) => {
                    console.log("Multiple graphs", checkIndicatorMapNoNewLine(key))
                    return (
                            <DisplayGraph
                                data={getDataColumn(this.state.data, [key])}
                                doubleAxis={false}
                                chartTitle={checkIndicatorMapNoNewLine(key)}
                                ml={0.05}
                                w={0.3}
                                h={450}
                                key={key + "" + i }
                                ref={this.state.chartRefs[i]}
                            />
                    )
                })
            }
            </div>
            </>
        )
    }
}
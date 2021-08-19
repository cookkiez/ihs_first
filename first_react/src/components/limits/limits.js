import React, { Component } from "react";
import { Button, FormControl } from "react-bootstrap";
import { Card, Form } from "react-bootstrap";
import { api_link, checkUnits } from "../app/App";
import { Tooltip } from "react-bootstrap";
import { OverlayTrigger } from "react-bootstrap";
import { checkIndicatorMapNoNewLine } from "../app/App";
import Select from "react-select"

export class Limits extends Component {
    constructor(props) {
        super(props)
        var temp_data = this.props.data
        temp_data = this.getTagsData(this.props.tags, temp_data.tags_data, temp_data)
        var flat = this.flattenData(temp_data)
        var bgs = this.props.limits.map(_ => {
            return ""
        })
        var selectStuff = this.getSelectStuff(flat)
        this.state = {
            limits: this.props.limits,
            data: flat,
            limitIds: this.getLimitIds(this.props.limits),
            newUpperLimit: -1,
            newLowerLimit: -1,
            tag_to_edit: selectStuff[0].value,
            checked: [],
            backgrounds: bgs,
            warning: false,
            emailToAdd: "",
            emailToAddActive: true,
            selectStuff: selectStuff
        }
        this.timeouts = {}
        this.selectRef = React.createRef()
    }

    getSelectStuff(data) {
        var stuff = []
        for (var key in data) {
            stuff.push({
                label: checkIndicatorMapNoNewLine(key), value: key
            })
        }
        return stuff
    }

    getLimitIds(limits) {
        var ids = {}
        limits.map(lim => {
            ids[lim["indicator_name"]] = lim["id"]
            return lim
        })
        return ids
    }

    flattenData(data) {
        var to_return = {}
        to_return = this.goOverData(data, "electric", to_return)
        to_return = this.goOverData(data, "air", to_return)
        for (var tag in data["tags_data"]) { to_return[tag] = data["tags_data"][tag] }

        return to_return
    }

    goOverData(data, key, to_return) {
        data[key].map(el => {
            for (var key in el) {
                if (key !== "id" && key !== "date_time") {
                    if (to_return[key] === undefined) { to_return[key] = [] }
                    to_return[key].push({ [key]: el[key], "date_time": el["date_time"] })
                }
            }
            return el
        })
        return to_return
    }

    getTagsData(tags, data, all_data) {
        var to_return = Object.assign({}, all_data)
        //to_return["electric"] = []
        var tags_data = {}

        tags.map(tag => {
            if (tag.active) {
                tags_data[tag.tag_name] = []
                data.map(el => {
                    if (tag.tag_name === el.tag_name) {
                        tags_data[tag.tag_name].push({
                            [tag.tag_name]: el.tag_data,
                            "date_time": el.date_time
                        })
                    }
                    return el
                })
            }
            return tag
        })
        to_return["tags_data"] = tags_data
        return to_return
    }

    updateLimits(limits) {
        this.setState({
            limits: limits,
            limitIds: this.getLimitIds(limits)
        }, () => {
            this.checkAllLimits()
        })
    }

    getWarning() {
        return this.state.warning
    }

    sendEmail(message) {
        fetch(api_link + "sendEmail/", {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(message)
        })
    }

    checkAllLimits() {
        var lims = this.state.limits
        var checked = []
        var warn = false
        var lims_exceded = ""
        var dict = {}
        lims.map(limit => {
            var tag = limit["indicator_name"]
            var tag_data = this.state.data[tag]
            var tag_last_data = tag_data[tag_data.length - 1][tag]
            var lower = limit.limit_lower, upper = limit.limit_upper
            var val = 0
            if (tag_last_data < lower) {
                val = -1
            } else if (tag_last_data > upper) {
                val = 1
            }
            if (val !== 0) {
                warn = true
                lims_exceded += checkIndicatorMapNoNewLine(tag) + " exceded limits! With value: " + this.getRounded(tag_last_data) + "" + checkUnits(tag) + 
                                ", upper limit: " + upper + "" + checkUnits(tag) + " and lower limit: " + lower + "" + checkUnits(tag) + "\n"
                dict[tag] = {
                    "lastData": this.getRounded(tag_last_data),
                    "upperLimit": upper,
                    "lowerLimit": lower,
                    "unit": checkUnits(tag)
                }
            }
            var sum = 0, max = 0, min = 9999999
            tag_data.map(el => {
                var v = el[tag]
                sum += v
                if (v > max) { max = v }
                if (v < min) { min = v }
                return el
            })
            var avg = sum / tag_data.length

            checked.push({
                tag: tag,
                val: val,
                lastVal: this.getRounded(tag_last_data),
                oldVal: this.getRounded(tag_data[tag_data.length - 2][tag]),
                avgVal: this.getRounded(avg),
                min: this.getRounded(min),
                max: this.getRounded(max),
                limitLower: this.getRounded(lower),
                limitUpper: this.getRounded(upper)
            })

            return limit
        })
        if(warn) { this.sendEmail({"message": lims_exceded, "dict": JSON.stringify(dict, null, 4)}) }
        this.setState({
            checked: checked,
            warning: warn
        }, () => {
            this.state.checked.map((el, index) => {
                this.blinking(el, index)
                return el
            })
        })
    }

    componentDidMount() {
        this.callFetchData()
        //this.timeout = setTimeout(() => { this.callFetchData.bind(this) }, 30000)
    }

    handleTagChange = (event) => {
        this.setState({
            tag_to_edit: event.target.value
        })
    }

    upperLimitChange = (event) => {
        this.setState({
            newUpperLimit: event.target.value
        })
    }

    lowerLimitChange = (event) => {
        this.setState({
            newLowerLimit: event.target.value
        })
    }

    getRounded(num) {
        return Number((Math.round(num * 100) / 100).toFixed(2))
    }

    sendToApi(limit) {
        var id = this.state.limitIds[limit["indicator_name"]]
        if (id === undefined) {
            fetch(api_link + "limits/", {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(limit)
            }).then(response => {
                if (response.status > 400) { alert("Could not add limit " + limit["indicator_name"]) }
                else { alert("Limit " + limit["indicator_name"] + " added successfully!") }
                return response.json();
            })
                .then(resp => { this.fetchData() })
        } else {
            fetch(api_link + "limits/" + id + "/", {
                method: "PUT",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify(limit)
            }).then(response => {
                if (response.status > 400) { alert("Could not add limit " + limit["indicator_name"]) }
                else { alert("Limit " + limit["indicator_name"] + " added successfully!") }
                return response.json();
            })
                .then(resp => { this.fetchData() })
        }
    }

    callFetchData() {
        this.fetchData()
        this.timeout = setTimeout(() => { this.callFetchData.bind(this) }, 30000)
    }

    fetchData() {
        console.log("Limits is fetching data")
        fetch(api_link + "limits/")
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
                        limits: data,
                        limitIds: this.getLimitIds(data)
                    };
                }, () => {
                    this.updateLimits(this.state.limits)
                    this.checkAllLimits()
                });
            });
    }

    handleSubmit = (event) => {
        event.preventDefault()

        this.sendToApi({
            indicator_name: this.state.tag_to_edit,
            limit_lower: this.state.newLowerLimit,
            limit_upper: this.state.newUpperLimit
        })
    }

    blinking(el, index) {
        var bg = ""
        if (this.state.backgrounds[index] === "#FF0000") { bg = "" }
        else {
            if (el.val !== 0) {
                bg = "#FF0000"
            }
        }
        var bgs = this.state.backgrounds
        bgs[index] = bg
        this.setState({
            backgrounds: bgs
        }, () => {
            if (this.timeouts[el.tag] === undefined) {
                this.timeouts[el.tag] = setTimeout(() => { this.blinking(el, index) }, 500)
            } else {
                clearTimeout(this.timeouts[el.tag])
            }
            this.timeouts[el.tag] = setTimeout(() => { this.blinking(el, index) }, 500)
        })
    }

    componentWillUnmount() {
        clearTimeout(this.timeout)
        /*this.timeouts.map(timeout => {
            clearTimeout(timeout)
        })*/
    }

    emailChanged = (event) => {
        this.setState({
            emailToAdd: event.target.value
        })
    }

    checkbox = (event) => {
        this.setState({
            emailToAddActive: !event.target.checked
        })
    }

    submitEmails = (event) => {
        event.preventDefault()
        fetch(api_link + "email/", {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({
                email: this.state.emailToAdd,
                active: this.state.emailToAddActive
            })
        }).then(response => {
            if (response.status > 400) { alert("Could not add email " + this.state.emailToAdd) }
            else { alert("Email " + this.state.emailToAdd + " added successfully!") }
            return response.json();
        })
    }

    render() {
        return (
            <>
                <div className="container-fluid row d-flex justify-content-center">
                    <Card style={{
                        margin: "10px", width: "45rem"
                    }}>
                        <Card.Header className="text-center">
                            Add or edit limits for tag or indicator
                        </Card.Header>
                        <Form
                            onSubmit={this.handleSubmit}
                            style={{ margin: "10px" }}>
                            <div className="container-fluid row">
                                <div className="col-12" style={{marginBottom: "15px"}}>
                                    <Select menuPlacement="auto" options={this.state.selectStuff} onChange={(item) => {
                                        this.setState({
                                            tag_to_edit: item.value
                                        })
                                    }} defaultValue={this.state.selectStuff[0].value} 
                                    placeholder={checkIndicatorMapNoNewLine(this.state.tag_to_edit)}
                                    id="tagNameId" 
                                    style={{maring: "10px"}}
                                    ref={this.selectRef}/>
                                </div>
                                <div className="col-12">
                                    <FormControl
                                        onChange={this.upperLimitChange}
                                        className="mb-3"
                                        placeholder='Enter upper limit of indicator/tag here'
                                        aria-label='Enter upper limit of indicator/tag here'
                                        aria-describedby="basic-addon2"
                                        id="upperLimitId"
                                    />
                                </div>
                                <div className="col-12">
                                    <FormControl
                                        onChange={this.lowerLimitChange}
                                        className="mb-3"
                                        placeholder='Enter lower limit of indicator/tag here'
                                        aria-label='Enter lower limit of indicator/tag here'
                                        aria-describedby="basic-addon2"
                                        id="lowerLimitId"
                                    />
                                </div>
                                <div className="col-12">
                                    <Button
                                        variant="outline-secondary"
                                        className="mb-3"
                                        type="submit">
                                        Add/Edit limits!
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </Card>
                    <Card style={{ margin: "10px" }}>
                        <Card.Header className="text-center">
                            Edit or save email, for reports, in database
                        </Card.Header>
                        <Card.Body>
                            <Form
                                onSubmit={this.submitEmails}
                                style={{ margin: "10px" }}>
                                <div className="container-fluid row">
                                    <div className="col-12">
                                        <FormControl
                                            onChange={this.emailChanged}
                                            className="mb-3"
                                            placeholder='Enter email here'
                                            aria-label='Enter email here'
                                            aria-describedby="basic-addon2"
                                            id="emailId"
                                        />
                                    </div>
                                    <div className="col-12" style={{ marginBottom: "10px" }}>
                                        <Form.Check
                                            type="checkbox"
                                            label="Send reports to this email?"
                                            onChange={this.checkbox}
                                            defaultChecked={this.state.emailToAddActive} />
                                    </div>
                                    <div className="col-12">
                                        <Button
                                            variant="outline-secondary"
                                            className="mb-3"
                                            type="submit">
                                            Save/edit email
                                        </Button>
                                    </div>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </div>

                <Card style={{ margin: 10 }}>
                    <Card.Header className="text-center">
                        Currently set limits
                    </Card.Header>

                    <Card.Body>
                        <div className="container-fluid row d-flex justify-content-center">
                            {
                                this.state.checked.map((el, index) => {
                                    return (
                                        <OverlayTrigger key={el.tag} placement="top" overlay={(props) => {
                                            return (
                                                <Tooltip {...props}>Click here to enter data of limits into input fields</Tooltip>
                                            )
                                        }}>
                                            <Card className="text-center" style={{
                                                fontSize: "20px",
                                                margin: 10,
                                                backgroundColor: this.state.backgrounds[index],
                                                width: "25rem"
                                            }}
                                                onMouseEnter={e => {
                                                    const container = e.target
                                                    container.style.cursor = "pointer";
                                                }}
                                                onClick={() => {
                                                    document.querySelector("#upperLimitId").value = el["limitUpper"]
                                                    document.querySelector("#lowerLimitId").value = el["limitLower"]
                                                    this.setState({
                                                        tag_to_edit: el.tag,
                                                        newUpperLimit: el["limitUpper"],
                                                        newLowerLimit: el["limitLower"]
                                                    })
                                                }}
                                            >
                                                <Card.Title style={{ marginTop: 10 }} >
                                                    {checkIndicatorMapNoNewLine(el["tag"])} <br /> ({el["tag"]})
                                                </Card.Title>
                                                <Card.Body>
                                                    <div>
                                                        <div>
                                                            Current consumption: {el.lastVal}
                                                        </div>
                                                        <div>
                                                            Upper limit: {el.limitUpper}
                                                        </div>
                                                        <div>
                                                            Lower limit: {el.limitLower}
                                                        </div>
                                                        <div >
                                                            Average consumption: {el.avgVal}
                                                        </div>
                                                        <div >
                                                            Previous consumption: {el.oldVal}
                                                        </div>
                                                        <div>
                                                            Max consumption: {el.max}
                                                        </div>
                                                        <div >
                                                            Min consumption: {el.min}
                                                        </div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </OverlayTrigger>
                                    )
                                })
                            }
                        </div>
                    </Card.Body>
                </Card>
            </>
        )
    }
}
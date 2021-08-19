
import { Component } from "react";
import Moment from 'moment';
import { Card, Form } from "react-bootstrap";
import { api_link, checkIndicatorMapNoNewLine } from "../app/App";
import { Spinner } from 'react-bootstrap';
import { DisplayGraph, getDataColumn } from "../graph/graph";
import Select from "react-select"
import React from "react"
import { Button, FormControl } from "react-bootstrap";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { indicator_map, indicator_map_no_new_line, units } from "../app/App";


export class TagsToGet extends Component {
    constructor(props) {
        super(props)
        this.state = {
            activeTab: false,
            tags: [],
            value: "",
            tag_to_add_name: "",
            tag_to_add_metric: "",
            tags_data: [],
            tags_select: [],
            group: {},
            tagsLoaded: false,
            tagsDataLoaded: false,
            loaded: false
        }

        this.graphElement = React.createRef()
        this.handleTagChange = this.handleTagChange.bind(this);
        this.handleTagNameChange = this.handleTagNameChange.bind(this);
        this.handleTagMetricChange = this.handleTagMetricChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async fetchData(appendix, dataToSave, loaded) {
        fetch(api_link + appendix)
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
                        [dataToSave]: data,
                        [loaded]: true
                    };
                });
            });
    }

    groupData() {
        let groupedData = {}
        this.state.tags_data.map(data => {
            let name = data.tag_name
            if (groupedData[name] === undefined) {
                groupedData[name] = {
                    data: [],
                    date_time: []
                }
            }
            groupedData[name]["data"].push(data["tag_data"])
            groupedData[name]["date_time"].push(
                Moment(new Date(data["date_time"])).format('DD MMMM, HH:mm:ss')
            )
            return groupedData
        })

        this.setState({
            group: groupedData,
            loaded: true
        })
    }

    componentWillUnmount() {
        clearTimeout(this.timeout)
    }

    doApiStuff() {
        console.log("Tags is fetching data")
        this.fetchData("tags/", "tags", "tagsLoaded")
        var select_tags = this.state.tags.map(tag => {
            return { label: checkIndicatorMapNoNewLine(tag.tag_name), value: tag.tag_name }
        })
        this.fetchData("tags_data/", "tags_data", "tagsDataLoaded")
        this.groupData()
        this.setState({
            tags_select: select_tags
        })
        this.state.tags.map(tag => {
            if(indicator_map[tag.tag_name] === undefined) {
                indicator_map[tag.tag_name] = tag.display_name
            }
            if(indicator_map_no_new_line[tag.tag_name] === undefined) {
                indicator_map_no_new_line[tag.tag_name] = tag.display_name
            }
            if(units[tag.tag_name] === undefined) {
                units[tag.tag_name] = tag.unit
            }
            return tag
        })
        this.timeout = setTimeout(this.doApiStuff.bind(this), 30000)
    }

    componentDidMount() {
        this.doApiStuff()
    }

    setActive() {
        this.setState({
            activeTab: !this.state.activeTab
        }, () => {
            if (this.state.activeTab) {
                
            } else {
                
            }
        })
    }

    sendToApi(tag) {
        fetch(api_link + "tags/" + tag.id + "/", {
            method: "PUT",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({
                id: tag.id,
                tag_name: tag.tag_name,
                active: tag.active
            })
        }).then(response => {
            if (response.status > 400) {
                alert("Could not activate tag " + checkIndicatorMapNoNewLine(tag.tag_name))
                return false
            }
            return response.json();
        })
            .then(resp => {
                if (resp) {
                    if (tag.active) { alert("Tag " + checkIndicatorMapNoNewLine(tag.tag_name)+ " activated successfully!") }
                    else { alert("Tag " + checkIndicatorMapNoNewLine(tag.tag_name) + " deactivated successfully!") }
                }
            })
    }

    postToApi(tag) {
        fetch(api_link + "tags/", {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({
                tag_name: tag.tag_name,
                display_name: tag.display_name,
                unit: tag.unit,
                active: tag.active
            })
        }).then(response => {
            if (response.status > 400) { alert("Could not add tag " + tag.tag_name) }
            else { alert("Tag " + tag.tag_name + " added successfully!") }
            return response.json();
        })
            .then(resp => { this.doApiStuff() })
    }

    deleteTag(tag) {
        fetch(api_link + "tags/" + tag.id + "/", {
            method: "DELETE",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({
                id: tag.id,
                tag_name: tag.tag_name,
                active: tag.active
            })
        }).then(response => {
            if (response.status > 400) {
                alert("Could not delete tag " + tag.tag_name)
            } else {
                alert("Tag " + tag.tag_name + " deleted successfully!")
            }
        })
            .then((resp) => { this.doApiStuff() })
    }

    cardClicked(clickedTag) {
        let arr = this.state.tags,
            index = arr.indexOf(clickedTag)
        clickedTag.active = !clickedTag.active
        arr[index] = clickedTag
        this.setState({
            tags: arr
        }, () => {
            //this.deleteTag(clickedTag)
            this.sendToApi(clickedTag)
        })
    }

    dropdownSelected = (selectedItem) => {
        if (selectedItem) {
            var tag = selectedItem.value

            var dats = []
            this.state.tags_data.map(el => {
                if (el.tag_name === tag) {
                    dats.push({
                        id: el["id"],
                        [tag]: el["tag_data"],
                        date_time: el["date_time"]
                    })
                }
                return el
            })

            this.graphElement.current.changeData(getDataColumn(dats, [tag]))
        }
    }

    handleSubmit(event) {
        //alert(this.state.value)
        this.postToApi({
            tag_name: this.state.value,
            display_name: this.state.tag_to_add_name,
            unit: this.state.tag_to_add_metric,
            active: true
        })
        event.preventDefault()
    }

    handleTagChange(event) {
        this.setState({ value: event.target.value });
    }
    handleTagNameChange(event) {
        this.setState({ tag_to_add_name: event.target.value });
    }

    handleTagMetricChange(event) {
        this.setState({ tag_to_add_metric: event.target.value });
    }


    render() {
        let g = <></>,
            graphStuff = <></>
        var spinner = <Spinner
            style={{
                position: "fixed",
                top: 50,
                right: 50,
                width: "50px",
                height: "50px",
                color: "#3a8ac0"
            }}
            animation="border"
            role="status"></Spinner>
        if (this.state.tagsLoaded &&
            this.state.tagsDataLoaded &&
            this.state.loaded) {
            spinner = <></>
            graphStuff =
                (
                    <>
                        <div className="col-sm-3 col-md-3 col-lg-3">
                            <h5>Select tag to display on graph</h5>
                            <Select menuPlacement="auto" options={this.state.tags_select} onChange={this.dropdownSelected} />
                        </div>
                        <DisplayGraph
                            ref={this.graphElement}
                            data={getDataColumn(this.state.tags_data, [])}

                        />
                    </>
                )



            g = this.state.tags.map(tag => {
                let val = this.state.group[tag.tag_name]
                if (val === undefined) { val = "Not yet read" }
                else { val = val["data"][this.state.group[tag.tag_name]["data"].length - 1] }
                let display_name = tag.display_name
                let display_display_name = <></>
                if (display_name.length > 0) {
                    display_display_name =
                        <Card.Title>
                            Display name: {display_name}
                        </Card.Title>
                }
                let units = tag.unit
                return (
                    <OverlayTrigger key={tag.id} placement="top" overlay={(props) => {
                        return (
                            <Tooltip {...props}> Click here to {(tag.active) ? "deactivate" : "activate"} reading of this tag.</Tooltip>
                        )
                    }}>
                        <Card  style={{
                            width: '25rem', margin: "20px", borderRadius: "10%",
                            background: "linear-gradient(to right," + ((tag.active) ? "green, green" : "grey,grey") + " 1rem,transparent 2rem,transparent 100%)"
                        }}
                            onMouseEnter={e => {
                                const container = e.target
                                container.style.cursor = "pointer";
                            }}
                        >
                            <Card.Body onClick={() => { this.cardClicked(tag) }}>
                                <div style={{ marginLeft: "2rem" }}>
                                    {
                                        display_display_name
                                    }
                                    <Card.Text>
                                        Tag: <i>{tag.tag_name}</i>
                                    </Card.Text>
                                    <Card.Text>
                                        Current value: {val} {(val === "Not yet read") ? "" : units}
                                    </Card.Text>
                                </div>
                            </Card.Body>
                            <Card.Footer
                                className="text-center"
                                onClick={() => { this.deleteTag(tag) }}
                            >
                                Delete this tag from database
                            </Card.Footer>
                        </Card>
                    </OverlayTrigger>
                )
            })
        }
        return (
            <>
                <Card style={{
                    margin: "10px", width: "35rem"
                }}>
                    <Card.Header className="text-center">
                        Add new tag to the database
                    </Card.Header>
                    <Form
                        onSubmit={this.handleSubmit}
                        style={{ margin: "10px" }}>
                        <div className="container-fluid row">
                            <div className="col-12">
                                <FormControl
                                    onChange={this.handleTagChange}
                                    className="mb-3"
                                    placeholder='Enter name of tag to add here (eg. "TC1".C2.M2.Speed.Actual)'
                                    aria-label='Enter name of tag to add here (eg. "TC1".C2.M2.Speed.Actual)'
                                    aria-describedby="basic-addon2"
                                />
                            </div>
                            <div className="col-12">
                                <FormControl
                                    onChange={this.handleTagNameChange}
                                    className="mb-3"
                                    placeholder='Enter display name of tag here'
                                    aria-label='Enter display name of tag here'
                                    aria-describedby="basic-addon2"
                                />
                            </div>
                            <div className="col-12">
                                <FormControl
                                    onChange={this.handleTagMetricChange}
                                    className="mb-3"
                                    placeholder='Enter units for tag here'
                                    aria-label='Enter units for tag here'
                                    aria-describedby="basic-addon2"
                                />
                            </div>
                            <div className="col-12">
                                <Button
                                    variant="outline-secondary"
                                    id="button-addon2"
                                    className="mb-3"
                                    type="submit">
                                    Add tag!
                                </Button>
                            </div>
                        </div>
                    </Form>
                </Card>
                {
                    spinner
                }
                <div className="container-fluid row">
                    {
                        g
                    }
                </div>
                <div className="container-fluid row">
                    {
                        graphStuff
                    }
                </div>
            </>
        )
    }
}
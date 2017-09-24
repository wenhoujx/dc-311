import React, {Component} from 'react';
import {csv} from 'd3-request';
import 'react-select/dist/react-select.css';
import {Map, TileLayer, Marker, Popup } from 'react-leaflet'
import Select from 'react-select'
import { Charts, ChartContainer, ChartRow, YAxis, LineChart, BarChart, styler } from "react-timeseries-charts";
import { TimeSeries, TimeRange } from "pondjs";
import _ from 'lodash'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: []
    };
    //csv("../data/dc_311-2016.csv", (error, data) => {
    csv("../data/dc_311-2016_top100.csv", (error, data) => {
      if (error) {
        this.setState({loadError: true});
      }
      var initData = data.filter(d => (d.LATITUDE !== 'NA' && d.LONGITUDE !== 'NA'))
                         .map(d => ({
                                     geo: [Number(d.LATITUDE), Number(d.LONGITUDE)],
                                     desc: d.SERVICECODEDESCRIPTION,
                                     creationDate: d.ADDDATE,
                         }))
      this.setState(
        Object.assign(this.state, {
          initData: initData,
          allOptions: [...new Set(initData.map(d => d.desc))],
        }));
    })
    this._handleSelect = this._handleSelect.bind(this);
  }

  filterData() {
    if (this.state.filter.length == 0) {
      return this.state.initData
    } else {
      return this.state.initData.filter(d => this.state.filter.includes(d.desc));
    }
  }

  _handleSelect(event) {
    this.setState(
      Object.assign(this.state, {
        filter: event.map(v => v.value)
      })
    );
  }

  yearlyHistogram(data) {
    var yearlyHist = {};
    if (data.length == 0) {
      return yearlyHist;
    }
    // leroy: assuming all data from the same year
    const year = data[0].creationDate.substring(0,4);

    for (let i = 1; i <= 12; i++) {
      yearlyHist[year + "-" + ("0" + i).slice(-2)] = 0;
    }
    _.forEach(data, d => (yearlyHist[d.creationDate.substring(0, 7)] += 1))
    return yearlyHist;

  }

  render() {
    if (this.state.loadError) {
      return <div>couldn't load file</div>;
    }
    if (!this.state.initData) {
      return <div />;
    }

    const data = this.filterData()
    const center = data[0].geo
    const zoom = 11;
    const options = this.state.allOptions.map(o => ({value: o, label: o}))
    const currentOptions = this.state.filter.map(o => ({value: o, label: o}))

    const yearlyHist = this.yearlyHistogram(data)
    const tsData = {
      name: "311-ts",
      columns: ["index", "count"],
      points: _.map(yearlyHist, (v, k) => [k, v])
    }

    const ts = new TimeSeries(tsData);
    return (
      <div className="whole-app">
        <h1>DC 311 Map</h1>
        <h2>{data.length} Events</h2>
        <div className="map-area">
          <Map center={center} zoom={zoom}>
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
            />
            { data.map(d => (
              <Marker position={d.geo}>
                <Popup>
                  <span>{d.desc}</span>
                </Popup>
              </Marker>
            ))}
          </Map>
        </div>

        <div className="time-series-area">
          <ChartContainer timeRange={ts.timerange()}>
            <ChartRow height="200">
              <YAxis id="axis1" label="Events" min={0} max={50} type="linear"/>
              <Charts>
                <BarChart axis="axis1" series={ts} columns={["count"]}
                />
              </Charts>
            </ChartRow>
          </ChartContainer>
        </div>

        <div className="filter-area">
          <Select
            name="form-field-name"
            value={currentOptions}
            placeholder="Filter by Event Code"
            multi={true}
            options={options}
            onChange={this._handleSelect}
          />
        </div>
      </div>
    )

  }
}
//eslint-disable import/first
export default App;

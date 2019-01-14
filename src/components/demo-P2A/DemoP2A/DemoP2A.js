import React, { Component } from 'react';
import { Grid, Row, Col, Button, Glyphicon } from 'react-bootstrap';
import memoize from 'memoize-one';
import {
  flow, takeWhile, slice, map, reduce, filter, tap, includes,
  sortBy
} from 'lodash/fp';
import { objUnion } from '../../../utils/fp';
import _ from 'lodash';

import meta from '../../../assets/meta'
import './DemoP2A.css';
import TimePeriodSelector from '../TimePeriodSelector';
import VariableSelector from '../VariableSelector';


function stringify(obj) {
  return <pre>{JSON.stringify(obj, null, 2)}</pre>;
}


class DemoP2A extends Component {
  state = {
    timePeriod: undefined,
    variable: undefined,
  };

  handleChangeTimePeriod = timePeriod => this.setState({ timePeriod });
  handleChangeVariable = variable => this.setState({ variable });


  static colProps = {
    lg: 3, md: 3, sm: 3,
  };

  render() {
    const prefilteredMeta = flow(
      filter(m => (
        m.model_id === 'CanESM2' &&
        m.experiment ===   'historical, rcp85' &&
        // m.ensemble_member === "r1i1p1"  // likely unnecessary
        includes(m.variable_id)('tasmax pr'.split(' ')) &&
        m.multi_year_mean &&
        includes(m.timescale, 'yearly seasonal'.split(' ')) &&
        true
      )),
      tap(result => console.log('prefilteredMeta', result))
    )(meta);

    return (
      <Grid fluid>
        <Row>
          <Col lg={12}>
            <h1>For P2A</h1>
          </Col>
        </Row>

        <Row>
          <Col {...DemoP2A.colProps}>
            <h2>Time Period</h2>
            <TimePeriodSelector
              meta={prefilteredMeta}
              value={this.state.timePeriod}
              onChange={this.handleChangeTimePeriod}
            />
            {stringify(this.state.timePeriod)}
          </Col>
          <Col {...DemoP2A.colProps}>
            <h2>Variable</h2>
            <VariableSelector
              meta={prefilteredMeta}
              value={this.state.variable}
              onChange={this.handleChangeVariable}
            />
            {stringify(this.state.variable)}
          </Col>
        </Row>

        <Row>
          <Col lg={12}>
            <ul>
              {
                flow(
                  filter(this.state.timePeriod || {}),
                  filter(this.state.variable || {}),
                  map(m => (
                    <li>{`
                      ${m.unique_id}
                    `}</li>
                  ))
                )(prefilteredMeta)
              }
            </ul>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default DemoP2A;

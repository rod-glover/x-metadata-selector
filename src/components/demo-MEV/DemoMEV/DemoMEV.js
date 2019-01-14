import React, { Component } from 'react';
import { Grid, Row, Col, Button, Glyphicon } from 'react-bootstrap';
import memoize from 'memoize-one';
import {
  flow, takeWhile, slice, map, reduce, filter, tap,
  sortBy
} from 'lodash/fp';
import { objUnion } from '../../../utils/fp';
import _ from 'lodash';

import meta from '../../../assets/meta'
import './DemoMEV.css';
import VariableSelector from '../VariableSelector';
import ModelSelector from '../ModelSelector';
import EmissionsScenarioSelector from '../EmissionsScenarioSelector';
import DatasetSelector from '../DatasetSelector';


function stringify(obj) {
  return <pre>{JSON.stringify(obj, null, 2)}</pre>;
}


class DemoMEV extends Component {
  state = {
    mev: {
      model: {
        // model_id: 'CanESM2',
      },
      emissions: {
        // experiment: 'historical, rcp45',
      },
      variable: {
        // variable_id: "pr",
        // variable_name: "Precipitation",
        // multi_year_mean: true,
      },
    },
    selectorOrder: 'model emissions variable'.split(' '),
    dataset: {
      // "start_date": "1961",
      // "end_date": "1990",
      // "ensemble_member": "r1i1p1"
    },
  };

  handleChangeSelection = (collection, item, value) =>
    this.setState(prevState => ({
      [collection]: { ...prevState[collection], [item]: value }
    }));

  anyHandleChangeModel = (value) =>
    this.setState(prevState => ({
      mev: { ...prevState.mev, model: { model_id: value } }
    }));
  anyHandleChangeEmissions = (value) =>
    this.setState(prevState => ({
      mev: { ...prevState.mev, emissions: { experiment: value } }
    }));
  anyHandleChangeVariable = (value) =>
    this.setState(prevState => ({
      mev: { ...prevState.mev, variable: value }
    }));

  anySelectorConstraint =
    (thisSelector, selectorOrder, state) => flow(
      tap(() => console.log(`anySelectorConstraint: thisSelector`, thisSelector, `selectorOrder`, selectorOrder, 'state', state)),
      takeWhile(selector => selector !== thisSelector),
      map(selector => state[selector]),
      objUnion,
      tap(result => console.log(`anySelectorConstraint: result`, result))
    )(selectorOrder)
  ;

  handleChangeDataset = dataset => this.setState({ dataset });

  static colProps = {
    lg: 3, md: 3, sm: 3,
  };

  anySelector = sel => {
    switch (sel) {
      case 'model': return (
        <Col {...DemoMEV.colProps}>
          <ModelSelector
            bases={meta}
            constraint={this.anySelectorConstraint('model', this.state.selectorOrder, this.state.mev)}
            value={this.state.mev.model.model_id}
            onChange={this.anyHandleChangeModel}
          />
          {stringify(this.state.mev[sel])}
        </Col>
      );
      case 'emissions': return (
        <Col {...DemoMEV.colProps}>
          <EmissionsScenarioSelector
            bases={meta}
            constraint={this.anySelectorConstraint('emissions', this.state.selectorOrder, this.state.mev)}
            value={this.state.mev.emissions.experiment}
            onChange={this.anyHandleChangeEmissions}
          />
          {stringify(this.state.mev[sel])}
        </Col>
      );
      case 'variable': return (
        <Col {...DemoMEV.colProps}>
          <VariableSelector
            bases={meta}
            constraint={this.anySelectorConstraint('variable', this.state.selectorOrder, this.state.mev)}
            value={this.state.mev.variable}
            onChange={this.anyHandleChangeVariable}
          />
          {stringify(this.state.mev[sel])}
        </Col>
      );
      default: return 'Idiot';
    }
  };

  moveSelectorOrderDown = index => this.setState(prevState => {
    const prevOrder = prevState.selectorOrder;
    return {
      selectorOrder: _.concat(
        slice(0, index, prevOrder),
        prevOrder[index+1],
        prevOrder[index],
        slice(index+2, undefined, prevOrder),
      )};
  });

  render() {
    console.log('DemoMEV.render')
    const mevConstraint = objUnion(this.state.mev);
    console.log('DemoMEV.render: mevConstraint', mevConstraint)
    const mevFilteredMetadata = filter(mevConstraint)(meta);
    console.log('DemoMEV.render: mevFilteredMetadata', mevFilteredMetadata)
    const mevdFilteredMetadata = filter(this.state.dataset)(mevFilteredMetadata);

    return (
      <Grid fluid>
        <Row>
          <Col lg={12} md={12} sm={12}><h1>Model, Emissions, Variable selectors</h1></Col>
        </Row>
        <Row>
            {
              this.state.selectorOrder.map((sel, index) => (
                <Col {...DemoMEV.colProps} className='text-center'>
                  <h2>
                    {
                      index > 0 &&
                      <Button
                        bsSize={'xsmall'}
                        onClick={this.moveSelectorOrderDown.bind(this, index-1)}
                      >
                        <Glyphicon glyph={'arrow-left'}/>
                      </Button>
                    }
                    {` ${sel} `}
                    {
                      index < 2 &&
                      <Button
                        bsSize={'xsmall'}
                        onClick={this.moveSelectorOrderDown.bind(this, index)}
                      >
                        <Glyphicon glyph={'arrow-right'}/>
                      </Button>
                    }
                  </h2>
                </Col>
              ))
            }
            <Col {...DemoMEV.colProps}><h2>Filtered metadata</h2></Col>
        </Row>

        <Row>
          {map(sel => this.anySelector(sel))(this.state.selectorOrder)}
          <Col {...DemoMEV.colProps}>
            <ul>
              {
                flow(
                  sortBy(['ensemble_member', 'start_date', 'timescale']),
                  map(m => (
                    <li>
                      {`${m.ensemble_member} ${m.start_date}-${m.end_date} ${m.multi_year_mean ? 'MYM' : 'TS'} ${m.timescale}`}
                    </li>
                  ))
                )(mevFilteredMetadata)
              }
            </ul>
          </Col>
        </Row>

        <Row>
          <Col lg={12} md={12} sm={12}><h1>Dataset selector</h1></Col>
        </Row>

        <Row>
          <Col {...DemoMEV.colProps}>
            <DatasetSelector
              bases={mevFilteredMetadata}
              value={this.state.dataset}
              onChange={this.handleChangeDataset}
            />
            {stringify(this.state.dataset)}
          </Col>
          <Col {...DemoMEV.colProps} lgOffset={6} mdOffset={6} smOffset={6}>
            <ul>
              {
                flow(
                  sortBy(['ensemble_member', 'start_date', 'timescale']),
                  map(m => (
                    <li>
                      {`${m.ensemble_member} ${m.start_date}-${m.end_date} ${m.multi_year_mean ? 'MYM' : 'TS'} ${m.timescale}`}
                    </li>
                  ))
                )(mevdFilteredMetadata)
              }
            </ul>
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default DemoMEV;

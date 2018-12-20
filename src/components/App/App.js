// TODO: Create wrapper component ConstrainedMetadataSelector: encapsulates
//  getOptionIsDisabled matching constraint to contexts; use it in
//  SpicyXXX
// TODO: Replace ModelSelector with SpicyModelSelector; allow constraints
// TODO: Replace NavigationSelector with SpicyModelSelector
// TODO: Create EmissionsScenarioSelector; allow constraints

import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import memoize from 'memoize-one';

import meta from '../../assets/meta'
import './App.css';
import VariableSelector from '../VariableSelector';
import ModelSelector from '../ModelSelector';


function stringify(obj) {
  return <pre>{JSON.stringify(obj, null, 2)}</pre>;
}


class App extends Component {
  state = {
    MV: {
      model: 'MRI-CGCM3',
      variable: null,
    },
    VM: {
      model: null,
      variable: {
        variable_id: "pr",
        variable_name: "Precipitation",
        multi_year_mean: true,
      },
    }
  };

  MVvariableSelectorConstraint = memoize(({ model: model_id }) => ({ model_id }));

  MVhandleChangeVariable = variable =>
    this.setState(prevState => ({ MV: { ...prevState.MV, variable } }));
  MVhandleChangeModel = model =>
    this.setState(prevState => ({ MV: { ...prevState.MV, model } }));

  VMvariableSelectorConstraint = memoize(({ variable }) => variable);

  VMhandleChangeVariable = variable =>
    this.setState(prevState => ({ VM: { ...prevState.VM, variable } }));
  VMhandleChangeModel = model =>
    this.setState(prevState => ({ VM: { ...prevState.VM, model } }));

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col lg={3}>
            Model -> Variable
          </Col>
          <Col lg={3}>
            <ModelSelector
              meta={meta}
              value={this.state.MV.model}
              onChange={this.MVhandleChangeModel}
            />
          </Col>
          <Col lg={3}>
            <VariableSelector
              meta={meta}
              constraint={this.MVvariableSelectorConstraint(this.state.MV)}
              value={this.state.MV.variable}
              onChange={this.MVhandleChangeVariable}
            />
          </Col>
        </Row>

        <Row>
          <Col lg={3}>
          </Col>
          <Col lg={3}>
            {stringify(this.state.MV.model)}
          </Col>
          <Col lg={3}>
            {stringify(this.state.MV.variable)}
          </Col>
        </Row>

        <Row>
          <Col lg={3}>
            Variable -> Model
          </Col>
          <Col lg={3}>
            <VariableSelector
              meta={meta}
              value={this.state.VM.variable}
              onChange={this.VMhandleChangeVariable}
            />
          </Col>
          <Col lg={3}>
            <ModelSelector
              meta={meta}
              constraint={this.VMvariableSelectorConstraint(this.state.VM)}
              value={this.state.VM.model}
              onChange={this.VMhandleChangeModel}
            />
          </Col>
        </Row>

        <Row>
          <Col lg={3}>
          </Col>
          <Col lg={3}>
            {stringify(this.state.VM.variable)}
          </Col>
          <Col lg={3}>
            {stringify(this.state.VM.model)}
          </Col>
        </Row>

      </Grid>
    );
  }
}

export default App;

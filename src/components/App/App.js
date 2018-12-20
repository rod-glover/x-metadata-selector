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
import OldVariableSelector from '../ZzzVariableSelector';
import OldModelSelector from '../ZzzModelSelector';
import VariableSelector from '../VariableSelector';
import ModelSelector from '../ModelSelector';


function stringify(obj) {
  return <pre>{JSON.stringify(obj, null, 2)}</pre>;
}


class App extends Component {
  state = {
    model: 'MRI-CGCM3',
    variable: null,
  };

  variableSelectorConstraint = memoize(model_id => ({ model_id }));

  handleChangeVariable = variable => this.setState({ variable });
  handleChangeModel = model => this.setState({ model });

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col lg={3}>
            Original Flavour
          </Col>
          <Col lg={3}>
            <OldModelSelector
              meta={meta}
              value={this.state.model}
              onChange={this.handleChangeModel}
            />
          </Col>
          <Col lg={3}>
            <OldVariableSelector
              meta={meta}
              constraint={this.variableSelectorConstraint(this.state.model)}
              value={this.state.variable}
              onChange={this.handleChangeVariable}
            />
          </Col>
        </Row>

        <Row>
          <Col lg={3}>
            Spicy
          </Col>
          <Col lg={3}>
            <ModelSelector
              meta={meta}
              value={this.state.model}
              onChange={this.handleChangeModel}
            />
          </Col>
          <Col lg={3}>
            <VariableSelector
              meta={meta}
              constraint={this.variableSelectorConstraint(this.state.model)}
              value={this.state.variable}
              onChange={this.handleChangeVariable}
            />
          </Col>
        </Row>

        <Row>
          <Col lg={3}>
          </Col>
          <Col lg={3}>
            {stringify(this.state.model)}
          </Col>
          <Col lg={3}>
            {stringify(this.state.variable)}
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default App;

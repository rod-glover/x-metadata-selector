// TODO: Create wrapper component ConstrainedMetadataSelector: encapsulates
//  getOptionIsDisabled matching constraint to contexts; use it in
//  SpicyXXX
// TODO: Replace ModelSelector with SpicyModelSelector; allow constraints
// TODO: Replace NavigationSelector with SpicyModelSelector
// TODO: Create EmissionsScenarioSelector; allow constraints

import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { Glyphicon } from 'react-bootstrap';
import memoize from 'memoize-one';

import meta from '../../assets/meta'
import './App.css';
import VariableSelector from '../VariableSelector';
import ModelSelector from '../ModelSelector';
import MetadataSelector from '../MetadataSelector';
import PropTypes from 'prop-types';
import {
  filter,
  isMatch,
  pick,
  some,
} from 'lodash/fp';

import { components } from 'react-select';

const { Option } = components;

function stringify(obj) {
  return <pre>{JSON.stringify(obj, null, 2)}</pre>;
}


class SpicyModelSelector extends Component {
  static getOptionValue = metadatum => metadatum.model_id;

  render() {
    return (
      <MetadataSelector
        {...this.props}
        getOptionValue={SpicyModelSelector.getOptionValue}
      />
    );
  }
}


class SpicyVariableSelector extends Component {
  static propTypes = {
    constraint: PropTypes.object,
  };

  static valueProps =
    'variable_id variable_name multi_year_mean'.split(' ');
  static getOptionValue = metadatum =>
    pick(SpicyVariableSelector.valueProps, metadatum);

  static contextProps =
    'model_id experiment'.split(' ');
  static getOptionContext = metadatum =>
    pick(SpicyVariableSelector.contextProps, metadatum);

  static getOptionLabel = ({ value: { variable_id, variable_name }}) =>
    `${variable_id} - ${variable_name}`;

  // Can't be static: needs to access props.
  getOptionIsDisabled = option => !some(
    context => isMatch(this.props.constraint, context)
  )(option.contexts);

  static groupOptions = options => {
    return [
      {
        label: 'Multi-Year Mean Datasets',
        options: filter(o => o.value.multi_year_mean)(options),
      },
      {
        label: 'Time Series Datasets',
        options: filter(o => !o.value.multi_year_mean)(options),
      },
    ];
  };

  static VariableOption = props => {
    return (
      <Option {...props}>
        <Glyphicon glyph={props.value.multi_year_mean ? 'repeat' : 'star'}/>
        {' '}
        {props.label}
      </Option>
    )};

  render() {
    return (
      <MetadataSelector
        {...this.props}
        getOptionValue={SpicyVariableSelector.getOptionValue}
        getOptionContext={SpicyVariableSelector.getOptionContext}
        getOptionLabel={SpicyVariableSelector.getOptionLabel}
        getOptionIsDisabled={this.getOptionIsDisabled}
        groupOptions={SpicyVariableSelector.groupOptions}
        components={{ Option: SpicyVariableSelector.VariableOption }}
      />
    );
  }
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
            Spicy
          </Col>
          <Col lg={3}>
            <SpicyModelSelector
              meta={meta}
              value={this.state.model}
              onChange={this.handleChangeModel}
            />
          </Col>
          <Col lg={3}>
            <SpicyVariableSelector
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

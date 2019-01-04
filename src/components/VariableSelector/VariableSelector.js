import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Glyphicon } from 'react-bootstrap';
import { flow, filter, isMatch, pick, some, sortBy } from 'lodash/fp';

import ConstrainedMetadataSelector from '../ConstrainedMetadataSelector';

import './VariableSelector.css';

import { components } from 'react-select';

const { Option } = components;


export default class VariableSelector extends Component {
  static propTypes = {
    constraint: PropTypes.object,
  };

  static valueProps =
    'variable_id variable_name multi_year_mean'.split(' ');
  static getOptionValue = metadatum =>
    pick(VariableSelector.valueProps, metadatum);

  static getOptionLabel = ({ value: { variable_id, variable_name }}) =>
    `${variable_id} - ${variable_name}`;

  // Can't be static: needs to access props.
  // getOptionIsDisabled = option => !some(
  //   context => isMatch(this.props.constraint, context)
  // )(option.contexts);

  static arrangeOptions = options => {
    return [
      {
        label: 'Multi-Year Mean Datasets',
        options: flow(
          filter(o => o.value.multi_year_mean),
          sortBy('label'),
        )(options),
      },
      {
        label: 'Time Series Datasets',
        options: flow(
          filter(o => !o.value.multi_year_mean),
          sortBy('label'),
        )(options),
      },
    ];
  };

  static Option = props => {
    return (
      <Option {...props}>
        <Glyphicon glyph={props.value.multi_year_mean ? 'repeat' : 'star'}/>
        {' '}
        {props.label}
      </Option>
    )};

  render() {
    // return 'VariableSelector dummy';
    console.log('VariableSelector.render')
    return (
      <ConstrainedMetadataSelector
        {...this.props}
        getOptionValue={VariableSelector.getOptionValue}
        getOptionLabel={VariableSelector.getOptionLabel}
        arrangeOptions={VariableSelector.arrangeOptions}
        components={{ Option: VariableSelector.Option }}
        debugValue='Variable'
      />
    );
  }
}
